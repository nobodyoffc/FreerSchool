"""Measure how distinct the derived voices are, per version, with a speaker-verification model.

For each set of voices, embed one sentence with ECAPA and report, within each gender:
  mean  — average cosine similarity over all pairs (lower: more spread out)
  near  — average similarity to each voice's closest neighbour (lower: fewer look-alikes)

    uv run --group analysis python compare.py [N]
"""
import dataclasses
import sys

import numpy as np
import torch
from speechbrain.inference.speaker import EncoderClassifier

from freer_voice import SAMPLE_RATE, Synthesizer, VoiceParams, base_voices, derive
from make_samples import test_fids

TEXT = '你好，我是领航员。欢迎来到飞人学堂，今天我们一起创建你的第一个身份。'


def stats(embeddings: list[np.ndarray]) -> tuple[float, float]:
    e = np.stack(embeddings)
    e /= np.linalg.norm(e, axis=1, keepdims=True)
    sim = e @ e.T
    np.fill_diagonal(sim, np.nan)
    return float(np.nanmean(sim)), float(np.nanmax(sim, axis=1).mean())


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 30
    synth = Synthesizer()
    ecapa = EncoderClassifier.from_hparams(source='speechbrain/spkrec-ecapa-voxceleb', savedir='models/ecapa')
    resample = lambda a: torch.nn.functional.interpolate(  # 24 kHz → 16 kHz for ECAPA
        torch.from_numpy(a)[None, None], scale_factor=16000 / SAMPLE_RATE, mode='linear')[0]

    def embed(p: VoiceParams) -> np.ndarray:
        return ecapa.encode_batch(resample(synth.speak(p, TEXT))).squeeze().numpy()

    def base(name: str, gender: str) -> VoiceParams:
        return VoiceParams('', 'base', gender, name, name, 0.0, None, 0.0, 1.0, 0)

    fids = test_fids(n)
    sets = {
        'base（100 个原始音色）': [base(v, g) for g in ('female', 'male') for v in base_voices(g)],
        'v0': [derive(f, 'v0') for f in fids],
        'v1 仅音色（无韵律、无音高）': [dataclasses.replace(derive(f, 'v1'), prosody=None, pitch=0.0) for f in fids],
        'v1': [derive(f, 'v1') for f in fids],
    }
    print(f'{"":28}{"女 mean":>9}{"女 near":>9}{"男 mean":>9}{"男 near":>9}')
    for name, params in sets.items():
        row = []
        for gender in ('female', 'male'):
            row += stats([embed(p) for p in params if p.gender == gender])
        print(f'{name:28}' + ''.join(f'{x:9.3f}' for x in row), flush=True)


if __name__ == '__main__':
    main()
