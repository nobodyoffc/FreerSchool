"""Narrate with Qwen3-TTS, cloning the Navigator's FID voice.

The Navigator's voice is derived from its FID (fid/freer_voice.py, FreerVoice v1 on Kokoro);
that sets the timbre and the calm delivery, and Qwen3-TTS speaks it more naturally. The
reference is two lines of U2-02 in that voice (ref/领航员.wav). Word timings come from
Qwen3-ForcedAligner, run on the finished line.
"""
import hashlib
import re
from dataclasses import dataclass
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
    '费为': '费维',  # 交易费为 wéi
    '设置为': '设置维',  # wéi
    '声明 A 为主人': '声明 A 维主人',  # wéi (U2-08)
    '声明身份 5 为主人': '声明身份 5 维主人',
    '用身份 1 开始': '用身份衣开始',  # yī; the digit came out yì
    '身份 2 做掌柜': '身份二做掌柜',  # the digit came out odd
    '0.000001': '百万分之一',  # read digit by digit, a zero went missing
    '=': '等于',  # otherwise skipped
    '2027年': '二零二七年',  # U2-10, no space before 年
    ' cd': ' CD',  # U2-10: the coin-day unit, spelled out
    '40% 、10% 和 50%': '百分之四十、百分之十和百分之五十',  # U2-10
    '面一行': '面一杭',  # U2-10 上面一行、下面一行: háng, not xíng
    '重组': '崇组',  # U2-11: chóng
    '重启': '崇启',  # U2-11: chóng
    '长按': '常按',  # U2-11: cháng
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
    '横着看，三个角色各用各的主人，互不转钱，链上看不出它们属于同一个人。': 2,  # U2-08: 转 came out zhuàn; take 2 is low
    '用身份 1 开始各种日常社交。': 3,  # U2-08: 衣 high and level in take 3
}
PUNCT = re.compile(r'[\s，。、：；！？“”"「」『』（）,.:;!?()]')


@dataclass(frozen=True)
class Language:
    """A narration language: the voice that speaks it and how it reads."""
    name: str  # Qwen's name for it
    version: str  # names the voice; part of every cache key and seed
    ref_audio: Path
    ref_text: str
    readings: dict
    per_second: tuple[float, float]  # characters a second; a take outside this is redone


# By the script's `language` field. Only Chinese so far. For English, cloning the Chinese
# reference gave a Chinese accent, and the preset English voices (Ryan, Aiden) did not suit
# either (2026-10-23); its voice is chosen when the English version starts.
LANGUAGES = {
    'zh': Language('Chinese', VERSION, REF_AUDIO, REF_TEXT, READINGS, (2, 9)),
}


def language(code: str) -> Language:
    if code not in LANGUAGES:
        raise SystemExit(f'还没有语言 {code} 的旁白声音（见 voice/qwen_voice.py 的 LANGUAGES）')
    return LANGUAGES[code]


def clean(text: str, lang: str = 'zh') -> str:
    """The text the model reads: READINGS applied, quotation marks (read as pauses) removed."""
    for word, reading in language(lang).readings.items():
        text = text.replace(word, reading)
    return text.translate(str.maketrans('', '', '"“”「」『』'))


class Synthesizer:
    def __init__(self, lang: str = 'zh'):
        import torch
        self.lang, self.language = lang, language(lang)
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
            self.prompt = self._model.create_voice_clone_prompt(ref_audio=str(self.language.ref_audio), ref_text=self.language.ref_text)
        return self._model

    def clean(self, text: str) -> str:
        return clean(text, self.lang)

    def speak(self, text: str, take: int | None = None) -> np.ndarray:
        """One line; float32 at SAMPLE_RATE. The same text and take give the same audio.

        Now and then the model does not stop (U2-02 S4-02 ran to 655 s): generation is capped,
        and a take whose length is far off for its text is redone with the next take."""
        take = TAKES.get(text, 0) if take is None else take
        chars = len(PUNCT.sub('', self.clean(text)))
        # Chinese runs about 4–5 characters a second; outside 2–9 something went wrong.
        slow, fast = self.language.per_second
        lo, hi = chars / fast, chars / slow + 1.5
        version = self.language.version
        read = text
        for word, reading in self.language.readings.items():
            read = read.replace(word, reading)
        for t in range(take, take + 5):
            # A line read differently (READINGS) is a different take of the same text.
            key = f'{version}/{t}/{text}' + (f'/{read}' if read != text else '')
            cached = CACHE / f'{hashlib.sha256(key.encode()).hexdigest()[:24]}.npy'
            if cached.exists():
                wav = np.load(cached)
            else:
                seed = int.from_bytes(hashlib.sha256(f'{version}/{t}/{text}'.encode()).digest()[:8], 'big') & 0x7FFF_FFFF
                self.torch.manual_seed(seed)
                wavs, sr = self.model.generate_voice_clone(text=self.clean(text), language=self.language.name, voice_clone_prompt=self.prompt,
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
        items = self.aligner.align(audio=(wav, SAMPLE_RATE), text=self.clean(text), language=self.language.name)[0].items
        # Items are characters (Chinese) or words (English); find the one where `word` starts.
        target = len(PUNCT.sub('', self.clean(text[:text.index(word)])))
        at = 0
        for item in items:
            if at >= target:
                return item.start_time
            at += len(PUNCT.sub('', item.text))
        return items[-1].start_time if items else 0.0
