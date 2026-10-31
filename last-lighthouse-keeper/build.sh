#!/bin/sh
# One command: The Last Lighthouse Keeper (Paper-cut Lightbox), vertical 1080×1920, 30 fps, 41 s → last-lighthouse-keeper.mp4
# Needs the Lemo-Opuscar library with the core, voice and music tiers:
#   sh .claude/skills/lemo-opuscar/scripts/setup.sh && sh .claude/skills/lemo-opuscar/scripts/setup.sh deps voice music
# and ffmpeg 7+ for mux.sh (ffmpeg 6 under-reports audio length through loudnorm).
set -e
LIB=${LIB:-$HOME/lemo-opuscar}
export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
PY="$LIB/.venv/bin/python"; FPS=30; SIZE=1080x1920; WORKERS=${WORKERS:-3}
cd "$LIB"
if [ ! -f "$HERE/voices/L7.wav" ]; then
  "$PY" core/tts/tts.py "$HERE/voices/lines.json" "$HERE/voices"
  "$PY" core/tts/asr_check.py "$HERE/voices/lines.json" "$HERE/voices" --lang en || echo "! speech check failed or unavailable: listen to voices/*.wav"
fi
python3 "$HERE/tools/timeline.py"                                         # → timeline.json + last-lighthouse-keeper.srt
node core/render/events.mjs "$HERE" --size $SIZE
node core/render/video.mjs "$HERE" --fps $FPS --workers $WORKERS --size $SIZE --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/last-lighthouse-keeper.mp4" $FPS 1
node core/render/still.mjs "$HERE" 19.6 --size $SIZE --q "nosub=1" --out "$HERE/out/stills"
ffmpeg -loglevel error -y -i "$HERE/out/stills/t_19.6.jpg" -q:v 3 "$HERE/poster.jpg"
echo "→ $HERE/last-lighthouse-keeper.mp4  $HERE/last-lighthouse-keeper.srt  $HERE/poster.jpg"
