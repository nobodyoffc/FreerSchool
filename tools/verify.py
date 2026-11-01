# /// script
# requires-python = ">=3.10"
# dependencies = ["base58", "coincurve", "pycryptodome"]
# ///
"""Check a signed release list: who signed it, and whether the videos match it.

    uv run tools/verify.py DIDS.sig.json [视频所在目录]

The .sig.json is what Freer's 工具 → 签名 gives (BTC-EcdsaSignMsg@No1_NrC7): the signed text
in `msg`, the signer's FID and the signature. The text lists each video's DID (sha256x2, FVEP11)
or SHA-256, one per line; lines starting with # are comments. The same check can be done by
hand: paste the .sig.json into Freer's 工具 → 验签, then compare each file's DID in 文件.
"""
import base64
import hashlib
import json
import sys
from pathlib import Path

import base58
import coincurve
from Crypto.Hash import RIPEMD160

NAVIGATOR = 'FQ8KKsMFYXkmNPDVauEMWFBnd7yfhiqqN8'  # 领航员 cy_qqN8


def signer(sig: dict) -> str:
    """The FID whose key made the signature, recovered from it (Bitcoin signed message, FCH address)."""
    msg = sig['msg'].encode()
    size = bytes([len(msg)]) if len(msg) < 253 else b'\xfd' + len(msg).to_bytes(2, 'little')
    digest = hashlib.sha256(hashlib.sha256(b'\x18Bitcoin Signed Message:\n' + size + msg).digest()).digest()
    raw = base64.b64decode(sig['sign'])
    key = coincurve.PublicKey.from_signature_and_message(raw[1:] + bytes([(raw[0] - 27) & 3]), digest, hasher=None)
    h160 = RIPEMD160.new(hashlib.sha256(key.format(raw[0] >= 31)).digest()).digest()
    return base58.b58encode_check(b'\x23' + h160).decode()


def main():
    path = Path(sys.argv[1])
    folder = Path(sys.argv[2]) if len(sys.argv) > 2 else path.parent
    sig = json.load(open(path, encoding='utf-8'))
    fid = signer(sig)
    print(f'签名者：{fid}' + ('（领航员 cy_qqN8）' if fid == NAVIGATOR else ''))
    ok = fid == sig['fid'] == NAVIGATOR
    if not ok:
        print('✗ 不是领航员的签名')
    did = 'sha256x2' in sig['msg']
    for line in sig['msg'].splitlines():
        if not line.strip() or line.startswith('#'):
            continue
        expected, name = line.split(maxsplit=1)
        file = folder / name
        if not file.exists():
            print(f'  —  {name}：不在 {folder}')
            continue
        digest = hashlib.sha256(file.read_bytes()).digest()
        got = hashlib.sha256(digest).hexdigest() if did else digest.hex()
        print(f'  {"✓" if got == expected else "✗"}  {name}')
        ok &= got == expected
    print('全部一致' if ok else '有不一致')
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
