"""Voice an episode's narration in the Navigator's voice.

Reads episodes/<...>/script.md, synthesizes every "> " line, and writes to <episode>/build/:
    narration.wav   all lines, with pauses between lines and scenes
    lines/*.wav     one file per line
    timeline.json   scene and line timings, in seconds, for the video and captions

    python narrate.py ../episodes/U1/U1-02-创建你的第一个身份
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

from freer_voice import SAMPLE_RATE, Synthesizer, derive

ROOT = Path(__file__).parent.parent
LINE_GAP = 0.35  # seconds of silence between lines
SCENE_GAP = 0.8  # between scenes

SCENE = re.compile(r'^### (S\d+) \[(.+?)\]\s*(.*)$')


def parse(script: str) -> list[dict]:
    scenes = []
    for raw in script.splitlines():
        if m := SCENE.match(raw):
            scenes.append({'id': m[1], 'type': m[2], 'title': m[3], 'lines': []})
        elif raw.startswith('> ') and scenes:
            scenes[-1]['lines'].append(raw[2:].strip())
    return scenes


def main():
    episode = Path(sys.argv[1]).resolve()
    scenes = parse((episode / 'script.md').read_text(encoding='utf-8'))
    navigator = json.loads((ROOT / 'school.json').read_text(encoding='utf-8'))['navigator']
    params = derive(navigator['fid'])

    build = episode / 'build'
    (build / 'lines').mkdir(parents=True, exist_ok=True)
    synth = Synthesizer()
    audio, t = [], 0.0

    def silence(seconds: float):
        nonlocal t
        audio.append(np.zeros(int(seconds * SAMPLE_RATE), dtype=np.float32))
        t += seconds

    timeline = {'fid': navigator['fid'], 'voice': params.version, 'scenes': []}
    for si, scene in enumerate(scenes):
        if si:
            silence(SCENE_GAP)
        entry = {k: scene[k] for k in ('id', 'type', 'title')} | {'start': round(t, 3), 'lines': []}
        for li, text in enumerate(scene['lines']):
            if li:
                silence(LINE_GAP)
            wav = synth.speak(params, text).astype(np.float32)
            name = f'{scene["id"]}-{li + 1:02}.wav'
            sf.write(build / 'lines' / name, wav, SAMPLE_RATE)
            duration = len(wav) / SAMPLE_RATE
            entry['lines'].append({'text': text, 'file': f'lines/{name}', 'start': round(t, 3), 'end': round(t + duration, 3)})
            audio.append(wav)
            t += duration
            print(f'{scene["id"]} {t:6.1f}s  {text}', flush=True)
        entry['end'] = round(t, 3)
        timeline['scenes'].append(entry)

    timeline['duration'] = round(t, 3)
    sf.write(build / 'narration.wav', np.concatenate(audio), SAMPLE_RATE)
    (build / 'timeline.json').write_text(json.dumps(timeline, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'total {t:.1f}s → {build}')


if __name__ == '__main__':
    main()
