#!/usr/bin/env bash
# Record one scene of an episode from an Android device over USB, with a clean status bar.
#
#   tools/record.sh U1-02 S3            # → recordings/U1-02/S3.mp4
#   tools/record.sh U1-02 S3 -s <serial> # pick a device when several are attached (adb devices)
#   tools/record.sh U1-02 S3 --time-limit=20  # anything else is passed on to scrcpy
#
# Close the scrcpy window (or press Ctrl+C here) to stop. Taps show as white dots.
# An existing recording is kept as S3.<time>.mp4 rather than overwritten.
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "用法：tools/record.sh <集号> <场景> [-s 设备序列号]   例如：tools/record.sh U1-02 S3"
  exit 1
fi
episode=$1
scene=$2
shift 2

# Which device: -s if given, else the only device, else the first one that is not an emulator.
device=
extra=()
while [[ $# -gt 0 ]]; do
  if [[ "$1" == "-s" ]]; then device=$2; shift 2; else extra+=("$1"); shift; fi
done
if [[ -z "${device}" ]]; then
  devices=$(adb devices | awk 'NR > 1 && $2 == "device" {print $1}')
  if [[ -z "${devices}" ]]; then echo "没有找到设备：请用 USB 连接手机并允许 USB 调试"; exit 1; fi
  device=$(echo "${devices}" | grep -v '^emulator-' | head -1)
  device=${device:-$(echo "${devices}" | head -1)}
fi
echo "设备：${device}"

root=$(cd "$(dirname "$0")/.." && pwd)
dir="${root}/recordings/${episode}"
out="${dir}/${scene}.mp4"
mkdir -p "${dir}"
if [[ -e "${out}" ]]; then mv "${out}" "${dir}/${scene}.$(date +%H%M%S).mp4"; fi

adb_() { adb -s "${device}" "$@"; }
demo() { adb_ shell am broadcast -a com.android.systemui.demo -e command "$@" >/dev/null; }

# Android demo mode (fixed clock, full battery and signal, no notification icons) and the
# touch dots both need adb to write system settings. Xiaomi phones refuse that unless
# 开发者选项 → "USB 调试（安全设置）" is on; then record without them.
touches=()
restore=()
cleanup() { for cmd in ${restore[@]+"${restore[@]}"}; do eval "$cmd"; done; }
trap cleanup EXIT
get() { adb_ shell settings get "$1" "$2" | tr -d '\r'; }
# Can adb write settings? Write a value back unchanged to find out.
prevent=$(get system show_touches_preventrecord)
if adb_ shell settings put system show_touches_preventrecord "${prevent}" 2>&1 | grep -q Exception; then
  echo "提示：手机不允许 adb 修改系统设置，跳过演示模式和点按白点。"
  echo "      想要它们：开发者选项 → 打开「USB 调试（安全设置）」；"
  echo "      或者手动：开发者选项 → 打开「显示点按操作」，并开启勿扰、清空通知。"
else
  # Touch dots on the phone; HyperOS keeps them out of recordings anyway, so the video draws its own.
  touches=(--show-touches)
  # Leave the phone's own demo mode (开发者选项 → 演示模式) alone when it is on.
  if [[ "$(get system sysui_tuner_demo_on)" == "1" || "$(get secure sysui_tuner_demo_on)" == "1" ]]; then
    echo "手机已开启演示模式，沿用。"
  else
    allowed=$(get global sysui_demo_allowed)
    adb_ shell settings put global sysui_demo_allowed 1
    demo enter
    demo clock -e hhmm 0900
    demo battery -e level 100 -e plugged false
    demo network -e wifi show -e level 4
    demo network -e mobile show -e level 4 -e datatype none
    demo notifications -e visible false
    restore+=("demo exit" "adb_ shell settings put global sysui_demo_allowed ${allowed}" "echo 演示模式已关闭")
  fi
fi

echo "录制 ${episode} ${scene} → ${out}（关闭镜像窗口结束）"
scrcpy -s "${device}" --no-audio ${touches[@]+"${touches[@]}"} --max-fps=30 --video-bit-rate=16M \
  --window-title="录制 ${episode} ${scene}（关闭窗口结束）" --record="${out}" ${extra[@]+"${extra[@]}"}
echo "已保存 ${out}"
