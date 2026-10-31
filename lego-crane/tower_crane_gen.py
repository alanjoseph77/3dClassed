"""Generate tower-crane.plan.json — an original flat-top tower crane.
Coordinates: LDU, -Y up, stud pitch 20, brick 24, plate 8. +X = working jib, -X = counter-jib."""
import json, pathlib
Y, DG, LG, BK, TR, WH, TC = 14, 72, 71, 0, 36, 15, 47
VERT = [[0, -1, 0], [1, 0, 0], [0, 0, 1]]          # string local X -> world +Y (proper rotation)

steps = []
def step(*parts): steps.append([p for p in parts])
def P(id, ref, col, at, yaw=None, matrix=None, purpose=None):
    d = {"id": id, "ref": ref, "colour": col, "at": at}
    if yaw is not None: d["yaw"] = yaw
    if matrix is not None: d["matrix"] = matrix
    if purpose: d["purpose"] = purpose
    return d

# --- foundation -------------------------------------------------------------
step(P("base", "41539.dat", DG, [0, 0, 0], purpose="8x8 concrete pad"))
step(P("found", "3031.dat", LG, [0, -8, 0], purpose="4x4 mast footing"),
     *[P(f"block-{i}", "3003.dat", LG, [x, -24, z], purpose="corner ballast block")
       for i, (x, z) in enumerate([(-60, -60), (60, -60), (-60, 60), (60, 60)])])
step(*[P(f"blockcap-{i}", "3068b.dat", Y, [x, -32, z], purpose="hazard-yellow cap")
       for i, (x, z) in enumerate([(-60, -60), (60, -60), (-60, 60), (60, 60)])])

# --- mast: three 2x2x8 girders (192 LDU bodies) -------------------------------
top = -8
for i in range(3):
    top -= 192
    step(P(f"mast-{i}", "30646.dat", Y, [0, top, 0], purpose=f"mast section {i+1}"))
# top = -584
step(P("mast-cap", "3031.dat", Y, [0, top - 8, 0], purpose="4x4 slewing seat"))
ring = top - 8 - 24          # turntable origin: base bottom (local +24) on the 4x4 plate
step(P("tt-base", "3403.dat", DG, [0, ring, 0], purpose="slewing ring base"),
     P("tt-top", "3404.dat", DG, [0, ring, 0], purpose="slewing ring top"))
jib_y = ring                  # turntable top surface = -616; jibs hang below the deck at the same level

# --- jibs (triangular girders, flat studded top) -----------------------------
step(P("jib-1", "30518.dat", Y, [220, jib_y, 0], purpose="working jib inner section"),
     P("jib-2", "30518.dat", Y, [540, jib_y, 0], purpose="working jib outer section"),
     P("cjib", "30518.dat", Y, [-220, jib_y, 0], yaw=180, purpose="counter-jib"))
deck = jib_y - 8
step(P("deck", "3030.dat", Y, [0, deck, 0], purpose="4x10 slewing deck, locks both jib roots to the ring"),
     P("splice", "3020.dat", Y, [380, deck, 0], purpose="jib splice plate across the seam"))

# --- operator cab (front of deck) & machinery house (rear) --------------------
step(P("cab-wall-1", "3010.dat", Y, [70, deck - 24, 0], yaw=90, purpose="cab back wall"),
     P("cab-window", "4863.dat", WH, [90, deck - 48, 0], yaw=90, purpose="cab front window"))
step(P("cab-wall-2", "3010.dat", Y, [70, deck - 48, 0], yaw=90, purpose="cab back wall upper"))
step(P("cab-roof", "3020.dat", Y, [80, deck - 56, 0], yaw=90, purpose="cab roof"))
step(P("cab-tile", "87079.dat", WH, [80, deck - 64, 0], yaw=90, purpose="cab roof tile"))
step(P("house-1", "3001.dat", LG, [-80, deck - 24, 0], yaw=90, purpose="hoist machinery house"))
step(P("house-2", "3001.dat", LG, [-80, deck - 48, 0], yaw=90, purpose="hoist machinery house"))
step(P("house-roof", "87079.dat", DG, [-80, deck - 56, 0], yaw=90, purpose="machinery roof"))
step(P("winch", "3020.dat", DG, [-20, deck - 8, 0], yaw=90, purpose="winch platform"),
     P("grille", "3069b.dat", BK, [-20, deck - 16, -10], purpose="winch vent grille"),
     P("grille-b", "3069b.dat", BK, [-20, deck - 16, 10], purpose="winch vent grille"))

# --- counter-jib ballast -----------------------------------------------------
for i in range(3):
    step(P(f"ballast-{i}", "3001.dat", DG, [-340, jib_y - 24 * (i + 1), 0], purpose="concrete counterweight"))
step(P("ballast-cap", "3020.dat", Y, [-340, jib_y - 80, 0], purpose="counterweight cap"))

# --- lights -------------------------------------------------------------------
step(P("tip-light", "3062b.dat", TR, [690, jib_y - 24, 10], purpose="jib tip warning light"),
     P("tail-light", "3062b.dat", TR, [-370, jib_y - 104, 10], purpose="counter-jib warning light"))

# --- trolley, hoist rope (two falls) and hook block ---------------------------
TX = 460
step(P("trolley", "3020.dat", DG, [TX, jib_y - 8, 0], yaw=90, purpose="trolley riding on the jib top, overhanging both sides"))
rope_top = jib_y            # underside of trolley overhang
for s, z in (("l", -30), ("r", 30)):
    step(P(f"rope-{s}", "75924.dat", BK, [TX, rope_top + 200, z], matrix=VERT, purpose="hoist rope fall (braided string 21L)"))
blk = rope_top + 400
step(P("hookblock", "3001.dat", Y, [TX, blk, 0], yaw=90, purpose="hook block"))
step(P("hookblock-plate", "3020.dat", DG, [TX, blk + 24, 0], yaw=90, purpose="hook block base"))
step(P("hook", "70644.dat", LG, [TX, blk + 32 + 28.8, 0], purpose="crane hook"))

plan = {"version": 1, "author": "Claude Code for ldraw-nova user (original design)",
        "sections": [{"name": "tower-crane.ldr",
                      "description": "Flat-top construction tower crane (original design)",
                      "steps": steps}]}
out = pathlib.Path(__file__).with_name("tower-crane.plan.json")
out.write_text(json.dumps(plan, indent=1))
print(out, sum(len(s) for s in steps), "placements")
