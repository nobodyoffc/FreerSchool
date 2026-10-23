"""Voice an episode's narration in the Navigator's voice.

Reads episodes/<...>/script.md, synthesizes every "> " line, and writes to <episode>/build/:
    narration.wav   all lines, with pauses between lines and scenes
    lines/*.wav     one file per line
    timeline.json   the episode for the video: id and title, and per scene its type, points,
                    operations, callouts and lines with timings in seconds

    .venv/bin/python narrate.py ../episodes/U1/U1-02-你的第一个身份

The voice is Qwen3-TTS cloning the Navigator's FID voice (qwen_voice.py). A line already
synthesized comes from the cache, so a rerun only synthesizes lines that changed.
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

from qwen_voice import SAMPLE_RATE, VERSION, Synthesizer

ROOT = Path(__file__).resolve().parent.parent
# Pauses between speech, in seconds. Each line is trimmed to its speech plus EDGE on
# either side, so these set the pause. Pauses inside a line are the model's own.
EDGE = 0.05
LINE_GAP = 1.55  # between lines: ~1.65 s of silence in all
SCENE_GAP = 1.9  # between scenes: ~2 s

SCENE = re.compile(r'^### (S\d+) \[(.+?)\]\s*(.*)$')
# A callout: "圈出 FID @"FID" 370,385,1060,580" (a box, shown when the word is spoken) or
# "点击 创建 @10.87s 990,2494" (a tap, at that second of the recording). Coordinates are
# recording pixels. "遮挡 私钥 @12.0-18.5s 60,900,1220,1010" covers a box (e.g. a private key)
# while the recording shows those seconds; without "@…s" it covers the whole scene.
# "圈出领航员头像 @"我的头像" 领航员" rings the Navigator's avatar beside the phone instead.
# A box can end before its line does: "圈出 对话框 @"SHA256"-21.5s 75,1035,1205,1740" goes when
# the recording reaches 21.5 s (e.g. the dialog closes).
# Anything else in a 标注 line stays a plain note.
MASK = re.compile(r'^遮挡\s*(?P<label>.*?)\s*(?:@(?P<a>\d+(?:\.\d+)?)-(?P<b>\d+(?:\.\d+)?)s\s+)?(?P<xy>\d+,\d+,\d+,\d+)$')
CALLOUT = re.compile(r'^(?P<label>.*?)\s*@(?:"(?P<word>[^"]+)"(?:-(?P<until>\d+(?:\.\d+)?)s)?|(?P<sec>-?\d+(?:\.\d+)?)s)\s+(?P<xy>\d+(?:,\d+){1,3}|领航员)$')


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
            scenes.append({'id': m[1], 'type': m[2], 'title': m[3], 'points': [], 'ops': [], 'notes': [], 'callouts': [], 'clip': [], 'lines': []})
        elif not scenes:
            continue
        elif raw.startswith('> '):
            # "> [12.0] 旁白": this line starts when the scene's recording is at 12.0 s.
            text = raw[2:].strip()
            anchor = None
            if m := re.match(r'^\[(-?\d+(?:\.\d+)?)\]\s*', text):
                anchor, text = float(m[1]), text[m.end():]
            scenes[-1]['lines'].append((text, anchor))
        elif raw.startswith('- '):
            scenes[-1]['points'].append(raw[2:].strip())
        elif raw.startswith('操作：'):
            scenes[-1]['ops'] += [op.strip() for op in raw[3:].split('→')]
        elif raw.startswith('剪辑：'):
            # "剪辑：0-3.8，12-15" — the seconds of the recording to use, in order.
            for part in re.split(r'[，,]', raw[3:]):
                start, end = part.strip().split('-')
                scenes[-1]['clip'].append([float(start), float(end)])
        elif raw.startswith('标注：'):
            for note in (n.strip() for n in raw[3:].split('；')):
                if m := MASK.match(note):
                    scenes[-1]['callouts'].append({
                        'label': '遮挡 ' + m['label'], 'word': None, 'rec': None, 'kind': 'mask',
                        'xy': [int(v) for v in m['xy'].split(',')],
                        'range': [float(m['a']), float(m['b'])] if m['a'] else None,
                    })
                elif c := CALLOUT.match(note):
                    xy = [] if c['xy'] == '领航员' else [int(v) for v in c['xy'].split(',')]
                    scenes[-1]['callouts'].append({
                        'label': c['label'], 'word': c['word'], 'rec': float(c['sec']) if c['sec'] else None,
                        'until': float(c['until']) if c['until'] else None,
                        'kind': 'navigator' if not xy else 'box' if len(xy) == 4 else 'tap', 'xy': xy,
                    })
                else:
                    scenes[-1]['notes'].append(note)
    return front, scenes


def trim(wav: np.ndarray, edge: float = EDGE, threshold: float = 0.01) -> np.ndarray:
    """Cut the silence around speech, keeping `edge` seconds on either side."""
    loud = np.flatnonzero(np.abs(wav) > threshold)
    if not len(loud):
        return wav
    margin = int(edge * SAMPLE_RATE)
    return wav[max(0, loud[0] - margin):loud[-1] + margin]


def main():
    episode = Path(sys.argv[1]).resolve()
    front, scenes = parse((episode / 'script.md').read_text(encoding='utf-8'))
    navigator = json.loads((ROOT / 'school.json').read_text(encoding='utf-8'))['navigator']

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
        'navigator': navigator, 'voice': VERSION,
        'gaps': {'line': LINE_GAP, 'scene': SCENE_GAP},
        'scenes': [],
    }
    for si, scene in enumerate(scenes):
        if si:
            silence(SCENE_GAP)
        entry = {k: scene[k] for k in ('id', 'type', 'title', 'points', 'ops', 'notes', 'clip')} | {'callouts': []} | {'start': round(t, 3), 'lines': []}
        for li, (text, anchor) in enumerate(scene['lines']):
            if li:
                silence(LINE_GAP)
            wav = trim(synth.speak(text))
            # Callouts keyed to a word in this line: the first line that says it.
            for c in scene['callouts']:
                if c['word'] and 'line' not in c and c['word'] in text.translate(str.maketrans('', '', '"“”')):
                    c['line'] = li
                    word = c['word']
                    # Word times come from aligning the finished line.
                    c['offset'] = round(synth.offset(wav, text, word), 3)
            name = f'{scene["id"]}-{li + 1:02}.wav'
            sf.write(build / 'lines' / name, wav, SAMPLE_RATE)
            duration = len(wav) / SAMPLE_RATE
            entry['lines'].append({'text': text, 'file': f'lines/{name}', 'duration': round(duration, 3),
                                   'start': round(t, 3), 'end': round(t + duration, 3), 'anchor': anchor})
            audio.append(wav)
            t += duration
            print(f'{scene["id"]} {t:6.1f}s  {text}', flush=True)
        entry['callouts'] = scene['callouts']
        for c in scene['callouts']:
            if c['word'] and 'line' not in c:
                print(f'警告：{scene["id"]} 的标注关键词"{c["word"]}"不在任何旁白里')
        entry['end'] = round(t, 3)
        timeline['scenes'].append(entry)

    timeline['duration'] = round(t, 3)
    sf.write(build / 'narration.wav', np.concatenate(audio), SAMPLE_RATE)
    (build / 'timeline.json').write_text(json.dumps(timeline, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'total {t:.1f}s → {build}')


if __name__ == '__main__':
    main()
