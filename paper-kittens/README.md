# Find the lost kittens

A tiny game for small children, built on the paper house (`/papercraft`). Five kittens are hiding in the paper garden: tap the hedges, lavender beds and fences to find them. Each one pops up like a paper flap and fills a paw circle at the top. Find all five for a small celebration, then play again. "Show me a hint" rings the nearest hiding place.

- **Open `paper-kittens.html`** (one offline file, ~880 KB). Works with a mouse or a finger; no reading is needed to play, no timer, no losing, no ads, no links, no data collected.
- **Source:** `src/scene.js` is the paper-house scene plus the game block at the end; the kit lives in `../paper-house/src`. Rebuild: `node build.mjs` (needs `DEPS` with `three@0.187.0` and esbuild).

Tested in headless Chromium (software GL): a tap on empty ground finds nothing, tapping each hiding place finds its kitten, five finds show the win card, Play again resets; a touch tap on a 390×844 phone screen finds a kitten; all five hiding places sit inside the phone frame; no console errors. Not tested: a real touch device or GPU, sound (none), and children actually playing it.
