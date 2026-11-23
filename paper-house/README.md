# Paper house

A single pop-up paper house, built with the `/papercraft` skill: a cardstock cottage that folds up out of a printed lawn, with a lavender scalloped roof, a coral door, framed lit windows, pink blossom trees, lavender beds, a picket fence, a cat, drifting petals, chimney smoke, birds and butterflies.

- **Open `paper-house.html`** (one offline file, ~880 KB, three.js inlined). Drag to look around; click to fold the world flat and pop it up again. `?mood=golden|dusk|night` changes the light.
- **Source:** `src/scene.js` is the scene (palette, house prints, garden pieces); `src/lib/`, `src/harness.js` and `src/examples/` are the papercraft kit (MIT, from xikhar/papercraft).
- **Rebuild:** `node build.mjs` with `DEPS` pointing at a `node_modules` that has `three@0.187.0` (and `esbuild`; set `ESBUILD_DEPS` if elsewhere).

Tested in headless Chromium (software GL) at 1280×720 and 390×844: no console errors, 142 cards in frame, the house rises and settles. Not tested on a real GPU, and frame rate on weak phones is unknown (the scene is print-heavy: it takes a few seconds to build). The fill uses the kit's countryside pieces (hedges, rocks, tufts) recoloured; the house, trees, lavender, fence details, mailbox, lantern and birdbath are drawn for this scene.
