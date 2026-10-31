# The Last Lighthouse Keeper

A 41-second vertical short film (YouTube Shorts, 1080×1920, 30 fps) in the **Paper-cut Lightbox** style, made entirely in code with the `/lemo-opuscar` skill.

> On the last night before his lighthouse goes automatic, the old keeper climbs the tower and lights the lamp by hand one final time, and a passing ship flashes back two letters: *thank you*.

| File | What it is |
|---|---|
| `last-lighthouse-keeper.mp4` | the film, about −14 LUFS, ready to upload |
| `last-lighthouse-keeper.srt` | subtitles (also burned into the picture) |
| `poster.jpg` | thumbnail frame (the lamp lighting up) |
| `TREATMENT.md` | structure, shot list, beat sheet, cue map, sound design |
| `CREDITS` | every third-party asset and its licence |
| `index.html`, `src/` | the picture: paper layers in three.js, `render(t)` per frame |
| `voices/` | narration lines and the Kokoro voice files |
| `mix.py` | score, foley and mix |
| `tools/timeline.py` | the one timeline: narration times, hits, Morse code, shots |
| `build.sh` | rebuilds everything in one command (needs the Lemo-Opuscar library) |

## YouTube upload notes

- Title idea: *The Last Lighthouse Keeper | a paper-cut short*. Paste `CREDITS` (or a short version) into the description.
- Upload `last-lighthouse-keeper.srt` as English subtitles if you like; they're already burned in.
- The narration is a synthetic voice (Kokoro): ticking YouTube's "altered or synthetic content" box is the safe choice.
- Everything in the film is original; the story, the keeper "Elias" and the ship are fictional.
