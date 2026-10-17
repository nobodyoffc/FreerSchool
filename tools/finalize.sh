#!/usr/bin/env bash
# Render an episode and normalise its loudness for publishing (-16 LUFS, true peak -1.5 dB).
# The title card is also saved as the cover and embedded in the mp4.
#
#   tools/finalize.sh U1-02        # → renders/U1-02.mp4, renders/U1-02-cover.png
set -euo pipefail
id=${1:?episode id, e.g. U1-02}
root=$(cd "$(dirname "$0")/.." && pwd)
raw="${root}/renders/${id}-raw.mp4"
out="${root}/renders/${id}.mp4"
(cd "${root}/video" && npx remotion render src/index.ts "${id}" "${raw}")
# Two passes: measure, then apply, so the whole episode moves by one even gain.
stats=$(ffmpeg -hide_banner -i "${raw}" -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "${stats}" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -hide_banner -v error -y -i "${raw}" -c:v copy -af "loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true" -ar 48000 -c:a aac -b:a 192k "${out}"
rm -f "${raw}"
"${root}/tools/cover.sh" "${id}"
echo "已导出 ${out}"
