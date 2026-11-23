// A single paper house: a pop-up cottage on a printed lawn, in the papercraft style (see .claude/skills/papercraft).
// World: a spring-morning cottage garden. Lead family lavender (roof, lavender beds), butter-cream walls, a coral door,
// pink blossom trees, cool sage ground. Every piece below is drawn for this house; the kit supplies only the plumbing.
import * as P2 from 'papercraft/lib/paperkit-2d.js';
import { layeredCard, clusterLayout } from 'papercraft/lib/paperkit-3d.js';
import * as EX from 'papercraft/examples/countryside.js';
import { boxHouse } from 'papercraft/examples/built-ground.js';
import { createLife } from 'papercraft/lib/paper-life.js';
import { createHarness } from './harness.js';

const { shade, mix, rgba, fillLeaf, fillLimb, motif } = P2;

// ---- 1. palette (derived from the brief: spring morning, lavender / butter / coral) -------------------------------
const C = {
  ground: '#cdd7c4', wash: '#b6c6ae', washLight: '#dbe4cb', lawn: '#c6d9a8', path: '#f1e6d2', soil: '#ad9479',
  wall: '#f5e1b0', plinth: '#b4aab8', trim: '#fff3da', roofA: '#7d6cab', roofB: '#9886c4', roofC: '#6a5a98', chimney: '#b4634a', brickInk: '#5a2a1e',
  door: '#e8604c', shutter: '#5d80b3', window: '#ffd46a', frame: '#fff0d4', stepStone: '#bdb3c2',
  bark: '#6c4a3d', blossomA: '#f2a6bf', blossomB: '#fbdbe5', blossomC: '#d1578b', leaf: '#7da36d', centre: '#f0b429',
  hedge: '#4f8b78', hedgeB: '#8aab6c', lavA: '#8c70d2', lavB: '#b9a0ea', stem: '#5d8a58', rock: '#b6adb9', ink: '#3a2a3c', fence: '#fcf3df', metal: '#5b6a86', hay: '#e3b04b',
};

// the house stands left of centre, turned a little toward the camera; its door looks down the path
const HOUSE = { x: -3.2, z: -6.5, yaw: -0.28, w: 7.4, d: 5.4, wallH: 4.5, roofH: 3.4 };
const front = { x: HOUSE.x + Math.sin(HOUSE.yaw) * HOUSE.d / 2, z: HOUSE.z + Math.cos(HOUSE.yaw) * HOUSE.d / 2 };   // middle of the front wall
const pathX = (z) => front.x + (z - front.z) * 0.58 + Math.sin(z * 0.42 + 0.6) * 0.9;   // door -> bottom right, bending twice in view
const HERO_AT = [pathX(front.z + 4.2) + 1.9, front.z + 4.2];                              // the cat, off the path at the lower right of the door

const H = createHarness({ ground: C.ground, stock: '#f6efe2', view: { pitch: 46, dist: 40, target: [-0.6, 2.2, -4.6] },
  bounds: { x0: -64, x1: 64, z0: -62, z1: 40 }, walkArea: { x0: -2, x1: 14, z0: -2, z1: 10 }, camBox: { x0: 0, x1: 3, z0: -5, z1: -2 }, subject: [HOUSE.x + 1.2, HOUSE.z + 1.5] });
const { flags } = H;
const popup = (pts, paint, o = {}) => H.popup(pts, paint, o);

// ---- 2. the printed ground: sage washes, a paler lawn round the house, a torn path of cream stones, flower beds ----
const lawnPts = Array.from({ length: 36 }, (_, i) => { const a = i / 36 * Math.PI * 2, k = 1 + 0.08 * Math.sin(a * 3 + 0.4) + 0.05 * Math.sin(a * 5 + 2); return [-1.2 + Math.cos(a) * 19 * k, -4.2 + Math.sin(a) * 11.5 * k]; });
const BEDS = [[-8.2, front.z + 0.55, 6.4, 1.3, -0.28], [1.9, front.z - 0.05, 5.2, 1.3, -0.28]];   // along the front wall, either side of the door: x, z, w, d, angle
H.printGround(({ g, ppu, X, Z, rnd, washes, torn, band, ribbon, drifts }) => {
  washes([C.wash, C.wash, C.wash, C.washLight, C.washLight]);
  torn(lawnPts, P2.rgba(C.lawn, 0.85), 'rgba(255,250,225,0.35)');
  for (const [bx, bz, bw, bd, ba] of BEDS) {
    const ca = Math.cos(ba), sa = Math.sin(ba), c = ([u, v]) => [bx + u * ca - v * sa, bz + u * sa + v * ca];
    torn([[-bw / 2, -bd / 2], [bw / 2, -bd / 2], [bw / 2, bd / 2], [-bw / 2, bd / 2]].map(c), P2.rgba(C.soil, 0.9));
  }
  const zEnd = H.bounds.z1;
  torn(band(pathX, (z) => 1.45 + Math.sin(z * 0.5) * 0.12, front.z, zEnd), C.path);   // the path: a torn strip of pale paper
  ribbon(pathX, 0.8, P2.rgba('#fffaf0', 0.45), front.z, zEnd, 0.2);
  for (let z = front.z + 0.9; z < zEnd; z += 1.9) {                                  // stepping stones down the middle, each its own little paper oval
    const x = pathX(z) + Math.sin(z * 2.3) * 0.25, rx = (0.42 + 0.1 * Math.sin(z * 5)) * ppu, ry = 0.3 * ppu;
    g.fillStyle = P2.rgba(shade(C.stepStone, -0.12), 0.7); g.beginPath(); g.ellipse(X(x), Z(z) + 0.05 * ppu, rx, ry, 0.1, 0, 7); g.fill();
    g.fillStyle = C.stepStone; g.beginPath(); g.ellipse(X(x), Z(z), rx * 0.93, ry * 0.9, 0.1, 0, 7); g.fill();
    g.fillStyle = P2.rgba('#fff6e6', 0.55); g.beginPath(); g.ellipse(X(x) - rx * 0.2, Z(z) - ry * 0.25, rx * 0.4, ry * 0.3, 0.1, 0, 7); g.fill();
  }
  for (let k = 0, n = Math.round(14 * (zEnd - front.z)); k < n; k++) {                // fine grit along the path
    const z = front.z + rnd() * (zEnd - front.z), x = pathX(z) + (rnd() - 0.5) * 2.4, r = (0.04 + rnd() * 0.05) * ppu;
    g.fillStyle = rnd() < 0.6 ? P2.rgba(shade(C.path, -0.3), 0.5) : P2.rgba('#fffaf0', 0.7); g.beginPath(); g.ellipse(X(x), Z(z), r * 1.3, r, rnd() * 3, 0, 7); g.fill();
  }
  drifts((x, y) => {                                                                  // grass ticks and tiny blossoms gathered in drifts
    if (rnd() < 0.78) { g.strokeStyle = P2.rgba(rnd() < 0.5 ? '#6f8f5a' : '#93ad63', 0.75); g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 3, y - 5 - rnd() * 5); g.stroke(); }
    else { g.fillStyle = rnd() < 0.5 ? '#fff3dc' : '#e58aa8'; for (let q = 0; q < 5; q++) { const t = q / 5 * 6.283; g.beginPath(); g.arc(x + Math.cos(t) * 2.2, y + Math.sin(t) * 2.2, 1.6, 0, 7); g.fill(); } }
  });
});

// ---- 3. the house: butter clapboard walls on a stone plinth, a lavender scalloped roof, a coral door under a little
// porch roof, framed lit windows with blue shutters and flower boxes, a round attic window, a brick chimney ----------
let rnd = P2.rng(101);
const between = (a, b) => a + rnd() * (b - a);
function shingles(P, rows, tw = 0.66) {                                       // rows of scalloped tiles laid from the eave up: each lower row overlaps the one above
  const { box } = P, pitch = box.h / rows, tones = [C.roofA, C.roofB, C.roofC];
  for (let j = rows - 1; j >= 0; j--) {
    P.layer((g) => {
      const yb = box.y0 + j * pitch, off = (j % 2) * tw / 2;
      for (let x = box.x0 - tw + off; x < box.x1 + tw; x += tw) { g.beginPath(); g.arc(x + tw / 2, yb + tw / 2, tw / 2, 0, Math.PI * 2); g.fill(); }
      g.fillRect(box.x0 - 1, yb + tw / 2, box.w + 2, pitch + 0.02);
    }, tones[j % 3], { lip: 0.7, depth: 0.7 });
  }
}
const paintRoof = () => (P) => {
  const { box } = P;
  P.gradient(shade(C.roofA, 0.1), shade(C.roofA, -0.1), 0); P.felt(0.8);
  shingles(P, 6);
  P.layer((g) => { const tw = 0.66, pitch = box.h / 6; for (let x = box.x0 + 0.4; x < box.x1; x += tw * 2) { g.beginPath(); g.arc(x, box.y0 + 3 * pitch + 0.5, 0.14, 0, 7); g.fill(); } }, '#fff0d6', { lip: 0.5, depth: 0.45 });   // cream studs: a contrasting accent
  P.layer((g) => g.fillRect(box.x0 - 1, box.y1 - box.h * 0.07, box.w + 2, box.h * 0.07 + 1), C.trim, { rim: 0.8 });      // ridge cap
  P.layer((g) => g.fillRect(box.x0 - 1, box.y0 - 1, box.w + 2, 0.22), C.trim, { rim: 0.6 });                              // eave trim
  P.innerShade(shade(C.roofA, -0.6), { alpha: 0.25, blurPx: 8 });
};
function clapboard(P, y0, y1) {
  const { box } = P, n = Math.max(3, Math.round((y1 - y0) / 0.55)), h = (y1 - y0) / n;
  P.layer((g) => { for (let i = 1; i < n; i += 2) g.fillRect(box.x0 - 1, y0 + i * h, box.w + 2, h * 0.5); }, shade(C.wall, -0.14), { lip: 0.5, depth: 0.5 });
  P.layer((g) => { for (let i = 0; i < n; i += 2) g.fillRect(box.x0 - 1, y0 + i * h + h * 0.5, box.w + 2, h * 0.08); }, shade(C.wall, 0.3), { lip: 0.3, depth: 0.3 });
}
function window2(P, x, y, ww, wh, { shutters = true, planter = true } = {}) {
  const fr = ww * 0.12;
  P.layer((g) => {
    if (shutters) { g.fillStyle = C.shutter; g.fillRect(x - ww / 2 - fr - ww * 0.42, y - fr, ww * 0.38, wh + 2 * fr); g.fillRect(x + ww / 2 + fr + ww * 0.04, y - fr, ww * 0.38, wh + 2 * fr);
      g.fillStyle = shade(C.shutter, -0.3); for (const sx of [x - ww / 2 - fr - ww * 0.42, x + ww / 2 + fr + ww * 0.04]) for (let k = 1; k < 5; k++) g.fillRect(sx + ww * 0.03, y - fr + k * (wh + 2 * fr) / 5, ww * 0.32, wh * 0.02); }
    g.fillStyle = C.frame; g.fillRect(x - ww / 2 - fr, y - fr, ww + 2 * fr, wh + 2 * fr);
  }, C.frame, { lip: 0.8, depth: 0.75 });
  P.draw((g) => {
    const gr = g.createRadialGradient(x, y + wh / 2, 0, x, y + wh / 2, ww * 0.8); gr.addColorStop(0, '#fff1c0'); gr.addColorStop(1, C.window);
    g.fillStyle = gr; g.fillRect(x - ww / 2, y, ww, wh); g.fillStyle = C.frame; g.fillRect(x - fr / 3, y, fr * 0.66, wh); g.fillRect(x - ww / 2, y + wh / 2 - fr / 3, ww, fr * 0.66);
  });
  P.glow((gc) => { gc.fillRect(x - ww / 2, y, ww / 2 - fr / 3, wh / 2 - fr / 3); gc.fillRect(x + fr / 3, y, ww / 2 - fr / 3, wh / 2 - fr / 3); gc.fillRect(x - ww / 2, y + wh / 2 + fr / 3, ww / 2 - fr / 3, wh / 2 - fr / 3); gc.fillRect(x + fr / 3, y + wh / 2 + fr / 3, ww / 2 - fr / 3, wh / 2 - fr / 3); });
  if (planter) {
    P.layer((g) => g.fillRect(x - ww / 2 - fr * 1.5, y - fr - wh * 0.26, ww + fr * 3, wh * 0.24), '#8a5a44', { lip: 0.7, depth: 0.7 });
    P.layer((g) => { for (let k = 0; k < 5; k++) motif.flower(g, x - ww * 0.4 + k * ww * 0.2, y - fr - wh * 0.06 + (k % 2) * wh * 0.05, ww * 0.1, k % 2 ? C.blossomC : '#fff3dc', C.centre); }, C.blossomC, { lip: 0.6, depth: 0.6 });
  }
}
const paintFront = (wallH) => (P) => {
  const { box } = P, cx = (box.x0 + box.x1) / 2, w = box.w;
  P.gradient(shade(C.wall, 0.08), shade(C.wall, -0.08), 0.5); P.felt(0.9);
  clapboard(P, box.y0 + wallH * 0.14, wallH);
  P.layer((g) => g.fillRect(box.x0 - 1, box.y0 - 1, w + 2, wallH * 0.14 + 1), C.plinth, { lip: 0.8, depth: 0.8 });
  P.marks('brick', { color: shade(C.plinth, -0.4), alpha: 0.5, size: 0.05, region: { x0: box.x0, x1: box.x1, y0: box.y0, y1: box.y0 + wallH * 0.14 } });
  P.layer((g) => { g.fillRect(box.x0 - 1, box.y0, 0.28, wallH); g.fillRect(box.x1 - 0.28, box.y0, 0.29, wallH); }, C.trim, { lip: 0.6, depth: 0.6 });   // corner boards
  const dw = w * 0.17, dh = wallH * 0.56;
  window2(P, cx - w * 0.3, wallH * 0.38, w * 0.15, wallH * 0.3);
  window2(P, cx + w * 0.3, wallH * 0.38, w * 0.15, wallH * 0.3);
  P.layer((g) => { g.fillRect(cx - dw / 2 - 0.16, -1, dw + 0.32, dh + 0.16 + 1); }, C.trim, { lip: 0.7, depth: 0.7 });                  // door frame
  P.layer((g) => { g.beginPath(); g.moveTo(cx - dw / 2, -1); g.lineTo(cx - dw / 2, dh - dw / 2); g.arc(cx, dh - dw / 2, dw / 2, Math.PI, 0, true); g.lineTo(cx + dw / 2, -1); g.closePath(); g.fill(); }, C.door, { rim: 0.9, lip: 0.6, depth: 0.7 });
  P.draw((g) => {
    g.strokeStyle = rgba(shade(C.door, -0.45), 0.65); g.lineWidth = 0.05; for (const f of [-0.22, 0, 0.22]) { g.beginPath(); g.moveTo(cx + f * dw, 0); g.lineTo(cx + f * dw, dh - dw * 0.2); g.stroke(); }
    g.fillStyle = C.centre; g.beginPath(); g.arc(cx + dw * 0.3, dh * 0.42, 0.11, 0, 7); g.fill();
  });
  P.layer((g) => { g.beginPath(); g.arc(cx, dh * 0.72, dw * 0.2, 0, 7); g.fill(); }, C.leaf, { lip: 0.6, depth: 0.6 });                      // a wreath
  P.layer((g) => { for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283; g.beginPath(); g.arc(cx + Math.cos(a) * dw * 0.2, dh * 0.72 + Math.sin(a) * dw * 0.2, dw * 0.055, 0, 7); g.fill(); } }, C.blossomC, { lip: 0.5, depth: 0.5 });
  P.layer((g) => g.fillRect(cx - dw * 0.85, -1, dw * 1.7, wallH * 0.05 + 1), C.stepStone, { lip: 0.8, depth: 0.8 });                          // doorstep
  P.layer((g) => { g.beginPath(); g.moveTo(cx - dw * 1.05, dh + 0.1); g.lineTo(cx + dw * 1.05, dh + 0.1); g.lineTo(cx, dh + dw * 0.75); g.closePath(); g.fill(); }, C.roofB, { lip: 0.7, depth: 0.8 });   // porch roof
  P.layer((g) => g.fillRect(cx - dw * 1.05, dh + 0.04, dw * 2.1, 0.14), C.trim, { lip: 0.6, depth: 0.6 });
  P.layer((g) => { g.beginPath(); g.arc(cx - dw * 1.5, dh * 0.62, 0.17, 0, 7); g.fill(); }, C.window, { lip: 0.6, depth: 0.5 });             // door lantern
  P.glow((gc) => { gc.beginPath(); gc.arc(cx - dw * 1.5, dh * 0.62, 0.17, 0, 7); gc.fill(); });
  P.innerShade(shade(C.wall, -0.6), { alpha: 0.3, blurPx: 10 });
};
const paintGable = (wallH, roofH) => (P) => {
  const { box } = P, cx = (box.x0 + box.x1) / 2;
  P.gradient(shade(C.wall, 0.06), shade(C.wall, -0.1), 0.5); P.felt(0.9);
  clapboard(P, box.y0 + wallH * 0.14, wallH + roofH);
  P.layer((g) => g.fillRect(box.x0 - 1, box.y0 - 1, box.w + 2, wallH * 0.14 + 1), C.plinth, { lip: 0.8, depth: 0.8 });
  window2(P, cx, wallH * 0.4, box.w * 0.2, wallH * 0.3, { planter: false });
  const ay = wallH + roofH * 0.34, ar = Math.min(roofH * 0.22, box.w * 0.1);                                                                   // round attic window
  P.layer((g) => { g.beginPath(); g.arc(cx, ay, ar * 1.25, 0, 7); g.fill(); }, C.frame, { lip: 0.8, depth: 0.7 });
  P.draw((g) => { g.fillStyle = C.window; g.beginPath(); g.arc(cx, ay, ar, 0, 7); g.fill(); g.strokeStyle = C.frame; g.lineWidth = ar * 0.16; g.beginPath(); g.moveTo(cx - ar, ay); g.lineTo(cx + ar, ay); g.moveTo(cx, ay - ar); g.lineTo(cx, ay + ar); g.stroke(); });
  P.glow((gc) => { gc.beginPath(); gc.arc(cx, ay, ar, 0, 7); gc.fill(); });
  P.innerShade(shade(C.wall, -0.6), { alpha: 0.3, blurPx: 10 });
};
const paintChimney = (P) => {
  P.gradient(C.chimney, shade(C.chimney, -0.2), 0.5);
  P.marks('brick', { color: C.brickInk, alpha: 0.5, size: 0.12 });
  P.draw((g) => { g.fillStyle = C.plinth; g.fillRect(P.box.x0 - 1, P.box.y1 - P.box.h * 0.12, P.box.w + 2, P.box.h * 0.12 + 1); });
};

// ---- 4. the garden pieces ----------------------------------------------------------------------------------------
const mound = (w, h, lobes = 7, depth = 0.18) => P2.shape.mound(rnd, { w, h, lobes, depth });
const D = P2.draw2;
// blossom tree (slotted cross): a bark trunk and limbs as one layer, then fat blossom blobs in three tones and a few green leaves
const paintBlossom = (variant) => (P) => {
  const { box, r } = P, cx = (box.x0 + box.x1) / 2, cy0 = box.y0 + box.h * 0.26, rx = box.w / 2, ry = (box.y1 - cy0) / 2, cy = cy0 + ry;
  const tones = variant ? [C.blossomB, C.blossomA, C.blossomC] : [C.blossomA, C.blossomB, C.blossomC];
  P.gradient(shade(tones[0], 0.1), shade(tones[0], -0.1), 0.6); P.felt(1);
  const T = box.w * 0.075, sx = cx, sy = cy0 + ry * 0.3, tips = [];
  P.layer((g) => {
    fillLimb(g, cx, box.y0 - box.h * 0.03, cx, (box.y0 + sy) / 2, sx, sy, T, T * 0.5);
    for (let i = 0; i < 5; i++) { const a = (i / 4 - 0.5) * 2.2 + (r() - 0.5) * 0.25, len = 0.72 + r() * 0.14, ex = sx + Math.sin(a) * rx * len, ey = sy + Math.cos(a) * (cy + ry * 0.62 - sy) * len;
      fillLimb(g, sx, sy, sx + (ex - sx) * 0.3, sy + (ey - sy) * 0.72, ex, ey, T * 0.36, T * 0.1); tips.push([ex, ey]); }
  }, C.bark, { lip: 0.8 });
  const Lb = box.w * 0.15, spots = [...tips];
  for (let guard = 0; spots.length < 24 && guard < 900; guard++) {
    const ang = r() * 6.283, rr = Math.sqrt(r()) * 0.84, x = cx + Math.cos(ang) * rx * rr, y = cy + Math.sin(ang) * ry * rr;
    if (Math.abs(x - cx) < T && y < sy + ry * 0.1) continue;
    if (spots.some(([qx, qy]) => Math.hypot(qx - x, qy - y) < Lb * 0.9)) continue;
    spots.push([x, y]);
  }
  P.layer((g) => { spots.forEach(([x, y], i) => { if (i % 5 === 4) fillLeaf(g, x, y, Lb * 0.9, r() * 6.283); }); }, C.leaf, { lip: 0.6, depth: 0.6 });
  for (let t = 0; t < 3; t++) P.layer((g) => { spots.forEach(([x, y], i) => { if (i % 5 !== 4 && (i % 3) === t) { g.beginPath(); g.arc(x, y, Lb * (0.5 + 0.1 * ((i * 7) % 3)), 0, 7); g.fill(); } }); }, tones[t], { lip: 0.7, depth: 0.75 });
  P.layer((g) => { spots.forEach(([x, y], i) => { if (i % 5 !== 4) { g.beginPath(); g.arc(x, y, Lb * 0.1, 0, 7); g.fill(); } }); }, C.centre, { lip: 0.4, depth: 0.4 });
  P.innerShade(shade(tones[2], -0.65), { alpha: 0.28, blurPx: 12 });
};
const blossomTree = () => { const h = between(7.5, 9.5), w = h * between(0.86, 0.98); return [P2.roughen(EX.shape.tree(rnd, { w, h, lobes: 8 + Math.floor(rnd() * 3), canopy: 0.78, trunk: 0.2 }), rnd), paintBlossom(rnd() < 0.5)]; };
const paintLavender = (P) => {
  const { box, r } = P;
  P.gradient(shade(C.lavA, 0.1), shade(C.lavA, -0.15), 0.4); P.felt(1);
  P.layer((g) => { g.lineCap = 'round'; g.lineWidth = box.w * 0.016; g.strokeStyle = C.stem; for (let i = 0; i < 13; i++) { const x = box.x0 + box.w * (0.08 + 0.84 * i / 12); g.beginPath(); g.moveTo(x, box.y0 - 0.1); g.quadraticCurveTo(x + (r() - 0.5) * box.w * 0.08, box.y0 + box.h * 0.4, x + (r() - 0.5) * box.w * 0.06, box.y0 + box.h * 0.62); g.stroke(); } }, C.stem, { lip: 0.5 });
  for (const [col, off] of [[C.lavA, 0], [C.lavB, 1]]) P.layer((g) => { for (let i = off; i < 13; i += 2) { const x = box.x0 + box.w * (0.08 + 0.84 * i / 12); for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(x + (r() - 0.5) * box.w * 0.03, box.y0 + box.h * (0.55 + k * 0.1), box.w * 0.032, box.h * 0.07, 0, 0, 7); g.fill(); } } }, col, { lip: 0.7, depth: 0.75 });
  P.marks('dot', { color: '#fff0dd', alpha: 0.6, size: 0.03, density: 0.2 });
  P.innerShade(shade(C.lavA, -0.6), { alpha: 0.25, blurPx: 8 });
};
const mailbox = () => [P2.fromDrawing((g) => { D.rect(g, -0.07, 0, 0.14, 1.5); D.rect(g, -0.46, 1.38, 0.92, 0.62, 0.22); D.rect(g, 0.26, 1.74, 0.3, 0.1); }, { w: 1.3, h: 2.2, name: 'mailbox' }),
  (P) => { const { box, g } = P; P.fill(C.metal); P.layer((gg) => gg.fillRect(box.x0 + box.w * 0.15, box.y0 + box.h * 0.66, box.w * 0.7, box.h * 0.3), C.door, { lip: 0.7 }); P.draw(() => { g.fillStyle = C.fence; g.fillRect(box.x0 + box.w * 0.62, box.y0 + box.h * 0.86, box.w * 0.34, box.h * 0.05); }); P.innerShade('#1e1830', { alpha: 0.35, blurPx: 4 }); }];
const birdbath = () => [P2.fromDrawing((g) => { D.rect(g, -0.14, 0, 0.28, 1.0); D.rect(g, -0.4, 0, 0.8, 0.14, 0.05); D.ell(g, 0, 1.14, 0.62, 0.2); D.rect(g, -0.62, 1.1, 1.24, 0.16, 0.05); }, { w: 1.4, h: 1.5, name: 'birdbath' }),
  (P) => { const { box, g } = P; P.gradient(shade(C.rock, 0.12), shade(C.rock, -0.15), 0.5); P.marks('dot', { color: shade(C.rock, -0.4), alpha: 0.4, size: 0.04, density: 0.4 }); P.layer((gg) => gg.fillRect(box.x0 - 1, box.y0 + box.h * 0.74, box.w + 2, box.h * 0.1), '#8fc3d6', { lip: 0.8 }); P.innerShade(shade(C.rock, -0.6), { alpha: 0.35, blurPx: 6 }); }];
const lantern = () => [P2.fromDrawing((g) => { D.rect(g, -0.07, 0, 0.14, 2.3); D.rect(g, -0.24, 2.2, 0.48, 0.52, 0.07); D.poly(g, [[-0.32, 2.7], [0, 3.0], [0.32, 2.7]]); D.rect(g, -0.26, 0, 0.52, 0.14); }, { w: 0.75, h: 3.05, name: 'lantern' }),
  (P) => { const { box, g } = P; P.fill('#5b4a63'); P.draw(() => { g.fillStyle = '#ffd37a'; g.fillRect(box.x0 + box.w * 0.25, box.y0 + box.h * 0.72, box.w * 0.5, box.h * 0.13); }); P.glow((gc) => gc.fillRect(box.x0 + box.w * 0.25, box.y0 + box.h * 0.72, box.w * 0.5, box.h * 0.13)); P.innerShade('#1e1228', { alpha: 0.4, blurPx: 4 }); }];
const K = {
  tuft: () => [P2.shape.mound(rnd, { w: 3.4, h: 2.4, lobes: 7, depth: 0.42 }), EX.paintBush({ leaf: '#93ad63' }, { bands: 2, flowers: false, motifs: false })],
  flowers: () => [P2.roughen(mound(6, 2.0, 11, 0.25), rnd), EX.paintBush({ leaf: '#7da36d' }, { bands: 0, flowers: true, motifs: false })],
  lavender: () => [P2.roughen(mound(between(3.6, 4.6), 2.5, 10, 0.28), rnd), paintLavender],
  rock: () => { const w = between(3.4, 4.6); return [P2.roughen(mound(w, w * 0.55, 4, 0.1), rnd), EX.paintRock({ stone: C.rock, ink: C.ink })]; },
  fence: () => [EX.shape.fence({ w: 5.4, h: 2.1, pickets: 7 }), EX.paintWood({ wood: C.fence }, { planks: 1, vertical: true })],
  mailbox, birdbath, lantern,
  cat: () => EX.critter.cat(2.1, { coat: '#d8964a', pale: '#fff1dc' }),
  bird: () => EX.critter.hen(1.3),
};
function hedge(x, z, { yaw = 0, scale = 1, long = false } = {}) {                 // two stacked cards: a dark scalloped hedge and a lighter inner card with sprigs and berries
  const w = (long ? between(8, 10) : between(5.5, 7)) * 1, col = rnd() < 0.6 ? C.hedge : C.hedgeB, inner = P2.mix(col, '#f3e2b4', 0.5);
  const node = layeredCard([
    { pts: P2.roughen(mound(w, w * 0.34, long ? 12 : 7, 0.2), rnd), paint: EX.paintBush({ leaf: shade(col, -0.1) }, { bands: 0, motifs: false, grass: false }) },
    { pts: P2.roughen(mound(w * 0.76, w * 0.24, 6, 0.14), rnd), paint: EX.paintBush({ leaf: inner, stem: shade(col, -0.35) }, { bands: 0 }), z: 0.4 },
  ], H.cardOpts(x, z, scale));
  return popup(null, null, { node, height: w * 0.34, x, z, yaw, scale, sway: 0.5 });
}

// ---- 5. the cat hero ------------------------------------------------------------------------------------------------
const LIFE = { chimneys: [], flowers: [], creatures: [] };
function heroCat() { const [pts, paint] = K.cat(); return popup(pts, paint, { x: HERO_AT[0], z: HERO_AT[1], scale: 1.0 }); }

// ---- 6. ?test: the material on a few cards under the final light and lens ---------------------------------------------
if (flags.TEST) {
  H.setHero(heroCat(), { turn: 'flip' });
  popup(...blossomTree(), { x: -3, z: -8, cross: true, sway: 0.8 }); hedge(5, -5); popup(...K.rock(), { x: -1, z: -2.5, yaw: -0.2 });
  H.glowing(popup(null, null, { node: boxHouse({ w: HOUSE.w, d: HOUSE.d, wallH: HOUSE.wallH, roofH: HOUSE.roofH, colors: { chimney: C.chimney, wall: C.wall, roof: C.roofA, window: C.window, door: C.door, ink: C.ink }, paints: { front: paintFront(HOUSE.wallH), gable: paintGable(HOUSE.wallH, HOUSE.roofH), roof: paintRoof(), chimney: paintChimney }, overhang: 0.5, paper: H.paper, seed: 79 }), height: 8, x: 9, z: -11, yaw: -0.3 }).group);
} else buildWorld();

if (!flags.TEST) {
  const life = createLife({ scene: H.scene, camera: H.camera, heroHeight: H.heroHeight, seed: 41, wind: [0.94, 0.34] });
  life.fallers({ count: 70, cut: 'petal', colors: [C.blossomA, C.blossomB, C.blossomC, '#fff0f4'], size: [0.2, 0.3], land: 9 });
  life.flock({ size: 4, height: 3.6, colors: ['#fff6ea', '#efe7da'] });
  life.flyers({ count: 6, colors: ['#fff6e0', '#f6d36a', '#f2a0bd'], anchors: LIFE.flowers.slice(0, 6), roam: 1.4 });
  life.puffs({ at: LIFE.chimneys, perEmitter: 3, life: 4.5, rise: 0.45, size: [0.2, 0.45], colors: ['#f6eddc', '#efe3cd'] });
  life.cloudShadows({ count: 4 });
  life.setNight({ night: 1, dusk: 0.5 }[flags.MOOD] ?? 0);
  life.reset(H.target);
  H.onStep((t, dt) => life.update(dt, H.target));
  H.onRestart(() => life.reset(H.target));
}

// ---- 7. the world: the house, its garden by hand, then the fill ---------------------------------------------------------
function buildWorld() {
  const node = boxHouse({ w: HOUSE.w, d: HOUSE.d, wallH: HOUSE.wallH, roofH: HOUSE.roofH, overhang: 0.55,
    colors: { chimney: C.chimney, wall: C.wall, roof: C.roofA, window: C.window, door: C.door, ink: C.ink },
    paints: { front: paintFront(HOUSE.wallH), gable: paintGable(HOUSE.wallH, HOUSE.roofH), roof: paintRoof(), chimney: paintChimney },
    paper: H.paper, seed: 79, print: H.cardOpts(HOUSE.x, HOUSE.z) });
  const house = popup(null, null, { node, height: HOUSE.wallH + HOUSE.roofH, x: HOUSE.x, z: HOUSE.z, yaw: HOUSE.yaw, solid: 3.8 });
  if (node.userData.chimneyTop) LIFE.chimneys.push(node.userData.chimneyTop);
  H.glowing(house.group); H.lamp(front.x - 1.4, 2.4, front.z + 0.8, 1, 11);
  const keep = [[HOUSE.x, HOUSE.z, 7.2]];
  const mark = (x, z, r) => keep.push([x, z, r]);
  const pathDist = (x, z) => { let d = 1e9; for (let s = -5; s <= 5; s += 0.25) d = Math.min(d, Math.hypot(x - pathX(z + s), s)); return d; };
  const free = (x, z, m = 0) => (z < front.z - 0.2 || pathDist(x, z) > 1.9 + m) && keep.every(([hx, hz, r]) => Math.hypot(x - hx, z - hz) > r + m) && BEDS.every(([bx, bz, bw, bd]) => Math.abs(x - bx) > bw / 2 + 0.7 + m || Math.abs(z - bz) > bd / 2 + 0.9 + m);
  // lavender beds along the front wall, the flower boxes' companions
  for (const [bx, bz, bw] of BEDS) for (let i = 0; i < 3; i++) { const x = bx + (i - 1) * bw * 0.31, z = bz + 0.15 + (i % 2) * 0.25; popup(...K.lavender(), { x, z, yaw: HOUSE.yaw * 0.5 + (rnd() - 0.5) * 0.2, sway: 0.6 }); LIFE.flowers.push([x, z]); }
  // the picket fence frames the front garden, with a gap for the path; a mailbox and a lantern at the gate
  for (const [dx, dz, yaw] of [[-8.4, 3.2, -0.12], [-3.0, 3.9, -0.05], [4.6, 4.6, 0.08], [9.6, 5.4, 0.12]]) { const x = front.x + dx, z = front.z + dz; if (pathDist(x, z) > 2.6) { popup(...K.fence(), { x, z, yaw }); mark(x, z, 2.4); } }
  { const z = front.z + 4.3, x = pathX(z) + 4.4; popup(...K.mailbox(), { x, z, yaw: -0.3, scale: 1.2 }); mark(x, z, 1.3); }
  { const z = front.z + 3.9, x = pathX(z) - 2.2; popup(...K.lantern(), { x, z, scale: 1.2 }); H.lamp(x, 3.5, z + 0.3, 0.66, 9); mark(x, z, 1.1); }
  { const x = front.x - 6.4, z = front.z + 3.4; popup(...K.birdbath(), { x, z, yaw: 0.2, scale: 1.3 }); mark(x, z, 1.8); }
  // hedges along the sides and back, blossom trees at the corners (tall pieces stay off the front, where the camera looks in)
  hedge(HOUSE.x - 8.2, HOUSE.z + 1.4, { yaw: 0.25, long: true }); mark(HOUSE.x - 8.2, HOUSE.z + 1.4, 4.5);
  hedge(HOUSE.x + 8.4, HOUSE.z + 1.0, { yaw: -0.2, long: true }); mark(HOUSE.x + 8.4, HOUSE.z + 1.0, 4.5);
  hedge(HOUSE.x - 2, HOUSE.z - 7.4, { yaw: 0.05, long: true }); mark(HOUSE.x - 2, HOUSE.z - 7.4, 4.5);
  for (const [x, z, s] of [[HOUSE.x + 9, HOUSE.z - 3.6, 1.1], [HOUSE.x - 7.6, HOUSE.z - 3, 1.0], [HOUSE.x + 2.4, HOUSE.z - 6.5, 1.25]]) { popup(...blossomTree(), { x, z, cross: true, sway: 0.8, scale: s }); mark(x, z, 3.4); }
  { const [x, z] = [pathX(front.z + 5.2) - 5.4, front.z + 5.2]; hedge(x, z, { yaw: 0.1 }); mark(x, z, 3); }
  H.setHero(heroCat(), { turn: 'flip' }); mark(HERO_AT[0], HERO_AT[1], 2);

  // the fill: groups of 4-7 different pieces in the open ground, only where the camera sees (every cell has its own seed)
  rnd = P2.rng(202);
  const cellSeed = (gx, gz, salt) => (Math.imul(Math.round(gx * 10), 73856093) ^ Math.imul(Math.round(gz * 10), 19349663) ^ Math.imul(salt, 83492791)) >>> 0;
  const ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
  const lush = (x, z) => 0.5 + 0.24 * Math.sin(x * 0.12 + ph[0]) * Math.sin(z * 0.14 + ph[1]) + 0.16 * Math.sin(x * 0.21 + z * 0.15 + ph[2]);
  const placed = [], trees = [];
  const BACK = ['bush', 'lavender', 'flowers', 'rock', 'tuft'], DRESS = ['bush', 'lavender', 'lavender', 'flowers', 'flowers', 'rock', 'tuft', 'tuft'];
  const kindsFor = (n) => { const out = []; n = Math.min(n, 5); while (out.length < n) { const k = DRESS[Math.floor(rnd() * DRESS.length)]; if (!out.includes(k)) out.push(k); } return out; };
  const group = (x, z, kinds, size) => {
    kinds.sort((a, b) => BACK.indexOf(a) - BACK.indexOf(b));
    clusterLayout(x, z, { n: kinds.length, size: size * 5.5, seed: Math.round(x * 13 + z * 7) & 1023 }).forEach((c, i) => {
      if (!free(c.x, c.z, 0.2)) return;
      if (kinds[i] === 'bush') { hedge(c.x, c.z, { yaw: c.yaw, scale: c.scale * size * 0.8 }); return; }
      const [pts, paint] = K[kinds[i]]();
      popup(pts, paint, { x: c.x, z: c.z, yaw: c.yaw, scale: c.scale * size, sway: ['tuft', 'flowers', 'lavender'].includes(kinds[i]) ? 0.6 : 0 });
      if (kinds[i] === 'flowers' || kinds[i] === 'lavender') LIFE.flowers.push([c.x, c.z]);
    });
  };
  const [hx0, hz0] = HERO_AT, corridor = (x, z) => z > hz0 - 2 && z < hz0 + 16 && Math.abs(x - hx0) < 8 + (z - hz0) * 0.3;
  for (let gz = -40; gz <= 22; gz += 3.4) for (let gx = -44; gx <= 46; gx += 3.4) {
    rnd = P2.rng(cellSeed(gx, gz, 19));
    const x = gx + (rnd() - 0.5) * 2.6, z = gz + (rnd() - 0.5) * 2.6, l = lush(x, z);
    if (!H.inFrame(x, z, 0.12, 4) || l < 0.33 || placed.some(([px, pz]) => Math.hypot(x - px, z - pz) < 3.8)) continue;
    placed.push([x, z]);
    if (l > 0.58 && z < HOUSE.z + 2 && free(x, z, 1.8) && !corridor(x, z) && trees.every(([tx, tz]) => Math.hypot(x - tx, z - tz) > 5.2)) { trees.push([x, z]); popup(...blossomTree(), { x, z, cross: true, sway: 0.8 }); }
    else if (free(x, z, 1.0)) group(x, z, kindsFor(4 + Math.floor(rnd() * 3)), 1.1);
  }
  for (let gz = -30; gz <= 14; gz += 2.2) for (let gx = -40; gx <= 42; gx += 2.2) {          // small fillers between the groups
    rnd = P2.rng(cellSeed(gx, gz, 69));
    const x = gx + (rnd() - 0.5) * 1.6, z = gz + (rnd() - 0.5) * 1.6;
    if (!H.inFrame(x, z, 0.05, 1) || lush(x, z) < 0.34 || !free(x, z, 0.5) || placed.some(([px, pz]) => Math.hypot(x - px, z - pz) < 1.9)) continue;
    placed.push([x, z]); const k = ['tuft', 'flowers', 'tuft', 'rock'][Math.floor(rnd() * 4)];
    popup(...K[k](), { x, z, yaw: (rnd() - 0.5) * 0.7, scale: 0.65 + rnd() * 0.25, sway: k === 'rock' ? 0 : 0.6 });
  }
  // big blurred pieces across the bottom edge sell the miniature scale
  rnd = P2.rng(303);
  for (const [sx, dz, s, kind] of [[-1.05, 5.2, 2.0, 'tree'], [-0.38, 6.7, 1.7, 'bush'], [1.05, 7.2, 2.1, 'tree'], [0.3, 8.2, 1.4, 'bush']]) {
    const p = H.groundAt(sx, -1); if (!p) continue;
    if (kind === 'bush') hedge(p.x, p.z + dz, { scale: s, yaw: (rnd() - 0.5) * 0.4 }); else popup(...blossomTree(), { x: p.x, z: p.z + dz, cross: true, scale: s, sway: 0.6 });
  }
}

H.start();
