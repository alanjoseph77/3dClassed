---
name: lego
description: Design a LEGO model from a description (e.g. "/lego a fire truck", "build a lego crane", "make a LEGO house") with the ldraw-nova toolkit, check it, render previews, and deliver an LDraw .mpd plus a single-file offline interactive 3D HTML viewer in its own repo folder. Use whenever the user asks to build, design or generate a LEGO/LDraw model or wants one shown as HTML.
argument-hint: "<model idea, e.g. a red fire truck with a ladder>"
---

# LEGO builder (ldraw-nova → .mpd → single HTML)

**Model requested:** $ARGUMENTS

If no model was given, ask what to build (subject, rough size, colours). Otherwise pick sensible defaults, state them in one line, and build it end to end; don't stop at a plan.
Deliverable: a new top-level folder named after the model (e.g. `fire-truck/`), the same layout as `lego-crane/`, a card for it in the root `index.html`, a row in the root `README.md`, then commit and push, and send the user the HTML file.

Worked example of everything below: `lego-crane/` in this repo (tower crane, 44 parts).

## 1. Set up (once per container)

```sh
sh .claude/skills/lego/scripts/setup_env.sh "$SCRATCH"   # any scratch dir
export LDRAW_DIR=/usr/share/ldraw
cd "$SCRATCH/ldraw-nova"
```

- library.ldraw.org is often blocked by the network policy; the script installs Ubuntu's `ldraw-parts`, `leocad` and `xvfb` instead.
- Read `instructions.md` and `docs/agent/plans.md` in ldraw-nova before designing. Check `examples/` so you don't duplicate an existing model (it already has a mobile crane, bridge, cathedral, cars, spaceships…).

## 2. Design

1. Write a short brief: subject, silhouette, size in studs, palette, focal feature, moving parts.
2. Find real parts — never invent IDs:
   ```sh
   ./ldraw-agent catalog parts 'girder' --limit 20
   ./ldraw-agent part 30646 --limit 5      # bounds, origin, studs, connectors
   ```
3. Write a Python generator that outputs `MODEL.plan.json` (see `lego-crane/tools/tower_crane_gen.py`). Use explicit `at` coordinates.

Geometry rules that bit us:
- LDU, **-Y is up**. Stud pitch 20, brick body 24, plate body 8. A brick/plate origin is its **top surface**; the body extends +Y. So a part sitting on a surface at height `y` has origin `y - body_height`.
- Parts must land **on the stud grid**: a part 2 studs wide must be centred on a stud *boundary*, a 1-wide part on a stud *centre*. With `yaw: 90`, X and Z swap — recheck which axis is 2 wide.
- Windows/odd parts: read `bounds` from `./ldraw-agent part`; e.g. window 4863 spans y 0..48, so its origin is 48 above the surface it stands on.
- Turntable 3403 + 3404 share one origin; base bottom is local y=+24.
- Tiles (no studs) can't carry parts on top — use a plate if something sits there.
- Flexible parts (braided string 75924 etc.) can only be placed rigidly; they and what hangs from them show as separate components. That is expected — say so.

## 3. Check and fix

```sh
python output/MODEL_gen.py
./ldraw-agent review output/MODEL.plan.json --no-render --outdir output/checks --force
./ldraw-agent inspect output/checks/model.mpd --contacts all --detail full --limit 80
```
Read `geometry.confirmed_components`: indices are placements in plan order. Every lone index is a floating part — fix its position (usually half-stud offset or wrong height). Stud-zone overlaps of depth 4 with connections are normal.

## 4. Render and look

```sh
./ldraw-agent review output/MODEL.plan.json --force          # builds output/MODEL-review/model.mpd + bom.json
sh .claude/skills/lego/scripts/render_previews.sh "$PWD" output/MODEL-review/model.mpd output/previews
```
Open the PNGs (Read tool) and actually review them: silhouette, proportions, colours, floating bits. Iterate.

## 5. Deliver as HTML

```sh
python .claude/skills/lego/scripts/mpd_to_html.py output/MODEL-review/model.mpd OUT.html \
  --title "LEGO Tower Crane" --subtitle "44 parts"
```
- One file, works offline (three.js embedded from npm; CDNs may be blocked in the sandbox).
- Orbit/zoom, spin, edges toggle, reset. Camera auto-fits the model, including phone screens.
- For moving parts pass `--plan PLAN.json --groups groups.json` (`{"slew": ["tt-top", "jib-*"]}`); each group is exposed as `window.MODEL.groups[name]` for custom sliders. `lego-crane/tower-crane.html` is a customised version with slew/trolley/hook sliders (template in `lego-crane/tools/crane-viewer-template.html`).
- Verify with Playwright (`chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']})`), desktop and 390px wide, no console errors.

## 6. STL for 3D printing (when asked)

```sh
python .claude/skills/lego/scripts/mpd_to_stl.py output/MODEL-review/model.mpd OUT/stl          # display STL + parts/*.stl + report.json, Z up, 1 LDU = 0.4 mm
pip install trimesh scipy scikit-image
python .claude/skills/lego/scripts/make_watertight.py OUT/stl/MODEL-display.stl OUT/stl/MODEL-display-50pct-watertight.stl --scale 0.5 --pitch 0.3
```
- Raw LDraw meshes are not watertight (T-junctions); `make_watertight.py` voxelises and remeshes into a guaranteed-closed solid. Don't decimate afterwards; it breaks watertightness. Use a larger `--pitch` for a smaller file.
- Pick a scale that fits a ~220 mm bed. Render a preview (matplotlib) and look at it. Write `stl/README.md` with orientation, supports and fragile-feature tips (see `lego-crane/stl/README.md`).

## 7. Hand over

Put a folder in the repo: `MODEL.mpd`, `MODEL.html`, `MODEL.plan.json`, `tools/` (generator), `PARTS.md` (from `bom.json`), `validation.json`, `previews/`, `README.md`. Report part count, checks, and limitations honestly (checks ≠ proof it is physically buildable; ldraw-nova is AGPL-3.0).
