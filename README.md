# 飞人学堂 · Freer School

教人使用 Freer App、参与构建自由宇宙（Freeverse）、理解密码共识与密码经济的系列教学视频。

## 三条线 × 三个级别

| | 入门 I | 进阶 II | 专业 III |
|---|---|---|---|
| **用 Use** — 使用 Freer App | U1 | U2 | U3 |
| **懂 Think** — 理论与思想 | T1 | T2 | T3 |
| **建 Build** — 协议、服务、SDK | B1 | B2 | B3 |

单集编号 `U1-04`，标题形如《用·入门 04｜获得第一笔 FCH》。完整集目见 [docs/集目.md](docs/集目.md)。

## 目录

```
docs/         原则、集目、领航员设定、FID 声音设计
episodes/     每集一个目录：script.md 是唯一源头
  _template/  新建一集时复制这里
voice/        FID → 声音 的生成工具（原型阶段）
video/        Remotion 工程：组件与每集合成
assets/       品牌、音乐、字体、领航员形象
recordings/   App 原始录屏（不入库）
renders/      导出的成片（不入库）
```

## 流程

```
episodes/<编号>/script.md
  ↓ voice/   逐句合成旁白 + 时间戳
  ↓ scrcpy   按脚本录制 App 片段 → recordings/
  ↓ video/   Remotion 合成：录屏 + 手机外框 + 标注 + 领航员 + 字幕
  ↓ renders/ 导出 16:9 成片
```

## 常用命令

```bash
cd video
npm install
npm run studio      # 打开 Remotion Studio 预览
npm run render -- Sample ../renders/sample.mp4
```

## 外部依赖

- Node.js（已有）
- `brew install scrcpy` — Android 录屏
- 语音引擎：待定，见 [docs/FID声音.md](docs/FID声音.md)

## 相关项目

- 协议、服务端、Java SDK：`~/Freeverse`
- Android 版 Freer：`~/AndroidStudioProjects/Freer`
- Mac 版 Freer：`~/MacApp/FreerForMac`
- 理论著作《密码经济》：`~/Desktop/CryptoEconomics/working`
