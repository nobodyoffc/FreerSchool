"""Write freeverse-release.json: the release's videos as FVEP11 works, for Freer for Mac's Release Sync.

    python3 tools/release-manifest.py u1-u2-v1

Lists every video of the release (renders/release/DIDS.txt) as a FEIP25 Video, titled from
docs/集目.md, with its 要点 as the summary, and its cover as a FEIP24 Image that the video names
as its `cover`; all signed by the Navigator. Each file is fetched from GitHub or from the two
sites that mirror the release. Release Sync carves the images first.

Run it after each release, then in Freer for Mac (switched to the Navigator's FID) open
Tools → Release Sync, add this folder, pick the tag and scan. Ids that Release Sync wrote back
into the file after a publish are kept, so the next release updates the same records.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / 'freeverse-release.json'
NAVIGATOR = 'FQ8KKsMFYXkmNPDVauEMWFBnd7yfhiqqN8'
MIRRORS = ['https://cid.cash/download/FreerSchool/{tag}/{name}',
           'https://freecash.info/download/FreerSchool/{tag}/{name}']


def main():
    tag = sys.argv[1]
    rows = re.findall(r'^\| ([UTB]\d-\d\d) \| ([^|]+?) +\| ([^|]+?) +\|', (ROOT / 'docs/集目.md').read_text(), re.M)
    catalogue = {eid: (title, re.sub(r'\*\*', '', points).strip()) for eid, title, points in rows}
    listed = [line.split()[1] for line in (ROOT / 'renders/release/DIDS.txt').read_text().splitlines()
              if line and not line.startswith('#')]

    old = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    ids = {w['asset']: w['id'] for w in old.get('works', []) if w.get('id') and w.get('asset')}

    works = []
    for name in listed:
        eid = name.removesuffix('.mp4')
        title, points = catalogue[eid]
        cover = f'{eid}-cover.png'
        works.append({'kind': 'image', 'title': f'{eid} {title} 封面', 'asset': cover,
                      'lang': 'zh', 'authors': [NAVIGATOR], 'format': 'image/png', 'mirrors': MIRRORS})
        works.append({'kind': 'video', 'title': f'{eid} {title}', 'asset': name, 'lang': 'zh',
                      'authors': [NAVIGATOR], 'format': 'video/mp4', 'summary': points, 'mirrors': MIRRORS,
                      'cover': cover})
    for work in works:
        if work['asset'] in ids:
            work = {'kind': work.pop('kind'), 'id': ids[work['asset']], **work}
            works[[w['asset'] for w in works].index(work['asset'])] = work

    manifest = {'github': 'nobodyoffc/FreerSchool', 'owner': NAVIGATOR, 'works': works}
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(f'{MANIFEST.name}：{len(works)} 项（{tag}），已保留 {sum(1 for w in works if "id" in w)} 个已发布的 id')


if __name__ == '__main__':
    main()
