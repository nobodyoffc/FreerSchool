"""Listening page for screening the base voices: out/screen/index.html.

Each base voice, unmixed, reads the same sentence. Voices whose Mandarin tones
sound foreign go into EXCLUDED in freer_voice.py.

    python screen_voices.py
"""
from pathlib import Path

import soundfile as sf

from freer_voice import EXCLUDED, SAMPLE_RATE, Synthesizer, VoiceParams, base_voices

OUT = Path(__file__).parent / 'out' / 'screen'
TEXT = '我是领航员。主页上有一份新手入门清单，我们一项一项完成它。'


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    synth = Synthesizer()
    rows = []
    for gender in ('male', 'female'):
        for voice in base_voices(gender):
            p = VoiceParams('', 'v0', gender, voice, voice, 0.0, 0.0, 1.0, 0)
            sf.write(OUT / f'{voice}.wav', synth.speak(p, TEXT), SAMPLE_RATE)
            note = '已排除' if voice in EXCLUDED else ''
            rows.append(f'<tr><td><code>{voice}</code></td><td>{note}</td>'
                        f'<td><audio controls preload="none" src="{voice}.wav"></audio></td></tr>')
            print(voice, flush=True)
    (OUT / 'index.html').write_text(
        '<!doctype html><meta charset="utf-8"><title>基础音色筛选</title>'
        '<style>body{font-family:-apple-system,"PingFang SC",sans-serif;margin:24px}'
        'td{padding:4px 12px;border-bottom:1px solid #eee}</style>'
        f'<h1>基础音色筛选</h1><p>{TEXT}</p><p>请记下声调怪异、像外国人念中文的音色编号。</p>'
        '<table>' + ''.join(rows) + '</table>',
        encoding='utf-8',
    )


if __name__ == '__main__':
    main()
