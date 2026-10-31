"""Generate sports-car.plan.json: an original classic 4-wide LEGO Town sports roadster.
LDU, -Y up, road at Y=0, X across (4 studs = -40..40), -Z is the FRONT. Length 12 studs (Z -120..120).
Classic wheel recipe (ldraw-nova WHEEL_PACKS['classic']): 4600 holder top at Y=-23, wheel axis Y=-18,
4624 rim + 3641 tyre at X=+-30, rotated (never mirrored) so both faces point outwards."""
import json, pathlib
RED, BLK, LG, DG, WHT, TCLR, TRED = 4, 0, 71, 72, 15, 47, 36
steps = []
def step(*p): steps.append(list(p))
def P(id, ref, col, at, yaw=None, purpose=None):
    d = {"id": id, "ref": ref, "colour": col, "at": at}
    if yaw is not None: d["yaw"] = yaw
    if purpose: d["purpose"] = purpose
    return d
row = lambda i: -110 + 20 * i          # stud-row centres, front (i=0) to rear (i=11)

# --- running gear: two axles ---------------------------------------------------
AXLES = {"front": -80, "rear": 60}       # 2-deep holders centred on stud boundaries; wheelbase 7 studs
for name, z in AXLES.items():
    step(P(f"{name}-holder", "4600.dat", BLK, [0, -23, z], purpose=f"{name} wheel-pin plate"),
         *[P(f"{name}-rim-{s}", "4624.dat", LG, [sx * 30, -18, z], yaw=-90 * sx, purpose="rim") for s, sx in (("l", -1), ("r", 1))],
         *[P(f"{name}-tyre-{s}", "3641.dat", BLK, [sx * 30, -18, z], yaw=-90 * sx, purpose="tyre") for s, sx in (("l", -1), ("r", 1))])
    step(P(f"{name}-mudguard", "3788.dat", RED, [0, -39, z], purpose=f"{name} wheel arches"))

# --- chassis ------------------------------------------------------------------
DECK = -47                                   # top of the 4x12 chassis plate
step(P("chassis", "3029.dat", RED, [0, DECK, 0], yaw=90, purpose="4x12 chassis plate over both mudguards"))
step(P("bumper-f", "3710.dat", LG, [0, DECK + 8, row(0)], purpose="front bumper under the nose"),
     P("bumper-r", "3710.dat", LG, [0, DECK + 8, row(11)], purpose="rear bumper"))

B = DECK - 24                                # top of one brick on the deck
# --- nose: headlights + bonnet --------------------------------------------------
step(P("headlight-l", "4070.dat", WHT, [-30, B, row(0)], purpose="headlight"),
     P("headlight-r", "4070.dat", WHT, [30, B, row(0)], purpose="headlight"),
     P("nose", "3004.dat", RED, [0, B, row(0)], purpose="nose centre"),
     P("bonnet-1", "3010.dat", RED, [0, B, row(1)], purpose="bonnet"),
     P("bonnet-2", "3010.dat", RED, [0, B, row(2)], purpose="bonnet"))
step(P("bonnet-tile", "87079.dat", RED, [0, B - 8, (row(0) + row(1)) / 2], purpose="smooth bonnet"),
     P("cowl-tile", "2431.dat", BLK, [0, B - 8, row(2)], purpose="black cowl strip in front of the screen"))

# --- cabin ----------------------------------------------------------------------
step(P("windscreen", "3823.dat", TCLR, [0, DECK - 48, row(4)], purpose="raked 2x4x2 windscreen on rows 3-4"))
step(P("steering", "3829c01.dat", BLK, [0, DECK - 8, row(5)], purpose="steering wheel"),
     P("seat", "4079.dat", BLK, [0, DECK - 8, (row(6) + row(7)) / 2], purpose="driver seat"),
     P("side-l", "3622.dat", RED, [-30, B, row(6)], yaw=90, purpose="left cockpit side"),
     P("side-r", "3622.dat", RED, [30, B, row(6)], yaw=90, purpose="right cockpit side"))
step(P("sill-l", "63864.dat", RED, [-30, B - 8, row(6)], yaw=90, purpose="cockpit edge tile"),
     P("sill-r", "63864.dat", RED, [30, B - 8, row(6)], yaw=90, purpose="cockpit edge tile"))

# --- rear deck, tail lights and spoiler (row 8 left open: the seat back leans into it) ---
step(*[P(f"deck-{i}", "3010.dat", RED, [0, B, row(i)], purpose="rear deck") for i in (9, 10)],
     P("tail-l", "4070.dat", TRED, [-30, B, row(11)], yaw=180, purpose="tail light"),
     P("tail-r", "4070.dat", TRED, [30, B, row(11)], yaw=180, purpose="tail light"),
     P("tail-c", "3004.dat", RED, [0, B, row(11)], purpose="tail centre"))
step(P("deck-tile", "87079.dat", RED, [0, B - 8, (row(9) + row(10)) / 2], purpose="smooth rear deck"),
     P("strut-l", "3062b.dat", BLK, [-30, B - 24, row(11)], purpose="spoiler strut"),
     P("strut-r", "3062b.dat", BLK, [30, B - 24, row(11)], purpose="spoiler strut"),
     P("tail-plate", "3023.dat", RED, [0, B - 8, row(11)], purpose="rear deck between struts"),
     )
step(P("wing", "3710.dat", BLK, [0, B - 32, row(11)], purpose="spoiler wing"))
step(P("wing-tile", "2431.dat", RED, [0, B - 40, row(11)], purpose="spoiler top"))

plan = {"version": 1, "author": "Claude Code for 3dClassed (original design)",
        "sections": [{"name": "sports-car.ldr", "description": "Classic 4-wide Town sports roadster (original design)", "steps": steps}]}
out = pathlib.Path(__file__).resolve().parent.parent / "sports-car.plan.json"
out.write_text(json.dumps(plan, indent=1))
print(out, sum(len(s) for s in steps), "placements")
