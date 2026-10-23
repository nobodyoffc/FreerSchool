"""Move an episode's anchors from an old narration to a new one (e.g. after the voice or its reference changes).

An anchor ties a line to the recording so that a tap lands on a word. When the voice
changes, the word moves within its line. For each tap this finds the character it landed
on in the old line, finds that character in the new line, and shifts the line's anchor
by the difference (taken from the first tap the line shows). It then plays both versions
the way the video does and reports, for every tap, how far it lands from where it should.
Taps behind a cut inside a line (a clip boundary) may need their clip adjusted by hand.

    .venv/bin/python migrate.py <episode dir> <old build dir>          # report only
    .venv/bin/python migrate.py <episode dir> <old build dir> --write  # also rewrite anchors in script.md
    .venv/bin/python migrate.py <episode dir> <old build dir> --check  # after narrate.py: report only, no shifts
"""
import json
import re
import sys
from pathlib import Path

import soundfile as sf
import torch

import qwen_voice

FPS = 30
LEAD = 0.4  # video/src/episode/plan.ts
ANCHOR = re.compile(r'^> \[(-?\d+(?:\.\d+)?)\]\s*')


def plan_lines(scene: dict, gaps: dict) -> list[dict]:
    """Each line's start (frames from the scene's start) and length, as plan.ts lays them out."""
    t, out = LEAD, []
    for i, line in enumerate(scene['lines']):
        if i:
            t += gaps['line']
        out.append({'from': round(t * FPS), 'frames': round(line['duration'] * FPS), 'anchor': line['anchor']})
        t += line['duration']
    return out


def plan_screen(lines: list[dict], clip: list, rec_frames: int, scene_frames: int) -> list[dict]:
    """A port of planScreen in video/src/episode/Screen.tsx."""
    end = max(1, rec_frames - 1)
    pieces = []
    kept = [[round(a * FPS), round(b * FPS)] for a, b in clip] if clip else [[0, end]]

    def play(at, frm, to, until):
        last = max(frm, to - 1)
        for a, b in kept:
            s = max(a, frm)
            frames = min(min(b, to) - s, until - at)
            if frames <= 0:
                continue
            pieces.append({'at': at, 'frames': frames, 'rec': s, 'hold': False})
            at += frames
            last = s + frames - 1
        if until > at:
            pieces.append({'at': at, 'frames': until - at, 'rec': last, 'hold': True})

    anchors = [{'at': l['from'], 'rec': round(l['anchor'] * FPS)} for l in lines if l['anchor'] is not None]
    first = anchors[0]
    zero = first['at'] - first['rec']
    nxt = anchors[1] if len(anchors) > 1 else None
    if zero > 0:
        pieces.append({'at': 0, 'frames': zero, 'rec': 0, 'hold': True})
        play(zero, 0, nxt['rec'] if nxt else end, nxt['at'] if nxt else scene_frames)
    else:
        play(0, -zero, nxt['rec'] if nxt else end, nxt['at'] if nxt else scene_frames)
    for i, a in enumerate(anchors[1:]):
        after = anchors[i + 2] if i + 2 < len(anchors) else None
        play(a['at'], a['rec'], after['rec'] if after else end, after['at'] if after else scene_frames)
    return pieces


def shown_at(pieces: list[dict], rec: int):
    for p in pieces:
        if not p['hold'] and p['rec'] <= rec < p['rec'] + p['frames']:
            return p['at'] + rec - p['rec']
    return None


class Aligner:
    def __init__(self, lang: str = 'zh'):
        self.lang = lang
        from qwen_asr import Qwen3ForcedAligner
        self.model = Qwen3ForcedAligner.from_pretrained(qwen_voice.ALIGNER, dtype=torch.bfloat16, device_map='mps')
        self.cache = {}

    def items(self, wav_path: Path, text: str) -> list:
        if wav_path not in self.cache:
            wav, sr = sf.read(wav_path, dtype='float32')
            assert sr == qwen_voice.SAMPLE_RATE
            self.cache[wav_path] = self.model.align(audio=(wav, sr), text=qwen_voice.clean(text, self.lang), language=qwen_voice.language(self.lang).name)[0].items
        return self.cache[wav_path]


def where(items, offset: float) -> tuple[int, float]:
    """(item index, seconds past that item's start) for an offset inside a line."""
    k = 0
    for i, it in enumerate(items):
        if it.start_time <= offset:
            k = i
    return k, offset - items[k].start_time


def main():
    episode, old_build = Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve()
    write = '--write' in sys.argv
    check = '--check' in sys.argv  # anchors already moved: only report where the taps land
    new_build = episode / 'build'
    old_t = json.loads((old_build / 'timeline.json').read_text(encoding='utf-8'))
    new_t = json.loads((new_build / 'timeline.json').read_text(encoding='utf-8'))
    rec_dir = Path(__file__).resolve().parents[1] / 'recordings' / new_t['id']
    aligner = Aligner(new_t.get('language', 'zh'))
    shifts = {}  # (scene id, line index) -> new anchor

    for old_s, new_s in zip(old_t['scenes'], new_t['scenes']):
        taps = [c for c in new_s['callouts'] if c['kind'] == 'tap' and c['rec'] is not None]
        if not any(l['anchor'] is not None for l in new_s['lines']) or not taps:
            continue
        if [l['text'] for l in old_s['lines']] != [l['text'] for l in new_s['lines']]:
            print(f'== {new_s["id"]}：旁白和旧版不同（脚本在上次合成后改过），要手动对齐')
            continue
        rec_path = rec_dir / f'{new_s["id"]}.mp4'
        import subprocess
        rec_frames = int(float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(rec_path)])) * FPS)
        old_lines = plan_lines(old_s, old_t['gaps'])
        old_pieces = plan_screen(old_lines, old_s['clip'], rec_frames, round((old_s['end'] - old_s['start'] + 3) * FPS))

        # Where each tap should land in the new narration.
        targets = []
        for c in taps:
            at = shown_at(old_pieces, round(c['rec'] * FPS))
            if at is None:
                print(f'{new_s["id"]} {c["label"]} @{c["rec"]}s: not shown in the old version, skipped')
                continue
            li = max([i for i, l in enumerate(old_lines) if l['from'] <= at] or [0])
            o_old = (at - old_lines[li]['from']) / FPS
            old_items = aligner.items(old_build / old_s['lines'][li]['file'], old_s['lines'][li]['text'])
            new_items = aligner.items(new_build / new_s['lines'][li]['file'], new_s['lines'][li]['text'])
            k, past = where(old_items, o_old)
            if o_old > old_s['lines'][li]['duration']:
                o_new = new_s['lines'][li]['duration'] + (o_old - old_s['lines'][li]['duration'])  # in the pause after
                word = '（句后）'
            else:
                o_new = new_items[min(k, len(new_items) - 1)].start_time + past
                word = old_items[k].text
            targets.append({'c': c, 'line': li, 'o_old': o_old, 'o_new': o_new, 'word': word})

        # Shift each anchored line by its first tap's move.
        new_lines = plan_lines(new_s, new_t['gaps'])
        anchored = [i for i, l in enumerate(new_lines) if l['anchor'] is not None]
        for n, i in enumerate(anchored):
            stop = anchored[n + 1] if n + 1 < len(anchored) else len(new_lines)
            mine = [t for t in targets if i <= t['line'] < stop]
            if mine and not check:
                t0 = mine[0]
                # Recording seconds per spoken second are 1 until the first tap (no cut before it).
                shift = (t0['o_old'] + old_lines[t0['line']]['from'] / FPS - old_lines[i]['from'] / FPS) - \
                        (t0['o_new'] + new_lines[t0['line']]['from'] / FPS - new_lines[i]['from'] / FPS)
                new_lines[i]['anchor'] = round(new_s['lines'][i]['anchor'] + shift, 2)
            shifts[(new_s['id'], i)] = new_lines[i]['anchor']

        new_pieces = plan_screen(new_lines, new_s['clip'], rec_frames, round((new_s['end'] - new_s['start'] + 3) * FPS))
        print(f'== {new_s["id"]}')
        for i in anchored:
            print(f'  第{i + 1}句 锚点 {new_s["lines"][i]["anchor"]} → {new_lines[i]["anchor"]}')
        for t in targets:
            at = shown_at(new_pieces, round(t['c']['rec'] * FPS))
            want = new_lines[t['line']]['from'] + t['o_new'] * FPS
            off = '未显示' if at is None else f'{(at - want) / FPS:+.2f}s'
            flag = '' if at is not None and abs(at - want) <= 4 else '   ← 需调整'
            print(f'  {t["c"]["label"]:6s} @{t["c"]["rec"]:6.2f}s 第{t["line"] + 1}句"{t["word"]}" 偏差 {off}{flag}')

    if write:
        script = episode / 'script.md'
        out, scene, li = [], None, -1
        for raw in script.read_text(encoding='utf-8').splitlines():
            if m := re.match(r'^### (S\d+) ', raw):
                scene, li = m[1], -1
            elif raw.startswith('> '):
                li += 1
                if (scene, li) in shifts and (m := ANCHOR.match(raw)):
                    raw = f'> [{shifts[(scene, li)]}] ' + raw[m.end():]
            out.append(raw)
        script.write_text('\n'.join(out) + '\n', encoding='utf-8')
        print(f'已改写 {script}')


if __name__ == '__main__':
    main()
