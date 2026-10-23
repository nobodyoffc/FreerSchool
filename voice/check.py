"""Hear every line back with Qwen3-ASR and compare it with the script.

Catches what a sampling TTS can do: skip, repeat or add words, or read a character wrong
(a same-sounding character is reported too; those are fine). Tones are not checked: listen.

    .venv/bin/python check.py ../episodes/<线>/<集目录>
"""
import difflib
import json
import re
import sys
from pathlib import Path

import torch

PUNCT = re.compile(r'[\s，。、：；！？“”"「」『』（）—…,.:;!?()_-]')
# Numbers and Latin letters come back as Chinese numerals or spelled out; leave them out of the
# comparison (listen to those) so a real slip stands out.
LOOSE = re.compile(r'[0-9A-Za-z零〇一二三四五六七八九十百千两]')


def main():
    build = Path(sys.argv[1]).resolve() / 'build'
    from qwen_asr import Qwen3ASRModel
    model = Qwen3ASRModel.from_pretrained('Qwen/Qwen3-ASR-1.7B', dtype=torch.bfloat16, device_map='mps')
    timeline = json.loads((build / 'timeline.json').read_text(encoding='utf-8'))
    bad = 0
    for scene in timeline['scenes']:
        for line in scene['lines']:
            heard = model.transcribe(audio=str(build / line['file']), language='Chinese')[0].text
            a, h = LOOSE.sub('', PUNCT.sub('', line['text'])), LOOSE.sub('', PUNCT.sub('', heard))
            ratio = difflib.SequenceMatcher(None, a, h).ratio()
            rate = len(PUNCT.sub('', line['text'])) / line['duration']
            if a != h or not 3 <= rate <= 6:
                bad += 1
                print(f'{line["file"][6:]:10s} {ratio:.2f} {rate:3.1f}字/秒  原文 {line["text"]}\n{"":28s}听到 {heard}')
    print(f'{bad} 句需要听一下' if bad else '全部一致')


if __name__ == '__main__':
    main()
