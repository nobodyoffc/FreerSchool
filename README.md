# 飞人学堂 · Freer School

教人使用飞人应用、参与构建自由宇宙（Freeverse）、理解密码共识与密码经济的系列教学视频。

## 三个系列 × 三个级别

| | 入门 I | 进阶 II | 专业 III |
|---|---|---|---|
| **使用 Use** — 使用飞人应用 | U1 | U2 | U3 |
| **理解 Think** — 理论与思想 | T1 | T2 | T3 |
| **建造 Build** — 协议、服务、SDK | B1 | B2 | B3 |

单集编号 `U1-04`，标题形如《使用·入门 04｜获得第一张钞票》。完整集目见 [docs/集目.md](docs/集目.md)。

## 观看与下载

成片在 [Releases](https://github.com/nobodyoffc/FreerSchool/releases) 下载。每版附一份 DID 清单（`DIDS.txt`，每集一行，DID 即 sha256x2，见 FVEP11）和领航员 cy_qqN8 对它的签名（`DIDS.sig.json`）。验证手上的视频是不是原版：

- 在飞人里：主页"工具"→"验签"，粘贴 `DIDS.sig.json` 的内容，确认签名者是 `FQ8KKsMFYXkmNPDVauEMWFBnd7yfhiqqN8`；再把视频加进"文件"，看它的 DID 是否和清单里那一行相同。
- 用命令：`uv run tools/verify.py DIDS.sig.json 视频所在目录`，验签名并逐个核对视频。只算一个文件的 DID：`shasum -a 256 文件 | cut -c1-64 | xxd -r -p | shasum -a 256`。

另附 SHA-256 清单（`SHA256SUMS.txt`，可用 `shasum -a 256 -c` 核对）及其签名。

## 目录

```
docs/         原则、集目、领航员设定、FID 声音设计
episodes/     每集一个目录：script.md 是唯一源头
  _template/  新建一集时复制这里
voice/        FID → 声音、旁白合成、声调自检
music/        主题音乐，用代码作曲
video/        Remotion 工程：组件与每集合成
assets/       品牌、音乐、字体、领航员形象
recordings/   应用原始录屏（不入库）
renders/      导出的成片（不入库）
```

## 流程

```
episodes/<编号>/script.md
  ↓ voice/   逐句合成旁白 + 时间戳
  ↓ scrcpy   按脚本录制应用片段 → recordings/
  ↓ video/   Remotion 合成：录屏 + 手机外框 + 标注 + 领航员 + 字幕
  ↓ renders/ 导出成片：Android 集竖屏 9:16，Mac 集横屏 16:9
```

## 做一集

以 U1-02 为例：

```bash
# 1. 用领航员的声音合成旁白 → episodes/.../build/（时间轴 timeline.json + 逐句音频），详见 voice/README.md
cd voice && .venv/bin/python readings.py "../episodes/U1/U1-02-你的第一个身份"   # 多音字、英文、数字，合成前配好读音
.venv/bin/python narrate.py "../episodes/U1/U1-02-你的第一个身份"
.venv/bin/python check.py "../episodes/U1/U1-02-你的第一个身份"      # 识别回文字，报出的句子重点试听

# 2. 手机用 USB 连上 Mac（开启 USB 调试），每个场景录一段 → recordings/U1-02/S3.mp4 …
#    状态栏自动切到演示模式，点按显示为白点；关闭镜像窗口即结束。没有录屏的场景显示操作步骤占位
cd .. && tools/record.sh U1-02 S3

# 3. 把旁白与录屏同步进视频工程
cd video && npm run sync -- "../episodes/U1/U1-02-你的第一个身份"

# 4. 主题音乐（只需一次；曲目在 school.json 里选，换曲后重跑）
cd ../music && uv sync && .venv/bin/python compose.py --theme

# 5. 预览，或导出成片（响度统一到 -16 LUFS）→ renders/U1-02.mp4
cd ../video && npm run studio
cd .. && tools/finalize.sh U1-02
```

新的一集要在 `video/src/Root.tsx` 的 `EPISODES` 里登记；概念动画在 `video/src/animations/` 里按"集号/场景"登记。

## 外部依赖

- Node.js（已有）
- scrcpy（`brew install scrcpy`，已装）— Android 录屏，用 `tools/record.sh`
- uv（Python 环境）
- 语音：Qwen3-TTS 1.7B 克隆领航员的 FID 声音，见 [voice/README.md](voice/README.md)

## 相关项目

- 协议、服务端、Java SDK：[nobodyoffc/Freeverse](https://github.com/nobodyoffc/Freeverse)
- Android 版飞人：[nobodyoffc/Freer](https://github.com/nobodyoffc/Freer)
- Mac 版飞人：[nobodyoffc/freer-mac](https://github.com/nobodyoffc/freer-mac)
- 密库：[nobodyoffc/Safe](https://github.com/nobodyoffc/Safe)
- 理论著作《密码经济》：尚未公开

## 许可

全部内容（视频、脚本、动画、音乐、代码）以 [CC0 1.0](LICENSE) 放入公有领域：可以自由复制、修改、转载、商用，不必署名，也不必询问。CC0 不涉及商标，"飞人""Freecash"等名称不在其列。原版以领航员的签名为准，见上文"观看与下载"。
