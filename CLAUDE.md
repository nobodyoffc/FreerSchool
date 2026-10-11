# 飞人学堂 项目约定

## 是什么

制作教学视频的工程。视频是从文本"构建"出来的产物：`episodes/<编号>/script.md` 是唯一源头，配音、字幕、画面都由它生成。

## 约定

- **先中文**。英文版等流程成熟后再做，届时从同一份脚本翻译。
- **每集 2–5 分钟，一集一事**。简洁实用，效率优先，不说教。
- **讲的必须和 App 实际行为一致**。写脚本前对照源码和界面文字核对：
  - Android：`~/AndroidStudioProjects/Freer`（中文界面文字在 `app/src/main/res/values-zh/strings.xml`）
  - Mac：`~/MacApp/FreerForMac`
  - 协议：`~/Freeverse/Protocols`
  - 理论：`~/Desktop/CryptoEconomics/working`
- **术语用 App 中文界面的叫法**，例如 Guide 叫"引路人"，Square 叫"群组"。
- **安全**：录屏只用演示身份；仓库里永远不出现私钥、助记词、加密私钥密文。领航员的私钥不在本仓库。
- **常青与易变分离**：概念动画长期有效；App 录屏片段在脚本里注明 App 版本，界面改版只重录该段。

## 讲师

"领航员"：一个真实存在于链上的 FID，头像和声音都由它的 FID 确定性生成。设定见 `docs/领航员.md`。

## 技术栈

- 视频合成：Remotion（`video/`，TypeScript/React，版本已锁定）
- 录屏：scrcpy（Android），ScreenCaptureKit/OBS（Mac）
- 配音：由 FID 生成的合成声音，见 `docs/FID声音.md`
