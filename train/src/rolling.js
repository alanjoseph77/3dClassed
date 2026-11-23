// Rolling stock in the style of Indian broad-gauge trains: a twin-cab electric passenger locomotive (rounded body,
// raked windscreens, single-arm pantographs, Co-Co bogies) and LHB-style AC coaches (curved body profile, FIAT-type
// bogies with disc brakes). Original liveries, no logos. Each vehicle faces +x; units are metres.
import { THREE, M, add, rbox, cyl, cv, tex } from './kit.js';
export const GAUGE = 1.676, WR = 0.545;
export const spinning = [];

// ---- extra materials ----
const P = (o) => new THREE.MeshPhysicalMaterial(o);
const MAT = {
  loco: P({ color: '#7d1a1f', roughness: 0.38, metalness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.18 }),
  locoRoof: P({ color: '#5d6166', roughness: 0.55, metalness: 0.45 }),
  steelBody: P({ color: '#c9ccd1', roughness: 0.3, metalness: 0.82, clearcoat: 0.3 }),
  coachRoof: P({ color: '#9aa0a7', roughness: 0.45, metalness: 0.6 }),
  under: P({ color: '#1c1e21', roughness: 0.75, metalness: 0.35 }),
  bogie: P({ color: '#2a2c2f', roughness: 0.6, metalness: 0.5 }),
  spring: P({ color: '#d9a21b', roughness: 0.5, metalness: 0.3 }),
  disc: P({ color: '#8f9398', roughness: 0.25, metalness: 0.95 }),
  rubber: P({ color: '#111214', roughness: 0.9, metalness: 0 }),
  hoseR: P({ color: '#b3261e', roughness: 0.6 }), hoseY: P({ color: '#d9a21b', roughness: 0.6 }),
  chrome: P({ color: '#d6dade', roughness: 0.15, metalness: 1 }),
  glassDark: new THREE.MeshPhysicalMaterial({ color: '#0a1218', roughness: 0.03, metalness: 0.4, clearcoat: 1, envMapIntensity: 2.0 }),
};
const decal = (p, w, h, t, x, y, z, ry, mat = {}) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshPhysicalMaterial({ map: t, transparent: true, roughness: 0.35, metalness: 0.2, clearcoat: 0.6, polygonOffset: true, polygonOffsetFactor: -2, ...mat })); m.position.set(x, y, z); m.rotation.y = ry; p.add(m); return m; };
// a body made by sweeping a cross-section (z, y) along x
function bodyShell(len, half, y0, wallTop, crown, shoulder = 0.42) {
  const s = new THREE.Shape(); s.moveTo(-half, y0); s.lineTo(half, y0); s.lineTo(half, wallTop);
  s.quadraticCurveTo(half, wallTop + shoulder * 0.9, half - shoulder, wallTop + shoulder); s.quadraticCurveTo(0, crown + 0.02, -(half - shoulder), wallTop + shoulder);
  s.quadraticCurveTo(-half, wallTop + shoulder * 0.9, -half, wallTop); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 3, curveSegments: 16 });
  g.translate(0, 0, -len / 2); g.rotateY(Math.PI / 2); return g;      // now along x
}
function wheelset(p, x, disc = false) {
  const g = new THREE.Group(); g.position.set(x, WR, 0); p.add(g); spinning.push(g);
  const ax = add(g, cyl(0.09, 0.09, 2.3, 12), M.metal); ax.rotation.x = Math.PI / 2;
  const prof = [[0.08, -0.07], [0.2, -0.07], [WR * 0.72, -0.045], [WR - 0.02, -0.07], [WR, -0.065], [WR + 0.035, -0.07], [WR + 0.035, -0.04], [WR, -0.03], [WR - 0.01, 0.07], [WR * 0.72, 0.05], [0.2, 0.07], [0.08, 0.07]];
  const wg = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 36); wg.rotateX(Math.PI / 2);
  for (const sd of [-1, 1]) { const w = add(g, wg, M.wheel, 0, 0, sd * GAUGE / 2); if (sd < 0) w.rotation.y = Math.PI;
    const hub = add(g, cyl(0.14, 0.14, 0.24, 16), M.metal, 0, 0, sd * (GAUGE / 2 + 0.06)); hub.rotation.x = Math.PI / 2; }
  if (disc) for (const z of [-0.45, -0.15, 0.15, 0.45]) { const d = add(g, cyl(0.32, 0.32, 0.08, 24), MAT.disc, 0, 0, z); d.rotation.x = Math.PI / 2; }
}
function coilSpring(p, x, y, z, h = 0.34, r = 0.12) { const pts = []; for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 2 * 5; pts.push(new THREE.Vector3(Math.cos(a) * r, -h / 2 + h * i / 60, Math.sin(a) * r)); } const t = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.025, 5); return add(p, t, MAT.spring, x, y, z); }
function bogie(p, x, n, sp, loco) {
  const g = new THREE.Group(); g.position.set(x, 0, 0); p.add(g); const L = (n - 1) * sp;
  for (let i = 0; i < n; i++) wheelset(g, -L / 2 + i * sp, !loco);
  for (const s of [-1, 1]) {
    const z = s * 1.12;
    add(g, rbox(L + (loco ? 1.6 : 1.2), 0.38, 0.22, 0.06), MAT.bogie, 0, 0.88, z);                    // side frame
    add(g, rbox(L + (loco ? 1.2 : 0.8), 0.12, 0.3, 0.04), MAT.bogie, 0, 0.68, z);                       // lower flange
    for (let i = 0; i < n; i++) { const ax = -L / 2 + i * sp;
      add(g, rbox(0.46, 0.4, 0.34, 0.05), MAT.under, ax, WR, s * 1.13);                                 // axle box
      coilSpring(g, ax - 0.22, 0.86, s * 1.13); coilSpring(g, ax + 0.22, 0.86, s * 1.13);              // primary springs
      if (loco) { const bc = add(g, cyl(0.11, 0.11, 0.3, 12), MAT.under, ax + sp / 2 - 0.15, 0.95, s * 1.26); bc.rotation.z = Math.PI / 2; add(g, rbox(0.3, 0.35, 0.25, 0.04), MAT.under, ax + sp / 2 - 0.05, 1.1, s * 1.22); }
    }
    const dm = add(g, cyl(0.05, 0.05, 0.5, 8), MAT.chrome, L / 2 - 0.2, 1.0, s * 1.3); dm.rotation.z = 0.6;   // damper
  }
  for (let i = 0; i <= (loco ? 2 : 1); i++) add(g, rbox(0.3, 0.3, 2.3, 0.05), MAT.bogie, -L / 2 + (L / (loco ? 2 : 1)) * i - (loco ? 0 : 0), 0.9, 0);   // transoms
  if (!loco) for (const s of [-1, 1]) { coilSpring(g, 0, 1.15, s * 1.0, 0.32, 0.2); coilSpring(g, 0.5, 1.15, s * 1.0, 0.32, 0.2); }   // secondary springs
  if (loco) for (let i = 0; i < n; i++) { const m = add(g, cyl(0.34, 0.34, 1.05, 18), MAT.under, -L / 2 + i * sp + 0.55, 0.62, 0); m.rotation.x = Math.PI / 2; }
  return g;
}
function cbc(p, x, d) {   // centre buffer coupler and hoses
  add(p, rbox(1.0, 0.3, 0.34, 0.06), MAT.under, x + d * 0.5, 1.08, 0); add(p, rbox(0.45, 0.42, 0.55, 0.08), MAT.under, x + d * 1.05, 1.08, 0);
  for (const [z, m] of [[0.5, MAT.hoseR], [-0.5, MAT.hoseY], [0.8, MAT.hoseR], [-0.8, MAT.hoseY]]) { const h = add(p, cyl(0.04, 0.04, 0.6, 8), m, x + d * 0.35, 0.95, z); h.rotation.z = d * 0.6; }
}

// ---- locomotive ----
const locoSide = (num) => { const W = 2048, H = 512, c = cv(W, H), g = c.getContext('2d');
  g.fillStyle = '#efe4c6'; g.fillRect(0, H * 0.4, W, H * 0.1); g.fillStyle = '#f2c12e'; g.fillRect(0, H * 0.5, W, H * 0.018); g.fillRect(0, H * 0.375, W, H * 0.012);
  // grilles: framed louvre panels
  for (const [x0, x1] of [[0.19, 0.31], [0.35, 0.47], [0.53, 0.65], [0.69, 0.81]]) { g.fillStyle = 'rgba(25,25,28,.9)'; g.fillRect(W * x0, H * 0.56, W * (x1 - x0), H * 0.3); g.fillStyle = 'rgba(120,120,125,.9)'; for (let y = 0.57; y < 0.86; y += 0.024) g.fillRect(W * x0 + 4, H * y, W * (x1 - x0) - 8, 3); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 4; g.strokeRect(W * x0, H * 0.56, W * (x1 - x0), H * 0.3); }
  for (const [x0, x1] of [[0.19, 0.31], [0.53, 0.65]]) { g.fillStyle = 'rgba(25,25,28,.85)'; g.fillRect(W * x0, H * 0.1, W * (x1 - x0), H * 0.22); }
  g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 3; for (const x of [0.17, 0.33, 0.5, 0.67, 0.83]) { g.beginPath(); g.moveTo(W * x, H * 0.06); g.lineTo(W * x, H * 0.95); g.stroke(); }   // panel seams
  for (const [xc, d] of [[0.065, 1], [0.935, -1]]) {   // cab side: door with a droplight window, and a fixed window
    g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(W * xc - 55, H * 0.08, 110, H * 0.86); g.fillStyle = '#7d1a1f'; g.fillRect(W * xc - 51, H * 0.09, 102, H * 0.84);
    g.fillStyle = '#efe4c6'; g.fillRect(W * xc - 51, H * 0.4, 102, H * 0.1);
    g.fillStyle = '#0b141b'; g.beginPath(); g.roundRect(W * xc - 38, H * 0.12, 76, H * 0.22, 10); g.fill(); g.beginPath(); g.roundRect(W * xc + d * 70 - 34, H * 0.12, 68, H * 0.2, 10); g.fill();
    g.fillStyle = '#d6dade'; g.fillRect(W * xc + 40, H * 0.5, 8, H * 0.3); }
  g.fillStyle = '#efe4c6'; g.font = 'bold 46px Arial'; g.textAlign = 'center'; g.fillText(num, W * 0.5, H * 0.345);
  return tex(c); };
const locoFront = () => { const c = cv(512, 512), g = c.getContext('2d');
  g.fillStyle = '#efe4c6'; g.beginPath(); g.moveTo(0, 300); g.lineTo(256, 360); g.lineTo(512, 300); g.lineTo(512, 340); g.lineTo(256, 400); g.lineTo(0, 340); g.fill();   // cream chevron
  g.fillStyle = '#f2c12e'; g.fillRect(0, 470, 512, 42); g.fillStyle = '#111'; for (let x = -40; x < 520; x += 64) { g.beginPath(); g.moveTo(x, 512); g.lineTo(x + 30, 470); g.lineTo(x + 52, 470); g.lineTo(x + 22, 512); g.fill(); }   // hazard stripes
  return tex(c); };
export function buildLoco(num) {
  const g = new THREE.Group(), L = 20.6, HW = 1.575, Y0 = 1.42;
  add(g, rbox(L - 0.4, 0.34, 3.0, 0.05), MAT.under, 0, Y0 - 0.12, 0);                                            // underframe
  const shell = add(g, bodyShell(L - 0.5, HW, Y0, 3.62, 4.18), MAT.loco);
  for (const s of [-1, 1]) decal(g, L - 0.5, 2.25, locoSide(num), 0, Y0 + 1.1, s * (HW + 0.105), s > 0 ? 0 : Math.PI);
  for (const s of [-1, 1]) add(g, rbox(L - 0.8, 0.05, 0.06, 0.02), MAT.chrome, 0, Y0 + 2.3, s * (HW + 0.12));       // rain strip
  // roof: equipment well, fans, insulators, roof bar, horns
  add(g, rbox(13, 0.12, 2.2, 0.05), MAT.locoRoof, 0, 4.24, 0);
  for (const x of [-2.6, 2.6]) { add(g, cyl(0.55, 0.6, 0.16, 28), MAT.locoRoof, x, 4.33, 0); const fg = add(g, new THREE.CircleGeometry(0.5, 28), new THREE.MeshStandardMaterial({ color: '#202225', roughness: 0.6, metalness: 0.4, wireframe: false }), x, 4.415, 0); fg.rotation.x = -Math.PI / 2; for (let k = 0; k < 6; k++) add(g, new THREE.BoxGeometry(1.0, 0.02, 0.03), MAT.chrome, x, 4.42, 0).rotation.y = k * Math.PI / 6; }
  add(g, rbox(1.6, 0.5, 1.0, 0.08), MAT.locoRoof, 0, 4.5, 0);                                                     // vacuum circuit breaker housing
  for (const z of [-0.3, 0.3]) for (const x of [-0.5, 0.5]) add(g, cyl(0.07, 0.11, 0.5, 10), M.insul, x, 4.95, z);
  const rb = add(g, cyl(0.035, 0.035, 12, 8), MAT.chrome, 0, 4.62, -0.6); rb.rotation.z = Math.PI / 2;
  // single-arm pantographs: frame, four insulators, lower arm, upper arm, pan head with two collector strips and horns
  const panto = (x, h, flip) => { const pg = new THREE.Group(); pg.position.set(x, 4.3, 0); pg.scale.x = flip; g.add(pg);
    add(pg, rbox(1.7, 0.1, 1.3, 0.03), MAT.bogie, 0, 0.32, 0); for (const z of [-0.5, 0.5]) for (const xx of [-0.65, 0.65]) add(pg, cyl(0.07, 0.1, 0.3, 10), M.insul, xx, 0.15, z);
    const A = new THREE.Vector3(-0.6, 0.38, 0), knee = new THREE.Vector3(0.9, 0.38 + h * 0.55, 0), head = new THREE.Vector3(-0.15, 0.38 + h, 0);
    const bar = (a, b, r, m) => { const d = b.clone().sub(a), o = add(pg, cyl(r, r, d.length(), 8), m); o.position.copy(a).add(b).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return o; };
    for (const z of [-0.25, 0.25]) bar(A.clone().setZ(z), knee.clone().setZ(z * 0.2), 0.045, MAT.chrome);
    bar(knee, head, 0.035, MAT.chrome); bar(new THREE.Vector3(-0.3, 0.4, 0), knee.clone().add(new THREE.Vector3(-0.2, -0.1, 0)), 0.02, MAT.chrome);
    for (const dx of [-0.13, 0.13]) { const st = add(pg, rbox(0.06, 0.06, 1.55, 0.02), MAT.bogie, head.x + dx, head.y + 0.04, 0); void st; }
    for (const z of [-0.78, 0.78]) { const hn = add(pg, cyl(0.025, 0.025, 0.35, 6), MAT.chrome, head.x, head.y - 0.08, z + Math.sign(z) * 0.1); hn.rotation.x = Math.sign(z) * 1.0; }
    return pg; };
  panto(-5.6, 1.95, 1); panto(5.6, 0.3, -1);
  // cab ends (the face of the body is at about x = +-10.22)
  for (const e of [-1, 1]) {
    const xf = e * (L / 2 - 0.08), ry = e > 0 ? Math.PI / 2 : -Math.PI / 2;
    decal(g, 2.95, 2.55, locoFront(), xf + e * 0.01, Y0 + 1.25, 0, ry, { clearcoat: 0.6 });
    for (const z of [-0.72, 0.72]) { const gl = add(g, rbox(0.06, 0.95, 1.22, 0.08), MAT.glassDark, xf - e * 0.02, 3.3, z); gl.rotation.z = e * 0.14; }
    add(g, rbox(0.06, 1.05, 0.12, 0.02), MAT.under, xf + e * 0.02, 3.3, 0);                                   // centre pillar
    add(g, rbox(0.08, 0.07, 2.9, 0.03), MAT.under, xf + e * 0.04, 2.75, 0);                                   // sill
    for (const z of [-0.45, 0.95]) { const wp = add(g, rbox(0.03, 0.8, 0.03, 0.01), MAT.under, xf + e * 0.07, 3.15, z); wp.rotation.x = 0.6; }
    for (const z of [-0.3, 0.3]) { const rim = add(g, cyl(0.2, 0.2, 0.08, 24), MAT.chrome, xf + e * 0.02, 3.98, z); rim.rotation.z = Math.PI / 2; const hl = add(g, cyl(0.15, 0.15, 0.08, 24), M.lamp, xf + e * 0.06, 3.98, z); hl.rotation.z = Math.PI / 2; }
    for (const z of [-1.15, 1.15]) { const ml = add(g, cyl(0.09, 0.09, 0.08, 16), M.lamp, xf + e * 0.05, 1.95, z); ml.rotation.z = Math.PI / 2; const tl = add(g, cyl(0.075, 0.075, 0.08, 16), e > 0 ? M.lamp : M.red, xf + e * 0.05, 2.25, z); tl.rotation.z = Math.PI / 2; }
    for (const z of [-0.9, 0.9]) add(g, cyl(0.12, 0.08, 0.35, 12), MAT.chrome, xf - e * 0.5, 4.3, z).rotation.z = e * Math.PI / 2;   // air horns
    for (const z of [-1.45, 1.45]) add(g, cyl(0.03, 0.03, 1.5, 8), MAT.chrome, xf + e * 0.08, 2.1, z);   // grab rails
    const plow = add(g, rbox(0.55, 0.32, 2.7, 0.05), M.yellow, xf + e * 0.28, 0.5, 0); plow.rotation.z = e * 0.65;
    cbc(g, e * (L / 2 - 0.1), e);
    for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) add(g, rbox(0.45, 0.04, 0.26, 0.02), MAT.chrome, xf - e * 1.3, 0.48 + k * 0.28, sd * 1.55);   // cab steps
  }
  // under-body: transformer, tanks, air reservoirs, battery boxes
  add(g, rbox(5.5, 0.85, 2.3, 0.08), MAT.under, 0, 0.85, 0);
  for (const s of [-1, 1]) { const ar = add(g, cyl(0.24, 0.24, 3.2, 16), MAT.under, -0.2, 0.92, s * 1.25); ar.rotation.z = Math.PI / 2; add(g, rbox(1.4, 0.55, 0.45, 0.05), MAT.under, 3.6, 0.9, s * 1.2); }
  bogie(g, -6.55, 3, 2.05, true); bogie(g, 6.55, 3, 2.05, true);
  g.userData = { length: L };
  const spot = new THREE.SpotLight('#fff3d0', 0, 160, 0.3, 0.5, 1.2); spot.position.set(L / 2 + 0.2, Y0 + 3.1, 0); spot.target.position.set(L / 2 + 60, 0, 0); g.add(spot, spot.target); g.userData.spot = spot;
  void shell; return g;
}

// ---- LHB-style coaches ----
const coachSide = (label, kind) => { const W = 4096, H = 512, c = cv(W, H), g = c.getContext('2d');
  g.fillStyle = '#a3222a'; g.fillRect(0, H * 0.18, W, H * 0.36); g.fillStyle = '#7d1a1f'; g.fillRect(0, H * 0.54, W, H * 0.025);
  g.fillStyle = '#f2c12e'; g.fillRect(0, H * 0.585, W, H * 0.012);
  const n = 11; for (let i = 0; i < n; i++) { const x = 560 + i * (W - 1120) / (n - 1) - 120, y = H * 0.22, w = 240, h = H * 0.27;
    g.fillStyle = '#2b2d30'; g.beginPath(); g.roundRect(x - 10, y - 10, w + 20, h + 20, 20); g.fill();
    const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#7894aa'); gr.addColorStop(0.45, '#1a2a37'); gr.addColorStop(1, '#0a1118'); g.fillStyle = gr; g.beginPath(); g.roundRect(x, y, w, h, 14); g.fill();
    g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(x + 40, y + h); g.lineTo(x + 120, y); g.lineTo(x + 160, y); g.lineTo(x + 80, y + h); g.fill();
    g.fillStyle = 'rgba(240,230,210,.35)'; g.fillRect(x + 6, y + 6, w - 12, 10); }     // curtain line
  for (const x of [150, W - 330]) { g.fillStyle = '#b9bdc2'; g.fillRect(x, H * 0.08, 180, H * 0.86); g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 5; g.strokeRect(x, H * 0.08, 180, H * 0.86); g.fillStyle = '#0b141b'; g.beginPath(); g.roundRect(x + 45, H * 0.16, 90, H * 0.26, 10); g.fill(); g.fillStyle = '#d9a21b'; g.fillRect(x - 22, H * 0.36, 10, H * 0.5); g.fillRect(x + 192, H * 0.36, 10, H * 0.5); }
  for (let x = 380; x < W - 380; x += 220) { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x, H * 0.62, 2, H * 0.32); }   // panel seams
  g.fillStyle = '#ffffff'; g.font = 'bold 60px Arial'; g.textAlign = 'center'; g.fillText(label, 520, H * 0.73); g.fillText(label, W - 520, H * 0.73);
  g.fillStyle = '#2b2d30'; g.font = 'bold 34px Arial'; g.fillText(kind, W / 2, H * 0.73);
  return tex(c); };
export function buildCoach(label, last = false) {
  const g = new THREE.Group(), L = 23.54, HW = 1.62, Y0 = 1.28;
  add(g, rbox(L - 0.6, 0.3, 2.9, 0.05), MAT.under, 0, Y0 - 0.1, 0);
  add(g, bodyShell(L - 0.4, HW, Y0, 3.45, 4.05, 0.55), MAT.steelBody);
  const kind = label[0] === 'A' ? 'AC 2 TIER' : label[0] === 'H' ? 'AC FIRST' : 'AC 3 TIER';
  for (const s of [-1, 1]) decal(g, L - 0.6, 2.2, coachSide(label, kind), 0, Y0 + 1.12, s * (HW + 0.105), s > 0 ? 0 : Math.PI, { metalness: 0.5 });
  for (const x of [-9.6, 9.6]) { add(g, rbox(2.8, 0.32, 1.7, 0.12), MAT.coachRoof, x, 4.1, 0); for (const z of [-0.45, 0.45]) { const f = add(g, new THREE.CircleGeometry(0.32, 20), MAT.under, x, 4.27, z); f.rotation.x = -Math.PI / 2; } }
  for (let x = -7.5; x <= 7.5; x += 1.5) add(g, rbox(0.06, 0.03, 2.2, 0.01), MAT.coachRoof, x, 4.06, 0);                   // roof ribs
  for (const s of [-1, 1]) { add(g, rbox(13, 0.55, 0.5, 0.06), MAT.under, 0, 0.98, s * 0.95); const tk = add(g, cyl(0.3, 0.3, 2.6, 16), MAT.under, -4, 0.95, s * 0.3); tk.rotation.z = Math.PI / 2; }
  for (const e of [-1, 1]) { add(g, rbox(0.7, 2.6, 1.7, 0.18), MAT.rubber, e * (L / 2 + 0.2), Y0 + 1.4, 0); add(g, rbox(0.12, 2.8, 2.0, 0.06), MAT.under, e * (L / 2 - 0.05), Y0 + 1.4, 0); cbc(g, e * (L / 2 - 0.1), e); }
  bogie(g, -7.95, 2, 2.56, false); bogie(g, 7.95, 2, 2.56, false);
  if (last) {
    const tl = add(g, cyl(0.14, 0.14, 0.1, 16), M.red, -L / 2 - 0.6, 1.9, 0.62); tl.rotation.z = Math.PI / 2; g.userData.tail = tl;
    const c = cv(256, 256), x = c.getContext('2d'); x.fillStyle = '#f2c12e'; x.fillRect(0, 0, 256, 256); x.strokeStyle = '#111'; x.lineWidth = 26; x.beginPath(); x.moveTo(20, 20); x.lineTo(236, 236); x.moveTo(236, 20); x.lineTo(20, 236); x.stroke(); x.fillStyle = '#111'; x.font = 'bold 70px sans-serif'; x.textAlign = 'center'; x.fillText('LV', 128, 150);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshStandardMaterial({ map: tex(c), roughness: 0.6 })); b.position.set(-L / 2 - 0.62, 1.75, -0.5); b.rotation.y = -Math.PI / 2; g.add(b);
  }
  g.userData = { length: L, ...g.userData };
  return g;
}
