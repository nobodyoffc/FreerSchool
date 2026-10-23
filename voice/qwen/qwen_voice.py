"""Narrate with Qwen3-TTS, cloning the Navigator's FreerVoice.

The FreerVoice (Kokoro) sets the timbre and the calm delivery; Qwen3-TTS speaks it more
naturally. The reference is two lines of U2-02 in the Navigator's FreerVoice (ref/领航员.wav).
Word timings come from Qwen3-ForcedAligner, run on the finished line.

Runs in this directory's own environment (qwen-tts needs an older transformers than kokoro):
    cd voice/qwen && uv sync
    .venv/bin/python ../narrate.py --engine qwen ../../episodes/U2/<集目录>
"""
import hashlib
import re
from pathlib import Path

import numpy as np

SAMPLE_RATE = 24000
TTS_MODEL = 'Qwen/Qwen3-TTS-12Hz-1.7B-Base'
ALIGNER = 'Qwen/Qwen3-ForcedAligner-0.6B'
REF_AUDIO = Path(__file__).parent / 'ref' / '领航员.wav'
REF_TEXT = '私钥最大的风险是在联网设备上泄露，根治的办法就是设备离线。私钥用二维码扫进去，然后关机，放在安全的地方。'
VERSION = 'qwen3-tts-1.7b-base/领航员'
# Readings the model gets wrong, replaced before synthesis; captions keep the original.
READINGS = {}
PUNCT = re.compile(r'[\s，。、：；！？“”"「」『』（）,.:;!?()]')


class Synthesizer:
    def __init__(self):
        import torch
        from qwen_asr import Qwen3ForcedAligner
        from qwen_tts import Qwen3TTSModel

        self.torch = torch
        kw = dict(device_map='mps', dtype=torch.bfloat16)
        self.model = Qwen3TTSModel.from_pretrained(TTS_MODEL, attn_implementation='sdpa', **kw)
        self.prompt = self.model.create_voice_clone_prompt(ref_audio=str(REF_AUDIO), ref_text=REF_TEXT)
        self.aligner = Qwen3ForcedAligner.from_pretrained(ALIGNER, **kw)

    @staticmethod
    def clean(text: str) -> str:
        for word, reading in READINGS.items():
            text = text.replace(word, reading)
        # Quotation marks are read as pauses; captions keep them.
        return text.translate(str.maketrans('', '', '"“”「」『』'))

    def speak(self, text: str, take: int = 0) -> np.ndarray:
        """One line; float32 at SAMPLE_RATE. The same text and take give the same audio."""
        seed = int.from_bytes(hashlib.sha256(f'{VERSION}/{take}/{text}'.encode()).digest()[:8], 'big') & 0x7FFF_FFFF
        self.torch.manual_seed(seed)
        wavs, sr = self.model.generate_voice_clone(text=self.clean(text), language='Chinese', voice_clone_prompt=self.prompt)
        assert sr == SAMPLE_RATE, sr
        return np.asarray(wavs[0], dtype=np.float32)

    def offset(self, wav: np.ndarray, text: str, word: str) -> float:
        """Seconds from the start of `wav` to where `word` begins."""
        items = self.aligner.align(audio=(wav, SAMPLE_RATE), text=self.clean(text), language='Chinese')[0].items
        # Items are characters (Chinese) or words (English); find the one where `word` starts.
        target = len(PUNCT.sub('', self.clean(text[:text.index(word)])))
        at = 0
        for item in items:
            if at >= target:
                return item.start_time
            at += len(PUNCT.sub('', item.text))
        return items[-1].start_time if items else 0.0
