# voice

由 FID 确定性生成声音。设计见 [../docs/FID声音.md](../docs/FID声音.md)。

## 安装

```bash
cd voice
uv sync
# 下载锁定版本的模型（约 330MB，不入库）
.venv/bin/python -c "from huggingface_hub import snapshot_download; snapshot_download('hexgrad/Kokoro-82M-v1.1-zh', revision='01e7505bd6a7a2ac4975463114c3a7650a9f7218', local_dir='models/kokoro-v1.1-zh', allow_patterns=['config.json','kokoro-v1_1-zh.pth','voices/z*.pt'])"
```

## 使用

```bash
.venv/bin/python freer_voice.py --fid <FID> --params                 # 查看推导出的参数
.venv/bin/python freer_voice.py --fid <FID> --text "你好" --out a.wav  # 合成
.venv/bin/python make_samples.py [FID ...]                            # 生成试听页 out/index.html
.venv/bin/python narrate.py ../episodes/U1/<集目录>                    # 用领航员的声音合成整集旁白 → <集目录>/build/
```
