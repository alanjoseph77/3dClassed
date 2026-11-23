// A realistic 3D train in three.js: a diesel-electric locomotive and two passenger coaches on ballasted track.
// Everything is built from code (no model files). Units are metres. The train faces +x.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Sky } from 'three/addons/objects/Sky.js';

const $ = (id) => document.getElementById(id);
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.8;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#bcd0e0', 90, 330);
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 900);

// ---- sky, sun, reflections --------------------------------------------------------------------------------------------
const sky = new Sky(); sky.scale.setScalar(450000);
const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(66), THREE.MathUtils.degToRad(215));
Object.assign(sky.material.uniforms, { turbidity: { value: 3.2 }, rayleigh: { value: 1.3 }, mieCoefficient: { value: 0.004 }, mieDirectionalG: { value: 0.8 }, sunPosition: { value: sunDir } });
scene.add(sky);
{ const pm = new THREE.PMREMGenerator(renderer), es = new THREE.Scene(); es.add(sky.clone()); es.children[0].material = sky.material; scene.environment = pm.fromScene(es, 0.02).texture; scene.environmentIntensity = 0.85; pm.dispose(); }
const sun = new THREE.DirectionalLight('#fff1dc', 3.2);
sun.position.copy(sunDir).multiplyScalar(60); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 14, bottom: -14, near: 10, far: 140 }); sun.shadow.bias = -0.0002; sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target, new THREE.HemisphereLight('#cfe0f4', '#6c7a58', 0.55));

// ---- procedural textures ----------------------------------------------------------------------------------------------
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const tex = (c, srgb = true, rep = null) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); } return t; };
const noise = (g, w, h, a, n) => { for (let i = 0; i < n; i++) { const v = Math.random(); g.fillStyle = `rgba(${v < 0.5 ? 0 : 255},${v < 0.5 ? 0 : 255},${v < 0.5 ? 0 : 255},${a * Math.random()})`; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } };
const ballastTex = (() => { const c = cv(512, 512), g = c.getContext('2d'); g.fillStyle = '#7a7770'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 5200; i++) { const s = 3 + Math.random() * 7, v = 90 + Math.random() * 90; g.fillStyle = `rgb(${v},${v - 4},${v - 10})`; g.beginPath(); g.ellipse(Math.random() * 512, Math.random() * 512, s, s * 0.7, Math.random() * 3, 0, 7); g.fill(); } return tex(c, true, [1, 1]); })();
const grassTex = (() => { const c = cv(512, 512), g = c.getContext('2d'); g.fillStyle = '#6f8a47'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 9000; i++) { const v = Math.random(); g.fillStyle = v < 0.5 ? 'rgba(60,90,35,.35)' : 'rgba(150,170,80,.3)'; g.fillRect(Math.random() * 512, Math.random() * 512, 2, 5 + Math.random() * 6); } return tex(c, true, [110, 110]); })();
const metalNoise = (() => { const c = cv(256, 256), g = c.getContext('2d'); g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256); noise(g, 256, 256, 0.35, 5000); return tex(c, false, [6, 6]); })();

// ---- materials --------------------------------------------------------------------------------------------------------
const mat = (o) => new THREE.MeshPhysicalMaterial(o);
const M = {
  body: mat({ color: '#1d4f86', roughness: 0.42, metalness: 0.15, clearcoat: 0.7, clearcoatRoughness: 0.3, roughnessMap: metalNoise }),
  cream: mat({ color: '#e9e2cf', roughness: 0.45, metalness: 0.05, clearcoat: 0.5, clearcoatRoughness: 0.3, roughnessMap: metalNoise }),
  roof: mat({ color: '#9aa1a8', roughness: 0.6, metalness: 0.3, roughnessMap: metalNoise }),
  dark: mat({ color: '#25282c', roughness: 0.7, metalness: 0.4, roughnessMap: metalNoise }),
  steel: mat({ color: '#8d9399', roughness: 0.35, metalness: 0.9 }),
  wheel: mat({ color: '#55585c', roughness: 0.45, metalness: 0.85 }),
  rail: mat({ color: '#6e6b66', roughness: 0.35, metalness: 0.85 }),
  rust: mat({ color: '#6b4a38', roughness: 0.9, metalness: 0.2 }),
  glass: mat({ color: '#0b141c', roughness: 0.04, metalness: 0.2, clearcoat: 1, envMapIntensity: 1.8 }),
  yellow: mat({ color: '#e8b82c', roughness: 0.5, metalness: 0.1 }),
  red: mat({ color: '#b3282b', roughness: 0.45, metalness: 0.15 }),
  lamp: new THREE.MeshStandardMaterial({ color: '#fff8e0', emissive: '#fff2c0', emissiveIntensity: 0.1, roughness: 0.2 }),
  tail: new THREE.MeshStandardMaterial({ color: '#7a1010', emissive: '#ff2020', emissiveIntensity: 0.15, roughness: 0.3 }),
};
const add = (parent, geo, m, x = 0, y = 0, z = 0, name = '') => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; if (name) o.name = name; parent.add(o); return o; };
const rbox = (w, h, d, r = 0.08) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2));
const cyl = (r0, r1, h, seg = 24) => new THREE.CylinderGeometry(r0, r1, h, seg);
const decal = (w, h, t, parent, x, y, z, ry, extra = {}) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshPhysicalMaterial({ map: t, transparent: true, roughness: 0.4, metalness: 0.1, clearcoat: 0.4, polygonOffset: true, polygonOffsetFactor: -2, ...extra })); m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; parent.add(m); return m; };

// ---- livery textures (no logos: a colour scheme and a number only) -------------------------------------------------------
const hoodSide = (() => {
  const W = 2048, Hh = 512, c = cv(W, Hh), g = c.getContext('2d');
  g.fillStyle = '#e9e2cf'; g.fillRect(0, Hh * 0.62, W, Hh * 0.1);                       // cream stripe
  g.fillStyle = '#e8b82c'; g.fillRect(0, Hh * 0.72, W, Hh * 0.03);                      // yellow pin-stripe
  g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 3;
  for (let x = 0; x <= W; x += W / 7.5) { g.beginPath(); g.moveTo(x, Hh * 0.04); g.lineTo(x, Hh * 0.6); g.stroke(); }   // panel seams
  g.fillStyle = 'rgba(0,0,0,.55)';
  for (const [x0, x1] of [[0.16, 0.30], [0.50, 0.64], [0.80, 0.94]]) for (let y = 0.08; y < 0.56; y += 0.024) g.fillRect(W * x0, Hh * y, W * (x1 - x0), 4);   // louvres
  g.fillStyle = '#c9ccd0'; for (let x = W / 15; x < W; x += W / 7.5) g.fillRect(x + 8, Hh * 0.33, 12, 40);                // door handles
  g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, Hh * 0.04, W, 4);
  return tex(c);
})();
const cabSide = (() => {
  const c = cv(1024, 512), g = c.getContext('2d');
  g.fillStyle = '#e9e2cf'; g.fillRect(0, 512 * 0.62, 1024, 512 * 0.1); g.fillStyle = '#e8b82c'; g.fillRect(0, 512 * 0.72, 1024, 512 * 0.03);
  g.fillStyle = '#e9e2cf'; g.font = 'bold 74px sans-serif'; g.textAlign = 'center'; g.fillText('4407', 512, 512 * 0.57);
  g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 3; g.strokeRect(430, 512 * 0.62 - 380, 0, 0);
  return tex(c);
})();
const coachSide = (() => {
  const W = 4096, Hh = 512, c = cv(W, Hh), g = c.getContext('2d');
  g.fillStyle = '#1d4f86'; g.fillRect(0, Hh * 0.62, W, Hh * 0.24); g.fillStyle = '#e8b82c'; g.fillRect(0, Hh * 0.6, W, Hh * 0.025);   // blue skirt and a yellow line
  for (let i = 0; i < 16; i++) {                                                               // windows
    const x = 190 + i * (W - 380) / 15 - 90, y = Hh * 0.14, w = 180, h = Hh * 0.34;
    g.fillStyle = '#e9e2cf'; g.beginPath(); g.roundRect(x - 8, y - 8, w + 16, h + 16, 16); g.fill();
    const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#6f8da8'); gr.addColorStop(0.45, '#1a2a38'); gr.addColorStop(1, '#0a121a');
    g.fillStyle = gr; g.beginPath(); g.roundRect(x, y, w, h, 12); g.fill();
    g.fillStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.moveTo(x + 30, y + h); g.lineTo(x + 90, y); g.lineTo(x + 130, y); g.lineTo(x + 70, y + h); g.fill();
  }
  for (const x of [60, W - 140]) { g.fillStyle = '#d6ceb8'; g.fillRect(x, Hh * 0.08, 90, Hh * 0.74); g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 3; g.strokeRect(x, Hh * 0.08, 90, Hh * 0.74); g.fillStyle = '#0a121a'; g.fillRect(x + 14, Hh * 0.14, 62, Hh * 0.3); }   // doors
  g.fillStyle = '#e9e2cf'; g.font = 'bold 44px sans-serif'; g.textAlign = 'center'; g.fillText('2nd', W / 2, Hh * 0.78);
  return tex(c);
})();
const fanTex = (() => { const c = cv(256, 256), g = c.getContext('2d'); g.fillStyle = '#2a2d31'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#8d9399'; g.lineWidth = 5; for (let r = 18; r < 128; r += 22) { g.beginPath(); g.arc(128, 128, r, 0, 7); g.stroke(); } for (let a = 0; a < 12; a++) { g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(a * Math.PI / 6) * 126, 128 + Math.sin(a * Math.PI / 6) * 126); g.stroke(); } return tex(c); })();

// ---- running gear -------------------------------------------------------------------------------------------------------
const WR = 0.5, GAUGE = 1.435, spinning = [];
function wheelset(parent, x) {
  const g = new THREE.Group(); g.position.set(x, WR, 0); parent.add(g);
  const roll = new THREE.Group(); g.add(roll); spinning.push(roll);                                 // spins about z
  const ax = add(roll, cyl(0.1, 0.1, 2.0, 16), M.steel); ax.rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) {
    const z = s * GAUGE / 2;
    const tread = add(roll, cyl(WR, WR, 0.14, 40), M.wheel, 0, 0, z); tread.rotation.x = Math.PI / 2;
    const flange = add(roll, cyl(WR + 0.035, WR + 0.035, 0.035, 40), M.wheel, 0, 0, z - s * 0.065); flange.rotation.x = Math.PI / 2;
    const web = add(roll, cyl(WR * 0.8, WR * 0.8, 0.17, 32), M.dark, 0, 0, z + s * 0.01); web.rotation.x = Math.PI / 2;
    const hub = add(roll, cyl(0.17, 0.17, 0.22, 20), M.steel, 0, 0, z + s * 0.06); hub.rotation.x = Math.PI / 2;
    for (let k = 0; k < 6; k++) { const sp = add(roll, new THREE.BoxGeometry(0.06, WR * 0.62, 0.05), M.wheel, 0, 0, z + s * 0.1); sp.rotation.z = k * Math.PI / 3; sp.position.set(Math.cos(k * Math.PI / 3 + Math.PI / 2) * 0.28 * 0, 0, z + s * 0.1); }
  }
  return g;
}
function bogie(parent, x, axles, spacing, motors = true) {
  const g = new THREE.Group(); g.position.set(x, 0, 0); parent.add(g);
  const n = axles, len = (n - 1) * spacing;
  for (let i = 0; i < n; i++) wheelset(g, -len / 2 + i * spacing);
  for (const s of [-1, 1]) {
    add(g, rbox(len + 1.1, 0.26, 0.2, 0.05), M.dark, 0, 0.78, s * 0.98);                          // side frame
    for (let i = 0; i < n; i++) {
      const ax = -len / 2 + i * spacing;
      add(g, rbox(0.46, 0.4, 0.3, 0.05), M.dark, ax, WR + 0.02, s * 1.0);                         // axle box
      const sp = add(g, cyl(0.1, 0.1, 0.3, 12), M.steel, ax, 0.92, s * 0.98);                      // spring
      sp.userData.spring = true;
    }
  }
  add(g, rbox(len + 0.4, 0.2, 1.7, 0.05), M.dark, 0, 1.02, 0);                                      // bolster
  if (motors) for (let i = 0; i < n; i++) { const m = add(g, cyl(0.3, 0.3, 0.95, 20), M.dark, -len / 2 + i * spacing + 0.45, 0.62, 0); m.rotation.x = Math.PI / 2; }
  add(g, rbox(0.9, 0.3, 0.9, 0.08), M.steel, 0, 1.18, 0);                                           // centre pivot
  return g;
}
function handrail(parent, x0, x1, y, z, post = 1.0) {
  const L = x1 - x0, r = add(parent, cyl(0.03, 0.03, L, 8), M.steel, (x0 + x1) / 2, y, z); r.rotation.z = Math.PI / 2;
  const r2 = add(parent, cyl(0.03, 0.03, L, 8), M.steel, (x0 + x1) / 2, y - 0.35, z); r2.rotation.z = Math.PI / 2;
  for (let x = x0; x <= x1 + 0.01; x += post) add(parent, cyl(0.03, 0.03, 0.9, 8), M.steel, x, y - 0.4, z);
}
function ladder(parent, x, y, z, ry = 0, rungs = 4) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); for (const s of [-1, 1]) add(g, cyl(0.03, 0.03, rungs * 0.38, 8), M.steel, s * 0.3, -rungs * 0.19, 0); for (let i = 0; i < rungs; i++) { const r = add(g, cyl(0.03, 0.03, 0.62, 8), M.steel, 0, -i * 0.38 - 0.1, 0); r.rotation.z = Math.PI / 2; } }
function coupler(parent, x, dir) { const g = new THREE.Group(); g.position.set(x, 1.12, 0); parent.add(g); add(g, rbox(0.9, 0.3, 0.34, 0.06), M.dark, dir * 0.45, 0, 0); add(g, rbox(0.4, 0.4, 0.5, 0.08), M.dark, dir * 1.0, 0, 0); const h = add(g, cyl(0.04, 0.04, 0.5, 8), M.steel, dir * 1.1, 0, 0.18); h.rotation.x = 0.3; }

// ---- the locomotive ---------------------------------------------------------------------------------------------------
const train = new THREE.Group(); scene.add(train);
const loco = new THREE.Group(); train.add(loco);
const bodyBobs = [];
{
  const W = 2.9, Y0 = 1.28;
  add(loco, rbox(19, 0.4, W, 0.06), M.dark, 0, Y0 + 0.05, 0, 'underframe');
  add(loco, rbox(18.6, 0.18, W + 0.3, 0.05), M.steel, 0, Y0 + 0.3, 0);                                              // walkway deck
  add(loco, cyl(0.55, 0.55, 6, 24), M.dark, 0.5, 0.98, 0).rotation.z = Math.PI / 2;                                  // fuel tank
  bogie(loco, -6.2, 3, 1.9); bogie(loco, 6.2, 3, 1.9);
  // cab (rear) and long hood (front)
  const cab = add(loco, rbox(4.1, 2.9, W - 0.1, 0.12), M.body, -7.1, Y0 + 1.75, 0, 'cab');
  add(loco, rbox(4.5, 0.22, W + 0.35, 0.1), M.roof, -7.1, Y0 + 3.3, 0);                                              // cab roof
  const hood = add(loco, rbox(14.6, 2.0, W - 0.3, 0.18), M.body, 2.2, Y0 + 1.3, 0, 'hood');
  add(loco, rbox(14.4, 0.14, W - 0.45, 0.06), M.roof, 2.2, Y0 + 2.34, 0);                                           // hood top plate
  // livery decals and windows
  for (const s of [-1, 1]) {
    decal(14.5, 2.0 * 0.62, hoodSide, loco, 2.2, Y0 + 1.3, s * (W - 0.3) / 2 + s * 0.012, s > 0 ? 0 : Math.PI);
    decal(4.0, 2.0, cabSide, loco, -7.1, Y0 + 1.75 - 0.2, s * (W - 0.1) / 2 + s * 0.012, s > 0 ? 0 : Math.PI);
    add(loco, new THREE.PlaneGeometry(1.5, 1.05), M.glass, -7.1 + 0.2, Y0 + 2.3, s * (W - 0.1) / 2 + s * 0.02).rotation.y = s > 0 ? 0 : Math.PI;
    const fr = add(loco, rbox(1.7, 1.25, 0.04, 0.03), M.cream, -7.1 + 0.2, Y0 + 2.3, s * (W - 0.1) / 2 + s * 0.008);
    // door
    add(loco, rbox(0.95, 2.1, 0.05, 0.05), M.cream, -8.5, Y0 + 1.5, s * (W - 0.1) / 2 + s * 0.01);
    ladder(loco, -8.2, Y0 + 0.2, s * (W / 2 + 0.2), 0, 4);
    handrail(loco, -4.4, 8.7, Y0 + 1.45, s * (W / 2 + 0.12), 1.2);
  }
  // cab windscreens (facing the hood, +x) and rear (-x)
  for (const z of [-0.75, 0.75]) { add(loco, new THREE.PlaneGeometry(1.1, 1.15), M.glass, -5.045, Y0 + 2.35, z).rotation.y = Math.PI / 2; add(loco, rbox(0.05, 1.3, 1.25, 0.03), M.cream, -5.052, Y0 + 2.35, z); add(loco, new THREE.PlaneGeometry(1.1, 1.15), M.glass, -9.155, Y0 + 2.35, z).rotation.y = -Math.PI / 2; }
  add(loco, rbox(0.3, 0.12, 2.6, 0.05), M.dark, -5.0, Y0 + 3.05, 0);                                                 // sun visor
  // roof equipment
  const fan = (x) => { const h = add(loco, cyl(0.88, 0.95, 0.22, 36), M.roof, x, Y0 + 2.5, 0); add(loco, new THREE.CircleGeometry(0.8, 36), new THREE.MeshStandardMaterial({ map: fanTex, roughness: 0.6, metalness: 0.5 }), x, Y0 + 2.612, 0).rotation.x = -Math.PI / 2; };
  [1.2, 3.6, 6.0].forEach(fan);
  add(loco, rbox(2.2, 0.6, 1.4, 0.1), M.roof, -1.2, Y0 + 2.62, 0);                                                   // dynamic brake grid box
  add(loco, cyl(0.24, 0.28, 0.9, 18), M.dark, -2.8, Y0 + 2.77, 0.5);                                                 // exhaust
  add(loco, cyl(0.18, 0.18, 0.55, 14), M.steel, -6.4, Y0 + 3.7, 0.7).rotation.z = 0.15;                              // horn
  add(loco, cyl(0.22, 0.22, 0.4, 12), M.yellow, 8.4, Y0 + 2.5, 0);                                                    // beacon base
  // nose: headlights, number board, buffers, front steps
  add(loco, rbox(0.3, 1.6, W - 0.3, 0.1), M.body, 9.55, Y0 + 1.0, 0);
  for (const z of [-0.9, 0.9]) { add(loco, cyl(0.2, 0.2, 0.12, 24), M.lamp, 9.72, Y0 + 1.5, z).rotation.z = Math.PI / 2; add(loco, cyl(0.26, 0.26, 0.08, 24), M.steel, 9.7, Y0 + 1.5, z).rotation.z = Math.PI / 2; add(loco, cyl(0.14, 0.14, 0.1, 18), M.tail, 9.72, Y0 + 0.8, z).rotation.z = Math.PI / 2; }
  add(loco, rbox(0.1, 0.5, 1.2, 0.04), M.cream, 9.72, Y0 + 2.0, 0);
  add(loco, cyl(0.2, 0.2, 0.12, 24), M.lamp, 9.72, Y0 + 2.45, 0).rotation.z = Math.PI / 2;                         // ditch / top light
  // pilot: a sloped steel apron under the nose, with a step each side
  { const ap = add(loco, rbox(0.9, 0.5, 2.6, 0.06), M.dark, 9.95, 0.82, 0); ap.rotation.z = -0.55; for (const z of [-1.0, 1.0]) add(loco, rbox(0.7, 0.07, 0.5, 0.02), M.steel, 9.85, 0.62, z); }
  coupler(loco, 9.55, 1); coupler(loco, -9.55, -1);
  // headlight beam
  const spot = new THREE.SpotLight('#fff3d0', 0, 90, 0.35, 0.6, 1.2); spot.position.set(9.6, Y0 + 1.5, 0); spot.target.position.set(40, 0.5, 0); loco.add(spot, spot.target);
  loco.userData.spot = spot;
}

// ---- passenger coaches --------------------------------------------------------------------------------------------------
function coach(x, seed) {
  const g = new THREE.Group(); g.position.set(x, 0, 0); train.add(g);
  const W = 2.9, L = 19.6, Y0 = 1.22;
  add(g, rbox(L, 0.36, W - 0.4, 0.05), M.dark, 0, Y0, 0);
  add(g, rbox(L, 2.5, W, 0.2), M.cream, 0, Y0 + 1.45, 0, 'shell');
  for (const s of [-1, 1]) decal(L - 0.1, 2.2, coachSide, g, 0, Y0 + 1.45, s * (W / 2 + 0.012), s > 0 ? 0 : Math.PI);
  const rf = add(g, new THREE.CylinderGeometry(1.62, 1.62, L - 0.2, 40, 1, false, 0, Math.PI), M.roof, 0, Y0 + 2.62, 0); rf.rotation.set(0, 0, Math.PI / 2); rf.rotation.order = 'XYZ'; rf.scale.set(0.34, 1, 1); rf.rotation.z = Math.PI / 2; rf.rotation.y = Math.PI / 2; rf.position.set(0, Y0 + 2.7, 0);
  rf.rotation.set(Math.PI / 2, 0, 0); rf.rotation.z = Math.PI / 2;
  for (const dx of [-5, 0, 5]) add(g, rbox(2.2, 0.28, 1.1, 0.08), M.roof, dx, Y0 + 3.2, 0);                          // roof air-conditioning units
  for (const s of [-1, 1]) { add(g, rbox(L - 1, 0.16, 0.3, 0.05), M.dark, 0, Y0 + 0.1, s * (W / 2 - 0.2)); ladder(g, 8.2, Y0 + 0.5, s * (W / 2 + 0.05), 0, 3); }
  for (const e of [-1, 1]) { add(g, rbox(0.12, 2.6, 2.4, 0.1), M.dark, e * (L / 2 + 0.05), Y0 + 1.4, 0); add(g, rbox(0.5, 2.5, 1.6, 0.14), M.dark, e * (L / 2 + 0.15), Y0 + 1.4, 0); coupler(g, e * (L / 2), e); }   // end gangway
  bogie(g, -6.6, 2, 2.5, false); bogie(g, 6.6, 2, 2.5, false);
  return g;
}
const coaches = [coach(-20.3, 1), coach(-40.5, 2)];

// ---- track, ground and scenery (scrolled by the speed) -------------------------------------------------------------------
const SP = 0.65;                                                       // sleeper spacing
const world = new THREE.Group(); scene.add(world);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.62; ground.receiveShadow = true; scene.add(ground);
const bed = new THREE.Mesh(new THREE.BoxGeometry(700, 0.5, 3.8), new THREE.MeshStandardMaterial({ map: ballastTex, roughness: 1 })); bed.position.set(0, -0.42, 0); bed.receiveShadow = true; scene.add(bed);
ballastTex.repeat.set(175, 1);
const slopeG = new THREE.CylinderGeometry(0.01, 0.01, 1); void slopeG;
const sleepers = new THREE.InstancedMesh(new THREE.BoxGeometry(0.26, 0.18, 2.6), new THREE.MeshStandardMaterial({ color: '#6d5a48', roughness: 0.95 }), 700);
{ const m = new THREE.Matrix4(); for (let i = 0; i < 700; i++) { m.makeTranslation((i - 350) * SP, -0.1, 0); sleepers.setMatrixAt(i, m); } sleepers.castShadow = true; sleepers.receiveShadow = true; scene.add(sleepers); }
for (const s of [-1, 1]) {
  add(scene, new THREE.BoxGeometry(700, 0.1, 0.16), M.rail, 0, -0.03, s * GAUGE / 2);                                // rail foot
  add(scene, new THREE.BoxGeometry(700, 0.1, 0.07), M.rail, 0, 0.0, s * GAUGE / 2).position.y = -0.04;
  add(scene, new THREE.BoxGeometry(700, 0.12, 0.13), M.rail, 0, -0.015, s * GAUGE / 2);
}
// poles and trees repeat every 80 m so they can scroll without end
const scenery = new THREE.Group(); scene.add(scenery);
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const treeMat = [new THREE.MeshStandardMaterial({ color: '#4d7a3e', roughness: 0.9 }), new THREE.MeshStandardMaterial({ color: '#3c6633', roughness: 0.9 }), new THREE.MeshStandardMaterial({ color: '#628a42', roughness: 0.9 })];
const trunkMat = new THREE.MeshStandardMaterial({ color: '#5a4030', roughness: 1 });
const PERIOD = 80, cells = [];
for (let c = -4; c <= 4; c++) {
  const g = new THREE.Group(); g.position.x = c * PERIOD; scenery.add(g); cells.push(g);
}
for (const g of cells) for (let k = 0; k < 4; k++) for (const s of [-1, 1]) {
  const x = k * 20 + (rnd() - 0.5) * 6 - 30, z = s > 0 ? 26 + rnd() * 14 : -(11 + rnd() * 14), h = 5 + rnd() * 4;
  add(g, cyl(0.2, 0.3, h * 0.35, 8), trunkMat, x, h * 0.17 - 0.6, z);
  add(g, new THREE.IcosahedronGeometry(h * 0.32, 1), treeMat[Math.floor(rnd() * 3)], x, h * 0.55, z).scale.set(1, 1.25, 1);
  add(g, new THREE.IcosahedronGeometry(h * 0.22, 1), treeMat[Math.floor(rnd() * 3)], x + 0.8, h * 0.8, z + 0.4);
}
for (const g of cells) for (let k = 0; k < 2; k++) { const x = k * 40 - 30; add(g, cyl(0.1, 0.13, 7.5, 8), trunkMat, x, 3.1, -4.6); const arm = add(g, new THREE.BoxGeometry(0.2, 0.16, 2.0), trunkMat, x, 6.4, -4.6); arm.rotation.y = 0; add(g, new THREE.BoxGeometry(0.1, 0.1, 2.6), M.dark, x, 6.0, -4.6); }
const bank = new THREE.Mesh(new THREE.BoxGeometry(700, 0.8, 8), new THREE.MeshStandardMaterial({ color: '#7d8a55', roughness: 1 })); bank.position.set(0, -0.6, 0); bank.visible = false; scene.add(bank);

// ---- camera, controls, UI -------------------------------------------------------------------------------------------------
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.08; controls.maxPolarAngle = Math.PI * 0.495; controls.minDistance = 4; controls.maxDistance = 160; controls.target.set(-3, 2.0, 0);
const VIEWS = {
  hero: { p: [20, 6.5, 19], t: [-4, 2.2, 0] }, side: { p: [-4, 3.2, 24], t: [-4, 2.4, 0] }, front: { p: [28, 3.2, 9], t: [8, 2.2, 0] },
  cab: { p: [-4.4, 5.1, 0], t: [30, 1.2, 0] }, top: { p: [-6, 46, 4], t: [-6, 0, 0] }, whole: { p: [-30, 11, 46], t: [-20, 2, 0] },
};
let goal = null;
const portrait = () => canvas.clientHeight > canvas.clientWidth;
const viewPos = (k) => { const t = new THREE.Vector3(...VIEWS[k].t), p = new THREE.Vector3(...VIEWS[k].p); return portrait() && k !== 'cab' ? p.sub(t).multiplyScalar(1.7).add(t) : p; };
const setView = (k) => { goal = { p: viewPos(k), t: new THREE.Vector3(...VIEWS[k].t), k }; document.querySelectorAll('#views button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === k))); };
document.querySelectorAll('#views button').forEach((b) => b.addEventListener('click', () => setView(b.dataset.v)));
controls.addEventListener('start', () => { goal = null; document.querySelectorAll('#views button').forEach((b) => b.setAttribute('aria-pressed', 'false')); });
camera.position.copy(viewPos('hero')); controls.target.set(...VIEWS.hero.t);
let speed = 0, target = 0, dist = 0, lights = false;
const speedEl = $('spd'), slider = $('speed');
const setTarget = (v) => { target = v; slider.value = v; };
slider.addEventListener('input', () => { target = parseFloat(slider.value); });
$('go').addEventListener('click', () => { setTarget(target > 0 ? 0 : 20); $('go').textContent = target > 0 ? 'Stop' : 'Drive'; });
$('lights').addEventListener('click', () => { lights = !lights; $('lights').setAttribute('aria-pressed', String(lights)); });
addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); $('go').click(); } else if (e.code === 'ArrowUp') setTarget(Math.min(33, target + 3)); else if (e.code === 'ArrowDown') setTarget(Math.max(0, target - 3)); else if (e.key === 'l') $('lights').click(); else if (/^[1-6]$/.test(e.key)) setView(Object.keys(VIEWS)[+e.key - 1]); });
function fit() { const r = canvas.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); camera.fov = camera.aspect < 1 ? 55 : 38; camera.updateProjectionMatrix(); }
addEventListener('resize', fit); fit();

let last = performance.now(), t = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
  speed += (target - speed) * (1 - Math.exp(-dt * 0.9));
  const d = speed * dt; dist += d;
  for (const w of spinning) w.rotation.z -= d / WR;
  const off = dist % SP; sleepers.position.x = -off;
  scenery.position.x = -(dist % PERIOD);
  ballastTex.offset.x = -(dist * 175 / 700);
  grassTex.offset.x = -(dist * 110 / 700);
  // a little body motion that grows with speed
  const k = Math.min(1, speed / 20);
  train.children.forEach((c, i) => { c.position.y = Math.sin(t * 9 + i * 1.7) * 0.012 * k + Math.sin(t * 3.1 + i) * 0.006 * k; c.rotation.z = Math.sin(t * 2.3 + i * 2.1) * 0.0035 * k; });
  const li = lights ? 1 : 0; M.lamp.emissiveIntensity = lights ? 3 : 0.1; M.tail.emissiveIntensity = lights ? 1.2 : 0.15; loco.userData.spot.intensity = li * 500;
  if (goal) { camera.position.lerp(goal.p, 1 - Math.exp(-dt * 3.5)); controls.target.lerp(goal.t, 1 - Math.exp(-dt * 3.5)); }
  controls.update();
  speedEl.textContent = Math.round(speed * 3.6);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.TRAIN = { camera, controls, setView, get speed() { return speed; }, setTarget, get dist() { return dist; }, scene, spinning };
