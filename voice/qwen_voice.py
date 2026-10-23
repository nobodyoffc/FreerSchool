"""Narrate with Qwen3-TTS, cloning the Navigator's FID voice.

The Navigator's voice is derived from its FID (fid/freer_voice.py, FreerVoice v1 on Kokoro);
that sets the timbre and the calm delivery, and Qwen3-TTS speaks it more naturally. The
reference is two lines of U2-02 in that voice (ref/领航员.wav). Word timings come from
Qwen3-ForcedAligner, run on the finished line.
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
TOKENS_PER_SECOND = 12  # the 12Hz tokenizer
# Finished lines by version, take and text, so a rerun only synthesizes lines that changed.
CACHE = Path(__file__).parent / 'cache'
# Readings the model gets wrong, replaced before synthesis; captions keep the original.
READINGS = {
    '重掷': '崇掷',  # chóng, not zhòng
    '骰子': '投子',  # tóu, not shǎi
    'SHA256': '杀二五六',  # SHA came out unclear; 256 digit by digit, as people say it
    'Argon2id': 'Argon two id',  # the 2 in English
    '@': '艾特',  # otherwise skipped
    '靓': '亮',  # liàng (搜索靓名 was heard as 废名)
    # Carried over from fid/freer_voice.py's READINGS: polyphones the ear checks, not the ASR, would catch.
    '长数据': '常数据',  # cháng, not zhǎng
    '长字符': '常字符',
    '加为': '加维',  # wéi, not wèi
    '登记为': '登记维',
    '值为': '值维',
    '面额为': '面额维',
    '弹出': '谈出',  # tán, not dàn
    '教你': '交你',  # jiāo, not jiào
    '猜不中': '猜不众',  # zhòng, not zhōng
    '2027 年': '二零二七年',  # a year, digit by digit
    # Server names are words; in capitals they are spelled out letter by letter.
    'BASE': 'Base',
    'DOCK': 'Dock',
    'DISK': 'Disk',
    'CALL': 'Call',
    'ROAD': 'Road',
    'MAP': 'Map',
    'SWAP': 'Swap',
    'P2P': 'P two P',  # the 2 in English
}
# A line that came out wrong is redone with another take (another seed): text -> take.
TAKES = {
    '点发送，几分钟后就确认了。': 1,  # U1-12: take 0 said 点点发送
    '别人怎么知道你的 DOCK 在哪里？看链上的登记。': 2,  # U1-06: take 0 said dog
    '你的 DOCK 是公开的，谁都能查到。': 1,  # U1-06: take 0 said 道可
}
PUNCT = re.compile(r'[\s，。、：；！？“”"「」『』（）,.:;!?()]')


class Synthesizer:
    def __init__(self):
        import torch
        from qwen_asr import Qwen3ForcedAligner
        self.torch = torch
        self.kw = dict(device_map='mps', dtype=torch.bfloat16)
        self.aligner = Qwen3ForcedAligner.from_pretrained(ALIGNER, **self.kw)
        self._model = None

    @property
    def model(self):
        # Loaded on first use: a rerun whose lines are all cached never needs it.
        if self._model is None:
            from qwen_tts import Qwen3TTSModel
            self._model = Qwen3TTSModel.from_pretrained(TTS_MODEL, attn_implementation='sdpa', **self.kw)
            self.prompt = self._model.create_voice_clone_prompt(ref_audio=str(REF_AUDIO), ref_text=REF_TEXT)
        return self._model

    @staticmethod
    def clean(text: str) -> str:
        for word, reading in READINGS.items():
            text = text.replace(word, reading)
        # Quotation marks are read as pauses; captions keep them.
        return text.translate(str.maketrans('', '', '"“”「」『』'))

    def speak(self, text: str, take: int | None = None) -> np.ndarray:
        """One line; float32 at SAMPLE_RATE. The same text and take give the same audio.

        Now and then the model does not stop (U2-02 S4-02 ran to 655 s): generation is capped,
        and a take whose length is far off for its text is redone with the next take."""
        take = TAKES.get(text, 0) if take is None else take
        chars = len(PUNCT.sub('', self.clean(text)))
        # About 4–5 characters a second; outside 2–9 something went wrong.
        lo, hi = chars / 9, chars / 2 + 1.5
        read = text
        for word, reading in READINGS.items():
            read = read.replace(word, reading)
        for t in range(take, take + 5):
            # A line read differently (READINGS) is a different take of the same text.
            key = f'{VERSION}/{t}/{text}' + (f'/{read}' if read != text else '')
            cached = CACHE / f'{hashlib.sha256(key.encode()).hexdigest()[:24]}.npy'
            if cached.exists():
                wav = np.load(cached)
            else:
                seed = int.from_bytes(hashlib.sha256(f'{VERSION}/{t}/{text}'.encode()).digest()[:8], 'big') & 0x7FFF_FFFF
                self.torch.manual_seed(seed)
                wavs, sr = self.model.generate_voice_clone(text=self.clean(text), language='Chinese', voice_clone_prompt=self.prompt,
                                                           max_new_tokens=int(hi * TOKENS_PER_SECOND) + 12)
                assert sr == SAMPLE_RATE, sr
                wav = np.asarray(wavs[0], dtype=np.float32)
            if lo <= len(wav) / SAMPLE_RATE <= hi:
                CACHE.mkdir(exist_ok=True)
                np.save(cached, wav)
                return wav
            print(f'  第 {t} 次合成 {len(wav) / SAMPLE_RATE:.1f} 秒，不在 {lo:.1f}–{hi:.1f} 秒内，重来：{text}', flush=True)
        raise RuntimeError(f'合成五次都不正常：{text}')

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
