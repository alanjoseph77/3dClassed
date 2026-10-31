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
# mux + master to -14 LUFS. mux.sh needs ffmpeg 7+; with ffmpeg 6 it rejects the audio length, so fall back to the same two passes by hand
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/last-lighthouse-keeper.mp4" $FPS 1 || {
  set -- $(ffmpeg -hide_banner -nostats -i "$HERE/out/mix.wav" -af loudnorm=I=-14:TP=-1.2:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p' | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset'])")
  ffmpeg -v error -y -i "$HERE/out/video.mp4" -i "$HERE/out/mix.wav" -map 0:v -map 1:a -c:v copy -af "loudnorm=I=-14:TP=-1.2:LRA=11:measured_I=$1:measured_TP=$2:measured_LRA=$3:measured_thresh=$4:offset=$5:linear=true,aresample=48000,apad" -c:a aac -b:a 192k -t 41 -movflags +faststart "$HERE/last-lighthouse-keeper.mp4"; }
ffmpeg -loglevel error -y -ss 19.6 -i "$HERE/last-lighthouse-keeper.mp4" -frames:v 1 -q:v 3 "$HERE/poster.jpg"
echo "→ $HERE/last-lighthouse-keeper.mp4  $HERE/last-lighthouse-keeper.srt  $HERE/poster.jpg"
