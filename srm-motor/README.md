# Switched reluctance motor (interactive figure)

An interactive isometric figure made with the `/anatomy` skill: a 6/4 switched reluctance motor on a bench, cabled to a three-phase controller.

- `srm-motor.html` (dark) and `srm-motor-light.html` (light): open in any browser. Move the pointer across the card to fire phases A, B, C, or use the arrow keys.
- `build.mjs`: the source. `node build.mjs` and `node build.mjs --light` rebuild the pages (needs the skill folder at `../.claude/skills/anatomy`).
- `previews/`: screenshots.

What it shows (the model drives every motion and number):
- 6 stator poles, wound as phases A (red), B (green), C (blue) on opposite pairs; a 4-pole iron rotor with no magnets or windings.
- Firing a phase pulls the nearest rotor teeth into line with its poles (minimum reluctance): torque −K·sin(4·Δθ), same for either current direction.
- Step angle 360° / (3 × 4) = 30°. A → B → C turns the rotor backwards (−30° per step); C → B → A turns it forwards.

Checks: the skill's line-end check reports 0 floating line ends in both themes; no console errors; works at phone width (390 px) and with reduced motion.
