"""Voice an episode's narration in the Navigator's voice.

Reads episodes/<...>/script.md, synthesizes every "> " line, and writes to <episode>/build/:
    narration.wav   all lines, with pauses between lines and scenes
    lines/*.wav     one file per line
    timeline.json   the episode for the video: id and title, and per scene its type, points,
                    operations, callouts and lines with timings in seconds

    python narrate.py ../episodes/U1/U1-02-你的第一个身份
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

from freer_voice import SAMPLE_RATE, Synthesizer, derive, trim

ROOT = Path(__file__).parent.parent
# Pauses between speech, in seconds. Each line is trimmed to its speech plus EDGE on
# either side (the model pads ~0.7 s before and ~1.1 s after), so these set the pause.
EDGE = 0.05
LINE_GAP = 1.55  # between lines: ~1.65 s of silence in all
SCENE_GAP = 1.9  # between scenes: ~2 s
# Pauses inside a line (at commas and full stops) longer than PAUSE_MIN are cut to PAUSE_SCALE.
PAUSE_MIN = 0.3
PAUSE_SCALE = 0.75

SCENE = re.compile(r'^### (S\d+) \[(.+?)\]\s*(.*)$')


def parse(script: str) -> tuple[dict, list[dict]]:
    """Front matter fields, and the scenes under "## 场景"."""
    front = {}
    if script.startswith('---'):
        for raw in script.split('---')[1].splitlines():
            if ':' in raw:
                key, value = raw.split(':', 1)
                front[key.strip()] = value.split('#')[0].strip()
    scenes = []
    for raw in script.splitlines():
        if m := SCENE.match(raw):
            scenes.append({'id': m[1], 'type': m[2], 'title': m[3], 'points': [], 'ops': [], 'notes': [], 'lines': []})
        elif not scenes:
            continue
        elif raw.startswith('> '):
            scenes[-1]['lines'].append(raw[2:].strip())
        elif raw.startswith('- '):
            scenes[-1]['points'].append(raw[2:].strip())
        elif raw.startswith('操作：'):
            scenes[-1]['ops'] += [op.strip() for op in raw[3:].split('→')]
        elif raw.startswith('标注：'):
            scenes[-1]['notes'] += [n.strip() for n in raw[3:].split('；')]
    return front, scenes


def tighten(wav: np.ndarray, threshold: float = 0.01, hop: int = 240) -> np.ndarray:
    """Shorten each silent run longer than PAUSE_MIN to PAUSE_SCALE of its length, cutting from its middle."""
    quiet = np.array([np.abs(wav[i:i + hop]).max() <= threshold for i in range(0, len(wav), hop)])
    keep = np.ones(len(wav), dtype=bool)
    i = 0
    while i < len(quiet):
        if not quiet[i]:
            i += 1
            continue
        j = i
        while j < len(quiet) and quiet[j]:
            j += 1
        run = (j - i) * hop
        if run >= PAUSE_MIN * SAMPLE_RATE:
            cut = int(run * (1 - PAUSE_SCALE))
            middle = i * hop + run // 2
            keep[middle - cut // 2:middle - cut // 2 + cut] = False
        i = j
    return wav[keep]


def main():
    episode = Path(sys.argv[1]).resolve()
    front, scenes = parse((episode / 'script.md').read_text(encoding='utf-8'))
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

    timeline = {
        'id': front.get('id'), 'title': front.get('title'), 'app': front.get('app'),
        'navigator': navigator, 'voice': params.version,
        'gaps': {'line': LINE_GAP, 'scene': SCENE_GAP},
        'scenes': [],
    }
    for si, scene in enumerate(scenes):
        if si:
            silence(SCENE_GAP)
        entry = {k: scene[k] for k in ('id', 'type', 'title', 'points', 'ops', 'notes')} | {'start': round(t, 3), 'lines': []}
        for li, text in enumerate(scene['lines']):
            if li:
                silence(LINE_GAP)
            wav = tighten(trim(synth.speak(params, text).astype(np.float32), EDGE))
            name = f'{scene["id"]}-{li + 1:02}.wav'
            sf.write(build / 'lines' / name, wav, SAMPLE_RATE)
            duration = len(wav) / SAMPLE_RATE
            entry['lines'].append({'text': text, 'file': f'lines/{name}', 'duration': round(duration, 3),
                                   'start': round(t, 3), 'end': round(t + duration, 3)})
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
