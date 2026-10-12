"""FreerVoice: derive a unique, reproducible voice from an FID.

v1 keeps one base voice dominant, scales the predicted pitch curve inside the
model, and pushes the result away from the gender's average voice, so the
voices are not averaged into one another.

Prosody (the [128:] half of a Kokoro style, which shapes tones) is never taken
from another voice: some base voices carry a foreign-sounding tone pattern,
and borrowing it makes Mandarin tones sound wrong. Such voices are listed in
EXCLUDED and are skipped.

v1  h = SHA256("FreerVoice/v1/" + FID)
    byte 0       gender: even → female (zf_*), odd → male (zm_*)
    bytes 1–2    voice A, from that gender's sorted list
    bytes 3–4    voice B, same list without A
    byte 5       weight w ∈ [0, 0.3]; style = (1 - w)·A + w·B
    byte 8       pitch ∈ [-3, +3] semitones, applied to the predicted F0
    byte 9       speed ∈ [0.9, 1.1]
    bytes 16–23  torch seed for the vocoder's noise
    then         style += CARICATURE · (style − mean of that gender's base voices)

    A pick that lands on an EXCLUDED voice is redrawn from SHA256(h ‖ byte ‖ n),
    n = 0, 1, …, so excluding a voice moves only the FIDs that had picked it.

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
# English inside Chinese comes out rushed; its phonemes are held this many times longer.
ENGLISH_STRETCH = 1.5
SENTENCE_PAUSE = 0.45  # seconds between chunks of one text, about the model's own sentence pause
# v1 only. At 0.3 the voices are as far apart as the base voices themselves
# (ECAPA, compare.py); higher sounds no more distinct to the ear.
CARICATURE = 0.3

# Base voices with foreign-sounding Mandarin tones, found by ear with screen_voices.py;
# never picked (v1). Many more voices turn a sentence-final 员 (yuán) into yuǎn; that
# looks like a model limitation rather than a bad voice, so they are kept (docs/FID声音.md).
EXCLUDED = {
    'zm_010', 'zm_013', 'zm_014', 'zm_016', 'zm_030', 'zm_035', 'zm_058', 'zm_062', 'zm_068',
    'zf_060', 'zf_090',
}

# English words inside Chinese text go through the English G2P; these override it.
LEXICON = {
    'FID': 'ˌɛfˌIdˈi',  # spelled out, like CID
}

# Chinese words the G2P misreads, spoken as a homophone instead; captions keep the original.
READINGS = {
    '靓': '亮',  # liàng, not jìng
    '长数据': '常数据',  # cháng, not zhǎng
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
    voice_a: str
    voice_b: str
    weight: float  # share of voice_b
    pitch: float  # semitones
    speed: float
    seed: int


def base_voices(gender: str) -> list[str]:
    prefix = 'zf' if gender == 'female' else 'zm'
    return sorted(p.stem for p in (MODEL_DIR / 'voices').glob(f'{prefix}_*.pt'))


def _pick(h: bytes, at: int, voices: list[str], excluded: set[str]) -> str:
    """Pick by h[at:at+2]; redraw from SHA256(h ‖ at ‖ n) while the pick is excluded."""
    k, n = int.from_bytes(h[at:at + 2], 'big'), 0
    while voices[k % len(voices)] in excluded:
        k = int.from_bytes(hashlib.sha256(h + bytes([at, n])).digest()[:2], 'big')
        n += 1
    return voices[k % len(voices)]


def derive(fid: str, version: str = VERSION) -> VoiceParams:
    check_fid(fid)
    h = hashlib.sha256(f'FreerVoice/{version}/{fid}'.encode()).digest()
    gender = 'female' if h[0] % 2 == 0 else 'male'
    voices = base_voices(gender)
    excluded = EXCLUDED if version == 'v1' else set()
    a = _pick(h, 1, voices, excluded)
    b = _pick(h, 3, [v for v in voices if v != a], excluded)
    if version == 'v0':
        return VoiceParams(
            fid=fid, version=version, gender=gender, voice_a=a, voice_b=b,
            weight=round(0.2 + 0.6 * h[5] / 255, 4),
            pitch=0.0,
            speed=round(0.92 + 0.16 * h[6] / 255, 4),
            seed=int.from_bytes(h[8:16], 'big') & 0x7FFF_FFFF_FFFF_FFFF,
        )
    if version == 'v1':
        return VoiceParams(
            fid=fid, version=version, gender=gender, voice_a=a, voice_b=b,
            weight=round(0.3 * h[5] / 255, 4),
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

        # English phonemes are the Latin/IPA tokens; Chinese ones are bopomofo and CJK.
        import unicodedata
        latin = [i for c, i in self.model.vocab.items()
                 if any(k in unicodedata.name(c, '') for k in ('LATIN', 'MODIFIER LETTER', 'GREEK', 'IPA'))]
        self.english_ids = torch.tensor(latin)
        self.english_stretch = ENGLISH_STRETCH
        self.model.forward_with_tokens = self._forward_with_tokens

        english = KPipeline(lang_code='a', repo_id=REPO_ID, model=False)
        self.pipeline = KPipeline(
            lang_code='z',
            repo_id=REPO_ID,
            model=self.model,
            en_callable=lambda word: LEXICON.get(word) or next(english(word)).phonemes,
        )

    def _forward_with_tokens(self, input_ids, ref_s, speed=1):
        """KModel.forward_with_tokens (kokoro 0.9.4), with English phonemes held longer."""
        torch, m = self.torch, self.model
        with torch.no_grad():
            return self._forward(torch, m, input_ids, ref_s, speed)

    def _forward(self, torch, m, input_ids, ref_s, speed):
        input_lengths = torch.full((input_ids.shape[0],), input_ids.shape[-1], device=input_ids.device, dtype=torch.long)
        text_mask = torch.arange(input_lengths.max()).unsqueeze(0).expand(input_lengths.shape[0], -1).type_as(input_lengths)
        text_mask = torch.gt(text_mask + 1, input_lengths.unsqueeze(1)).to(m.device)
        bert_dur = m.bert(input_ids, attention_mask=(~text_mask).int())
        d_en = m.bert_encoder(bert_dur).transpose(-1, -2)
        s = ref_s[:, 128:]
        d = m.predictor.text_encoder(d_en, s, input_lengths, text_mask)
        x, _ = m.predictor.lstm(d)
        duration = m.predictor.duration_proj(x)
        duration = torch.sigmoid(duration).sum(axis=-1) / speed
        english = torch.isin(input_ids, self.english_ids)
        duration = torch.where(english, duration * self.english_stretch, duration)
        pred_dur = torch.round(duration).clamp(min=1).long().squeeze()
        indices = torch.repeat_interleave(torch.arange(input_ids.shape[1], device=m.device), pred_dur)
        pred_aln_trg = torch.zeros((input_ids.shape[1], indices.shape[0]), device=m.device)
        pred_aln_trg[indices, torch.arange(indices.shape[0])] = 1
        pred_aln_trg = pred_aln_trg.unsqueeze(0).to(m.device)
        en = d.transpose(-1, -2) @ pred_aln_trg
        F0_pred, N_pred = m.predictor.F0Ntrain(en, s)
        t_en = m.text_encoder(input_ids, input_lengths, text_mask)
        asr = t_en @ pred_aln_trg
        audio = m.decoder(asr, F0_pred, N_pred, ref_s[:, :128]).squeeze()
        return audio, pred_dur

    def _load(self, name: str):
        return self.torch.load(MODEL_DIR / 'voices' / f'{name}.pt', weights_only=True)

    def style(self, p: VoiceParams):
        style = (1 - p.weight) * self._load(p.voice_a) + p.weight * self._load(p.voice_b)
        if p.version == 'v0':
            return style
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
        # The model pauses on quotation marks as if they were commas; captions keep them.
        text = text.translate(str.maketrans('', '', '"“”「」『』'))
        self.pitch_ratio = 2 ** (p.pitch / 12)
        self.torch.manual_seed(p.seed)
        parts = [r.audio.numpy() for r in self.pipeline(text, voice=style, speed=speed) if r.audio is not None]
        if len(parts) == 1:
            return parts[0]
        # The pipeline voices long text in chunks, each padded with ~1.8 s of silence;
        # join them with a natural sentence pause instead.
        pause = np.zeros(int(SENTENCE_PAUSE * SAMPLE_RATE), dtype=np.float32)
        joined = [trim(parts[0])]
        for part in parts[1:]:
            joined += [pause, trim(part)]
        return np.concatenate(joined)


def trim(wav, edge: float = 0.05, threshold: float = 0.01):
    """Cut the silence the model pads around speech, keeping `edge` seconds on either side."""
    import numpy as np

    loud = np.flatnonzero(np.abs(wav) > threshold)
    if not len(loud):
        return wav
    margin = int(edge * SAMPLE_RATE)
    return wav[max(0, loud[0] - margin):loud[-1] + margin]


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
