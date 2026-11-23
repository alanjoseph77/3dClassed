# Train

A 3D diesel-electric locomotive with two passenger coaches on ballasted track, built from code in three.js (version r187, bundled inside the file). First step towards a train-driving game: this is only the train and its viewer.

- **Open `train.html`** (one offline file, ~590 KB). Drag to look around, scroll or pinch to zoom. Buttons and keys 1-6 jump between views: 3/4, side, front, **driver** (looking down the track over the hood), top, whole train.
- **Drive / Stop** and the speed slider (up to about 120 km/h) spin the wheels and run the track and scenery past the train; **Lights** switches the headlights and tail lights (the headlight casts a beam). Space = drive/stop, up/down arrows = speed, L = lights.
- **What is modelled:** a long-hood diesel locomotive (cab, hood, roof fans, exhaust, horn, handrails, ladders, fuel tank, two 3-axle bogies with wheels, springs and traction motors, couplers, headlights, pilot) and two coaches (windows, doors, end gangways, 2-axle bogies, roof units). The livery is an original colour scheme: no logos or real railway names.
- **Source:** `src/main.js`. Rebuild with `node build.mjs` (`DEPS` = a `node_modules` with `three@0.187.0` and esbuild).

Honest limits: it is a detailed, realistic-looking model made from primitive shapes and drawn textures, not a photoreal or scale-accurate copy of one real engine. Trees are simple. No sound yet. The wheels do not turn with coupling rods (diesel bogies have none), and the train does not yet follow a curved track, stop at stations or take any game input beyond speed and lights. Tested in headless Chromium (software GL) at 1280×720 and 390×844: all views, driving, lights, no console errors apart from a test-only synthetic pointer warning. Not tested on a real GPU or touch device, or for frame rate on a weak phone.
