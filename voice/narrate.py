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
# A callout: "圈出 FID @"FID" 370,385,1060,580" (a box, shown when the word is spoken) or
# "点击 创建 @10.87s 990,2494" (a tap, at that second of the recording). Coordinates are
# recording pixels. "遮挡 私钥 @12.0-18.5s 60,900,1220,1010" covers a box (e.g. a private key)
# while the recording shows those seconds; without "@…s" it covers the whole scene.
# Anything else in a 标注 line stays a plain note.
MASK = re.compile(r'^遮挡\s*(?P<label>.*?)\s*(?:@(?P<a>\d+(?:\.\d+)?)-(?P<b>\d+(?:\.\d+)?)s\s+)?(?P<xy>\d+,\d+,\d+,\d+)$')
CALLOUT = re.compile(r'^(?P<label>.*?)\s*@(?:"(?P<word>[^"]+)"|(?P<sec>-?\d+(?:\.\d+)?)s)\s+(?P<xy>\d+(?:,\d+){1,3})$')
CJK = re.compile(r'[\u4e00-\u9fff]')


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
                    xy = [int(v) for v in c['xy'].split(',')]
                    scenes[-1]['callouts'].append({
                        'label': c['label'], 'word': c['word'], 'rec': float(c['sec']) if c['sec'] else None,
                        'kind': 'box' if len(xy) == 4 else 'tap', 'xy': xy,
                    })
                else:
                    scenes[-1]['notes'].append(note)
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


def word_offset(synth: Synthesizer, params, text: str, word: str, lead: float) -> float:
    """Seconds from the start of a trimmed line to where `word` begins, from the model's durations."""
    clean = text.translate(str.maketrans('', '', '"“”「」『』'))
    target = len(CJK.findall(clean[:clean.index(word)]))
    starts, before = [], 0.0
    for r in synth.pipeline(clean, voice=synth.style(params), speed=lambda n: params.speed * 1.1):
        ps, dur = r.phonemes, r.pred_dur.tolist()
        acc, syl = dur[0], None
        for j, c in enumerate(ps):
            if syl is None and ('\u3100' <= c <= '\u312f' or '\u4e00' <= c <= '\u9fff'):
                syl = acc
            if c in '12345' and syl is not None:
                starts.append(before + syl * 600 / SAMPLE_RATE)
                syl = None
            acc += dur[j + 1]
        before += sum(dur) * 600 / SAMPLE_RATE
    if not starts:
        return 0.0
    at = starts[min(target, len(starts) - 1)]
    if not CJK.match(word[0]) and target > 0:
        # An English word has no syllable of its own here; it follows the previous character.
        at = min(at, starts[target - 1] + 0.3)
    return max(0.0, at - lead)


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
        entry = {k: scene[k] for k in ('id', 'type', 'title', 'points', 'ops', 'notes', 'clip')} | {'callouts': []} | {'start': round(t, 3), 'lines': []}
        for li, (text, anchor) in enumerate(scene['lines']):
            if li:
                silence(LINE_GAP)
            raw = synth.speak(params, text).astype(np.float32)
            lead = max(0, int(np.flatnonzero(np.abs(raw) > 0.01)[0]) - int(EDGE * SAMPLE_RATE)) / SAMPLE_RATE if np.any(np.abs(raw) > 0.01) else 0.0
            wav = tighten(trim(raw, EDGE))
            # Callouts keyed to a word in this line: the first line that says it.
            for c in scene['callouts']:
                if c['word'] and 'line' not in c and c['word'] in text.translate(str.maketrans('', '', '"“”')):
                    c['line'] = li
                    c['offset'] = round(word_offset(synth, params, text, c['word'], lead), 3)
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
