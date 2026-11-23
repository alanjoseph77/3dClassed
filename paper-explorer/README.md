# Paper garden explorer

Walk a paper child around the pop-up garden (the paper house scene) and collect 12 golden paper stars hidden round the hedges, fences and trees. Built with `/papercraft`.

- **Open `paper-explorer.html`** (one offline file, ~890 KB). Walk with the arrow keys or WASD; on a phone or tablet use the thumb stick (bottom left). **Drag the world to turn the view**: the camera follows the child and can swing about 34° each way and tilt, so the paper garden reads as a real 3D diorama. Hedges, trees, fences and the house block the way.
- Collect all 12 for the win card; "Play again" puts the stars back. No timer, no losing, nothing online.
- **Source:** `src/scene.js` (the paper-house scene, the walking child from the papercraft template recoloured, and the game block at the end); the kit is `../paper-house/src`. Rebuild: `node build.mjs` with `DEPS` = a `node_modules` that has `three@0.187.0` and esbuild. The orbit range comes from `window.__papercraftOrbit` (a small hook added to the shared harness).

Tested in headless Chromium (software GL, so slow frames): the child walks with the keys, steering walks onto a star and collects it, dragging the view changes the camera, all 12 stars are reachable (checked against the walk map) and the win card shows, the thumb stick moves the child on a 390×844 touch screen, no console errors. The page takes about 11 s to build in software GL. Not tested: a real GPU or touch device, and children playing it.
