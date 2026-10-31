// Fig 1 · Switched reluctance motor: a 6/4 lamination stack on a bench plinth, cabled to a three-phase controller.
// node build.mjs [--light]  →  srm-motor.html / srm-motor-light.html
// The model (MODEL below) is the truth: 6 stator poles (phases A, B, C on opposite pairs), 4 rotor poles,
// torque from the reluctance pull T = −K·sin(Nr·(θ − θaligned)) toward the nearest aligned position,
// step angle 360° / (3 · 4) = 30°, and A → B → C turns the rotor backwards.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../.claude/skills/anatomy/kit/iso-kit.mjs";
import { kitScript } from "../.claude/skills/anatomy/scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";
const WIDTH = 640, HEIGHT = 400;
const DEG = Math.PI / 180;

// —— the truth ——
const MODEL = {
  NS: 6, NR: 4, PHASES: ["A", "B", "C"], TONES: ["red", "green", "blue"],
  POLE: [0, 60, 120],                 // stator pole angle of each phase (and +180°)
  ALIGN: [0, -30, 30],                // rotor angles (mod 90°) aligned with each phase: 60 mod 90 = −30, 120 mod 90 = 30
  STEP: 360 / (3 * 4),                // 30°
  K: 900, C: 12,                      // peak pull (deg/s²) and damping (1/s): a 30° step settles in about 0.6 s
};

// —— the world (units ≈ px), motor axis vertical so the rotor turns in plain view ——
const PLATE = { x: -168, y: -92, w: 330, d: 184, r: 9 }, PLATE_H = 12, FOOT_H = 5;
const M = [-62, 0];                                   // motor axis
const PLINTH_R = 84, PLINTH_H = 8, RING_R = 80, RING_H = 2;
const Z0 = PLINTH_H + RING_H;                         // stack bottom
const STACK = 26, ZT = Z0 + STACK;                    // stack top
const R_OUT = 72, R_YOKE = 58, R_TIP = 31.2, R_SHOE = 35, POLE_W = 18, SHOE_W = 23;
const R_ROT = 30, R_CORE = 15, ROT_W = 19;
const COIL = { r0: 37.5, r1: 55, w: 30, z0: Z0 - 2, z1: ZT + 5 };
const CTRL = { x: 48, y: -50, w: 104, d: 78, r: 5 }, CTRL_H = 20, PANEL_H = 2.2;
const CT = CTRL_H + PANEL_H;
const LAMPS = [[96, -32], [116, -32], [136, -32]];
const KNOB = [72, -12];
const TB = { x: 22, y: 38, w: 30, d: 12, r: 2 }, TB_H = 7;   // terminal block between motor and controller

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [M[0], M[1] - PLINTH_R, COIL.z1], [M[0], M[1] + PLINTH_R, COIL.z1], [M[0] - PLINTH_R, M[1], COIL.z1], [CTRL.x + CTRL.w, CTRL.y, CT + 8]],
  WIDTH, HEIGHT, { pad: 26, azimuth: 40 },
);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const pol = (a, r) => [M[0] + r * Math.cos(a * DEG), M[1] + r * Math.sin(a * DEG)];
const depthAt = (xy, z = ZT) => k.depthOf([xy[0], xy[1], z], P);
const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

// a shape in the motor's polar frame: local [u radial, v tangential] at angle a → floor points
const local = (a, pts) => pts.map(([u, v]) => [M[0] + u * Math.cos(a * DEG) - v * Math.sin(a * DEG), M[1] + u * Math.sin(a * DEG) + v * Math.cos(a * DEG)]);
const arcPts = (a0, a1, r, n) => Array.from({ length: n + 1 }, (_, i) => pol(a0 + (a1 - a0) * i / n, r));
const roundRect = (u0, u1, w, rr, n = 4) => {   // rounded rectangle in (u, v), corners rounded by rr
  const out = [], h = w / 2, cs = [[u1 - rr, h - rr, 0], [u0 + rr, h - rr, 90], [u0 + rr, -h + rr, 180], [u1 - rr, -h + rr, 270]];
  for (const [cu, cv, s] of cs) for (let i = 0; i <= n; i++) { const t = (s + 90 * i / n) * DEG; out.push([cu + rr * Math.cos(t), cv + rr * Math.sin(t)]); }
  return out;
};

// —— static parts ——
function bench() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 24))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // ruler strip along the front edge
  const strip = { x: PLATE.x + 20, y: PLATE.y + PLATE.d - 15, w: PLATE.w - 40, d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const t = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
  // label plate, back left
  const lp = { x: PLATE.x + 14, y: PLATE.y + 12, w: 40, d: 18, r: 1.5 };
  out.push(S(k.slabOf(lp, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(lp, 1.6), 0.8, P, 4), { tone: "faint" }));
  out.push(L([[6, 28], [10, 20], [14, 24]].map(([dy, w]) => k.lineOnTop([lp.x + 5, lp.y + dy], [lp.x + 5 + w, lp.y + dy], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([lp.x + 2.6, lp.y + 2.6, 0.8]), at([lp.x + lp.w - 2.6, lp.y + lp.d - 2.6, 0.8])], { size: 0.4 }));
  return out.join("");
}

function plinth() {
  const out = [`<path class="iso-halo" d="${k.haloOf({ x: M[0] - PLINTH_R, y: M[1] - PLINTH_R, w: 2 * PLINTH_R, d: 2 * PLINTH_R, r: PLINTH_R }, 0, 1, P)}" style="filter:blur(3px)"/>`];
  out.push(S(k.cylinder(M[0], M[1], PLINTH_R, 0, PLINTH_H, P, 96, 1.2), { tone: "mid" }));
  out.push(L(k.sideArc(M[0], M[1], PLINTH_R, 3, P, 64), { tone: "faint" }));
  // six hold-down screws round the plinth rim, between the coils
  out.push(L([30, 90, 150, 210, 270, 330].map((a) => { const [x, y] = pol(a, PLINTH_R - 2.6); return k.ring(x, y, 1.6, PLINTH_H, P, 12); }).join(""), { tone: "lo" }));
  out.push(D([30, 90, 150, 210, 270, 330].map((a) => at([...pol(a, PLINTH_R - 2.6), PLINTH_H])), { size: 0.45 }));
  out.push(S(k.cylinder(M[0], M[1], RING_R, PLINTH_H, RING_H, P, 96, 0.6), { tone: "lo" }));
  // protractor on the ring top: every 7.5°, a major every 30° (one rotor step)
  const tk = k.radialTicks(M[0], M[1], RING_R - 0.6, 48, 4, Z0, [2.2, 4], P);
  out.push(L(tk.minor, { tone: "lo" }), L(tk.major, { tone: "mid" }));
  return out.join("");
}

// stator pieces: 12 yoke sectors, 6 poles each with its coil; each item keeps its depth so the rotor can slot in
function statorItems() {
  const items = [];
  for (let i = 0; i < 12; i++) {
    const a0 = i * 30 - 15, a1 = a0 + 30, ring = [...arcPts(a0, a1, R_OUT, 8), ...arcPts(a1, a0, R_YOKE, 8)];
    const mid = pol((a0 + a1) / 2, (R_OUT + R_YOKE) / 2);
    let svg = S(k.extrude(ring, Z0, STACK, P, { convex: false, bevel: 0.5 }), { tone: "mid", inner: L([4, 8, 12, 16, 20, 24].map((dz) => outerArc(a0, a1, Z0 + dz)).join(""), { tone: "faint" }) });
    if (i % 2 === 1) {   // a tie-rod head on every sector between two poles
      const [x, y] = pol((a0 + a1) / 2, (R_OUT + R_YOKE) / 2);
      svg += S(k.cylinder(x, y, 2.6, ZT, 1.4, P, 16), { tone: "mid" }) + D([at([x, y, ZT + 1.4])], { size: 0.45, tone: "lo" });
    }
    items.push({ depth: depthAt(mid), svg });
  }
  for (let p = 0; p < 6; p++) {
    const a = p * 60, ph = p % 3, tone = MODEL.TONES[ph];
    const pole = local(a, [[R_YOKE + 1, POLE_W / 2], [R_SHOE, POLE_W / 2], [R_SHOE, SHOE_W / 2], [R_TIP, SHOE_W / 2 - 1], [R_TIP - 0.2, 0], [R_TIP, -SHOE_W / 2 + 1], [R_SHOE, -SHOE_W / 2], [R_SHOE, -POLE_W / 2], [R_YOKE + 1, -POLE_W / 2]]);
    let svg = S(k.extrude(pole, Z0, STACK, P, { convex: false, bevel: 0.4 }), { tone: "mid" });
    // the coil: a rounded block wound round the pole shank, its turns drawn on top in the phase colour
    const coil = local(a, roundRect(COIL.r0, COIL.r1, COIL.w, 4));
    svg += S(k.extrude(coil, COIL.z0, COIL.z1 - COIL.z0, P, { bevel: 0.6 }), { tone: "lo", inner: L(k.ringSeam(coil, COIL.z1 - 3, P), { tone: "faint" }) });
    const turns = [2.2, 4.6, 7].map((d) => k.onTop(local(a, roundRect(COIL.r0 + d, COIL.r1 - d, COIL.w - 2 * d, Math.max(1, 4 - d * .4))), COIL.z1, P, true)).join("");
    svg += `<g data-coil="${ph}" class="srm-coil">${L(turns, { tone })}</g>`;
    // the pole face shows between coil and rotor: one seam where the shoe meets the shank
    svg += L(k.onTop(local(a, [[R_SHOE, POLE_W / 2], [R_SHOE, -POLE_W / 2]]), ZT, P), { tone: "faint" });
    items.push({ depth: depthAt(pol(a, (R_TIP + COIL.r1) / 2)), svg, pole: true });
  }
  return items;
}
function outerArc(a0, a1, z) {   // visible part of the stack's outer edge at height z (lamination seams)
  const pts = [];
  for (let i = 0; i <= 8; i++) { const a = a0 + (a1 - a0) * i / 8, n = [Math.cos(a * DEG), Math.sin(a * DEG)], tv = k.towardViewer(P); if (n[0] * tv[0] + n[1] * tv[1] > 0.02) pts.push([...pol(a, R_OUT), z]); }
  if (pts.length < 2) return "";
  return k.pathOf(pts.map(at));
}

// —— rotor geometry, shared by the build and the page (no closures over build-only values) ——
const ROTOR_SRC = `
function rotorParts(theta, phase, P) {
  const DEG = Math.PI / 180, M = ${JSON.stringify(M)}, R_ROT = ${R_ROT}, R_CORE = ${R_CORE}, ROT_W = ${ROT_W}, Z0 = ${Z0}, ZT = ${ZT}, POLE = ${JSON.stringify(MODEL.POLE)}, R_TIP = ${R_TIP}, TONES = ${JSON.stringify(MODEL.TONES)};
  const half = Math.asin(ROT_W / 2 / R_ROT) / DEG, coreHalf = Math.asin(ROT_W / 2 / R_CORE) / DEG;
  const ring = [];
  for (let j = 0; j < 4; j++) {
    const c = theta + j * 90;
    for (let i = 0; i <= 6; i++) { const a = (c - half + 2 * half * i / 6) * DEG; ring.push([M[0] + R_ROT * Math.cos(a), M[1] + R_ROT * Math.sin(a)]); }
    for (let i = 0; i <= 8; i++) { const a = (c + coreHalf + (90 - 2 * coreHalf) * i / 8) * DEG; ring.push([M[0] + R_CORE * Math.cos(a), M[1] + R_CORE * Math.sin(a)]); }
  }
  const pt = (a, r, z) => [M[0] + r * Math.cos(a * DEG), M[1] + r * Math.sin(a * DEG), z];
  let svg = solidSvg(extrude(ring, Z0, ZT - Z0, P, { convex: false, bevel: 0.5 }), { tone: "hi", crease: "lo" });
  // lamination seams on the rotor's visible pole faces
  // flux path of the energised phase: stator tip → nearest rotor pole → through the core → opposite pole → opposite tip
  if (phase >= 0) {
    const a = POLE[phase]; let best = 0, gap = 1e9;
    for (let j = 0; j < 4; j++) { const d = Math.abs(((theta + j * 90 - a) % 360 + 540) % 360 - 180); if (d < gap) { gap = d; best = theta + j * 90; } }
    const z = ZT + 0.15;
    const path = [pt(a, R_TIP + 1.5, z), pt(best, R_ROT - 2, z), pt(best, R_CORE - 6, z), pt(best + 180, R_CORE - 6, z), pt(best + 180, R_ROT - 2, z), pt(a + 180, R_TIP + 1.5, z)];
    svg += '<path class="iso-line" data-tone="' + TONES[phase] + '" data-flow="" d="' + pathOf(path.map((p) => iso(p, P))) + '" style="stroke-width:1.3"/>';
  }
  // the marker: one rotor pole lit, so the reader can follow it
  svg += '<path class="iso-line" data-tone="lit" d="' + pathOf([pt(theta, R_CORE - 3, ZT + 0.2), pt(theta, R_ROT - 2.5, ZT + 0.2)].map((p) => iso(p, P))) + '" style="stroke-width:1.6"/>';
  // hub, shaft and key
  svg += solidSvg(cylinder(M[0], M[1], 8, ZT, 4, P, 36, 0.5), { tone: "mid" });
  svg += solidSvg(cylinder(M[0], M[1], 4.4, ZT + 4, 9, P, 28, 0.4), { tone: "hi", crease: "lo" });
  svg += '<path class="iso-line" data-tone="lo" d="' + pathOf([pt(theta, 0, ZT + 13), pt(theta, 4.2, ZT + 13)].map((p) => iso(p, P))) + '"/>';
  svg += dotsSvg([iso(pt(theta + 120, 6, ZT + 4), P), iso(pt(theta + 240, 6, ZT + 4), P), iso(pt(theta, 6, ZT + 4), P)], { size: 0.45, tone: "lo" });
  return svg;
}`;
const rotorParts = new Function("solidSvg", "extrude", "cylinder", "pathOf", "iso", "dotsSvg", ROTOR_SRC + "; return rotorParts;")(k.solidSvg, k.extrude, k.cylinder, k.pathOf, k.iso, k.dotsSvg);

function controller() {
  const out = [`<path class="iso-halo" d="${k.haloOf(CTRL, 0, CTRL_H, P)}"/>`];
  out.push(S(k.slabOf(CTRL, 0, CTRL_H, P, 6, 1.0), { tone: "mid", inner: L(k.sideSeam(CTRL, 6, P, 6), { tone: "faint" }) }));
  const panel = k.insetPlan(CTRL, 3);
  out.push(S(k.slabOf(panel, CTRL_H, PANEL_H, P, 6, 0.6), { tone: "lo" }));
  out.push(D(byDepth(k.corners(panel, 4)).map(([x, y]) => at([x, y, CT])), { size: 0.45 }));
  // vent slots on the right face are closed slots on the top panel's back strip
  for (let i = 0; i < 6; i++) out.push(L(k.planOutline({ x: CTRL.x + 14 + i * 7, y: CTRL.y + 56, w: 3, d: 14, r: 1.4 }, CT, P, 3), { tone: "faint" }));
  // three phase lamps: bezel, lens (lit when that phase is on), a ring in the phase colour
  LAMPS.forEach(([x, y], i) => {
    out.push(S(k.cylinder(x, y, 6, CT, 2.2, P, 28, 0.4), { tone: "mid" }));
    out.push(L(k.ring(x, y, 6.6, CT, P, 32), { tone: MODEL.TONES[i] }));
    out.push(`<g data-lamp="${i}" data-on="0"><g class="srm-off">${S(k.cylinder(x, y, 4, CT + 2.2, 2.6, P, 24), { tone: "lo" })}</g><g class="srm-on">${S(k.cylinder(x, y, 4, CT + 2.2, 2.6, P, 24), { tone: "hi", lit: true })}</g></g>`);
  });
  // the phase selector: knurled knob, three coloured stops, a lit pointer rebuilt as it turns
  const [kx, ky] = KNOB;
  MODEL.TONES.forEach((tone, i) => { const a = (-60 + i * 60) * DEG; out.push(L(k.lineOnTop([kx + 13.4 * Math.sin(a), ky - 13.4 * Math.cos(a)], [kx + 18.5 * Math.sin(a), ky - 18.5 * Math.cos(a)], CT, P), { tone })); });
  out.push(L(k.ring(kx, ky, 13.4, CT, P, 48), { tone: "faint" }));
  out.push(L(k.ring(kx, ky, 18.5, CT, P, 64), { tone: "faint" }));   // the selector's scale band: stops run ring to ring
  out.push(S(k.cylinder(kx, ky, 12, CT, 3, P, 48, 0.5), { tone: "mid" }));
  out.push(S(k.cylinder(kx, ky, 10, CT + 3, 6, P, 48, 0.6), { tone: "mid" }));
  out.push(L(k.knurl(kx, ky, 10, CT + 3, CT + 9, 60, P), { tone: "lo" }));
  out.push(`<path data-part="knob" class="iso-line" data-tone="lit" data-free="end" d="${knobLine(-60)}" style="stroke-width:1.4"/>`);
  out.push(D([at([kx, ky, CT + 9])], { size: 0.6, tone: "hi" }));
  // a small label plate with three rule lines
  const lp = { x: CTRL.x + 52, y: CTRL.y + 30, w: 36, d: 14, r: 1.2 };
  out.push(S(k.slabOf(lp, CT, 0.6, P, 3), { tone: "mid", crease: "none" }));
  out.push(L([[4, 20], [7.5, 14], [11, 17]].map(([dy, w]) => k.lineOnTop([lp.x + 4, lp.y + dy], [lp.x + 4 + w, lp.y + dy], CT + 0.6, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([lp.x + 2, lp.y + 2, CT + 0.6]), at([lp.x + lp.w - 2, lp.y + lp.d - 2, CT + 0.6])], { size: 0.4 }));
  return out.join("");
}
function knobLine(deg) { const a = deg * DEG, [kx, ky] = KNOB; return k.lineOnTop([kx, ky], [kx + 9 * Math.sin(a), ky - 9 * Math.cos(a)], CT + 9.05, P); }

// terminal block beside the plinth, three posts; cables in the phase colours to the controller's side
function terminals() {
  const out = [];
  out.push(S(k.slabOf(TB, 0, TB_H, P, 3, 0.5), { tone: "mid" }));
  const posts = [-9, 0, 9].map((dx) => [TB.x + TB.w / 2 + dx, TB.y + TB.d / 2]);
  const ends = [0, 1, 2].map((i) => [CTRL.x + 24 + i * 12, CTRL.y + CTRL.d]);
  posts.forEach(([x, y], i) => {
    out.push(S(k.cylinder(x, y, 2.4, TB_H, 2.2, P, 16), { tone: "mid" }));
    out.push(D([at([x, y, TB_H + 2.2])], { size: 0.5, tone: "hi" }));
  });
  // cables from each post to the controller's left face, lying on the bench, then up the face
  posts.forEach(([x, y], i) => {
    const e = ends[i];
    out.push(`<g data-cable="${i}">` + k.wireSvg(at([x, y, TB_H + 2.2]), at([e[0], e[1], 11]), { via: [at([x, y + 4, TB_H + 2.2]), at([x + 2, TB.y + TB.d + 5, 0.8]), at([e[0], TB.y + TB.d + 5, 0.8]), at([e[0], e[1] + 3, 0.8]), at([e[0], e[1], 4])], tone: MODEL.TONES[i], size: 1.1 }) + `</g>`);
  });
  // from the block to the stack: three leads into the plinth's side (they run under the stack to the coils)
  posts.forEach(([x, y], i) => {
    const into = pol(28 + i * 4, PLINTH_R);
    out.push(k.wireSvg(at([TB.x, TB.y + 3 + i * 3, 4]), at([into[0], into[1], 4]), { via: [at([TB.x - 4, TB.y + 3 + i * 3, 0.8]), at([into[0] + 3, into[1] + 1, 0.8])], tone: MODEL.TONES[i], size: 0.9 }));
  });
  return out.join("");
}

// —— assemble: bench, plinth, back stator half, rotor (live), front stator half, terminals, controller ——
const items = statorItems().sort((a, b) => a.depth - b.depth);
const centre = depthAt(M);
const back = items.filter((it) => it.depth <= centre).map((it) => it.svg).join("");
const front = items.filter((it) => it.depth > centre).map((it) => it.svg).join("");
const svg = k.figureSvg({
  width: WIDTH, height: HEIGHT,
  label: "A switched reluctance motor on a bench: a laminated stator with six salient poles, each wound with a coil, phases A, B and C on opposite pairs, around a four-pole iron rotor with no magnets and no windings. Cables run from a terminal block to a three-phase controller with a selector knob and three lamps. Firing a phase pulls the nearest rotor poles into line with that phase's poles; firing A, B, C in turn steps the rotor 30 degrees each time, in the opposite direction.",
  body: [bench(), plinth(), back, `<g data-part="rotor">${rotorParts(0, 0, P)}</g>`, front, controller(), terminals()],
});

const live = `
${ROTOR_SRC}
const P = ${JSON.stringify(P)};
const MODEL = ${JSON.stringify(MODEL)};
const KNOB = ${JSON.stringify(KNOB)}, CT = ${CT};
const stage = document.querySelector(".iso-stage"), svg = stage.querySelector("svg");
const rotor = svg.querySelector('[data-part="rotor"]'), knob = svg.querySelector('[data-part="knob"]');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const wrap = (d) => ((d % 360) + 540) % 360 - 180;
const wrap90 = (d) => ((d % 90) + 135) % 90 - 45;   // into [−45°, 45°): rotor poles repeat every 90°
const nearestAligned = (theta, ph) => theta + wrap90(MODEL.ALIGN[ph] - theta);
let theta = 0, rate = 0, phase = 0, knobAt = -60, knobRate = 0, frame = 0, last = 0, clock = 0, touring = true, visible = false, idle = 0, step = 0;
// pull toward the nearest aligned position of the active phase: T = −K·sin(4·(θ − θa))
const torque = (th, ph) => -MODEL.K * Math.sin(4 * wrap90(th - MODEL.ALIGN[ph]) * Math.PI / 180);
function setPhase(ph) {
  phase = ph;
  svg.querySelectorAll("[data-coil]").forEach((g) => g.setAttribute("data-on", +g.dataset.coil === ph ? "1" : "0"));
  svg.querySelectorAll("[data-lamp]").forEach((g) => g.setAttribute("data-on", +g.dataset.lamp === ph ? "1" : "0"));
  svg.querySelectorAll("[data-cable]").forEach((g) => g.setAttribute("data-on", +g.dataset.cable === ph ? "1" : "0"));
}
function draw() {
  rotor.innerHTML = rotorParts(theta, phase, P);
  const a = knobAt * Math.PI / 180;
  knob.setAttribute("d", lineOnTop([KNOB[0], KNOB[1]], [KNOB[0] + 9 * Math.sin(a), KNOB[1] - 9 * Math.cos(a)], CT + 9.05, P));
  const err = wrap90(theta - MODEL.ALIGN[phase]), al = Math.abs(err) < 1.5;
  const text = MODEL.PHASES[phase] + " on · " + (theta >= 0 ? "+" : "−") + Math.abs(theta).toFixed(1) + "° · " + (al ? "aligned" : Math.abs(err).toFixed(0) + "° to go");
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuetext", text);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60; last = now;
  const calm = still.matches;
  if (touring) { clock += dt; const s = Math.floor(clock / 1.25); if (s !== step) { step = s; setPhase(((s % 3) + 3) % 3); } }
  if (calm) { theta = nearestAligned(theta, phase); rate = 0; }
  else for (let i = 0; i < 8; i++) { rate += (torque(theta, phase) - MODEL.C * rate) * dt / 8; theta += rate * dt / 8; }
  const want = -60 + phase * 60; knobAt += (want - knobAt) * (1 - Math.exp(-dt / 0.12));
  draw();
  const settled = !touring && Math.abs(rate) < 0.02 && Math.abs(want - knobAt) < 0.05;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const choose = (ph) => { touring = false; if (ph !== phase) setPhase(ph); clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; clock = 0; step = -1; run(); }, 4000); run(); };
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
stage.addEventListener("pointermove", (ev) => { const b = svg.getBoundingClientRect(); const s = (ev.clientX - b.left) / b.width; choose(s < 1 / 3 ? 0 : s < 2 / 3 ? 1 : 2); });
stage.addEventListener("keydown", (ev) => {
  let to = null;
  if (ev.key === "ArrowRight" || ev.key === "ArrowUp") to = (phase + 1) % 3;
  if (ev.key === "ArrowLeft" || ev.key === "ArrowDown") to = (phase + 2) % 3;
  if (to === null) return; ev.preventDefault(); choose(to);
});
setPhase(0); draw();
`;

const css = `<style>
.srm-coil .iso-line{opacity:.38;transition:opacity .25s}
.srm-coil[data-on="1"] .iso-line{opacity:1;stroke-width:1.5}
[data-lamp] .srm-on{opacity:0;transition:opacity .2s}
[data-lamp][data-on="1"] .srm-on{opacity:1}
[data-cable] .iso-wire,[data-cable] path{opacity:.45;transition:opacity .25s}
[data-cable][data-on="1"] .iso-wire,[data-cable][data-on="1"] path{opacity:1}
</style>`;

const body = css + k.plateHtml({
  fig: "Fig 1",
  title: "Switched reluctance motor",
  hint: "Move across: fire A · B · C",
  readout: "A on · +0.0° · aligned",
  keys: [
    { mark: "lit", label: "Rotor: plain iron, no magnets, no windings; the marked pole shows where it turns" },
    { mark: "red", label: "Phase A coils (and lamp)" },
    { mark: "green", label: "Phase B" },
    { mark: "blue", label: "Phase C" },
  ],
  caption:
    "A 6/4 switched reluctance motor. Six stator poles carry the coils, wired as three phases on opposite pairs; the rotor is four iron teeth on a shaft. Current in one phase makes its two poles a magnet, and the nearest rotor teeth are pulled into line with them, because that is the path of least reluctance (highest inductance): torque ½·i²·dL/dθ, the same whichever way the current flows. Fire A, B, C in turn and each step moves the rotor 360° / (3 × 4) = 30°, backwards against the firing order. Fire C, B, A and it turns the other way. The controller only switches the phases in time with the rotor; there is nothing on the rotor to wear out.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Switched reluctance motor: arrow keys fire the next or previous phase" aria-valuetext="phase A on">${svg}</div>`,
});

const name = theme === "light" ? "srm-motor-light.html" : "srm-motor.html";
writeFileSync(join(HERE, name), k.pageHtml({ title: "Switched reluctance motor", theme, body, script: kitScript() + live }));
console.log("wrote", name);
