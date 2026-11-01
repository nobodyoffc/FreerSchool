"""Write the FreeverseExplorer 学堂 page's data from a published release.

    python3 tools/explorer.py u1-u2-v1 [ROOT]

Reads the release's files in renders/ (videos, covers, the signed lists in renders/release/) and
the titles in docs/集目.md, and writes ROOT/modules/school-data.js (ROOT defaults to the
Explorer's Tomcat folder). Run it again after each new release, then deploy the Explorer: its
servers fetch every file listed here from GitHub (tools/mirror-list.mjs) and serve them.
"""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RENDERS = ROOT / 'renders'
REPO = 'FreerSchool'
NAVIGATOR = {'cid': 'cy_qqN8', 'fid': 'FQ8KKsMFYXkmNPDVauEMWFBnd7yfhiqqN8'}
SERIES = {
    'U1': {'title': {'zh': '使用 · 入门', 'en': 'Use · Basics'},
           'note': {'zh': '从零开始，按顺序看：装好飞人，有了身份、钞票和 CID，加引路人，进广场。',
                    'en': 'Start here and watch in order: install Freer, get an identity, cash and a CID, add your guide, join a square.'}},
    'U2': {'title': {'zh': '使用 · 进阶', 'en': 'Use · Intermediate'},
           'note': {'zh': '每集独立，挑需要的看：私钥安全、多重身份、离线与多签交易、文件、秘密、凭据、通证等。',
                    'en': 'Each stands alone: key safety, multiple identities, offline and multisig transactions, files, secrets, proofs, tokens and more.'}},
}
# Each release's name, as on GitHub.
RELEASES = {
    'u1-u2-v1': {'zh': '使用 · 入门与进阶（U1–U2）第一版', 'en': 'Use · Basics and Intermediate (U1–U2), first edition'},
}
LISTS = ['DIDS.txt', 'DIDS.sig.json', 'SHA256SUMS.txt', 'SHA256SUMS.sig.json']


def entry(path: Path) -> dict:
    data = path.read_bytes()
    digest = hashlib.sha256(data).digest()
    return {'name': path.name, 'size': len(data), 'sha256': digest.hex(), 'did': hashlib.sha256(digest).hexdigest()}


def main():
    tag = sys.argv[1]
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else Path.home() / 'tomcat-9.0.73/webapps/ROOT'
    titles = dict(re.findall(r'^\| ([UTB]\d-\d\d) \| ([^|]+?) +\|', (ROOT / 'docs/集目.md').read_text(), re.M))
    listed = [line.split()[1] for line in (RENDERS / 'release/DIDS.txt').read_text().splitlines() if line and not line.startswith('#')]
    series = []
    for sid, info in SERIES.items():
        episodes = []
        for name in listed:
            eid = name.removesuffix('.mp4')
            if not eid.startswith(sid):
                continue
            seconds = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0',
                                                     str(RENDERS / name)]))
            episodes.append({'id': eid, 'title': titles[eid], 'seconds': int(seconds), 'video': entry(RENDERS / name),
                             'cover': entry(RENDERS / f'{eid}-cover.png')})
        series.append({'id': sid, **info, 'episodes': episodes})
    school = {'repo': REPO, 'tag': tag, 'title': RELEASES[tag], 'navigator': NAVIGATOR, 'license': 'CC0 1.0',
              'lists': [entry(RENDERS / 'release' / name) for name in LISTS], 'series': series}
    js = ('// 飞人学堂 videos, served from this site (mirrored from the GitHub release) and played on the 学堂 page.\n'
          f'// Written by FreerSchool tools/explorer.py from release {tag}; do not edit by hand.\n'
          f'export const SCHOOL = {json.dumps(school, ensure_ascii=False, indent=2)};\n')
    (out / 'modules/school-data.js').write_text(js)
    print(f'{out / "modules/school-data.js"}：{sum(len(s["episodes"]) for s in series)} 集')


if __name__ == '__main__':
    main()
