"""The Freer School theme, composed in code: every note and every sound is made here,
so the music is ours outright and can be re-rendered or changed at will.

One 8-bar loop per style. It opens with the 飞人 motif (five notes) which comes back in
bar 5, over four chords; pad, arpeggio, bass and soft drums underneath. The loop is
seamless: what rings past its end is wrapped onto its start.

    .venv/bin/python compose.py            # every style → out/<style>.wav + out/index.html
    .venv/bin/python compose.py 晨光       # one style
    .venv/bin/python compose.py --theme    # the chosen style (school.json) → video/public/music/{theme,bed}.wav
"""
import html
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
OUT = Path(__file__).parent / 'out'
rng = np.random.default_rng(7)  # fixed, so every render is identical


def hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def note(name: str) -> int:
    """'C4' → 60."""
    names = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
    pitch, octave = name[:-1], int(name[-1])
    semis = names[pitch[0]] + pitch.count('#') - pitch.count('b')
    return 12 * (octave + 1) + semis


def env(n: int, a: float, d: float, s: float, r: float, hold: float) -> np.ndarray:
    """ADSR over n samples; hold is the note length in seconds before release."""
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    rel = t > hold
    e[rel] *= np.exp(-(t[rel] - hold) / max(r, 1e-4))
    return e


def lowpass(x: np.ndarray, cutoff: float, order: int = 2) -> np.ndarray:
    return sosfilt(butter(order, cutoff, 'low', fs=SR, output='sos'), x)


def highpass(x: np.ndarray, cutoff: float, order: int = 2) -> np.ndarray:
    return sosfilt(butter(order, cutoff, 'high', fs=SR, output='sos'), x)


# ---- instruments: each returns a mono note of `dur` seconds plus its tail ----

def bell(m: int, dur: float) -> np.ndarray:
    """FM bell / electric-piano: bright attack that mellows."""
    n = int((dur + 2.0) * SR)
    t = np.arange(n) / SR
    f = hz(m)
    index = 2.2 * np.exp(-t / 0.35)
    x = np.sin(2 * np.pi * f * t + index * np.sin(2 * np.pi * f * 3.5 * t))
    x += 0.3 * np.sin(2 * np.pi * f * 2 * t)
    return x * env(n, 0.004, 0.6, 0.25, 0.8, dur)


def pluck(m: int, dur: float) -> np.ndarray:
    """Soft triangle pluck."""
    n = int((dur + 0.8) * SR)
    t = np.arange(n) / SR
    x = 2 * np.abs(2 * ((hz(m) * t) % 1) - 1) - 1
    return lowpass(x, 2400) * env(n, 0.003, 0.18, 0.0, 0.2, dur)


def square_lead(m: int, dur: float) -> np.ndarray:
    """Filtered square with a little vibrato: the most 'digital' voice."""
    n = int((dur + 0.6) * SR)
    t = np.arange(n) / SR
    vib = 1 + 0.003 * np.sin(2 * np.pi * 5.5 * t) * np.clip(t / 0.3, 0, 1)
    x = np.sign(np.sin(2 * np.pi * hz(m) * np.cumsum(vib) / SR))
    return lowpass(x, 1800) * env(n, 0.01, 0.3, 0.55, 0.25, dur)


def pad(ms: list[int], dur: float) -> tuple[np.ndarray, np.ndarray]:
    """Detuned saws, slow attack, darkened; stereo by detuning left and right apart."""
    n = int((dur + 1.5) * SR)
    t = np.arange(n) / SR
    left, right = np.zeros(n), np.zeros(n)
    for m in ms:
        for cents, side in ((-7, left), (6, right), (0, left), (0, right)):
            f = hz(m) * 2 ** (cents / 1200)
            side += 2 * ((f * t + rng.random()) % 1) - 1
    e = env(n, 0.9, 1.0, 0.8, 1.2, dur)
    return lowpass(left, 1100) * e / len(ms), lowpass(right, 1100) * e / len(ms)


def bass(m: int, dur: float) -> np.ndarray:
    n = int((dur + 0.4) * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * hz(m) * t) + 0.25 * np.sin(2 * np.pi * hz(m) * 2 * t)
    return np.tanh(1.5 * x) * env(n, 0.01, 0.4, 0.6, 0.15, dur)


def kick() -> np.ndarray:
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 45 + 75 * np.exp(-t / 0.04)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.18)


def hat() -> np.ndarray:
    n = int(0.06 * SR)
    return highpass(rng.standard_normal(n), 7000) * np.exp(-np.arange(n) / SR / 0.018)


def snap() -> np.ndarray:
    """A soft rim/snap rather than a full snare."""
    n = int(0.15 * SR)
    t = np.arange(n) / SR
    noise = sosfilt(butter(2, [1500, 5000], 'band', fs=SR, output='sos'), rng.standard_normal(n))
    return (0.6 * noise + 0.4 * np.sin(2 * np.pi * 330 * t)) * np.exp(-t / 0.05)


LEADS = {'bell': bell, 'pluck': pluck, 'square': square_lead}


@dataclass
class Style:
    name: str
    bpm: int
    chords: list[list[str]]  # four chords, one bar each, played twice
    roots: list[str]
    motif: list[tuple[str, float]]  # (note, beats) — the 飞人 motif
    lead: str
    arp_step: float = 0.5  # beats per arpeggio note
    swing: float = 0.0
    hats: float = 0.5  # beats between hats
    levels: dict = field(default_factory=dict)
    note: str = ''


STYLES = [
    Style(
        '晨光', 84,
        chords=[['C4', 'E4', 'G4', 'B4', 'D5'], ['A3', 'C4', 'E4', 'G4', 'B4'], ['F3', 'A3', 'C4', 'E4', 'G4'], ['G3', 'C4', 'D4', 'F4', 'A4']],
        roots=['C2', 'A1', 'F1', 'G1'],
        motif=[('E5', 0.5), ('G5', 0.5), ('C6', 1.5), ('B5', 0.5), ('G5', 1.0)],
        lead='bell', swing=0.08,
        note='C 大调，84 拍。贝尔音唱动机，温暖铺底，最轻松。',
    ),
    Style(
        '星图', 90,
        chords=[['A3', 'C4', 'E4', 'G4', 'B4'], ['F3', 'A3', 'C4', 'E4', 'G4'], ['C4', 'E4', 'G4', 'B4', 'D5'], ['G3', 'B3', 'D4', 'F#4', 'A4']],
        roots=['A1', 'F1', 'C2', 'G1'],
        motif=[('E5', 0.5), ('A5', 0.5), ('B5', 1.0), ('G5', 0.5), ('E5', 1.5)],
        lead='pluck', arp_step=0.5,
        note='A 小调，90 拍。带回声的拨弦唱动机，偏空灵。',
    ),
    Style(
        '电路', 96,
        chords=[['D4', 'F4', 'A4', 'C5', 'E5'], ['G3', 'B3', 'D4', 'F4', 'A4'], ['A3', 'C4', 'E4', 'G4', 'B4'], ['C4', 'E4', 'G4', 'B4', 'D5']],
        roots=['D2', 'G1', 'A1', 'C2'],
        motif=[('A5', 0.5), ('D6', 0.5), ('E6', 1.0), ('C6', 0.5), ('A5', 1.5)],
        lead='square', arp_step=0.25, hats=0.25,
        note='D 多利亚，96 拍。十六分音符琶音推进，科技感最强。',
    ),
]


def compose(style: Style, motif: bool = True) -> np.ndarray:
    """The loop; without the motif it is the quiet bed that sits under narration."""
    beat = 60 / style.bpm
    bar = 4 * beat
    loop = 8 * bar
    tail = 3.0
    n = int((loop + tail) * SR)
    L, R = np.zeros(n), np.zeros(n)

    def add(x, at, gain=1.0, pan=0.0):
        i = int(at * SR)
        j = min(n, i + len(x))
        L[i:j] += x[: j - i] * gain * (1 - pan) * 0.7
        R[i:j] += x[: j - i] * gain * (1 + pan) * 0.7

    def swung(b):  # delay off-beat eighths a little
        return b + (style.swing if (b * 2) % 2 == 1 else 0)

    for b8 in range(8):
        chord = [note(x) for x in style.chords[b8 % 4]]
        start = b8 * bar
        pl, pr = pad(chord, bar)
        i = int(start * SR)
        j = min(n, i + len(pl))
        L[i:j] += pl[: j - i] * 0.22
        R[i:j] += pr[: j - i] * 0.22
        # bass: root on 1, a nudge on the "and" of 3
        root = note(style.roots[b8 % 4])
        add(bass(root, 2.5 * beat), start, 0.42)
        add(bass(root, 0.8 * beat), start + 3.5 * beat, 0.3)
        # arpeggio over the chord, up then down, a little to the right
        order = chord + chord[-2:0:-1]
        steps = int(4 / style.arp_step)
        for k in range(steps):
            m = order[k % len(order)] + 12
            add(pluck(m, style.arp_step * beat * 0.9), start + swung(k * style.arp_step) * beat, 0.16, pan=0.3)
        # drums
        add(kick(), start, 0.55)
        add(kick(), start + 2.5 * beat, 0.4)
        add(snap(), start + beat, 0.22, pan=-0.1)
        add(snap(), start + 3 * beat, 0.22, pan=-0.1)
        h = 0.0
        while h < 4:
            add(hat(), start + swung(h) * beat, 0.07 if h % 1 else 0.1, pan=-0.35)
            h += style.hats

    # the motif: bar 1 (stated) and bar 5 (answered an octave lower, softer)
    lead = LEADS[style.lead]
    for bar_at, shift, gain in ((0, 0, 0.42), (4, -12, 0.3)) if motif else ():
        t = bar_at * bar
        for name, beats in style.motif:
            add(lead(note(name) + shift, beats * beat * 0.95), t, gain, pan=-0.15)
            t += beats * beat

    # echo on the lead/arp side: dotted-eighth delay, then a small room
    delay = int(0.75 * beat * SR)
    for ch in (L, R):
        echo = np.zeros_like(ch)
        echo[delay:] = ch[:-delay] * 0.22
        ch += lowpass(echo, 3000)
    ir_len = int(1.6 * SR)
    decay = np.exp(-np.arange(ir_len) / SR / 0.45)
    irl, irr = rng.standard_normal(ir_len) * decay, rng.standard_normal(ir_len) * decay
    wl = fftconvolve(L, irl)[:n] / np.sqrt(ir_len) * 0.9
    wr = fftconvolve(R, irr)[:n] / np.sqrt(ir_len) * 0.9
    L, R = L + 0.25 * lowpass(wl, 5000), R + 0.25 * lowpass(wr, 5000)

    # seamless loop: fold what rings past the end back onto the start
    m = int(loop * SR)
    L[: n - m] += L[m:]
    R[: n - m] += R[m:]
    out = np.stack([L[:m], R[:m]], axis=1)
    out = np.tanh(out * 1.2) / 1.2  # gentle glue
    rms = np.sqrt(np.mean(out ** 2))
    return (out * (0.12 / rms)).clip(-0.99, 0.99).astype(np.float32)  # about -18 dBFS RMS


def main():
    if sys.argv[1:] == ['--theme']:
        root = Path(__file__).parent.parent
        name = json.loads((root / 'school.json').read_text(encoding='utf-8'))['music']['theme']
        style = next(s for s in STYLES if s.name == name)
        folder = root / 'video' / 'public' / 'music'
        folder.mkdir(parents=True, exist_ok=True)
        # theme: with the motif, for the title and the end; bed: without it, under narration.
        theme, bed = compose(style), compose(style, motif=False)
        sf.write(folder / 'theme.wav', theme, SR, subtype='PCM_16')
        sf.write(folder / 'bed.wav', bed, SR, subtype='PCM_16')
        (folder / 'music.json').write_text(json.dumps({'loop': len(theme) / SR}))
        print(f'{name} → {folder}/theme.wav, bed.wav')
        return
    OUT.mkdir(exist_ok=True)
    chosen = [s for s in STYLES if not sys.argv[1:] or s.name in sys.argv[1:]]
    rows = []
    for style in chosen:
        audio = compose(style)
        sf.write(OUT / f'{style.name}.wav', audio, SR)
        # two passes back to back, to hear the loop seam
        sf.write(OUT / f'{style.name}-两遍.wav', np.concatenate([audio, audio]), SR)
        secs = len(audio) / SR
        print(f'{style.name}: {secs:.1f}s loop')
        rows.append(
            f'<tr><td><b>{style.name}</b></td><td>{html.escape(style.note)}<br>循环 {secs:.1f} 秒</td>'
            f'<td><audio controls preload="none" src="{style.name}-两遍.wav"></audio></td></tr>'
        )
    (OUT / 'index.html').write_text(
        '<!doctype html><meta charset="utf-8"><title>飞人学堂 主题音乐</title>'
        '<style>body{font-family:-apple-system,"PingFang SC",sans-serif;margin:24px}td{padding:8px 12px;border-bottom:1px solid #ddd}</style>'
        '<h1>飞人学堂 主题音乐</h1><p>每个版本连放两遍，可以听循环衔接处是否自然。开头的五个音是“飞人动机”。</p>'
        '<table>' + ''.join(rows) + '</table>',
        encoding='utf-8',
    )


if __name__ == '__main__':
    main()
