#!/bin/sh
# Render LeoCAD preview PNGs (home/front/top) for a model, headless.
# Ubuntu's LeoCAD 21.06 has no -csv BOM export, so `ldraw-agent review` stops at the render stage;
# this calls `ldraw-agent render`, which writes the PNGs before the (ignored) BOM error.
# Usage: sh render_previews.sh NOVA_DIR MODEL.mpd OUTDIR
set -u
NOVA=$1; MODEL=$2; OUT=$3
cd "$NOVA"
LDRAW_DIR=/usr/share/ldraw LIBGL_ALWAYS_SOFTWARE=1 xvfb-run -a -s "-screen 0 1600x1200x24" \
  ./ldraw-agent render "$MODEL" --outdir "$OUT" >/dev/null 2>&1
ls "$OUT"/*.png
