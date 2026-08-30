#!/bin/sh
# Rasterise app/icons/icon.svg into the PNG sizes iOS and Android ask for.
#
# iOS reads apple-touch-icon; it does not accept SVG, so the PNGs are checked in
# and this script only needs running when the mark itself changes.
#
#   sh tools/icons.sh [path-to-chrome]
#
# Any Chrome/Chromium build works. Note: use headless_shell or a real Chrome
# window - `--headless=new` clips the capture on some builds.
set -e
cd "$(dirname "$0")/.."
CHROME=${1:-${CHROME:-$(command -v chromium || command -v google-chrome || echo chrome)}}
for s in 120 152 167 180 192 512; do
  "$CHROME" --no-sandbox --disable-gpu --hide-scrollbars \
    --virtual-time-budget=3000 --force-device-scale-factor=1 \
    --window-size=$s,$s --screenshot=app/icons/icon-$s.png \
    "file://$PWD/app/icons/icon.svg" 2>/dev/null
  echo "app/icons/icon-$s.png"
done
