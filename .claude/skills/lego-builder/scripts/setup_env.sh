#!/bin/sh
# Prepare a cloud/Ubuntu container for ldraw-nova. Idempotent.
# Usage: sh setup_env.sh [WORKDIR]   (default: $TMPDIR or /tmp)
set -eu
WORK=${1:-${TMPDIR:-/tmp}}
mkdir -p "$WORK"
# 1. LDraw parts library + LeoCAD + virtual display (library.ldraw.org may be blocked; Ubuntu packages work)
if [ ! -f /usr/share/ldraw/parts/3001.dat ] || ! command -v leocad >/dev/null || ! command -v xvfb-run >/dev/null; then
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ldraw-parts leocad xvfb poppler-utils >/dev/null
fi
# 2. ldraw-nova itself
if [ ! -d "$WORK/ldraw-nova" ]; then
  git clone -q --depth 1 https://github.com/anteloc/ldraw-nova "$WORK/ldraw-nova"
fi
cd "$WORK/ldraw-nova"
if command -v uv >/dev/null; then uv sync --locked --extra test >/dev/null; else python3 -m venv .venv && .venv/bin/pip install -q -e '.[test]'; fi
export LDRAW_DIR=/usr/share/ldraw
./ldraw-agent doctor >/dev/null && echo "ready: $WORK/ldraw-nova  (export LDRAW_DIR=/usr/share/ldraw)"
