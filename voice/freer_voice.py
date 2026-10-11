"""FreerVoice: derive a unique, reproducible voice from an FID.

A Kokoro style vector has two halves: [:128] is timbre (fed to the decoder),
[128:] is prosody (fed to the duration and pitch predictor). v1 draws them
from different base voices and scales the predicted pitch curve inside the
model, so neither half is averaged away.

v1  h = SHA256("FreerVoice/v1/" + FID)
    byte 0       gender: even → female (zf_*), odd → male (zm_*)
    bytes 1–2    timbre voice A, from that gender's sorted list
    bytes 3–4    timbre voice B, same list, different from A
    byte 5       timbre weight w ∈ [0, 0.3]; timbre = (1 - w)·A + w·B
    bytes 6–7    prosody voice C, same list (may equal A)
    byte 8       pitch ∈ [-3, +3] semitones, applied to the predicted F0
    byte 9       speed ∈ [0.9, 1.1]
    bytes 16–23  torch seed for the vocoder's noise
    then         style += CARICATURE · (style − mean of that gender's base voices)

v0  h = SHA256("FreerVoice/v0/" + FID); kept for comparison only
    byte 0 gender, bytes 1–2 A, bytes 3–4 B, byte 5 w ∈ [0.2, 0.8] over the
    whole vector, byte 6 speed ∈ [0.92, 1.08], bytes 8–15 seed

The model and voices are pinned below; changing either is a new version.

Usage:
    python freer_voice.py --fid <FID> --text "你好" --out hello.wav
    python freer_voice.py --fid <FID> --params
"""
import argparse
import hashlib
import json
from dataclasses import asdict, dataclass
from pathlib import Path

VERSION = 'v1'
REPO_ID = 'hexgrad/Kokoro-82M-v1.1-zh'
REVISION = '01e7505bd6a7a2ac4975463114c3a7650a9f7218'
MODEL_SHA256 = 'b1d8410fa44dfb5c15471fd6c4225ea6b4e9ac7fa03c98e8bea47a9928476e2b'
MODEL_DIR = Path(__file__).parent / 'models' / 'kokoro-v1.1-zh'
SAMPLE_RATE = 24000
# v1 only. At 0.3 the voices are as far apart as the base voices themselves
# (ECAPA, compare.py); higher sounds no more distinct to the ear.
CARICATURE = 0.3

# English words inside Chinese text go through the English G2P; these override it.
LEXICON = {
    'FID': 'ˌɛfˌIdˈi',  # spelled out, like CID
}

# Chinese words the G2P misreads, spoken as a homophone instead; captions keep the original.
READINGS = {
    '靓': '亮',  # liàng, not jìng
}

BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
FID_VERSION = 0x23  # the version byte every FID starts with ('F')


def check_fid(fid: str) -> None:
    """Base58Check: version byte 0x23, 20-byte hash, 4-byte double-SHA256 checksum."""
    n = 0
    for c in fid:
        if c not in BASE58:
            raise ValueError(f'Not an FID: {fid}')
        n = n * 58 + BASE58.index(c)
    raw = n.to_bytes(25, 'big')
    body, checksum = raw[:21], raw[21:]
    if body[0] != FID_VERSION or hashlib.sha256(hashlib.sha256(body).digest()).digest()[:4] != checksum:
        raise ValueError(f'Not an FID: {fid}')


@dataclass(frozen=True)
class VoiceParams:
    fid: str
    version: str
    gender: str
    timbre_a: str
    timbre_b: str
    weight: float  # share of timbre_b
    prosody: str | None  # None: prosody mixes like timbre (v0)
    pitch: float  # semitones
    speed: float
    seed: int


def base_voices(gender: str) -> list[str]:
    prefix = 'zf' if gender == 'female' else 'zm'
    return sorted(p.stem for p in (MODEL_DIR / 'voices').glob(f'{prefix}_*.pt'))


def _pick_two(h: bytes, voices: list[str]) -> tuple[str, str]:
    a = int.from_bytes(h[1:3], 'big') % len(voices)
    b = int.from_bytes(h[3:5], 'big') % (len(voices) - 1)
    if b >= a:
        b += 1
    return voices[a], voices[b]


def derive(fid: str, version: str = VERSION) -> VoiceParams:
    check_fid(fid)
    h = hashlib.sha256(f'FreerVoice/{version}/{fid}'.encode()).digest()
    gender = 'female' if h[0] % 2 == 0 else 'male'
    voices = base_voices(gender)
    a, b = _pick_two(h, voices)
    if version == 'v0':
        return VoiceParams(
            fid=fid, version=version, gender=gender, timbre_a=a, timbre_b=b,
            weight=round(0.2 + 0.6 * h[5] / 255, 4),
            prosody=None,
            pitch=0.0,
            speed=round(0.92 + 0.16 * h[6] / 255, 4),
            seed=int.from_bytes(h[8:16], 'big') & 0x7FFF_FFFF_FFFF_FFFF,
        )
    if version == 'v1':
        return VoiceParams(
            fid=fid, version=version, gender=gender, timbre_a=a, timbre_b=b,
            weight=round(0.3 * h[5] / 255, 4),
            prosody=voices[int.from_bytes(h[6:8], 'big') % len(voices)],
            pitch=round(-3 + 6 * h[8] / 255, 3),
            speed=round(0.9 + 0.2 * h[9] / 255, 4),
            seed=int.from_bytes(h[16:24], 'big') & 0x7FFF_FFFF_FFFF_FFFF,
        )
    raise ValueError(f'Unknown version: {version}')


class Synthesizer:
    def __init__(self):
        import torch
        from kokoro import KModel, KPipeline

        self.torch = torch
        self.model = KModel(
            repo_id=REPO_ID,
            config=str(MODEL_DIR / 'config.json'),
            model=str(MODEL_DIR / 'kokoro-v1_1-zh.pth'),
        ).eval()
        # Scale the predicted pitch curve before it reaches the decoder: the pitch moves,
        # the timbre (decoder half of the style) does not.
        self.pitch_ratio = 1.0
        f0n = self.model.predictor.F0Ntrain

        def scaled_f0n(*args, **kwargs):
            f0, n = f0n(*args, **kwargs)
            return f0 * self.pitch_ratio, n

        self.model.predictor.F0Ntrain = scaled_f0n

        english = KPipeline(lang_code='a', repo_id=REPO_ID, model=False)
        self.pipeline = KPipeline(
            lang_code='z',
            repo_id=REPO_ID,
            model=self.model,
            en_callable=lambda word: LEXICON.get(word) or next(english(word)).phonemes,
        )

    def _load(self, name: str):
        return self.torch.load(MODEL_DIR / 'voices' / f'{name}.pt', weights_only=True)

    def style(self, p: VoiceParams):
        mixed = (1 - p.weight) * self._load(p.timbre_a) + p.weight * self._load(p.timbre_b)
        if p.prosody is None:
            return mixed
        style = self.torch.cat([mixed[..., :128], self._load(p.prosody)[..., 128:]], dim=-1)
        mean = self.torch.stack([self._load(v) for v in base_voices(p.gender)]).mean(0)
        return style + CARICATURE * (style - mean)

    def speak(self, p: VoiceParams, text: str):
        """One sentence or a few; returns a float32 numpy array at SAMPLE_RATE."""
        import numpy as np

        style = self.style(p)
        # Long inputs rush in this model; slow down as the phoneme count grows (from make_zh.py).
        def speed(n: int) -> float:
            k = 1.0 if n <= 83 else max(0.8, 1 - (n - 83) / 500)
            return p.speed * k * 1.1

        for word, reading in READINGS.items():
            text = text.replace(word, reading)
        self.pitch_ratio = 2 ** (p.pitch / 12)
        self.torch.manual_seed(p.seed)
        parts = [r.audio.numpy() for r in self.pipeline(text, voice=style, speed=speed) if r.audio is not None]
        return np.concatenate(parts)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--fid', required=True)
    ap.add_argument('--text')
    ap.add_argument('--out')
    ap.add_argument('--version', default=VERSION)
    ap.add_argument('--params', action='store_true', help='print the derived parameters and exit')
    args = ap.parse_args()

    p = derive(args.fid, args.version)
    if args.params or not args.text:
        print(json.dumps(asdict(p), ensure_ascii=False, indent=2))
        return
    import soundfile as sf

    sf.write(args.out or f'{args.fid}.wav', Synthesizer().speak(p, args.text), SAMPLE_RATE)


if __name__ == '__main__':
    main()
