// Rolling stock in the style of Indian broad-gauge trains: a twin-cab electric locomotive with a pantograph and
// LHB-style air-conditioned coaches. Original liveries, no logos. Each vehicle faces +x; units are metres.
import { THREE, M, add, rbox, cyl, cv, tex } from './kit.js';
export const GAUGE = 1.676, WR = 0.55;
export const spinning = [];
function wheelset(p, x) {
  const g = new THREE.Group(); g.position.set(x, WR, 0); p.add(g); spinning.push(g);
  const ax = add(g, cyl(0.1, 0.1, 2.2, 12), M.metal); ax.rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) { const z = s * GAUGE / 2;
    const w = add(g, cyl(WR, WR, 0.14, 32), M.wheel, 0, 0, z); w.rotation.x = Math.PI / 2;
    const f = add(g, cyl(WR + 0.035, WR + 0.035, 0.03, 32), M.wheel, 0, 0, z - s * 0.065); f.rotation.x = Math.PI / 2;
    const d = add(g, cyl(WR * 0.78, WR * 0.78, 0.17, 24), M.dark, 0, 0, z + s * 0.01); d.rotation.x = Math.PI / 2;
    for (let k = 0; k < 3; k++) { const sp = add(g, new THREE.BoxGeometry(0.08, WR * 1.4, 0.04), M.wheel, 0, 0, z + s * 0.1); sp.rotation.z = k * Math.PI / 3; } }
}
function bogie(p, x, n, sp, motor) {
  const g = new THREE.Group(); g.position.set(x, 0, 0); p.add(g); const L = (n - 1) * sp;
  for (let i = 0; i < n; i++) wheelset(g, -L / 2 + i * sp);
  for (const s of [-1, 1]) { add(g, rbox(L + 1.3, 0.34, 0.24, 0.06), M.black, 0, 0.85, s * 1.08);
    for (let i = 0; i < n; i++) { const ax = -L / 2 + i * sp; add(g, rbox(0.5, 0.42, 0.3, 0.05), M.dark, ax, WR, s * 1.1); add(g, cyl(0.13, 0.13, 0.34, 12), M.yellow, ax, 1.08, s * 1.06); } }
  add(g, rbox(L + 0.4, 0.22, 1.9, 0.05), M.black, 0, 1.08, 0);
  if (motor) for (let i = 0; i < n; i++) { const m = add(g, cyl(0.32, 0.32, 1.0, 16), M.dark, -L / 2 + i * sp + 0.5, 0.66, 0); m.rotation.x = Math.PI / 2; }
  return g;
}
const coupler = (p, x, d) => { add(p, rbox(1.0, 0.32, 0.36, 0.06), M.black, x + d * 0.5, 1.08, 0); add(p, rbox(0.42, 0.42, 0.52, 0.08), M.black, x + d * 1.05, 1.08, 0); };
const decal = (p, w, h, t, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshPhysicalMaterial({ map: t, transparent: true, roughness: 0.4, metalness: 0.15, clearcoat: 0.4, polygonOffset: true, polygonOffsetFactor: -2 })); m.position.set(x, y, z); m.rotation.y = ry; p.add(m); return m; };

// ---- locomotive ----
const locoSide = (num) => { const W = 2048, H = 512, c = cv(W, H), g = c.getContext('2d');
  g.fillStyle = '#efe4c6'; g.fillRect(0, H * 0.3, W, H * 0.16); g.fillStyle = '#f2c12e'; g.fillRect(0, H * 0.46, W, H * 0.025);   // cream band + yellow line
  g.fillStyle = 'rgba(20,20,22,.85)'; for (const [x0, x1] of [[0.2, 0.33], [0.38, 0.47], [0.53, 0.62], [0.67, 0.8]]) for (let y = 0.52; y < 0.86; y += 0.03) g.fillRect(W * x0, H * y, W * (x1 - x0), 6);   // louvres
  g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 3; for (const x of [0.09, 0.91]) { g.strokeRect(W * x - 70, H * 0.12, 140, H * 0.82); }   // cab doors
  g.fillStyle = '#0d161e'; for (const x of [0.09, 0.91]) { g.fillRect(W * x - 46, H * 0.16, 92, H * 0.13); }
  g.fillStyle = '#efe4c6'; g.font = 'bold 60px sans-serif'; g.textAlign = 'center'; g.fillText(num, W * 0.5, H * 0.43);
  return tex(c); };
export function buildLoco(num) {
  const g = new THREE.Group(), W = 3.15, L = 20.4, Y0 = 1.3;
  add(g, rbox(L, 0.45, W, 0.06), M.black, 0, Y0, 0);
  add(g, rbox(L - 0.2, 2.85, W, 0.16), M.maroon, 0, Y0 + 1.62, 0);
  for (const s of [-1, 1]) decal(g, L - 0.4, 2.85, locoSide(num), 0, Y0 + 1.62, s * (W / 2 + 0.012), s > 0 ? 0 : Math.PI);
  add(g, rbox(L - 1, 0.25, W - 0.3, 0.1), M.roof, 0, Y0 + 3.15, 0);
  // cab ends: sloped windscreens, twin headlights, marker lights, nose band
  for (const e of [-1, 1]) {
    const x = e * (L / 2 - 0.05);
    for (const z of [-0.72, 0.72]) { const gl = add(g, new THREE.PlaneGeometry(1.25, 0.95), M.glass, x + e * 0.02, Y0 + 2.55, z); gl.rotation.y = e > 0 ? Math.PI / 2 : -Math.PI / 2; gl.rotation.x = 0; }
    add(g, rbox(0.06, 1.15, 2.95, 0.04), M.black, x, Y0 + 2.55, 0);
    add(g, rbox(0.08, 0.38, W - 0.1, 0.04), M.cream, x + e * 0.01, Y0 + 1.85, 0);
    for (const z of [-0.32, 0.32]) { const l = add(g, cyl(0.17, 0.17, 0.12, 20), M.lamp, x + e * 0.06, Y0 + 3.2, z); l.rotation.z = Math.PI / 2; }
    for (const z of [-1.2, 1.2]) { const l = add(g, cyl(0.1, 0.1, 0.08, 14), M.lamp, x + e * 0.06, Y0 + 1.1, z); l.rotation.z = Math.PI / 2; }
    const pilot = add(g, rbox(0.9, 0.55, 2.8, 0.06), M.yellow, x + e * 0.4, 0.72, 0); pilot.rotation.z = e * 0.5;
    coupler(g, e * L / 2, e);
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) add(g, rbox(0.5, 0.05, 0.25, 0.02), M.metal, x - e * 1.0, 0.55 + k * 0.3, s * 1.5);   // steps
  }
  // roof: two pantographs (the rear one raised), insulators, main breaker, roof bars
  const panto = (x, up) => { const pg = new THREE.Group(); pg.position.set(x, Y0 + 3.3, 0); g.add(pg);
    add(pg, rbox(1.8, 0.12, 1.4, 0.04), M.dark, 0, 0, 0); for (const z of [-0.5, 0.5]) for (const xx of [-0.7, 0.7]) add(pg, cyl(0.07, 0.09, 0.32, 10), M.insul, xx, -0.1, z);
    const h = up ? 1.95 : 0.35, a1 = Math.atan2(h * 0.55, 1.4), l1 = Math.hypot(1.4, h * 0.55), a2 = Math.atan2(h * 0.45, 1.3), l2 = Math.hypot(1.3, h * 0.45);
    const low = add(pg, cyl(0.05, 0.05, l1, 8), M.metal, -0.3 + Math.cos(a1) * l1 / 2 - 0.7, 0.1 + Math.sin(a1) * l1 / 2, 0); low.rotation.z = a1 - Math.PI / 2;
    const kx = -1.0 + Math.cos(a1) * l1, ky = 0.1 + Math.sin(a1) * l1;
    const upA = add(pg, cyl(0.04, 0.04, l2, 8), M.metal, kx - Math.cos(a2) * l2 / 2, ky + Math.sin(a2) * l2 / 2, 0); upA.rotation.z = -(a2 - Math.PI / 2) + Math.PI;
    const hx = kx - Math.cos(a2) * l2, hy = ky + Math.sin(a2) * l2;
    const bar = add(pg, cyl(0.05, 0.05, 1.7, 8), M.metal, hx, hy, 0); bar.rotation.x = Math.PI / 2;
    for (const z of [-0.85, 0.85]) { const horn = add(pg, cyl(0.04, 0.04, 0.4, 8), M.metal, hx, hy - 0.12, z + Math.sign(z) * 0.12); horn.rotation.x = Math.sign(z) * 0.9; }
    return pg; };
  panto(-5.5, true); panto(5.5, false);
  add(g, rbox(2.2, 0.45, 1.1, 0.08), M.roof, 0, Y0 + 3.5, 0); for (const z of [-0.35, 0.35]) add(g, cyl(0.1, 0.12, 0.5, 10), M.insul, 1.6, Y0 + 3.5, z);
  const bar = add(g, cyl(0.04, 0.04, 11, 8), M.metal, 0, Y0 + 3.7, 0); bar.rotation.z = Math.PI / 2;
  add(g, rbox(6, 0.6, 1.7, 0.1), M.dark, 0, 0.95, 0);                                 // underslung transformer
  bogie(g, -6.4, 3, 2.0, true); bogie(g, 6.4, 3, 2.0, true);
  g.userData = { length: L };
  const spot = new THREE.SpotLight('#fff3d0', 0, 140, 0.32, 0.5, 1.2); spot.position.set(L / 2 + 0.2, Y0 + 3.2, 0); spot.target.position.set(L / 2 + 60, 0, 0); g.add(spot, spot.target); g.userData.spot = spot;
  return g;
}
// ---- coaches ----
const coachSide = (label, last) => { const W = 4096, H = 512, c = cv(W, H), g = c.getContext('2d');
  g.fillStyle = '#b3262a'; g.fillRect(0, H * 0.16, W, H * 0.4);                       // red window band
  g.fillStyle = '#f2c12e'; g.fillRect(0, H * 0.56, W, H * 0.02);
  for (let i = 0; i < 10; i++) { const x = 520 + i * 312, y = H * 0.21, w = 250, h = H * 0.3;
    const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#5d7b92'); gr.addColorStop(0.5, '#15222d'); gr.addColorStop(1, '#0a1118'); g.fillStyle = gr; g.beginPath(); g.roundRect(x, y, w, h, 14); g.fill();
    g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(x + 40, y + h); g.lineTo(x + 110, y); g.lineTo(x + 150, y); g.lineTo(x + 80, y + h); g.fill(); }
  for (const x of [120, W - 300]) { g.fillStyle = '#d4d7db'; g.fillRect(x, H * 0.1, 180, H * 0.8); g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 4; g.strokeRect(x, H * 0.1, 180, H * 0.8); g.fillStyle = '#0d161e'; g.fillRect(x + 40, H * 0.18, 100, H * 0.25); g.fillStyle = '#f2c12e'; g.fillRect(x - 18, H * 0.3, 10, H * 0.45); g.fillRect(x + 188, H * 0.3, 10, H * 0.45); }
  g.fillStyle = '#ffffff'; g.font = 'bold 64px sans-serif'; g.textAlign = 'center'; g.fillText(label, 420, H * 0.73); g.fillText(label, W - 420, H * 0.73);
  return tex(c); };
export function buildCoach(label, last = false) {
  const g = new THREE.Group(), W = 3.24, L = 23.5, Y0 = 1.25;
  add(g, rbox(L, 0.4, W - 0.4, 0.05), M.black, 0, Y0, 0);
  add(g, rbox(L, 2.75, W, 0.22), M.steel, 0, Y0 + 1.55, 0);
  for (const s of [-1, 1]) decal(g, L - 0.2, 2.6, coachSide(label, last), 0, Y0 + 1.6, s * (W / 2 + 0.012), s > 0 ? 0 : Math.PI);
  const rg = new THREE.CylinderGeometry(1.7, 1.7, L - 0.3, 40, 1, false, 0, Math.PI); rg.rotateZ(Math.PI / 2); rg.scale(1, 0.3, 0.95); add(g, rg, M.roof, 0, Y0 + 2.9, 0);
  for (const x of [-9.5, 9.5]) add(g, rbox(2.6, 0.35, 1.5, 0.1), M.roof, x, Y0 + 3.3, 0);
  for (const s of [-1, 1]) add(g, rbox(14, 0.6, 0.5, 0.06), M.dark, 0, 0.95, s * 0.95);
  for (const e of [-1, 1]) { add(g, rbox(0.6, 2.4, 1.5, 0.12), M.black, e * (L / 2 + 0.25), Y0 + 1.5, 0); coupler(g, e * L / 2, e); }
  bogie(g, -8.0, 2, 2.56, false); bogie(g, 8.0, 2, 2.56, false);
  if (last) {   // tail lamp and the yellow "LV" (last vehicle) board
    const tl = add(g, cyl(0.14, 0.14, 0.1, 16), M.red, -L / 2 - 0.55, 1.8, 0.6); tl.rotation.z = Math.PI / 2; g.userData.tail = tl;
    const c = cv(256, 256), x = c.getContext('2d'); x.fillStyle = '#f2c12e'; x.fillRect(0, 0, 256, 256); x.strokeStyle = '#111'; x.lineWidth = 26; x.beginPath(); x.moveTo(20, 20); x.lineTo(236, 236); x.moveTo(236, 20); x.lineTo(20, 236); x.stroke(); x.fillStyle = '#111'; x.font = 'bold 70px sans-serif'; x.textAlign = 'center'; x.fillText('LV', 128, 150);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshStandardMaterial({ map: tex(c), roughness: 0.6 })); b.position.set(-L / 2 - 0.56, 1.75, -0.5); b.rotation.y = -Math.PI / 2; g.add(b);
  }
  g.userData = { length: L, ...g.userData };
  return g;
}
