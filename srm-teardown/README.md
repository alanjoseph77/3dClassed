# SRM teardown: 6/4 switched reluctance motor

An interactive 3D simulator you can take apart, built with the `/teardown` skill. One offline HTML file (about 750 KB): open `srm-teardown.html` by double-click.

- **Run**: a controller fires each phase from the rotor position and a speed loop sets the current. Set speed, load torque, turn-on advance and direction.
- **Step**: you switch phases A, B, C yourself; each switch turns the rotor 30° (order A → C → B counter-clockwise).
- **Teardown**: Exploded view, Coils / Flux / Housing toggles, labels, five camera views (keys 1–5). Left alone it plays an auto tour; any click or key hands control over.
- **Numbers**: every gauge and chart reads one model, `T = ½·i²·dL/dθ`, from `.claude/skills/teardown/sims/srm-shared/srm.js` (6 stator poles, 4 rotor poles, 0.5 mm gap, L 4 to 28 mH, up to 10 A).

Honest limits: linear magnetics (no saturation), motor parameters are typical small-motor values chosen for the picture, not a measured machine. Time runs in slow motion (the slider sets how slow). Tested in headless Chromium; not checked on a real GPU or phone hardware.

Rebuild: `node .claude/skills/teardown/sims/build.mjs srm-live` (needs `npm install` in the skill folder first), then copy `teardown-out/dist/srm-live.html`.
