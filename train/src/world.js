// The line: a gently curving double track (down line at z = 0, up line to the right), concrete sleepers, ballast,
// overhead electric wires on masts, villages, trees and fields by region, and full stations with platforms, shelters,
// a footbridge, a station building, yellow name boards (Hindi + English), signals and speed boards.
import { THREE, M, add, rbox, cyl, cv, tex } from './kit.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GAUGE } from './rolling.js';
export const TRACK2 = 5.3, CH = 200, CONTACT_Y = 5.6;
const rng = (seed) => { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };

// ---- textures ----
const ballastTex = (() => { const c = cv(256, 256), g = c.getContext('2d'); g.fillStyle = '#6f6b63'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 2600; i++) { const s = 2 + Math.random() * 5, v = 85 + Math.random() * 85; g.fillStyle = `rgb(${v},${v - 3},${v - 8})`; g.beginPath(); g.ellipse(Math.random() * 256, Math.random() * 256, s, s * 0.7, Math.random() * 3, 0, 7); g.fill(); } return tex(c, { rep: [1, 1] }); })();
ballastTex.wrapS = ballastTex.wrapT = THREE.RepeatWrapping;
const ballastMat = new THREE.MeshStandardMaterial({ map: ballastTex, roughness: 1 });
const earthMat = new THREE.MeshStandardMaterial({ color: '#8a7656', roughness: 1 });
const fieldTex = (col, row) => { const c = cv(128, 128), g = c.getContext('2d'); g.fillStyle = col; g.fillRect(0, 0, 128, 128); g.fillStyle = row; for (let y = 0; y < 128; y += 8) g.fillRect(0, y, 128, 3); for (let i = 0; i < 500; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.08)'; g.fillRect(Math.random() * 128, Math.random() * 128, 2, 2); } const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
const FIELDS = { south: [['#5f8f3c', '#4f7e30'], ['#6f9a48', '#86ac56'], ['#86935a', '#9aa86a']], west: [['#7b8f45', '#6a7e3a'], ['#9a8a5a', '#8a7a4e'], ['#6f8a40', '#5e7834']], north: [['#c9b53a', '#b39f2a'], ['#9aa64e', '#8a9640'], ['#a48a5e', '#937a50']] };
const fieldMats = Object.fromEntries(Object.entries(FIELDS).map(([k, list]) => [k, list.map(([a, b]) => new THREE.MeshStandardMaterial({ map: fieldTex(a, b), roughness: 1 }))]));

// ---- instanced scenery shapes ----
const leaf = () => { const g = new THREE.BoxGeometry(3.2, 0.06, 0.55); g.translate(1.6, 0, 0); return g; };
const palmCrown = (() => { const parts = []; for (let i = 0; i < 9; i++) { const l = leaf(); l.rotateZ(-0.45 - (i % 2) * 0.25); l.rotateY(i / 9 * Math.PI * 2); parts.push(l); } return mergeGeometries(parts); })();
const palmTrunk = (() => { const g = cyl(0.14, 0.22, 9, 7); g.translate(0, 4.5, 0); return g; })();
const roundCrown = (() => { const a = new THREE.IcosahedronGeometry(2.6, 1), b = new THREE.IcosahedronGeometry(2.0, 1); b.translate(1.4, 0.6, 0.6); const c = new THREE.IcosahedronGeometry(1.9, 1); c.translate(-1.3, 0.3, -0.7); return mergeGeometries([a, b, c]); })();
const roundTrunk = (() => { const g = cyl(0.25, 0.38, 3.2, 7); g.translate(0, 1.6, 0); return g; })();
const houseBody = new THREE.BoxGeometry(1, 1, 1); houseBody.translate(0, 0.5, 0);
const tankGeo = cyl(0.55, 0.55, 1.0, 12);
const MAT = {
  palmLeaf: new THREE.MeshStandardMaterial({ color: '#4f7f2e', roughness: 0.85, side: THREE.DoubleSide }), trunk: new THREE.MeshStandardMaterial({ color: '#7a6248', roughness: 1 }),
  crown: new THREE.MeshStandardMaterial({ color: '#4a7434', roughness: 0.9, flatShading: true }), house: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 }), tank: new THREE.MeshStandardMaterial({ color: '#202224', roughness: 0.7 }),
};
const HOUSE_COLS = ['#f2d7a6', '#e9a7a1', '#a9c7e6', '#f4f0e4', '#c9e0a8', '#f1c27d', '#d7b3e0'];
const PEOPLE = ['#c0392b', '#2e86c1', '#f1c40f', '#8e44ad', '#16a085', '#e67e22', '#ecf0f1', '#d35400', '#27ae60', '#e84393'];

// ---- signs and boards (canvas text) ----
const boardTex = (hi, en, code) => { const c = cv(1024, 400), g = c.getContext('2d');
  g.fillStyle = '#f2c12e'; g.fillRect(0, 0, 1024, 400); g.strokeStyle = '#111'; g.lineWidth = 16; g.strokeRect(8, 8, 1008, 384);
  g.fillStyle = '#111'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const fit = (t, size, y, font) => { let s = size; g.font = `bold ${s}px ${font}`; while (g.measureText(t).width > 940 && s > 30) { s -= 4; g.font = `bold ${s}px ${font}`; } g.fillText(t, 512, y); };
  fit(hi, 120, 120, '"Noto Sans Devanagari","Nirmala UI","Mangal",sans-serif'); fit(en.toUpperCase(), 104, 262, 'Arial,sans-serif');
  g.font = 'bold 44px Arial,sans-serif'; g.fillText(code, 512, 352); return tex(c); };
const roundBoard = (txt) => { const c = cv(256, 256), g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill(); g.lineWidth = 22; g.strokeStyle = '#c0281e'; g.stroke(); g.fillStyle = '#111'; g.font = 'bold 110px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 128, 136); return tex(c); };
const rectBoard = (txt, bg = '#f2c12e', fg = '#111', w = 512, h = 256, size = 120) => { const c = cv(w, h), g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = fg; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14); g.fillStyle = fg; g.font = `bold ${size}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, h / 2 + 6); return tex(c); };
const boardMesh = (t, w, h) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, side: THREE.DoubleSide }));
function postBoard(parent, t, x, z, w, h, y, facing = -Math.PI / 2, posts = 2) {   // faces an approaching driver (-x) by default
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = facing; parent.add(g);
  const b = boardMesh(t, w, h); b.position.y = y; g.add(b);
  for (let i = 0; i < posts; i++) add(g, cyl(0.05, 0.05, y, 8), M.black, posts === 1 ? 0 : (i ? 1 : -1) * w * 0.38, y / 2, -0.03);
  return g;
}
export function makeSignal(parent, x, z, y = 4.6) {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  add(g, cyl(0.09, 0.11, y, 10), M.metal, 0, y / 2, 0);
  add(g, rbox(0.35, 1.35, 0.6, 0.06), M.black, 0, y + 0.4, 0);
  const lamps = {}; ['red', 'amber', 'green'].forEach((k, i) => { const m = M[k].clone(); const l = add(g, new THREE.CircleGeometry(0.17, 20), m, -0.18, y - 0.05 + i * 0.42, 0); l.rotation.y = -Math.PI / 2; lamps[k] = m; const hood = add(g, cyl(0.2, 0.2, 0.18, 12, 1), M.black, -0.24, y + 0.05 + i * 0.42, 0); hood.rotation.z = Math.PI / 2; hood.scale.set(1, 1, 0.5); });
  add(g, rbox(0.05, 1.1, 1.1, 0.02), M.black, 0.2, y + 0.4, 0);
  const set = (a) => { for (const k in lamps) lamps[k].emissiveIntensity = k === a ? 3.2 : 0; g.userData.aspect = a; };
  set('red'); g.userData.set = set; return g;
}

export function makeWorld(scene, route, SCALE) {
  const R = rng([...route.id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
  const stations = route.stations.map((st, i) => ({ ...st, i, s: 400 + st.km * SCALE }));
  const END = stations[stations.length - 1].s + 700, START = -500;
  const ph = [R() * 6, R() * 6, R() * 6];
  // caution zones (track work, 60 km/h) half way along the longer sections
  const zones = [];
  for (let i = 0; i < stations.length - 1; i++) { const a = stations[i].s, b = stations[i + 1].s; if (b - a > 2200) { const m = (a + b) / 2 + (R() - 0.5) * (b - a) * 0.2; zones.push({ s0: m - 350, s1: m + 350, limit: 60 }); } }
  const base = (s) => 26 * Math.sin(s / 610 + ph[0]) + 11 * Math.sin(s / 247 + ph[1]) + 5 * Math.sin(s / 131 + ph[2]);
  const gate = (s) => { let k = 1; for (const st of stations) { const d = Math.abs(s - (st.s - 70)); const t = Math.min(1, Math.max(0, (d - 300) / 380)); k *= t * t * (3 - 2 * t); } return k; };
  const f = (s) => base(s) * gate(s);
  const df = (s) => (f(s + 0.5) - f(s - 0.5));
  const at = (s, off = 0, y = 0, out = new THREE.Vector3()) => { const d = df(s), n = 1 / Math.hypot(1, d); return out.set(s - d * n * off, y, f(s) + n * off); };
  const heading = (s) => Math.atan(df(s));

  // a strip along the line (rails, wires, ballast): a box section swept along the curve
  function strip(s0, s1, off, w, h, yTop, mat, step = 4, uvScale = 0) {
    const pos = [], uv = [], idx = []; const n = Math.max(1, Math.ceil((s1 - s0) / step)); const v = new THREE.Vector3();
    for (let i = 0; i <= n; i++) { const s = s0 + (s1 - s0) * i / n;
      for (const [dx, dy] of [[-w / 2, 0], [w / 2, 0], [w / 2, -h], [-w / 2, -h]]) { at(s, off + dx, yTop + dy, v); pos.push(v.x, v.y, v.z); uv.push(uvScale ? s / uvScale : i, (dx > 0 ? 1 : 0)); } }
    for (let i = 0; i < n; i++) { const a = i * 4, b = a + 4; idx.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2, a + 3, a, b + 3, b + 3, a, b); }
    for (let i = 0; i < idx.length; i += 3) { const tmp = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = tmp; }   // faces outward
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.castShadow = h > 0.1 ? false : true; return m;
  }
  const inStation = (s, off) => stations.some((st) => s > st.s - 260 && s < st.s + 120 && off > -24 && off < TRACK2 + 20);
  const zoneAt = (s) => zones.find((z) => s >= z.s0 && s <= z.s1);

  // ---- chunks ----
  const chunks = new Map(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(1, 1, 1), v = new THREE.Vector3();
  const place = (inst, i, s, off, y, rotY = 0, scale = 1, sx = 1, sy = 1, sz = 1) => { at(s, off, y, v); e.set(0, -heading(s) + rotY, 0); q.setFromEuler(e); sc.set(scale * sx, scale * sy, scale * sz); m4.compose(v, q, sc); inst.setMatrixAt(i, m4); };
  function buildChunk(ci) {
    const s0 = Math.max(START, ci * CH), s1 = Math.min(END, (ci + 1) * CH); const g = new THREE.Group(); if (s1 <= s0) return g;
    const r = rng(ci * 7919 + 13);
    g.add(strip(s0, s1, TRACK2 / 2, 17, 0.4, -0.25, earthMat, 8));
    for (const off of [0, TRACK2]) {
      const b = strip(s0, s1, off, 4.4, 0.35, -0.12, ballastMat, 4, 3); g.add(b);
      const n = Math.floor((s1 - s0) / 0.6), sl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.26, 0.2, 2.75), M.sleeper, n);
      for (let i = 0; i < n; i++) place(sl, i, s0 + i * 0.6 + 0.3, off, -0.12); sl.receiveShadow = true; sl.castShadow = true; g.add(sl);
      for (const sd of [-1, 1]) { g.add(strip(s0, s1, off + sd * GAUGE / 2, 0.075, 0.17, 0.0, M.rail, 4)); g.add(strip(s0, s1, off + sd * GAUGE / 2, 0.15, 0.03, -0.14, M.rail, 8)); }
      g.add(strip(s0, s1, off, 0.025, 0.025, CONTACT_Y, M.wire, 6)); g.add(strip(s0, s1, off, 0.025, 0.025, CONTACT_Y + 1.3, M.wire, 6));
    }
    // OHE masts every 50 m, both sides, cantilever arms over each line
    for (let s = Math.ceil(s0 / 50) * 50; s < s1; s += 50) for (const [off, arm] of [[-3.3, 1], [TRACK2 + 3.3, -1]]) {
      const mg = new THREE.Group(); at(s, off, 0, v); mg.position.copy(v); mg.rotation.y = -heading(s); g.add(mg);
      add(mg, new THREE.BoxGeometry(0.32, 8.6, 0.32), M.metal, 0, 4.0, 0);
      const a1 = add(mg, cyl(0.05, 0.05, 3.5, 6), M.metal, 0, CONTACT_Y + 1.3, arm * 1.75); a1.rotation.x = Math.PI / 2;
      const a2 = add(mg, cyl(0.04, 0.04, 3.5, 6), M.metal, 0, CONTACT_Y + 0.25, arm * 1.75); a2.rotation.x = Math.PI / 2;
      for (const y of [CONTACT_Y + 1.3, CONTACT_Y + 0.25]) add(mg, cyl(0.08, 0.08, 0.5, 8), M.insul, 0, y, arm * 0.35).rotation.x = Math.PI / 2;
    }
    // trees, villages and fields by region
    const reg = route.region, palms = reg === 'south' ? 0.75 : reg === 'west' ? 0.35 : 0.05;
    const N = 46, pt = new THREE.InstancedMesh(palmTrunk, MAT.trunk, N), pc = new THREE.InstancedMesh(palmCrown, MAT.palmLeaf, N), rt = new THREE.InstancedMesh(roundTrunk, MAT.trunk, N), rc = new THREE.InstancedMesh(roundCrown, MAT.crown, N);
    let np = 0, nr = 0;
    for (let k = 0; k < N; k++) { const s = s0 + r() * (s1 - s0), side = r() < 0.5 ? -1 : 1, off = side < 0 ? -(10 + r() * 80) : TRACK2 + 10 + r() * 80; if (inStation(s, off)) continue;
      const sc2 = 0.8 + r() * 0.6;
      if (r() < palms) { place(pt, np, s, off, -0.5, 0, sc2, 1 + (r() - 0.5) * 0.3, 1, 1); place(pc, np, s, off, -0.5 + 9 * sc2, r() * 6, sc2); np++; }
      else { place(rt, nr, s, off, -0.5, 0, sc2); place(rc, nr, s, off, -0.5 + 3.6 * sc2, r() * 6, sc2, 1, 0.85, 1); nr++; } }
    for (const [im, n] of [[pt, np], [pc, np], [rt, nr], [rc, nr]]) { im.count = n; im.castShadow = true; im.receiveShadow = true; g.add(im); }
    const nh = r() < 0.55 ? 3 + Math.floor(r() * 6) : 0;
    if (nh) { const hs = new THREE.InstancedMesh(houseBody, MAT.house, nh), tk = new THREE.InstancedMesh(tankGeo, MAT.tank, nh), side = r() < 0.5 ? -1 : 1, s = s0 + 30 + r() * (s1 - s0 - 60), c = new THREE.Color();
      for (let k = 0; k < nh; k++) { const ss = s + (r() - 0.5) * 70, off = side < 0 ? -(22 + r() * 40) : TRACK2 + 22 + r() * 40; if (inStation(ss, off)) { hs.setMatrixAt(k, new THREE.Matrix4().makeScale(0, 0, 0)); tk.setMatrixAt(k, new THREE.Matrix4().makeScale(0, 0, 0)); continue; }
        const w = 5 + r() * 5, d = 5 + r() * 4, h = 3 + (r() < 0.4 ? 3 : 0); place(hs, k, ss, off, -0.5, (r() - 0.5) * 0.5, 1, w, h, d); place(tk, k, ss, off + 1, -0.5 + h + 0.5, 0, 1); hs.setColorAt(k, c.set(HOUSE_COLS[Math.floor(r() * HOUSE_COLS.length)])); }
      hs.castShadow = hs.receiveShadow = true; tk.castShadow = true; g.add(hs, tk); }
    for (let k = 0; k < 3; k++) { const s = s0 + r() * (s1 - s0), side = r() < 0.5 ? -1 : 1, off = side < 0 ? -(16 + r() * 50) : TRACK2 + 16 + r() * 50; if (inStation(s, off)) continue;
      const fm = new THREE.Mesh(new THREE.PlaneGeometry(40 + r() * 50, 30 + r() * 30), fieldMats[reg][Math.floor(r() * 3)]); at(s, off, -0.56, v); fm.position.copy(v); fm.rotation.set(-Math.PI / 2, 0, r() * 0.6 - 0.3 - heading(s)); fm.receiveShadow = true; g.add(fm); }
    // caution zone boards and track workers
    for (const z of zones) {
      if (z.s0 - 60 >= s0 && z.s0 - 60 < s1) { const b = postBoard(g, roundBoard('60'), 0, 0, 1.0, 1.0, 2.4, -Math.PI / 2, 1); at(z.s0 - 60, -2.9, 0, v); b.position.copy(v); b.rotation.y = -heading(z.s0) - Math.PI / 2; }
      if (z.s1 + 145 >= s0 && z.s1 + 145 < s1) { const b = postBoard(g, rectBoard('T', '#ffffff', '#111', 256, 256, 150), 0, 0, 0.9, 0.9, 2.4, -Math.PI / 2, 1); at(z.s1 + 145, -2.9, 0, v); b.position.copy(v); b.rotation.y = -heading(z.s1) - Math.PI / 2; }
      for (let s = Math.max(s0, z.s0 + 100); s < Math.min(s1, z.s1 - 100); s += 120) { for (let k = 0; k < 3; k++) { const p = person(g, '#ff7a1a'); at(s + k * 2.2, TRACK2 + 3.0 + (k % 2) * 0.8, -0.35, v); p.position.copy(v); } }
    }
    return g;
  }
  function person(parent, col, skin) {
    const p = new THREE.Group(); parent.add(p); const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.85, 4, 8), new THREE.MeshStandardMaterial({ color: col, roughness: 0.8 })); body.position.y = 0.72; body.castShadow = true; p.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshStandardMaterial({ color: skin || '#8d5a3b', roughness: 0.7 })); head.position.y = 1.5; p.add(head); return p;
  }

  // ---- stations (built when the train comes near) ----
  function buildStation(st, isFirst, isLast) {
    const g = new THREE.Group(); g.position.set(st.s, 0, 0); const r = rng(st.i * 977 + 5);
    const PL = { x0: -168, x1: 22, top: 0.84 };
    const platform = (z0, z1, x0 = PL.x0, x1 = PL.x1) => { const w = Math.abs(z1 - z0), zc = (z0 + z1) / 2; add(g, new THREE.BoxGeometry(x1 - x0, PL.top + 0.6, w), M.concrete, (x0 + x1) / 2, PL.top / 2 - 0.3, zc);
      const edge = Math.abs(z0) < Math.abs(z1) ? z0 : z1, dir = Math.sign(zc - edge); add(g, new THREE.BoxGeometry(x1 - x0, 0.03, 0.7), M.yellow, (x0 + x1) / 2, PL.top + 0.02, edge + dir * 0.45); add(g, new THREE.BoxGeometry(x1 - x0, 0.04, 0.25), new THREE.MeshStandardMaterial({ color: '#e9e4d8', roughness: 0.8 }), (x0 + x1) / 2, PL.top + 0.02, edge + dir * 0.12); };
    platform(-1.75, -9.8); platform(TRACK2 + 1.75, TRACK2 + 7.8, -150, 10);
    const shelter = (x0, x1, zc, w) => { for (let x = x0; x <= x1; x += 9) add(g, cyl(0.12, 0.12, 4.0, 10), M.maroon, x, PL.top + 2.0, zc); const roof = add(g, new THREE.BoxGeometry(x1 - x0 + 4, 0.18, w), new THREE.MeshStandardMaterial({ color: '#9e3b2f', roughness: 0.7, metalness: 0.2 }), (x0 + x1) / 2, PL.top + 4.05, zc); roof.rotation.x = Math.sign(zc) * 0.06; add(g, new THREE.BoxGeometry(x1 - x0 + 4, 0.3, 0.2), M.cream, (x0 + x1) / 2, PL.top + 3.9, zc - Math.sign(zc) * w / 2 + Math.sign(zc) * 0.02 * 0); };
    shelter(-128, -12, -6.0, 7.5); shelter(-100, -20, TRACK2 + 4.8, 5.5);
    // name boards: both ends and the middle of platform 1, one on platform 2 (face the line)
    const bt = boardTex(st.hi, st.en, st.code);
    for (const x of [-158, -68, 14]) postBoard(g, bt, x, -8.2, 3.6, 1.4, 2.9, 0);
    for (const x of [-140, -70]) postBoard(g, bt, x, -3.6, 3.6, 1.4, 2.9, Math.PI);
    postBoard(g, bt, -60, TRACK2 + 6.6, 3.6, 1.4, 2.9, Math.PI);
    // station building behind platform 1
    const bw = 70, bx = -78, bz = -16;
    const facade = (() => { const c = cv(2048, 512), x = c.getContext('2d'); x.fillStyle = '#f1e2c2'; x.fillRect(0, 0, 2048, 512); x.fillStyle = '#8b1e24'; x.fillRect(0, 440, 2048, 72); x.fillRect(0, 0, 2048, 28);
      for (let i = 0; i < 14; i++) { const cx = 70 + i * 140; x.fillStyle = '#8b1e24'; x.beginPath(); x.arc(cx + 30, 210, 46, Math.PI, 0); x.lineTo(cx + 76, 330); x.lineTo(cx - 16, 330); x.fill(); x.fillStyle = '#2b3036'; x.beginPath(); x.arc(cx + 30, 214, 36, Math.PI, 0); x.lineTo(cx + 66, 326); x.lineTo(cx - 6, 326); x.fill(); }
      x.fillStyle = '#111'; x.font = 'bold 64px Arial'; x.textAlign = 'center'; x.fillText(st.en.toUpperCase(), 1024, 96); return tex(c); })();
    add(g, new THREE.BoxGeometry(bw, 9, 9), M.cream, bx, 4.5 - 0.5, bz);
    const fm = new THREE.Mesh(new THREE.PlaneGeometry(bw, 9), new THREE.MeshStandardMaterial({ map: facade, roughness: 0.8 })); fm.position.set(bx, 4.0, bz + 4.52); g.add(fm);
    add(g, new THREE.BoxGeometry(bw + 1, 0.5, 10), new THREE.MeshStandardMaterial({ color: '#9e3b2f', roughness: 0.7 }), bx, 8.75, bz);
    add(g, new THREE.BoxGeometry(8, 4, 8), M.cream, bx, 10.8, bz); add(g, new THREE.ConeGeometry(5.6, 3, 4), new THREE.MeshStandardMaterial({ color: '#9e3b2f', roughness: 0.7 }), bx, 14.3, bz).rotation.y = Math.PI / 4;
    const clk = (() => { const c = cv(256, 256), x = c.getContext('2d'); x.fillStyle = '#fff'; x.beginPath(); x.arc(128, 128, 120, 0, 7); x.fill(); x.lineWidth = 12; x.strokeStyle = '#222'; x.stroke(); x.lineWidth = 10; x.beginPath(); x.moveTo(128, 128); x.lineTo(128, 50); x.moveTo(128, 128); x.lineTo(180, 150); x.stroke(); return tex(c); })();
    const cm = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), new THREE.MeshStandardMaterial({ map: clk })); cm.position.set(bx, 11, bz + 4.05); g.add(cm);
    // foot over bridge across both lines (above the wires)
    const fx = -40, fy = 7.6, z0 = -7.5, z1 = TRACK2 + 6.5;
    add(g, new THREE.BoxGeometry(3.2, 0.3, z1 - z0), M.concrete, fx, fy, (z0 + z1) / 2);
    for (const s of [-1, 1]) { add(g, new THREE.BoxGeometry(0.15, 1.4, z1 - z0), M.metal, fx + s * 1.6, fy + 0.85, (z0 + z1) / 2); add(g, new THREE.BoxGeometry(0.2, 0.2, z1 - z0), M.maroon, fx + s * 1.6, fy + 1.6, (z0 + z1) / 2); }
    for (const zc of [z0 + 0.6, z1 - 0.6]) { const st2 = add(g, new THREE.BoxGeometry(14, 0.3, 2.4), M.concrete, fx - 8.5, (fy + PL.top) / 2, zc); st2.rotation.z = Math.atan2(fy - PL.top, 14); add(g, new THREE.BoxGeometry(0.5, fy, 0.5), M.concrete, fx, fy / 2, zc); }
    // benches, lamps and people on the platforms
    for (let x = -150; x < 10; x += 18) { add(g, new THREE.BoxGeometry(2.2, 0.12, 0.6), M.maroon, x, PL.top + 0.5, -5.2); add(g, new THREE.BoxGeometry(2.2, 0.5, 0.1), M.maroon, x, PL.top + 0.8, -5.5); add(g, cyl(0.07, 0.09, 5, 8), M.dark, x + 9, PL.top + 2.5, -3.2); add(g, rbox(0.8, 0.2, 0.3, 0.05), M.lamp, x + 9, PL.top + 5, -3.2); }
    const np = isLast ? 25 : 70; for (let k = 0; k < np; k++) { const plat2 = r() < 0.3; const p = person(g, PEOPLE[Math.floor(r() * PEOPLE.length)], ['#6b4226', '#8d5a3b', '#a8714a', '#5a3820'][Math.floor(r() * 4)]); p.position.set(PL.x0 + 10 + r() * 170 * (plat2 ? 0.8 : 1), PL.top, plat2 ? TRACK2 + 3 + r() * 4 : -3.4 - r() * 5.5); p.rotation.y = r() * 6; }
    // signals, stop board, speed boards (face the approaching train)
    const home = makeSignal(g, -560, -2.9), starter = makeSignal(g, 32, -2.6);
    postBoard(g, rectBoard('STOP', '#f2c12e', '#111', 512, 256, 130), 2, -2.5, 1.2, 0.6, 2.2, -Math.PI / 2, 1);
    postBoard(g, roundBoard('60'), -440, -2.8, 1.0, 1.0, 2.4, -Math.PI / 2, 1);
    postBoard(g, roundBoard('30'), -150, -2.8, 1.0, 1.0, 2.4, -Math.PI / 2, 1);
    postBoard(g, roundBoard('45'), 40, -3.0, 1.0, 1.0, 2.4, -Math.PI / 2, 1);
    postBoard(g, rectBoard(st.code, '#ffffff', '#111', 512, 256, 110), -900, -3.2, 1.4, 0.7, 2.0, -Math.PI / 2, 1);   // distant station name board
    g.userData = { home, starter };
    return g;
  }
  const builtStations = new Map();
  function update(sCam) {
    const c0 = Math.floor((sCam - 450) / CH), c1 = Math.floor((sCam + 1300) / CH);
    for (let c = c0; c <= c1; c++) if (!chunks.has(c)) { const g = buildChunk(c); scene.add(g); chunks.set(c, g); }
    for (const [c, g] of chunks) if (c < c0 - 1 || c > c1 + 1) { scene.remove(g); g.traverse((o) => { if (o.geometry && o.geometry !== palmCrown && o.geometry !== palmTrunk && o.geometry !== roundCrown && o.geometry !== roundTrunk && o.geometry !== houseBody && o.geometry !== tankGeo) o.geometry.dispose(); }); chunks.delete(c); }
    stations.forEach((st, i) => { const near = sCam > st.s - 1600 && sCam < st.s + 900;
      if (near && !builtStations.has(i)) { const g = buildStation(st, i === 0, i === stations.length - 1); scene.add(g); builtStations.set(i, g); st.obj = g; st.home = g.userData.home; st.starter = g.userData.starter; if (st.aspect) { st.home.userData.set(st.homeAspect || 'amber'); st.starter.userData.set(st.aspect); } }
      if (!near && builtStations.has(i)) { const g = builtStations.get(i); scene.remove(g); builtStations.delete(i); st.obj = st.home = st.starter = null; } });
  }
  function setAspect(st, which, a) { if (which === 'starter') st.aspect = a; else st.homeAspect = a; const sig = which === 'starter' ? st.starter : st.home; if (sig) sig.userData.set(a); }
  return { stations, zones, END, START, f, df, at, heading, update, setAspect, zoneAt };
}
