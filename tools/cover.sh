#!/usr/bin/env bash
# Save an episode's title card as its cover and embed it in the exported mp4.
# Picture and sound are copied as they are, so an episode already exported is not re-rendered.
#
#   tools/cover.sh U1-02        # → renders/U1-02-cover.png, embedded in renders/U1-02.mp4
set -euo pipefail
id=${1:?episode id, e.g. U1-02}
root=$(cd "$(dirname "$0")/.." && pwd)
mp4="${root}/renders/${id}.mp4"
cover="${root}/renders/${id}-cover.png"
tmp="${root}/renders/${id}-tmp.mp4"
(cd "${root}/video" && npx remotion still src/index.ts "${id}" "${cover}" --frame=30 --log=error)
ffmpeg -hide_banner -v error -y -i "${mp4}" -i "${cover}" -map 0:v:0 -map 0:a -map 1 -c copy -c:v:1 png -disposition:v:1 attached_pic "${tmp}"
mv "${tmp}" "${mp4}"
echo "已加封面 ${mp4}"
