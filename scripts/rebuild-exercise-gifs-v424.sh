#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
out=assets/exercises
tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT

# Each source pose is extracted independently. Trimming excludes the adjoining
# pose in old sprite sheets; a fresh opaque square canvas prevents GIF disposal
# from leaving remnants of the preceding frame.
frame() {
  convert "$1" -background white -alpha remove -alpha off \
    -fuzz 3% -trim +repage -resize '356x340>' \
    -gravity center -background white -extent 384x384 "$2"
}
animate() {
  local name=$1 first=$2 second=$3
  frame "$first" "$tmp_dir/${name}-0.png"
  frame "$second" "$tmp_dir/${name}-1.png"
  convert -delay 75 "$tmp_dir/${name}-0.png" -delay 75 "$tmp_dir/${name}-1.png" \
    -dispose Background -loop 0 -colors 128 "$out/${name}-v424.gif"
}

animate box-jump "$out/box-jump-v392.jpg" "$out/box-jump-v423.gif[1]"
convert "$out/weighted-hyperextension-v396.gif[0]" -crop 380x300+2+65 +repage "$tmp_dir/hyper-0.png"
convert "$out/weighted-hyperextension-v396.gif[1]" -crop 380x300+2+65 +repage "$tmp_dir/hyper-1.png"
animate weighted-hyperextension "$tmp_dir/hyper-0.png" "$tmp_dir/hyper-1.png"
animate hip-thrust-barbell "$out/hip-thrust-barbell-v396.gif[0]" "$out/hip-thrust-barbell-v396.gif[1]"
animate hip-thrust-machine "$out/hip-thrust-machine-v396.gif[0]" "$out/hip-thrust-machine-v396.gif[1]"
animate hip-thrust-smith "$out/hip-thrust-smith-v396.gif[0]" "$out/hip-thrust-smith-v396.gif[1]"
animate weighted-pushup "$out/weighted-pushup-v423.gif[0]" "$out/weighted-pushup-v423.gif[1]"

if [[ -f "$out/weighted-dip-source-v424.png" ]]; then
  convert "$out/weighted-dip-source-v424.png" -crop 878x887+0+0 +repage "$tmp_dir/dip-0.png"
  convert "$out/weighted-dip-source-v424.png" -crop 878x887+897+0 +repage "$tmp_dir/dip-1.png"
  animate weighted-dip "$tmp_dir/dip-0.png" "$tmp_dir/dip-1.png"
fi
