# voice/fid

由 FID 确定性生成声音（FreerVoice v1，Kokoro v1.1-zh）。设计见 [../../docs/FID声音.md](../../docs/FID声音.md)。

旁白不直接用这里合成：领航员的 FID 声音念了两句话，存为 `../ref/领航员.wav`，旁白由 Qwen3-TTS 克隆它合成（见 [../README.md](../README.md)）。给另一个 FID 配旁白声音时，也是先在这里生成它的参考录音。

## 安装

```bash
cd voice/fid
uv sync
# 下载锁定版本的模型（约 330MB，不入库）
.venv/bin/python -c "from huggingface_hub import snapshot_download; snapshot_download('hexgrad/Kokoro-82M-v1.1-zh', revision='01e7505bd6a7a2ac4975463114c3a7650a9f7218', local_dir='models/kokoro-v1.1-zh', allow_patterns=['config.json','kokoro-v1_1-zh.pth','voices/z*.pt'])"
```

## 使用

```bash
.venv/bin/python freer_voice.py --fid <FID> --params                 # 查看推导出的参数
.venv/bin/python freer_voice.py --fid <FID> --text "你好" --out a.wav  # 合成（参考录音用这个）
.venv/bin/python make_samples.py [FID ...]                            # 生成试听页 out/index.html
```
