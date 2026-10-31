// Brick Builder: type what to build, it is assembled brick by brick in 3D.
// Units: 1 stud = 1 unit across; height in plates (1 plate = 0.4 units, 1 brick = 3 plates).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const PLATE = 0.4, GAP = 0.03, STUD_R = 0.3, STUD_H = 0.17;
const COLORS = {
  red: '#c91a09', blue: '#0055bf', yellow: '#f2cd37', green: '#237841', lime: '#a5ca18', white: '#f4f4f4', black: '#1b2a34',
  orange: '#fe8a18', purple: '#81007b', pink: '#e4adc8', grey: '#a0a5a9', gray: '#a0a5a9', darkgrey: '#6c6e68', brown: '#583927',
  tan: '#e4cd9e', 'dark blue': '#0a3463', 'dark red': '#720e0f', 'dark green': '#184632', azure: '#36aebf', gold: '#dbac34', silver: '#a5a9b4',
  glass: '#9fd3f5', trunk: '#583927', leaf: '#237841',
};
const NAMES = Object.keys(COLORS).filter((c) => !['glass', 'trunk', 'leaf', 'gray'].includes(c));

// —— a tiny seeded random, so the same words always give the same build ——
const hashStr = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// —— the builder: generators push parts into a list ——
// b(x, z, y, w, d, h, color, opts): a w×d brick (studs) whose min corner is (x, z), bottom at y plates, h plates tall
function kit() {
  const parts = [];
  const b = (x, z, y, w, d, h, color, o = {}) => parts.push({ kind: o.kind || 'brick', x, z, y, w, d, h, color, studs: o.studs !== false, dir: o.dir || 0 });
  const slope = (x, z, y, w, d, color, dir) => parts.push({ kind: 'slope', x, z, y, w, d, h: 3, color, studs: true, dir });
  const wheel = (x, z, y, r, color = 'black', axis = 'x') => parts.push({ kind: 'wheel', x, z, y, w: 1, d: r * 2, h: r * 2 / PLATE, r, color, axis });
  const round = (x, z, y, h, color) => parts.push({ kind: 'round', x, z, y, w: 1, d: 1, h, color, studs: true });
  return { parts, b, slope, wheel, round };
}

const G = {};
G.car = (o) => {
  const k = kit(), c = o.color, L = o.big ? 12 : o.small ? 8 : 10, W = 4;
  k.b(0, 0, 2, L, W, 1, 'darkgrey', { studs: false });                       // chassis plate
  for (const x of [1.5, L - 2.5]) for (const z of [-0.2, W - 0.8]) k.wheel(x + 0.5, z + 0.5, 0, 1.1);
  k.b(0, 0, 3, 3, W, 3, c); k.b(L - 2, 0, 3, 2, W, 3, c);                   // bonnet, boot
  k.b(3, 0, 3, L - 5, 1, 3, c); k.b(3, W - 1, 3, L - 5, 1, 3, c);          // doors
  k.b(-0.0, 1, 4.2, 0.4, 2, 1.2, 'white', { studs: false, kind: 'light' });
  k.b(3, 0, 6, 1, W, 3, 'glass', { studs: false });                          // windscreen
  k.b(4, 0, 6, L - 7, 1, 3, 'glass', { studs: false }); k.b(4, W - 1, 6, L - 7, 1, 3, 'glass', { studs: false });
  k.b(3, 0, 9, L - 5, W, 1, c);                                              // roof
  k.b(L - 3, 0, 6, 1, W, 3, c);
  if (o.word === 'police') { k.b(5, 1, 10, 1, 1, 1, 'blue'); k.b(6, 2, 10, 1, 1, 1, 'red'); }
  return k.parts;
};
G.truck = (o) => {
  const k = kit(), c = o.color, L = o.big ? 16 : 14, W = 5, fire = o.word === 'fire';
  k.b(0, 0, 2, L, W, 1, 'darkgrey', { studs: false });
  for (const x of [2, L - 5, L - 3]) for (const z of [-0.2, W - 0.8]) k.wheel(x + 0.5, z + 0.5, 0, 1.2);
  k.b(0, 0, 3, 4, W, 6, c); k.b(0, 0, 9, 4, W, 3, 'glass', { studs: false }); k.b(0, 0, 12, 4, W, 1, c);   // cab
  k.b(0, 1, 4, 0.4, 3, 1.2, 'white', { studs: false, kind: 'light' });
  if (fire) {
    k.b(4, 0, 3, L - 4, W, 6, c); k.b(5, 1, 9, L - 6, 3, 1, 'darkgrey');
    for (let i = 0; i < L - 6; i += 1) k.b(5 + i, 1.5, 10, 1, 2, 1, i % 2 ? 'white' : 'silver');           // ladder
    k.b(1, 2, 13, 1, 1, 1, 'blue'); k.b(2, 2, 13, 1, 1, 1, 'red');
  } else {
    k.b(4, 0, 3, 1, W, 3, 'darkgrey');
    k.b(5, 0, 3, L - 5, W, 1, 'tan'); k.b(5, 0, 4, L - 5, 1, 3, c); k.b(5, W - 1, 4, L - 5, 1, 3, c); k.b(L - 1, 1, 4, 1, W - 2, 3, c);   // open bed
    k.b(7, 1.5, 4, 2, 2, 3, 'brown'); k.b(10, 1, 4, 2, 2, 3, 'tan');                                           // crates
  }
  return k.parts;
};
G.house = (o) => {
  const k = kit(), c = o.color, W = o.big ? 10 : 8, D = 6, floors = o.tall ? 2 : 1, R = o.r;
  k.b(-3, -3, 0, W + 6, D + 6, 1, 'green', { studs: true });                   // garden base
  for (let f = 0; f < floors; f++) for (let row = 0; row < 3; row++) {
    const y = 1 + f * 9 + row * 3;
    for (let x = 0; x < W; x++) for (const z of [0, D - 1]) {
      const win = row === 1 && (x === 1 || x === 2 || x === W - 3 || x === W - 2), door = f === 0 && z === D - 1 && x === Math.floor(W / 2) && row < 2;
      if (door) { k.b(x, z, y, 1, 1, 3, 'brown', { studs: row === 1 }); continue; }
      k.b(x, z, y, 1, 1, 3, win ? 'glass' : (row === 0 && f === 0 ? 'white' : c), { studs: false });
    }
    for (let z = 1; z < D - 1; z++) for (const x of [0, W - 1]) k.b(x, z, y, 1, 1, 3, row === 1 && z === Math.floor(D / 2) ? 'glass' : c, { studs: false });
  }
  const top = 1 + floors * 9;
  k.b(0, 0, top, W, D, 1, 'white', { studs: false });
  const roof = o.word === 'flat' ? null : (o.roof || 'dark red');
  if (roof) for (let i = 0; i < D / 2; i++) { k.slope(0, i, top + 1 + i * 3, W, 1, roof, 2); k.slope(0, D - 1 - i, top + 1 + i * 3, W, 1, roof, 0); }
  k.b(W - 3, 1, top + 1, 1, 1, 6, 'darkgrey');                                  // chimney
  if (o.garden || !o.small) { tree(k, W + 1, -2, 1, R); tree(k, -2.5, D + 1, 1, R); for (let i = 0; i < 5; i++) k.round(-2 + R() * (W + 4), D + 1.5 + R() * 1.2, 1, 1, ['red', 'yellow', 'pink', 'orange'][i % 4]); }
  return k.parts;
};
function tree(k, x, z, y, R, s = 1) {
  k.b(x + 1, z + 1, y, 1, 1, 9 * s, 'trunk', { studs: false });
  const lv = [[0, 0, 3, 3], [-0.5, -0.5, 4, 4], [0, 0, 3, 3], [0.5, 0.5, 2, 2], [1, 1, 1, 1]];
  lv.forEach(([dx, dz, w, d], i) => k.b(x + dx, z + dz, y + 6 * s + i * 3, w, d, 3, R() < 0.25 ? 'lime' : 'leaf'));
}
G.tree = (o) => { const k = kit(); k.b(-3, -3, 0, 9, 9, 1, 'green'); tree(k, 0, 0, 1, o.r, o.big ? 1.5 : 1); if (!o.small) tree(k, 3.5, 3, 1, o.r, 0.7); return k.parts; };
G.tower = (o) => {
  const k = kit(), c = o.color, H = o.tall || o.big ? 14 : o.small ? 6 : 10, S = 4;
  k.b(-2, -2, 0, S + 4, S + 4, 1, 'darkgrey');
  for (let lv = 0; lv < H; lv++) for (let x = 0; x < S; x++) for (let z = 0; z < S; z++) {
    if (x > 0 && x < S - 1 && z > 0 && z < S - 1) continue;
    const win = lv % 3 === 1 && ((x === 1 || x === 2) && (z === 0 || z === S - 1) || (z === 1 || z === 2) && (x === 0 || x === S - 1));
    k.b(x, z, 1 + lv * 3, 1, 1, 3, win ? 'glass' : (lv % 2 ? c : shade(c)), { studs: false });
  }
  const top = 1 + H * 3;
  k.b(-0.5, -0.5, top, S + 1, S + 1, 1, 'darkgrey');
  for (let x = 0; x < S + 1; x += 2) for (const z of [-0.5, S - 0.5]) k.b(x - 0.5, z, top + 1, 1, 1, 3, c);
  for (let z = 1.5; z < S - 0.5; z += 2) for (const x of [-0.5, S - 0.5]) k.b(x, z, top + 1, 1, 1, 3, c);
  if (o.flag !== false) { k.round(1.5, 1.5, top + 1, 15, 'darkgrey'); k.b(2, 1.5, top + 10, 2, 0.25, 4, o.accent || 'yellow', { studs: false }); }
  return k.parts;
};
G.castle = (o) => {
  const k = kit(), c = o.color === 'red' && !o.saidColor ? 'grey' : o.color, W = 14;
  k.b(-2, -2, 0, W + 4, W + 4, 1, 'green');
  for (let lv = 0; lv < 4; lv++) for (let i = 0; i < W; i++) for (const [x, z] of [[i, 0], [i, W - 1], [0, i], [W - 1, i]]) {
    const gate = z === W - 1 && i >= 6 && i <= 7 && lv < 3;
    if (!gate) k.b(x, z, 1 + lv * 3, 1, 1, 3, lv % 2 ? c : shade(c), { studs: false });
  }
  for (let i = 0; i < W; i += 2) for (const [x, z] of [[i, 0], [i, W - 1], [0, i], [W - 1, i]]) k.b(x, z, 13, 1, 1, 3, c);
  for (const [x, z] of [[-1, -1], [W - 3, -1], [-1, W - 3], [W - 3, W - 3]]) {
    for (let lv = 0; lv < 7; lv++) k.b(x, z, 1 + lv * 3, 4, 4, 3, lv % 2 ? c : shade(c), { studs: lv === 6 });
    k.slope(x, z, 22, 4, 2, o.roof || 'dark blue', 2); k.slope(x, z + 2, 22, 4, 2, o.roof || 'dark blue', 0);
  }
  k.b(6, W - 1, 10, 2, 1, 3, c); k.b(6, W - 0.6, 1, 2, 0.4, 9, 'brown', { studs: false });
  k.round(1, 1, 25, 12, 'darkgrey'); k.b(1.5, 1, 32, 3, 0.25, 4, o.accent || 'red', { studs: false });
  return k.parts;
};
G.bridge = (o) => {
  const k = kit(), c = o.color, L = o.big ? 24 : 18;
  k.b(-2, -3, 0, L + 4, 10, 1, 'blue', { studs: false });                       // river
  for (const x of [0, L - 3]) { k.b(x - 2, -3, 1, 5, 10, 3, 'green'); }
  for (const x of [Math.floor(L / 3), Math.floor(2 * L / 3)]) for (let lv = 0; lv < 3; lv++) k.b(x, 0, 1 + lv * 3, 2, 4, 3, 'grey');
  k.b(0, 0, 10, L, 4, 1, c);
  for (let x = 0; x < L; x += 2) for (const z of [0, 3]) k.b(x, z, 11, 1, 1, 3, 'white');
  for (const z of [0, 3]) k.b(0, z, 14, L, 1, 1, c);
  return k.parts;
};
G.boat = (o) => {
  const k = kit(), c = o.color, L = o.big ? 16 : 12;
  k.b(-3, -4, 0, L + 6, 12, 1, 'blue', { studs: false });                       // water
  const rows = [[2, L - 4, 1, 2], [1, L - 2, 0.5, 3], [0, L, 0, 4]];
  rows.forEach(([x0, w, z0, d], i) => k.b(x0, z0, 1 + i * 3, w, d, 3, i === 2 ? 'white' : c));
  k.b(0, 0, 10, L, 4, 1, 'tan');
  k.b(L - 5, 1, 11, 3, 2, 3, 'white'); k.b(L - 5, 1, 14, 3, 2, 3, 'glass', { studs: false }); k.b(L - 5, 1, 17, 3, 2, 1, c);
  k.round(4, 1.5, 11, 24, 'brown');
  k.b(4.3, 1.75, 16, 0.2 + 0.0001, 0.5, 14, 'white', { studs: false, kind: 'sail' });
  return k.parts;
};
G.plane = (o) => {
  const k = kit(), c = o.color, L = 14;
  k.b(0, 0, 3, L, 2, 6, c); k.b(1, 0, 9, 3, 2, 2, 'glass', { studs: false });
  k.b(4, -6, 4, 3, 14, 1, c); k.b(L - 2, -2, 8, 2, 6, 1, c); k.b(L - 2, 0.5, 9, 2, 1, 6, c);   // wings, tail
  k.b(-0.6, 0.5, 4, 0.6, 1, 3, 'darkgrey', { studs: false }); k.b(-0.9, -1, 5.2, 0.3, 4, 0.6, 'black', { studs: false, kind: 'prop' });
  for (const z of [-1, 2]) k.wheel(3.5, z + 0.5, 0, 0.9); k.b(3, -1, 1.8, 1, 4, 1.2, 'darkgrey', { studs: false });
  k.b(-3, -8, 0, L + 6, 18, 0.01, 'darkgrey', { studs: false, kind: 'ground' });
  return k.parts;
};
G.robot = (o) => {
  const k = kit(), c = o.color;
  for (const x of [0, 3]) { k.b(x, 0, 0, 2, 3, 1, 'darkgrey'); k.b(x, 0.5, 1, 2, 2, 9, 'grey'); }
  k.b(0, 0, 10, 5, 3, 9, c); k.b(1.5, 3, 13, 2, 0.4, 3, 'glass', { studs: false, kind: 'light' });
  for (const x of [-1.5, 5]) { k.b(x, 0.5, 15, 1.5, 2, 3, 'grey'); k.b(x, 0.5, 9, 1.5, 2, 6, c); }
  k.b(1, 0.5, 19, 3, 2, 1, 'darkgrey'); k.b(0.5, 0, 20, 4, 3, 6, 'grey');
  k.b(1, 3, 22.5, 1, 0.3, 1.2, 'azure', { studs: false, kind: 'light' }); k.b(3, 3, 22.5, 1, 0.3, 1.2, 'azure', { studs: false, kind: 'light' });
  k.round(2, 1, 26, 6, 'darkgrey'); k.round(2, 1, 32, 2, 'red');
  return k.parts;
};
G.rocket = (o) => {
  const k = kit(), c = o.color === 'red' && !o.saidColor ? 'white' : o.color, H = o.big ? 12 : 9;
  k.b(-4, -4, 0, 12, 12, 1, 'darkgrey');
  for (let lv = 0; lv < H; lv++) k.b(0, 0, 1 + lv * 3, 4, 4, 3, lv === H - 3 ? 'glass' : lv % 4 === 3 ? (o.accent || 'red') : c, { studs: false });
  k.b(0.5, 0.5, 1 + H * 3, 3, 3, 3, c); k.b(1, 1, 4 + H * 3, 2, 2, 3, o.accent || 'red'); k.b(1.5, 1.5, 7 + H * 3, 1, 1, 3, o.accent || 'red');
  for (const [x, z, w, d] of [[-2, 1.5, 2, 1], [4, 1.5, 2, 1], [1.5, -2, 1, 2], [1.5, 4, 1, 2]]) k.b(x, z, 1, w, d, 6, o.accent || 'red');
  return k.parts;
};
G.crane = (o) => {
  const k = kit(), c = o.color === 'red' && !o.saidColor ? 'yellow' : o.color, H = o.tall || o.big ? 12 : 9;
  k.b(-3, -3, 0, 8, 8, 1, 'darkgrey'); k.b(-1, -1, 1, 4, 4, 3, 'grey');
  for (let lv = 0; lv < H; lv++) k.b(0, 0, 4 + lv * 3, 2, 2, 3, lv % 2 ? c : shade(c), { studs: false });
  const top = 4 + H * 3;
  k.b(-1, -1, top, 4, 4, 1, 'darkgrey'); k.b(0, -0.5, top + 1, 2, 3, 3, c); k.b(0, -0.2, top + 2, 0.4, 2.4, 1.6, 'glass', { studs: false });
  k.b(2, 0, top + 1, 14, 2, 1, c); k.b(-7, 0, top + 1, 7, 2, 1, c); k.b(-7, 0, top + 2, 2, 2, 6, 'darkgrey');
  k.b(12.8, 0.8, top - 16, 0.4, 0.4, 17, 'black', { studs: false, kind: 'rope' }); k.b(12, 0, top - 19, 2, 2, 3, c);
  return k.parts;
};
G.train = (o) => {
  const k = kit(), c = o.color;
  k.b(-2, -1, 0, 30, 6, 1, 'darkgrey'); for (let x = -2; x < 28; x += 2) k.b(x, 0, 1, 1, 4, 0.4, 'brown', { studs: false });
  for (const z of [0.4, 3.2]) k.b(-2, z, 1.4, 30, 0.4, 0.4, 'silver', { studs: false });
  const car = (x0, eng) => {
    k.b(x0, 0, 3, 12, 4, 1, 'black'); for (const x of [x0 + 2, x0 + 9]) for (const z of [-0.2, 3.2]) k.wheel(x + 0.5, z + 0.5, 1.4, 1);
    if (eng) { k.b(x0, 0, 4, 7, 4, 6, c); k.b(x0 + 7, 0, 4, 5, 4, 9, c); k.b(x0 + 7, 0, 10, 5, 4, 3, 'glass', { studs: false }); k.b(x0 + 7, 0, 13, 5, 4, 1, 'black'); k.round(x0 + 1, 1.5, 10, 6, 'black'); }
    else { k.b(x0, 0, 4, 12, 4, 3, c); k.b(x0, 0, 7, 12, 4, 3, 'glass', { studs: false }); k.b(x0, 0, 10, 12, 4, 1, shade(c)); }
  };
  car(-1, true); car(13, false);
  return k.parts;
};
G.pyramid = (o) => { const k = kit(), c = o.color === 'red' && !o.saidColor ? 'tan' : o.color, n = o.big ? 10 : 8; for (let i = 0; i < n; i++) k.b(i, i, i * 3, 2 * (n - i), 2 * (n - i), 3, i % 2 ? c : shade(c)); return k.parts; };
G.dog = (o) => {
  const k = kit(), c = o.color === 'red' && !o.saidColor ? 'tan' : o.color;
  for (const [x, z] of [[0, 0], [0, 2], [5, 0], [5, 2]]) k.b(x, z, 0, 1, 1, 6, c);
  k.b(0, 0, 6, 6, 3, 6, c); k.b(-2, 0.5, 9, 3, 2, 6, c); k.b(-3, 1, 10, 1, 1, 3, 'black');
  k.b(-2, 0.3, 15, 1, 0.4, 3, 'brown', { studs: false }); k.b(-2, 2.3, 15, 1, 0.4, 3, 'brown', { studs: false });
  k.b(-2.05, 0.6, 13, 0.3, 0.4, 1.2, 'black', { studs: false, kind: 'light' }); k.b(-2.05, 2, 13, 0.3, 0.4, 1.2, 'black', { studs: false, kind: 'light' });
  k.b(6, 1, 11, 1, 1, 6, c);
  return k.parts;
};

const SYN = {
  car: ['car', 'sports car', 'taxi', 'police car', 'police', 'jeep', 'auto', 'vehicle'], truck: ['truck', 'lorry', 'fire truck', 'fire engine', 'pickup', 'van'],
  house: ['house', 'home', 'cottage', 'hut', 'villa', 'building', 'shop'], tower: ['tower', 'lighthouse', 'skyscraper', 'chimney'], castle: ['castle', 'fort', 'palace', 'fortress'],
  bridge: ['bridge'], boat: ['boat', 'ship', 'yacht', 'sailboat', 'ferry'], plane: ['plane', 'airplane', 'aeroplane', 'jet', 'aircraft'], robot: ['robot', 'droid', 'mech'],
  rocket: ['rocket', 'spaceship', 'space ship', 'shuttle'], crane: ['crane'], train: ['train', 'locomotive', 'engine', 'railway'], tree: ['tree', 'forest', 'garden'],
  pyramid: ['pyramid', 'temple'], dog: ['dog', 'puppy', 'pet'],
};
const LABEL = { car: 'Car', truck: 'Truck', house: 'House', tower: 'Tower', castle: 'Castle', bridge: 'Bridge', boat: 'Boat', plane: 'Plane', robot: 'Robot', rocket: 'Rocket', crane: 'Crane', train: 'Train', tree: 'Tree', pyramid: 'Pyramid', dog: 'Dog' };
const shade = (c) => ({ red: 'dark red', blue: 'dark blue', green: 'dark green', grey: 'darkgrey', white: 'grey', yellow: 'orange', tan: 'brown' }[c] || c);

// —— understand the words: object, colours, size, extras ——
export function understand(text) {
  let t = ' ' + text.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ') + ' ';
  let type = null, at = 1e9;
  for (const [k, words] of Object.entries(SYN)) for (const w of words) { const i = t.indexOf(' ' + w + ' '); if (i >= 0 && i < at) { at = i; type = k; } }
  const MATERIAL = { stone: 'grey', wood: 'brown', wooden: 'brown', metal: 'silver', golden: 'gold', sky: 'azure', snow: 'white', grass: 'green', sand: 'tan', fire: null };
  for (const [w, c] of Object.entries(MATERIAL)) if (c && t.includes(' ' + w + ' ') && !NAMES.some((n) => t.includes(' ' + n + ' '))) t = t.replace(' ' + w + ' ', ' ' + c + ' ');
  const said = NAMES.map((c) => [c, t.indexOf(' ' + c + ' ')]).filter(([, i]) => i >= 0).sort((a, b) => a[1] - b[1]).map(([c]) => c === 'gray' ? 'grey' : c);
  const word = /\bfire\b/.test(t) ? 'fire' : /\bpolice\b/.test(t) ? 'police' : /\bflat\b/.test(t) ? 'flat' : null;
  const o = {
    type, word, saidColor: said.length > 0, color: said[0] || (word === 'fire' ? 'red' : word === 'police' ? 'white' : 'red'), accent: said[1], roof: said[1],
    small: /\b(small|tiny|little|mini)\b/.test(t), big: /\b(big|large|huge|giant)\b/.test(t), tall: /\b(tall|high|two storey|two story|double)\b/.test(t),
    garden: /\b(garden|trees|flowers|yard)\b/.test(t), rainbow: /\brainbow\b/.test(t),
  };
  o.r = rng(hashStr(text.toLowerCase().trim() || 'x'));
  return o;
}
export function build(text) {
  const o = understand(text);
  if (!o.type) return { ok: false, o };
  let parts = G[o.type](o);
  if (o.rainbow) { const rb = ['red', 'orange', 'yellow', 'lime', 'azure', 'blue', 'purple']; parts = parts.map((p, i) => (p.color === o.color || p.color === shade(o.color)) ? { ...p, color: rb[Math.floor(p.y / 3) % rb.length] } : p); }
  return { ok: true, o, parts, label: (o.small ? 'Small ' : o.big ? 'Big ' : o.tall ? 'Tall ' : '') + (o.word === 'fire' ? 'Fire ' : o.word === 'police' ? 'Police ' : '') + LABEL[o.type] };
}

// —— 3D ——
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setClearColor(0x000000, 0);   // transparent: the page's soft backdrop shows through
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(35, 1, 0.1, 500);
const ctl = new OrbitControls(cam, canvas); ctl.enableDamping = true; ctl.maxPolarAngle = Math.PI * 0.49;
scene.add(new THREE.HemisphereLight('#ffffff', '#8a8f99', 1.3));
const sun = new THREE.DirectionalLight('#fff4e0', 2.4); sun.position.set(18, 30, 14); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 90 }); sun.shadow.bias = -0.0004; scene.add(sun);
const fill = new THREE.DirectionalLight('#cfe0ff', 0.6); fill.position.set(-20, 12, -10); scene.add(fill);
const floor = new THREE.Mesh(new THREE.CircleGeometry(80, 64), new THREE.ShadowMaterial({ opacity: 0.22 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

const MAT = {}, mat = (c) => MAT[c] || (MAT[c] = c === 'glass'
  ? new THREE.MeshPhysicalMaterial({ color: COLORS.glass, roughness: 0.05, transmission: 0, transparent: true, opacity: 0.5, metalness: 0 })
  : new THREE.MeshStandardMaterial({ color: COLORS[c] || c, roughness: c === 'black' ? 0.55 : 0.32, metalness: ['silver', 'gold'].includes(c) ? 0.6 : 0 }));
const studGeo = new THREE.CylinderGeometry(STUD_R, STUD_R, STUD_H, 20);
const GEO = new Map();
function brickGeo(p) {
  const key = [p.kind, p.w, p.d, p.h, p.studs, p.dir].join('|');
  if (GEO.has(key)) return GEO.get(key);
  const H = p.h * PLATE, geos = [];
  if (p.kind === 'slope') {   // 45° slope: back row full height with studs, front falls to a lip
    const D = p.d, shape = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(D - GAP, 0), new THREE.Vector2(D - GAP, 0.25), new THREE.Vector2(Math.min(1, D) - GAP / 2, H - GAP), new THREE.Vector2(0, H - GAP)]);
    const g = new THREE.ExtrudeGeometry(shape, { depth: p.w - GAP, bevelEnabled: false });
    g.rotateY(-Math.PI / 2); g.translate(p.w - GAP / 2, 0, GAP / 2);   // x along w, z along d
    geos.push(g);
    for (let x = 0; x < p.w; x++) { const s = studGeo.clone(); s.translate(x + 0.5, H - GAP + STUD_H / 2, 0.5); geos.push(s); }
  } else {
    const g = new THREE.BoxGeometry(Math.max(0.05, p.w - GAP), Math.max(0.02, H - GAP), Math.max(0.05, p.d - GAP)); g.translate(p.w / 2, (H - GAP) / 2, p.d / 2); geos.push(g);
    if (p.studs && p.kind === 'brick') for (let x = 0; x < Math.floor(p.w + 1e-6); x++) for (let z = 0; z < Math.floor(p.d + 1e-6); z++) { const s = studGeo.clone(); s.translate(x + 0.5, H - GAP + STUD_H / 2, z + 0.5); geos.push(s); }
  }
  const merged = merge(geos); GEO.set(key, merged); return merged;
}
function merge(geos) {   // small merge for non-indexed + indexed geometry
  const pos = [], nor = [];
  for (let g of geos) { g = g.index ? g.toNonIndexed() : g; pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return m;
}
function meshOf(p) {
  let m;
  if (p.kind === 'wheel') {
    const g = new THREE.Group(), tyre = new THREE.Mesh(new THREE.CylinderGeometry(p.r, p.r, 0.9, 28), mat('black')), hub = new THREE.Mesh(new THREE.CylinderGeometry(p.r * 0.55, p.r * 0.55, 0.95, 20), mat('silver'));
    for (const q of [tyre, hub]) { q.rotation.x = Math.PI / 2; q.castShadow = true; g.add(q); }
    g.position.set(p.x, p.r + p.y * PLATE, p.z); return g;
  }
  if (p.kind === 'round') {
    const g = new THREE.Group(), body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, p.h * PLATE - GAP, 20), mat(p.color));
    body.position.y = (p.h * PLATE - GAP) / 2; const s = new THREE.Mesh(studGeo, mat(p.color)); s.position.y = p.h * PLATE - GAP + STUD_H / 2;
    for (const q of [body, s]) { q.castShadow = q.receiveShadow = true; g.add(q); } g.position.set(p.x + 0.5, p.y * PLATE, p.z + 0.5); return g;
  }
  m = new THREE.Mesh(brickGeo(p), mat(p.color)); m.castShadow = p.color !== 'glass' && p.kind !== 'ground'; m.receiveShadow = true;
  if (p.kind === 'slope' && p.dir) { const piv = new THREE.Group(); m.position.set(-p.w / 2, 0, -p.d / 2); piv.add(m); piv.rotation.y = p.dir * Math.PI / 2; piv.position.set(p.x + p.w / 2, p.y * PLATE, p.z + p.d / 2); return piv; }
  m.position.set(p.x, p.y * PLATE, p.z); return m;
}

// —— state, animation ——
let group = null, items = [], t0 = 0, speed = 1, center = new THREE.Vector3(), radius = 10;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
export function show(result) {
  if (group) scene.remove(group);
  group = new THREE.Group(); scene.add(group); items = [];
  const box = new THREE.Box3();
  const order = [...result.parts].sort((a, b) => a.y - b.y || (a.x + a.z) - (b.x + b.z));
  for (const p of order) { const m = meshOf(p); group.add(m); items.push({ m, y: m.position.y }); box.expandByObject(m); }
  box.getCenter(center); const size = box.getSize(new THREE.Vector3()); radius = Math.max(size.x, size.y, size.z) * 0.5 + 1;
  group.position.set(-center.x, 0, -center.z); center.set(0, size.y * 0.42, 0);
  const d = radius / Math.tan((cam.fov * Math.PI / 180) / 2) * (innerWidth < innerHeight ? 1.75 : 1.25);
  cam.position.set(d * 0.72, d * 0.55 + size.y * 0.25, d * 0.72); ctl.target.copy(center); ctl.update();
  speed = Math.max(1, items.length / 140); t0 = performance.now();
}
function frame(now) {
  const per = 45 / speed, el = REDUCED ? 1e9 : now - t0;
  items.forEach((it, i) => {
    const k = Math.min(1, Math.max(0, (el - i * per) / 260)), e = 1 - Math.pow(1 - k, 3);
    it.m.visible = k > 0; it.m.position.y = it.y + (1 - e) * 4;
  });
  const done = el > items.length * per + 260;
  document.getElementById('progress').style.width = (done ? 100 : Math.min(100, 100 * el / (items.length * per + 260))) + '%';
  ctl.autoRotate = done && document.getElementById('spin').checked; ctl.autoRotateSpeed = 1.2;
  ctl.update(); renderer.render(scene, cam); requestAnimationFrame(frame);
}
function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize(); requestAnimationFrame(frame);

// —— UI ——
const $ = (id) => document.getElementById(id);
function bom(parts) {
  const c = new Map();
  for (const p of parts) { if (p.kind === 'ground') continue; const name = p.kind === 'wheel' ? 'Wheel' : p.kind === 'round' ? `Round 1×1×${p.h % 3 ? p.h + ' plates' : p.h / 3}` : p.kind === 'slope' ? `Slope ${p.w}×${p.d}` : `${p.h < 3 ? 'Plate' : 'Brick'} ${+p.w.toFixed(1)}×${+p.d.toFixed(1)}${p.h > 3 ? '×' + +(p.h / 3).toFixed(1) : ''}`; const k = name + '|' + p.color; c.set(k, (c.get(k) || 0) + 1); }
  return [...c].sort((a, b) => b[1] - a[1]).map(([k, n]) => { const [name, col] = k.split('|'); return `<li><i style="background:${COLORS[col] || col}"></i>${n} × ${name} <span>${col}</span></li>`; }).join('');
}
export function go(text) {
  const r = build(text);
  if (!r.ok) { $('msg').innerHTML = `I don't know how to build that yet. Try one of: ${Object.values(LABEL).join(', ').toLowerCase()}.`; return r; }
  show(r);
  const n = r.parts.filter((p) => p.kind !== 'ground').length;
  $('msg').innerHTML = `<b>${r.label}</b> in ${r.o.rainbow ? 'rainbow' : r.o.color}${r.o.accent ? ' & ' + r.o.accent : ''} · ${n} parts`;
  $('bom').innerHTML = bom(r.parts);
  try { localStorage.setItem('bb-last', text); } catch {}
  return r;
}
$('f').addEventListener('submit', (e) => { e.preventDefault(); go($('q').value); });
document.querySelectorAll('[data-try]').forEach((b) => b.addEventListener('click', () => { $('q').value = b.dataset.try; go(b.dataset.try); }));
let first = 'red car'; try { first = localStorage.getItem('bb-last') || first; } catch {}
$('q').value = first; go(first);
window.__bb = { go, understand };
