"""Find highlight boxes that outstay their screen.

A box stays to the end of its line. When the page changes before that (a dialog closes, the
app moves on), the box hangs over the wrong screen. This plays each box the way the video
does, compares the recording under it with how it looked when the box appeared, and reports
the recording second at which the screen changed, ready for @"词"-秒s.

    .venv/bin/python boxes.py ../../episodes/U1/<集目录>
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

import migrate as m

FPS = 30
SAMPLE = 10  # recording frames a second for the comparison
W = 160  # comparison width in pixels
CHANGED = 18  # mean difference (0–255), over the box and over the whole screen, that counts as a new screen


def frames_of(path: Path) -> tuple[np.ndarray, int, int]:
    """The recording as grey frames, SAMPLE a second, W pixels wide."""
    w, h = map(int, subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', str(path)]).decode().split(',')[:2])
    hh = round(h * W / w / 2) * 2
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(path), '-vf', f'fps={SAMPLE},scale={W}:{hh},format=gray', '-f', 'rawvideo', '-'])
    return np.frombuffer(raw, np.uint8).reshape(-1, hh, W).astype(np.int16), w, h


def rec_at(pieces: list[dict], f: int) -> int:
    """Recording frame shown at scene frame f (recFrameAt in Callouts.tsx)."""
    p = next((x for x in pieces if x['at'] <= f < x['at'] + x['frames']), pieces[-1])
    return p['rec'] if p['hold'] else p['rec'] + (f - p['at'])


def main():
    episode = Path(sys.argv[1]).resolve()
    t = json.loads((episode / 'build' / 'timeline.json').read_text(encoding='utf-8'))
    rec_dir = Path(__file__).resolve().parents[2] / 'recordings' / t['id']
    found = 0
    for s in t['scenes']:
        boxes = [c for c in s['callouts'] if c['kind'] == 'box' and c.get('line') is not None]
        path = rec_dir / f'{s["id"]}.mp4'
        if not boxes or not path.exists():
            continue
        video, w, h = frames_of(path)
        k = W / w
        lines = m.plan_lines(s, t['gaps'])
        scene_frames = round((s['end'] - s['start'] + 3) * FPS)
        pieces = m.plan_screen(lines, s['clip'], len(video) * FPS // SAMPLE, scene_frames) if any(l['anchor'] is not None for l in lines) \
            else [{'at': 0, 'frames': scene_frames, 'rec': 0, 'hold': False}]
        for c in boxes:
            line = lines[c['line']]
            start = line['from'] + round(c['offset'] * FPS) - 3
            end = line['from'] + line['frames'] + 12
            x1, y1, x2, y2 = (round(v * k) for v in c['xy'])
            idx = lambda f: min(len(video) - 1, rec_at(pieces, f) * SAMPLE // FPS)
            first = video[idx(start)]
            for f in range(start, end, 3):
                now = video[idx(f)]
                box = np.abs(now[y1:y2, x1:x2] - first[y1:y2, x1:x2]).mean()
                screen = np.abs(now - first).mean()
                if box > CHANGED and screen > CHANGED:
                    rec = rec_at(pieces, f) / FPS
                    left = (end - f) / FPS
                    if c.get('until') is None and left > 0.4:
                        found += 1
                        print(f'{s["id"]} {c["label"]} @"{c["word"]}"：录屏 {rec:.2f} 秒换了画面，框还要停 {left:.1f} 秒 → @"{c["word"]}"-{rec:.2f}s')
                    break
    print(f'{found} 个框要提前撤掉' if found else '没有框停留过久')


if __name__ == '__main__':
    main()
