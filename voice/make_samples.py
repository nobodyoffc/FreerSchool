"""Make a listening sheet: for each test FID, its avatar and a voice sample, in out/index.html.

    python make_samples.py [FID ...]
"""
import hashlib
import html
import sys
from pathlib import Path

import soundfile as sf
from PIL import Image

from freer_voice import BASE58, FID_VERSION, SAMPLE_RATE, Synthesizer, derive

HERE = Path(__file__).parent
OUT = HERE / 'out'
AVATAR_ELEMENTS = HERE.parent / 'video' / 'public' / 'avatar' / 'elements'

# Candidates for the Navigator; the rest are test FIDs.
NAVIGATOR_CANDIDATES = ['FQ8KKsMFYXkmNPDVauEMWFBnd7yfhiqqN8']

TEXT = (
    '你好，我是领航员。欢迎来到飞人学堂。'
    '你的FID，就是你在自由宇宙里的身份。'
    '私钥是这个身份属于你的唯一证明，请把它抄在纸上，放在安全的地方。'
)


def encode_fid(hash160: bytes) -> str:
    body = bytes([FID_VERSION]) + hash160
    raw = body + hashlib.sha256(hashlib.sha256(body).digest()).digest()[:4]
    n, s = int.from_bytes(raw, 'big'), ''
    while n:
        n, r = divmod(n, 58)
        s = BASE58[r] + s
    return s


def test_fids(count: int) -> list[str]:
    """Valid FIDs made from fixed strings, so nobody holds their prikeys."""
    return [encode_fid(hashlib.sha256(f'FreerSchool/test/{i}'.encode()).digest()[:20]) for i in range(count)]


def avatar(fid: str, path: Path) -> None:
    """Same layering as FC-JDK feature.avatar.AvatarMaker."""
    layers = [AVATAR_ELEMENTS / str(i) / f'{BASE58.index(fid[29 - i])}.png' for i in range(10)]
    img = Image.open(layers[0]).convert('RGBA').resize((150, 150))
    for layer in layers[1:]:
        img.alpha_composite(Image.open(layer).convert('RGBA'))
    img.save(path)


def main():
    fids = sys.argv[1:] or NAVIGATOR_CANDIDATES + test_fids(9)
    OUT.mkdir(exist_ok=True)
    synth = Synthesizer()
    rows = []
    for fid in fids:
        p = derive(fid)
        avatar(fid, OUT / f'{fid}.png')
        sf.write(OUT / f'{fid}.wav', synth.speak(p, TEXT), SAMPLE_RATE)
        tag = '领航员候选' if fid in NAVIGATOR_CANDIDATES else ''
        rows.append(
            f'<tr><td><img src="{fid}.png" width="96"></td>'
            f'<td><code>{fid}</code><br><b>{tag}</b></td>'
            f'<td>{"男" if p.gender == "male" else "女"}</td>'
            f'<td>{p.voice_a} × {1 - p.weight:.2f}<br>{p.voice_b} × {p.weight:.2f}</td>'
            f'<td>{p.pitch:+.1f}</td>'
            f'<td>{p.speed:.3f}</td>'
            f'<td><audio controls preload="none" src="{fid}.wav"></audio></td></tr>'
        )
        print(fid, p.gender, p.voice_a, p.voice_b, p.weight, p.pitch, p.speed)
    (OUT / 'index.html').write_text(
        '<!doctype html><meta charset="utf-8"><title>FID 声音试听</title>'
        '<style>body{font-family:-apple-system,"PingFang SC",sans-serif;margin:24px}'
        'td{padding:8px 12px;border-bottom:1px solid #ddd;vertical-align:middle}code{font-size:13px}</style>'
        f'<h1>FID 声音试听</h1><p>{html.escape(TEXT)}</p>'
        '<table><tr><th>头像</th><th>FID</th><th>性别</th><th>音色</th><th>音高（半音）</th><th>语速</th><th>试听</th></tr>'
        + ''.join(rows) + '</table>',
        encoding='utf-8',
    )


if __name__ == '__main__':
    main()
