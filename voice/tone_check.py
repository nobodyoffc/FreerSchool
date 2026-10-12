"""Tone check: find syllables whose predicted pitch goes against their Mandarin tone.

The model predicts a pitch (F0) curve before it makes any sound, and gives every phoneme
a duration, so each syllable's own pitch movement can be read straight off the model.
A first tone should stay level and a second tone should rise; when the model lets a
first tone sink at the end of a phrase it is heard as a fourth (清单 → 清蛋), and a
second tone that fails to rise is heard as a third (员 → 远).

Only syllables at the end of a phrase are judged: inside a phrase a syllable's pitch slides
toward the next one, which looks like a wrong tone but is not. Checked against listening
(2026-10-12): first tones 5/5 right (清单 phrasings), second tones about 75% (员, 100 voices).

    python tone_check.py ../episodes/U1/U1-02-你的第一个身份      # every narration line
    python tone_check.py --text "主页上还有一份新手入门清单。"       # one text
"""
import argparse
import json
import re
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from freer_voice import Synthesizer, VoiceParams, derive

ROOT = Path(__file__).parent.parent
# A first tone that falls more than this many semitones, or a second tone that rises less,
# is flagged. The second-tone line was lowered from +1.0 after five flags between -0.3 and
# +0.9 all sounded right (U1-02); the 员 heard as 远 had a median of -1.0.
TONE1_MAX_FALL = 4.0
TONE2_MIN_RISE = -0.5
CJK = re.compile(r'[一-鿿]')


@dataclass
class Syllable:
    char: str | None  # the Chinese character, when the text and syllables line up
    phonemes: str
    tone: int
    change: float  # semitones from the start to the end of its voiced part
    phrase_end: bool  # followed by punctuation or the end of the text

    @property
    def flagged(self) -> bool:
        if not self.phrase_end:
            return False
        return (self.tone == 1 and self.change < -TONE1_MAX_FALL) or (self.tone == 2 and self.change < TONE2_MIN_RISE)


class ToneChecker:
    def __init__(self, synth: Synthesizer | None = None):
        self.synth = synth or Synthesizer()
        self._f0 = None
        predict = self.synth.model.predictor.F0Ntrain

        def capture(*args, **kwargs):
            f0, n = predict(*args, **kwargs)
            self._f0 = f0.squeeze().detach().numpy().copy()
            return f0, n

        self.synth.model.predictor.F0Ntrain = capture

    def check(self, p: VoiceParams, text: str) -> list[Syllable]:
        s = self.synth
        clean = text.translate(str.maketrans('', '', '"“”「」『』'))
        chars = CJK.findall(clean)
        syllables: list[Syllable] = []
        s.pitch_ratio = 2 ** (p.pitch / 12)
        for r in s.pipeline(clean, voice=s.style(p), speed=lambda n: p.speed * 1.1):
            ps, dur, f0 = r.phonemes, r.pred_dur.tolist(), self._f0
            ratio = len(f0) / sum(dur)
            frame = lambda i: int(sum(dur[:i + 1]) * ratio)  # +1: leading pad token
            start = 0
            for i, c in enumerate(ps):
                if c in '12345':
                    seg = f0[frame(start):frame(i + 1)]
                    voiced = seg[seg > 40]
                    nxt = ps[i + 1] if i + 1 < len(ps) else '.'
                    if len(voiced) >= 4:
                        k = max(2, len(voiced) // 4)
                        change = float(12 * np.log2(voiced[-k:].mean() / voiced[:k].mean()))
                    else:
                        change = 0.0
                    syllables.append(Syllable(None, ps[start:i + 1], int(c), round(change, 1), nxt in ',.!?;:—…'))
                    start = i + 1
                elif not ('㄀' <= c <= 'ㄯ' or '一' <= c <= '鿿'):
                    start = i + 1  # separators, punctuation, English
        if len(syllables) == len(chars):
            for syl, ch in zip(syllables, chars):
                syl.char = ch
        return syllables


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('episode', nargs='?')
    ap.add_argument('--text')
    ap.add_argument('--fid', help='voice to check; defaults to the Navigator')
    args = ap.parse_args()

    navigator = json.loads((ROOT / 'school.json').read_text(encoding='utf-8'))['navigator']
    p = derive(args.fid or navigator['fid'])
    if args.text:
        lines = [args.text]
    else:
        from narrate import parse
        _, scenes = parse((Path(args.episode) / 'script.md').read_text(encoding='utf-8'))
        lines = [line for scene in scenes for line in scene['lines']]

    checker = ToneChecker()
    flagged = 0
    for line in lines:
        bad = [s for s in checker.check(p, line) if s.flagged]
        for s in bad:
            what = '第一声下沉' if s.tone == 1 else '第二声没升'
            print(f'{s.char or s.phonemes} {what} {s.change:+.1f} 半音  ←  {line}')
        flagged += len(bad)
    print(f'{len(lines)} 句，{flagged} 处可疑')


if __name__ == '__main__':
    main()
