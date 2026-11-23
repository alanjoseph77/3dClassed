// My paper home: build a pop-up paper house level by level, earn coins, buy furniture and decorate the rooms.
// A cut-away paper dollhouse on the papercraft kit (see .claude/skills/papercraft). Coins are earned in play only: no real money.
import * as P2 from 'papercraft/lib/paperkit-2d.js';
import { layeredCard, makeCard } from 'papercraft/lib/paperkit-3d.js';
import * as EX from 'papercraft/examples/countryside.js';
import { createLife } from 'papercraft/lib/paper-life.js';
import { createHarness } from 'papercraft/harness.js';

const { shade, mix, rgba, fillLeaf, fillLimb, motif } = P2;

const C = {
  ground: '#cdd7c4', wash: '#b6c6ae', washLight: '#dbe4cb', lawn: '#c6d9a8', path: '#f1e6d2',
  wall: '#f5e1b0', trim: '#fff3da', roofA: '#7d6cab', roofB: '#9886c4', roofC: '#6a5a98',
  bark: '#6c4a3d', blossomA: '#f2a6bf', blossomB: '#fbdbe5', blossomC: '#d1578b', leaf: '#7da36d', centre: '#f0b429',
  hedge: '#4f8b78', hedgeB: '#8aab6c', lavA: '#8c70d2', lavB: '#b9a0ea', stem: '#5d8a58', rock: '#b6adb9', ink: '#3a2a3c', fence: '#fcf3df', metal: '#5b6a86',
};
const params = new URLSearchParams(location.search);
const NAME = (params.get('name') || '').replace(/[^\p{L}\p{N} '-]/gu, '').slice(0, 14).trim();   // ?name=Mia: "Mia's paper home"

const H = createHarness({ ground: C.ground, stock: '#f6efe2', view: { pitch: 44, dist: innerHeight > innerWidth ? 50 : 33, target: [0, 1.6, -3.9] }, focus: [0, 2.2, -5.5],
  bounds: { x0: -64, x1: 64, z0: -62, z1: 40 }, subject: [0, -5] });
const { flags } = H;
const popup = (pts, paint, o = {}) => H.popup(pts, paint, o);

// ---- the printed ground: sage washes, a paler lawn, a torn path from the front door ---------------------------------
const lawnPts = Array.from({ length: 36 }, (_, i) => { const a = i / 36 * Math.PI * 2, k = 1 + 0.08 * Math.sin(a * 3 + 0.4) + 0.05 * Math.sin(a * 5 + 2); return [Math.cos(a) * 20 * k, -3.5 + Math.sin(a) * 13 * k]; });
const pathX = (z) => 0.3 + (z + 3) * 0.28 + Math.sin(z * 0.42 + 0.6) * 0.8;
H.printGround(({ g, ppu, X, Z, rnd, washes, torn, band, ribbon, drifts }) => {
  washes([C.wash, C.wash, C.wash, C.washLight, C.washLight]);
  torn(lawnPts, P2.rgba(C.lawn, 0.85), 'rgba(255,250,225,0.35)');
  const zEnd = H.bounds.z1;
  torn(band(pathX, (z) => 1.5 + Math.sin(z * 0.5) * 0.12, -3.2, zEnd), C.path);
  ribbon(pathX, 0.8, P2.rgba('#fffaf0', 0.45), -3.2, zEnd, 0.2);
  for (let z = -2.4; z < zEnd; z += 1.9) {
    const x = pathX(z) + Math.sin(z * 2.3) * 0.25, rx = (0.42 + 0.1 * Math.sin(z * 5)) * ppu, ry = 0.3 * ppu;
    g.fillStyle = P2.rgba(shade('#bdb3c2', -0.12), 0.7); g.beginPath(); g.ellipse(X(x), Z(z) + 0.05 * ppu, rx, ry, 0.1, 0, 7); g.fill();
    g.fillStyle = '#bdb3c2'; g.beginPath(); g.ellipse(X(x), Z(z), rx * 0.93, ry * 0.9, 0.1, 0, 7); g.fill();
  }
  drifts((x, y) => {
    if (rnd() < 0.78) { g.strokeStyle = P2.rgba(rnd() < 0.5 ? '#6f8f5a' : '#93ad63', 0.75); g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 3, y - 5 - rnd() * 5); g.stroke(); }
    else { g.fillStyle = rnd() < 0.5 ? '#fff3dc' : '#e58aa8'; for (let q = 0; q < 5; q++) { const t = q / 5 * 6.283; g.beginPath(); g.arc(x + Math.cos(t) * 2.2, y + Math.sin(t) * 2.2, 1.6, 0, 7); g.fill(); } }
  });
});

let rnd = P2.rng(101);
const between = (a, b) => a + rnd() * (b - a);
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


// =====================================================================================================================
// THE HOME. A cut-away paper house: floors, a back wall with a gable, side walls, dividers. Rooms: bedroom, kitchen,
// living room (opens at level 2); the garden in front opens at level 3. Furniture is paper cards on hinges.
// =====================================================================================================================
const THREE = H.THREE, canvas = H.renderer.domElement;
const FLOOR_Y = 0.12, WALL_H = 4.6, Z0 = -8.9, Z1 = -3.3, DEPTH = Z1 - Z0, RW = 4.2;
const ROOMS = [
  { id: 'bed', name: 'Bedroom', x0: -6.3, x1: -2.1, lvl: 1 }, { id: 'kitchen', name: 'Kitchen', x0: -2.1, x1: 2.1, lvl: 1 }, { id: 'living', name: 'Living room', x0: 2.1, x1: 6.3, lvl: 2 },
];
const GARDEN = { id: 'garden', name: 'Garden', x0: -9.5, x1: 9.5, z0: -2.4, z1: 1.6, lvl: 3 };
const LEVEL_NEED = [3, 7, 11];                 // things placed to finish level 1, 2, 3

const card = (pts, paint, seed, o = {}) => makeCard(pts, { paint, paper: H.paper, thickness: 0.1, edgeWidth: 0.06, pxPerUnit: 44, seed, back: 'mirror', folds: [], ...o });
const planks = (P, y0, y1, col, dark) => { const { box } = P, n = Math.max(3, Math.round(box.w / 0.9)); P.layer((g) => { for (let i = 1; i < n; i += 2) g.fillRect(box.x0 + i * box.w / n, y0, box.w / n, y1 - y0); }, dark, { lip: 0.4, depth: 0.4 }); };
const roomPaper = {
  bed: { base: '#d9cdf2', ink: '#b9a0ea', motif: 'star' }, kitchen: { base: '#f7e6b0', ink: '#e9c76a', motif: 'check' }, living: { base: '#f9d3de', ink: '#f2a6bf', motif: 'stripe' },
};
const wallRoom = (P, r, x0, x1, y0, y1) => {
  const p = roomPaper[r.id], reg = { x0, x1, y0, y1 };
  P.layer((g) => g.fillRect(x0, y0, x1 - x0, y1 - y0), p.base, { lip: 0.2, depth: 0.2 });
  if (p.motif === 'stripe') P.layer((g) => { for (let x = x0 + 0.3; x < x1; x += 0.7) g.fillRect(x, y0, 0.28, y1 - y0); }, p.ink, { lip: 0.3, depth: 0.3 });
  else if (p.motif === 'check') P.layer((g) => { for (let x = x0; x < x1; x += 0.6) for (let y = y0 + (((x - x0) / 0.6) % 2 ? 0 : 0.6); y < y1; y += 1.2) g.fillRect(x, y, 0.6, 0.6); }, p.ink, { lip: 0.25, depth: 0.25 });
  else P.layer((g) => { for (let x = x0 + 0.5; x < x1; x += 1.05) for (let y = y0 + 0.9; y < y1; y += 1.15) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? 0.1 : 0.24; g.lineTo(x + Math.cos(a) * k, y + Math.sin(a) * k); } g.closePath(); g.fill(); } }, p.ink, { lip: 0.4, depth: 0.4 });
  P.layer((g) => g.fillRect(x0, y0, x1 - x0, 0.45), shade(p.base, -0.16), { lip: 0.7, depth: 0.6 });          // skirting board
  return reg;
};
const house = new THREE.Group(); H.scene.add(house);
{
  const W = RW * 3, cx = 0, yTop = WALL_H;
  // back wall with a gable: wallpaper per room, a roof band above the wall
  const gable = [[-W / 2 - 0.3, 0], [W / 2 + 0.3, 0], [W / 2 + 0.3, yTop], [0, yTop + 2.7], [-W / 2 - 0.3, yTop]];
  const back = card(gable, (P) => {
    const { box } = P; P.gradient('#f2e8d6', '#ddd0bc', 0.5); P.felt(0.8);
    ROOMS.forEach((r) => wallRoom(P, r, r.x0, r.x1, 0, yTop));
    P.layer((g) => g.fillRect(box.x0 - 1, yTop - 0.12, box.w + 2, 0.5), C.trim, { lip: 0.7, depth: 0.6 });
    P.layer((g) => { g.beginPath(); g.moveTo(box.x0 - 0.1, yTop + 0.2); g.lineTo(0, yTop + 2.75); g.lineTo(box.x1 + 0.1, yTop + 0.2); g.closePath(); g.fill(); }, C.roofA, { lip: 0.8, depth: 0.7 });
    P.layer((g) => { for (let j = 0; j < 4; j++) for (let x = box.x0 + (j % 2) * 0.4; x < box.x1; x += 0.8) { g.beginPath(); g.arc(x, yTop + 0.55 + j * 0.5, 0.3, 0, Math.PI * 2); g.fill(); } }, C.roofB, { lip: 0.6, depth: 0.5 });
    P.layer((g) => { g.beginPath(); g.arc(0, yTop + 1.2, 0.55, 0, 7); g.fill(); }, C.trim, { lip: 0.8, depth: 0.7 });
    P.draw((g) => { g.fillStyle = '#ffd46a'; g.beginPath(); g.arc(0, yTop + 1.2, 0.42, 0, 7); g.fill(); });
    P.innerShade('#4a3a58', { alpha: 0.28, blurPx: 10 });
  }, 11);
  back.position.set(cx, FLOOR_Y, Z0); house.add(back);
  // side walls and the two dividers
  const wall = (x, ry, seed, rooms, w = DEPTH, h = yTop) => {
    const m = card(P2.shape.rect(w, h), (P) => { const { box } = P; P.gradient('#efe3cf', '#d8c9b2', 0.5); P.felt(0.8); wallRoom(P, rooms, box.x0, box.x1, 0, h); P.layer((g) => g.fillRect(box.x0 - 1, h - 0.14, box.w + 2, 0.5), C.trim, { lip: 0.7, depth: 0.6 }); P.innerShade('#4a3a58', { alpha: 0.25, blurPx: 8 }); }, seed);
    m.position.set(x, FLOOR_Y, (Z0 + Z1) / 2); m.rotation.y = ry; house.add(m); return m;
  };
  wall(-W / 2, Math.PI / 2, 12, ROOMS[0]); wall(W / 2, -Math.PI / 2, 13, ROOMS[2]);
  wall(ROOMS[0].x1, Math.PI / 2, 14, ROOMS[0], DEPTH, yTop * 0.78); wall(ROOMS[1].x1, Math.PI / 2, 15, ROOMS[1], DEPTH, yTop * 0.78);
  // floors, flat on the ground: wood, tiles, carpet
  const floorCard = (r, seed, painter) => { const m = card(P2.shape.rect(RW, DEPTH), painter, seed, { thickness: 0.12 }); m.rotation.x = -Math.PI / 2; m.position.set((r.x0 + r.x1) / 2, FLOOR_Y, Z1); house.add(m); return m; };
  floorCard(ROOMS[0], 21, (P) => { const { box } = P; P.gradient('#d7a877', '#c58f5e', 0.5); P.felt(0.9); P.layer((g) => { for (let k = 1; k < 8; k++) g.fillRect(box.x0, box.y0 + k * box.h / 8, box.w, 0.06); }, '#a8683a', { lip: 0.3, depth: 0.3 }); });
  floorCard(ROOMS[1], 22, (P) => { const { box } = P; P.fill('#f4efe4'); P.layer((g) => { for (let x = box.x0; x < box.x1; x += 0.7) for (let y = box.y0 + (((x - box.x0) / 0.7) % 2 ? 0 : 0.7); y < box.y1; y += 1.4) g.fillRect(x, y, 0.7, 0.7); }, '#7aa7b8', { lip: 0.3, depth: 0.3 }); });
  floorCard(ROOMS[2], 23, (P) => { const { box } = P; P.gradient('#e9a8bf', '#d78aa6', 0.5); P.felt(1); P.marks('dot', { color: '#fff0f4', alpha: 0.5, size: 0.05, density: 0.5 }); });
}
// locked living room: a paper panel stands across its front until level 2
const cover = (() => {
  const pts = P2.shape.rect(RW, 3.6), pr = (P) => { const { box } = P; P.gradient('#9886c4', '#6a5a98', 0.5); P.felt(0.9);
    P.layer((g) => { g.beginPath(); g.arc(0, 1.6, 0.55, Math.PI, 0); g.lineTo(0.55, 1.2); g.lineTo(-0.55, 1.2); g.closePath(); g.lineWidth = 0.16; g.strokeStyle = '#fff3da'; g.stroke(); }, '#fff3da', { lip: 0.6, depth: 0.5 });
    P.layer((g) => g.fillRect(-0.7, 0.55, 1.4, 1.1), '#f0b429', { lip: 0.7, depth: 0.7 });
    P.layer((g) => { g.beginPath(); g.arc(0, 1.15, 0.12, 0, 7); g.fill(); g.fillRect(-0.05, 0.8, 0.1, 0.35); }, '#6a5a98', { lip: 0.4, depth: 0.4 });
    P.layer((g) => g.fillRect(box.x0 - 1, box.y1 - 0.6, box.w + 2, 0.18), '#fff3da', { lip: 0.5, depth: 0.4 }); P.innerShade('#2a1a48', { alpha: 0.3, blurPx: 8 }); };
  return popup(pts, pr, { x: (ROOMS[2].x0 + ROOMS[2].x1) / 2, z: Z1 + 0.15, yaw: 0, scale: 1, sway: 0 });
})();
const gardenSign = (() => {   // "level 3" sign on the lawn
  const pts = P2.shape.rect(3.6, 1.7), pr = (P) => { P.gradient('#fff6e4', '#e8c9a0', 0.5); P.felt(0.8); P.layer((g) => { g.beginPath(); g.arc(0, 0.95, 0.38, Math.PI, 0); g.lineTo(0.38, 0.6); g.lineTo(-0.38, 0.6); g.closePath(); g.lineWidth = 0.1; g.strokeStyle = '#6a5a98'; g.stroke(); }, '#6a5a98', { lip: 0.4, depth: 0.4 }); P.layer((g) => g.fillRect(-0.5, 0.2, 1, 0.7), '#f0b429', { lip: 0.6, depth: 0.6 }); P.innerShade('#8a5a10', { alpha: 0.3, blurPx: 6 }); };
  return popup(pts, pr, { x: 0, z: 0.6, yaw: 0, scale: 1, sway: 0 });
})();

// ---- the shop: furniture drawn as paper pieces (each a function of its colour) -----------------------------------------
const PALETTE = ['#e8604c', '#f2a6bf', '#8c70d2', '#5d80b3', '#f0b429', '#7da36d'];
const WOOD = '#8a5a44';
const ITEMS = {
  bed: { name: 'Bed', price: 15, lvl: 1, w: 3.6, h: 2.1, draw: (g, k, c) => { g.fillStyle = k(WOOD); D.rect(g, -1.8, 0, 3.6, 0.5, 0.1); D.rect(g, -1.8, 0, 0.3, 2.0, 0.1); D.rect(g, 1.5, 0, 0.3, 1.15, 0.08); g.fillStyle = k(c); D.rect(g, -1.5, 0.5, 3.0, 0.6, 0.2); g.fillStyle = k('#fff3da'); D.ell(g, -0.98, 1.24, 0.5, 0.22); g.fillStyle = k(shade(c, -0.18)); D.rect(g, -0.35, 0.52, 1.85, 0.66, 0.2); } },
  wardrobe: { name: 'Wardrobe', price: 15, lvl: 1, w: 2.4, h: 3.7, draw: (g, k, c) => { g.fillStyle = k('#b98a6a'); D.rect(g, -1.2, 0, 2.4, 3.6, 0.12); g.fillStyle = k(c); D.rect(g, -1.08, 0.15, 1.0, 3.3, 0.08); D.rect(g, 0.08, 0.15, 1.0, 3.3, 0.08); g.fillStyle = k('#f0b429'); D.ell(g, -0.2, 1.8, 0.08, 0.08); D.ell(g, 0.2, 1.8, 0.08, 0.08); } },
  lamp: { name: 'Lamp', price: 5, lvl: 1, w: 1.4, h: 3.2, draw: (g, k, c) => { g.fillStyle = k('#6a5a98'); D.rect(g, -0.4, 0, 0.8, 0.16, 0.06); D.rect(g, -0.05, 0.1, 0.1, 2.0); g.fillStyle = k(c); D.poly(g, [[-0.65, 2.0], [0.65, 2.0], [0.4, 3.1], [-0.4, 3.1]]); } },
  table: { name: 'Table', price: 10, lvl: 1, w: 2.8, h: 1.7, draw: (g, k, c) => { g.fillStyle = k(WOOD); D.rect(g, -1.1, 0, 0.18, 1.1); D.rect(g, 0.92, 0, 0.18, 1.1); g.fillStyle = k(c); D.rect(g, -1.4, 1.05, 2.8, 0.3, 0.08); g.fillStyle = k('#fff3da'); D.ell(g, 0.2, 1.42, 0.3, 0.13); } },
  chair: { name: 'Chair', price: 5, lvl: 1, w: 1.3, h: 2.2, draw: (g, k, c) => { g.fillStyle = k(WOOD); D.rect(g, -0.5, 0, 0.12, 0.9); D.rect(g, 0.38, 0, 0.12, 0.9); g.fillStyle = k(c); D.rect(g, -0.6, 0.85, 1.2, 0.22, 0.06); D.rect(g, -0.6, 0.85, 0.2, 1.3, 0.06); } },
  fridge: { name: 'Fridge', price: 15, lvl: 1, w: 2.0, h: 3.7, draw: (g, k, c) => { g.fillStyle = k(c); D.rect(g, -1, 0, 2.0, 3.6, 0.2); g.fillStyle = k(shade(c, -0.25), 'print'); D.rect(g, -1, 2.3, 2.0, 0.07); g.fillStyle = k('#fff3da'); D.rect(g, 0.55, 2.5, 0.12, 0.7, 0.04); D.rect(g, 0.55, 1.2, 0.12, 0.8, 0.04); } },
  stove: { name: 'Stove', price: 15, lvl: 1, w: 2.2, h: 2.4, draw: (g, k, c) => { g.fillStyle = k('#d9d2e0'); D.rect(g, -1.1, 0, 2.2, 2.1, 0.1); g.fillStyle = k(c); D.rect(g, -1.1, 2.0, 2.2, 0.32, 0.06); g.fillStyle = k('#3a2a3c'); D.rect(g, -0.78, 0.3, 1.56, 1.0, 0.1); g.fillStyle = k('#fff3da'); for (const x of [-0.6, -0.2, 0.2, 0.6]) D.ell(g, x, 1.65, 0.1, 0.1); } },
  sofa: { name: 'Sofa', price: 20, lvl: 2, w: 3.8, h: 2.2, draw: (g, k, c) => { g.fillStyle = k('#6c4a3d'); D.rect(g, -1.7, 0, 0.22, 0.34); D.rect(g, 1.48, 0, 0.22, 0.34); g.fillStyle = k(shade(c, -0.12)); D.rect(g, -1.9, 0.5, 3.8, 1.6, 0.4); g.fillStyle = k(c); D.rect(g, -1.55, 0.3, 3.1, 0.85, 0.28); g.fillStyle = k(shade(c, -0.06)); D.rect(g, -1.9, 0.25, 0.6, 1.3, 0.28); D.rect(g, 1.3, 0.25, 0.6, 1.3, 0.28); g.fillStyle = k('#fff3da'); D.ell(g, -0.6, 1.35, 0.3, 0.3); } },
  tv: { name: 'TV', price: 20, lvl: 2, w: 2.8, h: 2.3, draw: (g, k, c) => { g.fillStyle = k(WOOD); D.rect(g, -1.1, 0, 2.2, 0.7, 0.06); g.fillStyle = k('#2a2a3c'); D.rect(g, -1.3, 0.7, 2.6, 1.55, 0.1); g.fillStyle = k(c); D.rect(g, -1.17, 0.83, 2.34, 1.29, 0.06); g.fillStyle = k('#fff3da'); D.ell(g, 0.4, 1.55, 0.25, 0.25); } },
  plant: { name: 'Plant', price: 5, lvl: 2, w: 1.6, h: 2.8, draw: (g, k, c) => { g.fillStyle = k(c); D.poly(g, [[-0.5, 0.8], [0.5, 0.8], [0.34, 0], [-0.34, 0]]); g.fillStyle = k('#7da36d'); D.ell(g, -0.38, 1.4, 0.3, 0.72, 0.5); D.ell(g, 0.38, 1.4, 0.3, 0.72, -0.5); D.ell(g, 0, 1.7, 0.28, 0.8, 0); g.fillStyle = k('#4f8b78'); D.ell(g, 0, 1.3, 0.14, 0.6, 0); } },
  shelf: { name: 'Bookshelf', price: 10, lvl: 2, w: 2.4, h: 3.1, draw: (g, k, c) => { g.fillStyle = k('#a8683a'); D.rect(g, -1.2, 0, 2.4, 3.0, 0.06); g.fillStyle = k(WOOD); D.rect(g, -1.1, 0.95, 2.2, 0.12); D.rect(g, -1.1, 1.9, 2.2, 0.12); g.fillStyle = k(c); for (let i = 0; i < 4; i++) D.rect(g, -0.9 + i * 0.5, 1.07, 0.3, 0.7, 0.03); g.fillStyle = k('#fff3da'); for (let i = 0; i < 4; i++) D.rect(g, -0.9 + i * 0.5, 2.02, 0.3, 0.7, 0.03); } },
  flowers: { name: 'Flowers', price: 5, lvl: 3, w: 2.8, h: 1.7, draw: (g, k, c) => { g.fillStyle = k('#7da36d'); D.ell(g, 0, 0.42, 1.2, 0.36); for (const x of [-0.7, 0, 0.7]) D.rect(g, x - 0.04, 0.5, 0.08, 0.7); g.fillStyle = k(c); for (const [x, y] of [[-0.7, 1.0], [0, 1.2], [0.7, 0.95]]) D.ell(g, x, y, 0.24, 0.24); g.fillStyle = k('#fff3da'); for (const [x, y] of [[-0.7, 1.0], [0, 1.2], [0.7, 0.95]]) D.ell(g, x, y, 0.08, 0.08); } },
  car: { name: 'Car', price: 40, lvl: 3, w: 4.4, h: 2.2, draw: (g, k, c) => { g.fillStyle = k(c); D.rect(g, -2.1, 0.5, 4.2, 0.85, 0.32); D.poly(g, [[-1.1, 1.3], [1.1, 1.3], [0.7, 2.05], [-0.8, 2.05]]); g.fillStyle = k('#cfe6f2'); D.poly(g, [[-0.85, 1.4], [-0.05, 1.4], [-0.05, 1.9], [-0.6, 1.9]]); D.poly(g, [[0.1, 1.4], [0.9, 1.4], [0.6, 1.9], [0.1, 1.9]]); g.fillStyle = k('#3a2a3c'); D.ell(g, -1.3, 0.5, 0.5, 0.5); D.ell(g, 1.3, 0.5, 0.5, 0.5); g.fillStyle = k('#fff3da'); D.ell(g, -1.3, 0.5, 0.2, 0.2); D.ell(g, 1.3, 0.5, 0.2, 0.2); g.fillStyle = k('#ffd46a'); D.ell(g, 2.0, 0.85, 0.14, 0.14); } },
  kitten: { name: 'Kitten', price: 25, lvl: 3, w: 2.2, h: 2.3, pet: true },
};
const ORDER = Object.keys(ITEMS);
const itemPiece = (id, c) => { const it = ITEMS[id]; if (it.pet) { const [pts, paint] = EX.critter.cat(2.0, { coat: c, pale: '#fff1dc' }); return [pts, paint]; } return P2.drawnPiece((g, k) => it.draw(g, k, c), { w: it.w, h: it.h, name: it.name }); };

// ---- state, saved on this device only -------------------------------------------------------------------------------------
const KEY = 'paperhome.v1' + (NAME ? '.' + NAME.toLowerCase() : '');
let state = { coins: 40, level: 1, items: [], nextId: 1 };
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && Array.isArray(s.items)) state = { ...state, ...s }; } catch (e) { /* storage blocked: play without saving */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ coins: state.coins, level: state.level, nextId: state.nextId, items: state.items.map(({ id, kind, x, z, yaw, col }) => ({ id, kind, x, z, yaw, col })) })); } catch (e) { /* ignore */ } };
const placed = new Map();     // id -> { data, h }
const unlockedRoom = (r) => state.level >= r.lvl;
const zoneAt = (x, z) => {
  for (const r of ROOMS) if (x > r.x0 + 0.5 && x < r.x1 - 0.5 && z > Z0 + 0.6 && z < Z1 - 0.2) return unlockedRoom(r) ? { ok: true, r, y: FLOOR_Y } : { ok: false, why: r.name + ' opens at level ' + r.lvl };
  if (x > GARDEN.x0 && x < GARDEN.x1 && z > GARDEN.z0 && z < GARDEN.z1) return state.level >= GARDEN.lvl ? { ok: true, r: GARDEN, y: 0.02 } : { ok: false, why: 'The garden opens at level ' + GARDEN.lvl };
  return { ok: false, why: 'Tap inside a room to put it down' };
};
function spawn(d, rise = true) {
  const [pts, paint] = itemPiece(d.kind, d.col), z = zoneAt(d.x, d.z);
  const h = popup(pts, paint, { x: d.x, z: d.z, yaw: d.yaw, scale: 1.2, sway: 0 });
  h.group.position.y = z.y ?? FLOOR_Y; h.order = 9 + d.z * 0.01;
  if (rise) { h.reset(0); h.set(1, 0); }
  placed.set(d.id, { d, h }); return h;
}
function unspawn(id) { const p = placed.get(id); if (!p) return; const i = H.hinges.indexOf(p.h); if (i >= 0) H.hinges.splice(i, 1); H.scene.remove(p.h.group); placed.delete(id); }

// ---- the little world round the house ------------------------------------------------------------------------------------
{
  rnd = P2.rng(202);
  for (const [x, z, s] of [[-10.6, -9.5, 1.15], [10.8, -10, 1.2], [-4.5, -12.5, 1.3], [4.5, -13.2, 1.25]]) popup(...blossomTree(), { x, z, cross: true, sway: 0.8, scale: s });
  for (const [x, z, y] of [[-11.8, -4.2, 0.2], [11.8, -4.5, -0.2]]) hedge(x, z, { yaw: y, long: true });
  for (const [x, z] of [[-13.5, -1], [13.5, -0.5], [-8, 6.5], [9, 6.8], [-14, -7], [14, -8]]) { const k = ['tuft', 'flowers', 'lavender', 'rock'][Math.floor(rnd() * 4)]; popup(...K[k](), { x, z, yaw: (rnd() - 0.5) * 0.6, sway: k === 'rock' ? 0 : 0.6 }); }
  popup(...K.lantern(), { x: pathX(2.2) + 2.8, z: 2.6, scale: 1.2 }); popup(...K.mailbox(), { x: pathX(5.2) - 3.4, z: 4.6, yaw: 0.3, scale: 1.2 });
  const [cp, cpaint] = EX.critter.cat(1.9, { coat: '#d8964a', pale: '#fff1dc' });
  H.setHero(popup(cp, cpaint, { x: 7.6, z: 1.2 }), { turn: 'flip' });
}
if (!flags.TEST) {
  const life = createLife({ scene: H.scene, camera: H.camera, heroHeight: H.heroHeight, seed: 41, wind: [0.94, 0.34] });
  life.fallers({ count: 50, cut: 'petal', colors: [C.blossomA, C.blossomB, C.blossomC, '#fff0f4'], size: [0.2, 0.3], land: 9 });
  life.flock({ size: 4, height: 3.6, colors: ['#fff6ea', '#efe7da'] });
  life.cloudShadows({ count: 3 });
  life.reset(H.target); H.onStep((t, dt) => life.update(dt, H.target)); H.onRestart(() => life.reset(H.target));
}

// ---- the game: coins from golden stars, a shop, placing, levels ---------------------------------------------------------------
if (!flags.TEST) {
  window.__papercraftNoFold = true;
  const starPts = (R, r) => { const p = []; for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? r : R; p.push([Math.cos(a) * k, 1.1 + Math.sin(a) * k]); } return p; };
  const paintStar = (P) => { const { box } = P, cx = (box.x0 + box.x1) / 2, cy = (box.y0 + box.y1) / 2; P.gradient('#ffe27a', '#f0b429', 0.4); P.felt(0.8);
    P.layer((g) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, k = (i % 2 ? 0.26 : 0.55) * box.w / 1.04; g.lineTo(cx + Math.cos(a) * k, cy + Math.sin(a) * k); } g.closePath(); g.fill(); }, '#fff2b8', { lip: 0.8, depth: 0.7 });
    P.layer((g) => { g.beginPath(); g.arc(cx, cy, box.w * 0.1, 0, 7); g.fill(); }, '#e8604c', { lip: 0.7, depth: 0.6 }); P.glow((gc) => { gc.beginPath(); gc.arc(cx, cy, box.w * 0.2, 0, 7); gc.fill(); }); P.innerShade('#8a5a10', { alpha: 0.3, blurPx: 6 }); };
  const STAR_SPOTS = [[-8, 0.6], [-4, 1.2], [0, 0.4], [4, 1.3], [8, 0.2], [-6, -1.4], [6, -1.4]];
  const stars = [0, 1, 2].map(() => ({ h: popup(starPts(0.95, 0.4), paintStar, { x: 0, z: 0, cross: true, sway: 0.4, scale: 1.2 }), alive: false, t: 0, wait: Math.random() * 2 + 0.5, x: 0, z: 0 }));
  const placeStar = (s) => { const occupied = stars.filter((q) => q.alive).map((q) => q.x); const spots = STAR_SPOTS.filter((p) => !occupied.includes(p[0])); const p = spots[Math.floor(Math.random() * spots.length)]; s.x = p[0]; s.z = p[1]; s.h.group.position.set(p[0], 0.02, p[1]); s.h.group.rotation.y = 0; s.h.group.visible = true; s.h.reset(0); s.h.set(1, 0); s.alive = true; s.t = 0; };
  stars.forEach((s) => { s.h.group.visible = false; });
  H.onStep((t, dt) => stars.forEach((s) => {
    if (!s.alive) { if (s.wait > 0) { s.wait -= dt; if (s.wait <= 0) placeStar(s); } else if (s.t < 1) { s.t = Math.min(1, s.t + dt * 1.8); s.h.group.position.y = 0.02 + s.t * 3.2; s.h.group.rotation.y += dt * 9; if (s.t >= 1) { s.h.group.visible = false; s.wait = 2.5 + Math.random() * 2; } } }
  }));

  // ---- the page: coins, level, shop, toolbar ----
  const el = (h, c, p = document.body) => { const d = document.createElement('div'); if (c) d.className = c; if (h) d.innerHTML = h; p.appendChild(d); return d; };
  const hud = el('<div class="t"></div><div class="row"><span class="coin"><i></i><b id="coins">0</b></span><span class="lvl" id="lvl"></span></div><div class="bar"><u id="bar"></u></div><div class="m" id="mission"></div>', null); hud.id = 'hud';
  const toast = el('', null); toast.id = 'toast';
  const bar = el('', null); bar.id = 'shop';
  const tools = el('<button data-a="colour">Colour</button><button data-a="turn">Turn</button><button data-a="move">Move</button><button data-a="away">Put away</button><button data-a="done" class="ok">Done</button>', null); tools.id = 'tools'; tools.hidden = true;
  const cancel = el('<span>Tap a room to put it down</span><button id="cancel">Cancel</button>', null); cancel.id = 'cancelbar'; cancel.hidden = true;
  const win = el('<div class="card"><h1 id="wt"></h1><p id="wp"></p><button id="wok" type="button">Keep decorating</button></div>', null); win.id = 'win'; win.hidden = true;
  const style = document.createElement('style');
  style.textContent = `body{font-family:Georgia,'Times New Roman',serif}
#hud{position:fixed;left:14px;top:14px;display:flex;flex-direction:column;gap:7px;color:#4a3a58;max-width:calc(100% - 28px);width:330px}
#hud .t{background:#fff6e4;border:2px solid #e8c9a0;border-radius:14px;padding:7px 14px;font-weight:700;font-size:clamp(17px,2.6vw,24px);box-shadow:0 3px 0 #d9b98c}
#hud .row{display:flex;gap:10px;align-items:center}#hud .coin,#hud .lvl{background:#fff6e4;border:2px solid #e8c9a0;border-radius:14px;padding:6px 12px;font-weight:700;font-size:clamp(16px,2.4vw,22px);box-shadow:0 3px 0 #d9b98c;display:flex;align-items:center;gap:8px}
#hud .coin i{width:20px;height:20px;border-radius:50%;background:#f0b429;border:3px solid #d99a1c;display:block}
#hud .bar{height:12px;background:#fff6e4;border:2px solid #e8c9a0;border-radius:8px;overflow:hidden}#hud .bar u{display:block;height:100%;width:0;background:#f2a6bf;transition:width .4s}
#hud .m{font-style:italic;font-size:clamp(13px,1.9vw,16px);color:#fffaf0;text-shadow:0 1px 3px #4a3a58}
#toast{position:fixed;left:50%;top:18px;transform:translateX(-50%);background:#fff6e4;border:2px solid #e8c9a0;border-radius:14px;padding:8px 16px;font-weight:700;font-size:clamp(15px,2.2vw,20px);color:#4a3a58;box-shadow:0 3px 0 #d9b98c;opacity:0;transition:opacity .25s;pointer-events:none;text-align:center;max-width:calc(100% - 30px)}#toast.on{opacity:1}
#shop{position:fixed;left:0;right:0;bottom:0;display:flex;gap:8px;padding:10px 12px 14px;overflow-x:auto;background:linear-gradient(transparent,rgba(74,58,88,.25) 35%);-webkit-overflow-scrolling:touch}
#shop button{flex:none;width:88px;min-height:92px;border-radius:16px;border:2px solid #e8c9a0;background:#fff6e4;color:#4a3a58;font:700 14px Georgia,serif;box-shadow:0 3px 0 #d9b98c;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:6px 4px}
#shop button canvas{width:60px;height:46px}#shop button small{font-weight:700;font-size:13px}
#shop button.lock{opacity:.55;filter:grayscale(.6)}#shop button.poor{opacity:.7}#shop button.sel{border-color:#d1578b;box-shadow:0 0 0 3px #f2a6bf}
#tools{position:fixed;left:50%;bottom:118px;transform:translateX(-50%);display:flex;gap:8px;flex-wrap:wrap;justify-content:center;max-width:calc(100% - 20px)}
#tools button,#cancelbar button,#win button{font:700 clamp(15px,2.2vw,19px) Georgia,serif;min-height:48px;padding:6px 16px;border-radius:14px;border:2px solid #d9b98c;background:#f2a6bf;color:#4a3a58;box-shadow:0 3px 0 #c78aa2;cursor:pointer}
#tools button.ok{background:#fff6e4}
#cancelbar{position:fixed;left:50%;bottom:118px;transform:translateX(-50%);display:flex;gap:10px;align-items:center;background:#fff6e4;border:2px solid #e8c9a0;border-radius:14px;padding:6px 10px 6px 16px;font-weight:700;color:#4a3a58;box-shadow:0 3px 0 #d9b98c}
#tools[hidden],#cancelbar[hidden],#win[hidden]{display:none}
#win{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(74,58,88,.35)}
#win .card{background:#fff6e4;border:3px solid #e8c9a0;border-radius:22px;padding:26px 34px;text-align:center;color:#4a3a58;box-shadow:0 6px 0 #d9b98c;animation:pop .6s cubic-bezier(.2,1.4,.4,1);max-width:calc(100% - 30px)}
#win h1{margin:0 0 6px;font-size:clamp(24px,5vw,38px)}#win p{margin:0 0 16px;font-size:clamp(16px,3vw,21px)}
.bit{position:fixed;top:-20px;width:14px;height:20px;border-radius:50% 50% 50% 0;animation:fall linear forwards;pointer-events:none}@keyframes fall{to{transform:translateY(110vh) rotate(540deg)}}
@keyframes pop{0%{transform:scale(.6);opacity:0}100%{transform:scale(1);opacity:1}}
@media (prefers-reduced-motion:reduce){#win .card,.bit{animation:none}}`;
  document.head.appendChild(style);
  hud.querySelector('.t').textContent = (NAME ? NAME + "'s" : 'My') + ' paper home';

  let holding = null, selected = null, toastT = 0;   // holding: { kind, col, price, moving?: id }
  const say = (t) => { toast.textContent = t; toast.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('on'), 2200); };
  const confetti = () => { for (let i = 0; i < 40; i++) { const b = el('', 'bit'); b.style.left = Math.random() * 100 + 'vw'; b.style.background = ['#f2a6bf', '#fbdbe5', '#d1578b', '#f0b429', '#8c70d2'][i % 5]; b.style.animationDuration = 2.5 + Math.random() * 2.5 + 's'; b.style.animationDelay = Math.random() * 1.2 + 's'; setTimeout(() => b.remove(), 7000); } };
  const icon = (id, w = 64, h = 54) => { const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2; const g = c.getContext('2d'), it = ITEMS[id], [pts] = itemPiece(id, PALETTE[0]); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; pts.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
    const k = Math.min((w * 2 - 8) / (x1 - x0), (h * 2 - 8) / (y1 - y0)); g.translate(w - (x0 + x1) / 2 * k, h * 2 - 4 + y0 * k); g.scale(k, -k); g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fillStyle = PALETTE[ORDER.indexOf(id) % PALETTE.length]; g.fill(); g.lineWidth = 0.06; g.strokeStyle = '#6c4a3d'; g.stroke(); void it; return c; };
  const icons = Object.fromEntries(ORDER.map((id) => [id, icon(id)]));
  const refresh = () => {
    hud.querySelector('#coins').textContent = state.coins;
    hud.querySelector('#lvl').textContent = 'Level ' + state.level;
    const need = LEVEL_NEED[Math.min(state.level, 3) - 1], prev = state.level > 1 ? LEVEL_NEED[state.level - 2] : 0, n = state.items.length;
    hud.querySelector('#bar').style.width = (state.level >= 3 && n >= need ? 100 : Math.max(0, Math.min(100, (n - prev) / (need - prev) * 100))) + '%';
    hud.querySelector('#mission').textContent = state.level >= 3 && n >= need ? 'House complete! Keep decorating.' : 'Put ' + Math.max(0, need - n) + ' more things in your home to reach level ' + (state.level + 1) + (state.level === 1 ? ' (opens the living room)' : state.level === 2 ? ' (opens the garden)' : '');
    bar.innerHTML = '';
    ORDER.forEach((id) => { const it = ITEMS[id], b = document.createElement('button'), locked = state.level < it.lvl, poor = !locked && state.coins < it.price;
      b.className = (locked ? 'lock ' : '') + (poor ? 'poor ' : '') + (holding && holding.kind === id ? 'sel' : ''); b.appendChild(icons[id].cloneNode ? (() => { const c = document.createElement('canvas'); c.width = icons[id].width; c.height = icons[id].height; c.getContext('2d').drawImage(icons[id], 0, 0); return c; })() : icons[id]);
      b.insertAdjacentHTML('beforeend', '<span>' + it.name + '</span><small>' + (locked ? 'Level ' + it.lvl : it.price + ' coins') + '</small>');
      b.addEventListener('click', () => { if (locked) return say(it.name + ' opens at level ' + it.lvl); if (poor) return say('Collect golden stars for more coins'); select(null); holding = { kind: id, col: PALETTE[Math.floor(Math.random() * PALETTE.length)], price: it.price }; cancel.hidden = false; tools.hidden = true; refresh(); });
      bar.appendChild(b); });
  };
  const mark = (id) => { /* a gentle bounce marks the selected piece */ };
  function select(id) { selected = id; tools.hidden = id == null; void mark; }
  const afterPlace = () => {
    save();
    const need = LEVEL_NEED[Math.min(state.level, 3) - 1];
    if (state.level < 3 && state.items.length >= need) {
      state.level++; state.coins += 25; save();
      if (state.level === 2) cover.set(0, 0);
      if (state.level === 3) { gardenSign.set(0, 0); }
      const msg = state.level === 2 ? ['Level 2!', 'The living room is open, with new things to buy. +25 coins'] : ['Level 3!', 'The garden is open: flowers, a car and a kitten. +25 coins'];
      win.querySelector('#wt').textContent = msg[0]; win.querySelector('#wp').textContent = msg[1]; win.hidden = false; confetti();
    }
    refresh();
  };
  win.querySelector('#wok').addEventListener('click', () => { win.hidden = true; });
  cancel.querySelector('#cancel').addEventListener('click', () => { if (holding && holding.moving) { /* put the piece back where it was */ spawn(holding.old); state.items.push(holding.old); } holding = null; cancel.hidden = true; refresh(); save(); });
  tools.addEventListener('click', (e) => {
    const a = e.target.dataset && e.target.dataset.a; if (!a || selected == null) return;
    const p = placed.get(selected); if (!p) return; const d = p.d;
    if (a === 'colour') { d.col = PALETTE[(PALETTE.indexOf(d.col) + 1) % PALETTE.length]; const keep = d; unspawn(d.id); spawn(keep, false).reset(1); }
    else if (a === 'turn') { d.yaw = d.yaw === 0 ? 0.5 : d.yaw > 0 ? -0.5 : 0; p.h.group.rotation.y = d.yaw; }
    else if (a === 'move') { holding = { kind: d.kind, col: d.col, price: 0, moving: true, old: { ...d } }; state.items = state.items.filter((q) => q.id !== d.id); unspawn(d.id); select(null); cancel.hidden = false; }
    else if (a === 'away') { state.coins += Math.floor(ITEMS[d.kind].price / 2); state.items = state.items.filter((q) => q.id !== d.id); unspawn(d.id); select(null); say('Put away: +' + Math.floor(ITEMS[d.kind].price / 2) + ' coins'); }
    else if (a === 'done') select(null);
    save(); refresh();
  });
  // tapping the world
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -FLOOR_Y), pt = new THREE.Vector3(), v3 = new THREE.Vector3(); let down = null;
  const groundAt = (cx, cy) => { const r = canvas.getBoundingClientRect(); ray.setFromCamera(new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), H.camera); return ray.ray.intersectPlane(plane, pt) ? pt.clone() : null; };
  const screen = (x, y, z) => { const r = canvas.getBoundingClientRect(); v3.set(x, y, z).project(H.camera); return [r.left + (v3.x * 0.5 + 0.5) * r.width, r.top + (-v3.y * 0.5 + 0.5) * r.height, r]; };
  canvas.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  addEventListener('pointerup', (e) => {
    if (!down || e.target !== canvas) { down = null; return; }
    const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]); down = null; if (moved > 12) return;
    if (holding) {
      const p = groundAt(e.clientX, e.clientY); if (!p) return; const z = zoneAt(p.x, p.z);
      if (!z.ok) return say(z.why);
      const d = holding.moving ? { ...holding.old, x: p.x, z: p.z } : { id: state.nextId++, kind: holding.kind, x: p.x, z: p.z, yaw: 0, col: holding.col };
      if (!holding.moving) state.coins -= holding.price;
      state.items.push(d); spawn(d); const done = holding; holding = null; cancel.hidden = true; void done; afterPlace(); return;
    }
    // golden stars first
    for (const s of stars) { if (!s.alive) continue; const [sx, sy, r] = screen(s.x, 1.4, s.z), lim = Math.max(60, Math.min(r.width, r.height) * 0.09); if (Math.hypot(sx - e.clientX, sy - e.clientY) < lim) { s.alive = false; s.t = 0; s.wait = 0; state.coins += 5; save(); refresh(); return; } }
    // then a placed piece
    let best = null, bd = 1e9; for (const [id, p] of placed) { const it = ITEMS[p.d.kind], [sx, sy, r] = screen(p.d.x, p.h.group.position.y + it.h * 0.5, p.d.z), dd = Math.hypot(sx - e.clientX, sy - e.clientY), lim = Math.max(46, Math.min(r.width, r.height) * 0.07); if (dd < lim && dd < bd) { bd = dd; best = id; } }
    select(best); if (best != null) say(ITEMS[placed.get(best).d.kind].name);
  });
  // restore the saved home
  state.items.forEach((d) => spawn(d, true));
  if (state.level >= 2) cover.set(0, 0); if (state.level >= 3) gardenSign.set(0, 0);
  refresh();
  window.GAME = { state, placed, ITEMS, zoneAt, ROOMS, spawn, afterPlace, stars, refresh, get holding() { return holding; }, buy: (kind, x, z) => { const it = ITEMS[kind]; if (state.coins < it.price || state.level < it.lvl) return false; const zz = zoneAt(x, z); if (!zz.ok) return false; state.coins -= it.price; const d = { id: state.nextId++, kind, x, z, yaw: 0, col: PALETTE[0] }; state.items.push(d); spawn(d); afterPlace(); return true; } };
}

H.start();
