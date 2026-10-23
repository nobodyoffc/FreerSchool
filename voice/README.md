# voice

用领航员的声音合成旁白。声音分两步得到：

1. **音色由 FID 确定**：`fid/` 从 FID 推导出一个声音（FreerVoice v1，Kokoro），用它念两句话，作为参考录音 `ref/领航员.wav`。设计见 [../docs/FID声音.md](../docs/FID声音.md)。
2. **克隆参考录音合成旁白**：Qwen3-TTS 1.7B 照参考录音的音色和平稳语气念出每一句，比 Kokoro 自然；Qwen3-ForcedAligner 对齐出关键词时刻，供标注使用。

两步各用一套环境（两个模型要的 transformers 版本冲突）：本目录 `.venv` 合成旁白，`fid/.venv` 生成 FID 声音。

## 安装

```bash
cd voice && uv sync     # 模型首次运行时自动下载到 ~/.cache/huggingface（约 6GB）
```

## 做一集的旁白

```bash
.venv/bin/python readings.py <集目录>   # 合成前：列出多音字、英文和数字，配好读音后再合成
.venv/bin/python narrate.py <集目录>    # 合成 → <集目录>/build/（timeline.json、逐句音频）
.venv/bin/python check.py <集目录>      # 合成后：识别回文字，找漏字、多字、念错的字
.venv/bin/python boxes.py <集目录>      # 对齐录屏后：找画面已切走还停着的标注框
```

- 已合成的句子按版本、种子、文本缓存在 `cache/`（不入库），重跑只合成改过的句子。同一句话、同一个种子，每次合成结果相同。
- **读音**：`qwen_voice.py` 的 `READINGS` 在合成前替换（字幕保留原文）。多音字用同音字替换整个词（"重掷→崇掷"），英文全大写会逐字母读，要读成单词就改成首字母大写（"DOCK→Dock"），数字里的 2 要读英文就写成 two（"P2P→P two P"）。
- **换种子**：一句念错（多念字、声调不对），在 `TAKES` 里给它换个种子重合成。合成时长明显不对（模型不停）会自动换种子重来。
- **声调**：识别回文字分辨不了声调，`readings.py` 列出的多音字要人耳听。确认没问题的词加进它的 `HEARD`，以后不再列出。换种子也救不了的，换个说法（"请他转一点→请他给你转一点"）。

## 语言

脚本的 `language` 字段（不写即 `zh`）决定用哪个声音和读音表，见 `qwen_voice.py` 的 `LANGUAGES`。现在只有中文。英文试过两种：用中文参考录音克隆念英文，带中文口音；Qwen 预设的英文男声（Ryan、Aiden，加不加"平稳"要求）也不满意。做英文版时再定，加一项 `LANGUAGES['en']` 即可，旁白合成、对齐、识别回文字都会跟着切换。

## 其他工具

- `migrate.py`：换声音后，按新旧旁白里关键词的位置平移各句锚点（U1、U2 从 Kokoro 换到现在的声音时用过）。
- `fid/`：给一个 FID 生成声音、做试听页，见 [fid/README.md](fid/README.md)。
