# 飞人学堂 · Freer School

教人使用飞人应用、参与构建自由宇宙（Freeverse）、理解密码共识与密码经济的系列教学视频。

## 三条线 × 三个级别

| | 入门 I | 进阶 II | 专业 III |
|---|---|---|---|
| **用 Use** — 使用飞人应用 | U1 | U2 | U3 |
| **懂 Think** — 理论与思想 | T1 | T2 | T3 |
| **建 Build** — 协议、服务、SDK | B1 | B2 | B3 |

单集编号 `U1-04`，标题形如《用·入门 04｜获得第一张钞票》。完整集目见 [docs/集目.md](docs/集目.md)。

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
# 1. 用领航员的声音合成旁白 → episodes/.../build/（时间轴 timeline.json + 逐句音频）
cd voice && .venv/bin/python narrate.py "../episodes/U1/U1-02-你的第一个身份"
.venv/bin/python tone_check.py "../episodes/U1/U1-02-你的第一个身份"   # 声调自检，报警的句子重点试听

# 2. 手机用 USB 连上 Mac（开启 USB 调试），每个场景录一段 → recordings/U1-02/S3.mp4 …
#    状态栏自动切到演示模式，点按显示为白点；关闭镜像窗口即结束。没有录屏的场景显示操作步骤占位
cd .. && tools/record.sh U1-02 S3

# 3. 把旁白与录屏同步进视频工程
cd video && npm run sync -- "../episodes/U1/U1-02-你的第一个身份"

# 4. 主题音乐（只需一次；曲目在 school.json 里选，换曲后重跑）
cd ../music && ../voice/.venv/bin/python compose.py --theme

# 5. 预览，或导出成片（响度统一到 -16 LUFS）→ renders/U1-02.mp4
cd ../video && npm run studio
cd .. && tools/finalize.sh U1-02
```

新的一集要在 `video/src/Root.tsx` 的 `EPISODES` 里登记；概念动画在 `video/src/animations/` 里按"集号/场景"登记。

## 外部依赖

- Node.js（已有）
- scrcpy（`brew install scrcpy`，已装）— Android 录屏，用 `tools/record.sh`
- 语音引擎：待定，见 [docs/FID声音.md](docs/FID声音.md)

## 相关项目

- 协议、服务端、Java SDK：`~/Freeverse`
- Android 版飞人：`~/AndroidStudioProjects/Freer`
- Mac 版飞人：`~/MacApp/FreerForMac`
- 理论著作《密码经济》：`~/Desktop/CryptoEconomics/working`
