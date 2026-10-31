# LEGO tower crane (built with ldraw-nova)

An original flat-top construction tower crane, generated with [ldraw-nova](https://github.com/anteloc/ldraw-nova).

![overview](previews/overview.png)

- `tower-crane.html` — interactive 3D viewer (single file, works offline): orbit, slew, move the trolley, raise/lower the hook.
- `tower-crane.mpd` — the LDraw model. Open it in LeoCAD, LDCad, BrickLink Studio or LDView.
- `tools/tower_crane_gen.py` → `tower-crane.plan.json`: editable source (regenerate with `python tools/tower_crane_gen.py`).
- `tools/mpd_to_html_flatten.py` + `tools/crane-viewer-template.html`: how `tower-crane.html` was produced. For new models use the generic `.claude/skills/lego/scripts/mpd_to_html.py`.
- `PARTS.md` / `bom.json` — parts list. `validation.json` — geometry checks.

Size: about 54 studs long (jib tip to counter-jib) and 30 bricks tall.

Not stud-connected (visual only): the two hoist rope falls (braided string), the hook block hanging from them, and the hook.
Checks passing does not prove the real model is buildable or strong.
