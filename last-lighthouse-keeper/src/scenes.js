// The Last Lighthouse Keeper: the two paper stacks.
//   world(E): cliff, lighthouse, sea, ship (shots W1 0–15.6 s and W2 22–41 s, one camera path through film time)
//   room(E):  the lamp room, the keeper lights the lamp (15.6–22 s)
// Metres, y up. Cavity 0.33 × 0.56 m (portrait lamp), layers z −0.142 (sky) … 0 (front). Film time t in seconds.
import * as THREE from 'three';
import { sheet, skyPanel, text } from './paper.js';
import { stage, aim } from './stage.js';
import { mulberry, lerp, clamp, TAU, ss, seg, eio, eo, track, env } from './lib.js';

export const PAPER = '#9a9a9a', BASE = new THREE.Color(PAPER).r;
export const tint = (m, hex, k = 1) => m.material.color.set(hex).multiplyScalar(k / BASE);
export const cut = (x, fn) => { x.save(); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000'; x.strokeStyle = '#000'; fn(); x.restore(); };
const poly = (x, pts) => { x.beginPath(); x.moveTo(...pts[0]); for (const p of pts.slice(1)) x.lineTo(...p); x.closePath(); x.fill(); };

const LW = .40, LH = .66;               // layer size (slightly larger than the cavity; the frame face hides the overhang)
const HY = -.06;                          // horizon
const TX = .085, TB = -.036, TT = .162;   // tower x, base, top of the shaft
const LAMP = [TX, .186];                  // lamp centre
const SHIP = [-.068, HY + .001];
// the path the keeper walks: cliff foot → door
const PATH = [[.030, -.205], [.052, -.160], [.036, -.118], [.062, -.080], [.072, -.050], [TX - .002, TB + .001]];
const pathAt = u => { // u 0..1 along the polyline by length
  const L = []; let s = 0; for (let i = 1; i < PATH.length; i++) { s += Math.hypot(PATH[i][0] - PATH[i - 1][0], PATH[i][1] - PATH[i - 1][1]); L.push(s); }
  const d = clamp(u) * s; let i = 0; while (i < L.length - 1 && L[i] < d) i++;
  const s0 = i ? L[i - 1] : 0, k = (d - s0) / (L[i] - s0);
  return [lerp(PATH[i][0], PATH[i + 1][0], k), lerp(PATH[i][1], PATH[i + 1][1], k)];
};
const halfW = y => lerp(.023, .0145, clamp((y - TB) / (TT - TB)));   // tower half-width
const WINDOWS = Array.from({ length: 8 }, (_, k) => [TX + (k % 2 ? .006 : -.006), TB + .022 + k * .0165]);

// beam: one rotating lamp seen from the front: a left sweep, then a right sweep (period P)
export function beamAt(t, H) {
  if (t < H.light) return { k: 0, a: 0 };
  const P = H.beamPeriod, u = (((t - H.beamCycle0) % P) + P) % P / P;
  const on = ss(seg(t, H.light, H.light + 1.5));
  if (u < .5) { const s = u / .5; return { a: Math.PI + .15 + .95 * s, k: on * Math.pow(Math.sin(Math.PI * s), .7), u }; }
  const s = (u - .5) / .5; return { a: -(1.1 - .95 * s), k: on * Math.pow(Math.sin(Math.PI * s), .7), u };
}

// additive light shaft from the lamp (analytic, no texture edges)
function shaft() {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(.6, .9), new THREE.ShaderMaterial({
    uniforms: { o: { value: new THREE.Vector2(...LAMP) }, a: { value: 0 }, w: { value: .045 }, k: { value: 0 }, col: { value: new THREE.Color('#ffd391') } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec2 vP; void main(){ vP = (modelMatrix * vec4(position,1.)).xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `varying vec2 vP; uniform vec2 o; uniform float a, w, k; uniform vec3 col;
      void main(){ vec2 d = vP - o; float r = length(d); float an = atan(d.y, d.x) - a; an = mod(an + 3.14159265, 6.2831853) - 3.14159265;
        float ww = w * (1. + r * 1.6); float m = exp(-an*an/(ww*ww)) * smoothstep(.004, .03, r) * exp(-r / .34);
        float core = exp(-r*r/(.012*.012)) * .9;
        gl_FragColor = vec4(col * (m * .55 + core) * k, 1.); }`,
  }));
  m.renderOrder = 9; m.position.set(0, 0, -.0805); return m;
}

// additive point glow (centred, analytic falloff)
function burst(w, h, col = '#ffcd82') {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.ShaderMaterial({
    uniforms: { col: { value: new THREE.Color(col) }, k: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'varying vec2 vUv; uniform vec3 col; uniform float k; void main(){ float r = length(vUv - .5) * 2.; float a = pow(max(0., 1. - r), 2.4) + .6 * exp(-r*r*60.); gl_FragColor = vec4(col * a * k, 1.); }',
  }));
  m.renderOrder = 10; m.userData.set = k => { m.material.uniforms.k.value = k; }; return m;
}

// —— motifs ——
function waves(x, top, amp, f, seed, bottom = -.4) {
  x.beginPath(); x.moveTo(-LW / 2, bottom);
  for (let u = -LW / 2; u <= LW / 2 + .001; u += .001) {
    const ph = u * f + seed; const y = top + amp * (Math.sin(ph) * .6 + Math.sin(ph * 2.3 + 1.7) * .25) + amp * .9 * Math.pow(Math.max(0, Math.sin(ph * .5 + seed)), 6);
    x.lineTo(u, y);
  }
  x.lineTo(LW / 2, bottom); x.closePath(); x.fill();
}
function tower(x) {
  x.beginPath(); x.moveTo(TX - halfW(TB), TB - .004); x.lineTo(TX - halfW(TT), TT); x.lineTo(TX + halfW(TT), TT); x.lineTo(TX + halfW(TB), TB - .004); x.closePath(); x.fill();
  x.fillRect(TX - .028, TB - .006, .056, .006);                   // plinth
  cut(x, () => {                                                   // the door is a hole (its glow sheet sits behind); windows stay paper and glow
    x.beginPath(); x.moveTo(TX - .004, TB); x.lineTo(TX - .004, TB + .009); x.arc(TX, TB + .009, .004, Math.PI, 0, true); x.lineTo(TX + .004, TB); x.closePath(); x.fill();
  });
}
function bands(x) {                                                // the accent: two red bands
  for (const [y0, y1] of [[.035, .062], [.112, .139]]) {
    x.beginPath(); x.moveTo(TX - halfW(y0) - .0003, y0); x.lineTo(TX - halfW(y1) - .0003, y1); x.lineTo(TX + halfW(y1) + .0003, y1); x.lineTo(TX + halfW(y0) + .0003, y0); x.closePath(); x.fill();
  }
  cut(x, () => { for (const [wx, wy] of WINDOWS) { x.beginPath(); x.ellipse(wx, wy, .0018, .0032, 0, 0, TAU); x.fill(); } });
}
function gallery(x) {                                               // lantern room: gallery deck + rail, glazing frame, cupola, vent ball
  x.fillRect(TX - .024, TT, .048, .004);                            // gallery deck
  x.fillRect(TX - .024, TT + .004, .0012, .009); x.fillRect(TX + .0228, TT + .004, .0012, .009); x.fillRect(TX - .024, TT + .0125, .048, .001);  // rail
  for (let k = -3; k <= 3; k++) x.fillRect(TX + k * .0068 - .0003, TT + .004, .0006, .0085);
  x.fillRect(TX - .0135, TT + .004, .027, .004);                    // lantern base
  x.fillRect(TX - .0135, TT + .008, .0012, .028); x.fillRect(TX + .0123, TT + .008, .0012, .028);   // glazing posts
  x.fillRect(TX - .0006, TT + .008, .0012, .028); x.fillRect(TX - .0135, TT + .021, .027, .0008);
  x.beginPath(); x.moveTo(TX - .016, TT + .036); x.quadraticCurveTo(TX, TT + .058, TX + .016, TT + .036); x.closePath(); x.fill();   // cupola
  x.fillRect(TX - .0006, TT + .046, .0012, .012); x.beginPath(); x.arc(TX, TT + .059, .0022, 0, TAU); x.fill();
}
function glazingGlow(x) { x.fillStyle = '#fff'; x.fillRect(TX - .0123, TT + .008, .0246, .028); }
function cliff(x) {
  poly(x, [[.012, -.4], [.018, -.215], [.032, -.17], [.026, -.13], [.045, -.095], [.05, -.06], [.06, -.042], [.07, -.038], [.11, -.037], [.14, -.041], [.165, -.05], [LW / 2, -.06], [LW / 2, -.4]]);
  cut(x, () => {   // the path is a slit: the far sea shows through it
    x.lineWidth = .0013; x.lineCap = 'round'; x.lineJoin = 'round';
    x.beginPath(); x.moveTo(...PATH[0]); for (const p of PATH.slice(1, -1)) x.lineTo(...p); x.stroke();
    x.lineWidth = .0006; for (let k = 0; k < 9; k++) { const y = -.09 - k * .02; x.beginPath(); x.moveTo(.105 + k * .006, y); x.lineTo(.13 + k * .004, y - .006); x.stroke(); }   // rock strata
  });
}
function ship(x) {   // small coaster: hull, bridge, mast, funnel (faces left)
  const [sx, sy] = SHIP;
  poly(x, [[sx - .024, sy + .006], [sx + .022, sy + .006], [sx + .019, sy - .001], [sx - .02, sy - .001]]);
  x.fillRect(sx + .006, sy + .006, .011, .006); x.fillRect(sx + .009, sy + .012, .006, .003);
  x.fillRect(sx - .010, sy + .006, .0009, .022); x.fillRect(sx - .016, sy + .02, .012, .0007);
  x.fillRect(sx + .0155, sy + .009, .0035, .008);
  cut(x, () => { for (let k = 0; k < 3; k++) x.fillRect(sx + .0075 + k * .0033, sy + .0085, .0017, .0018); });
}
function front(x) {   // darkest layer: foreground rocks and grass along the bottom (keeps the subtitle band dark)
  const R = mulberry(9);
  x.beginPath(); x.moveTo(-LW / 2, -.4); x.lineTo(-LW / 2, -.17);
  for (let u = -LW / 2; u <= LW / 2; u += .004) { const y = -.215 + .02 * Math.sin(u * 22 + 1) + .012 * Math.sin(u * 61) + (u < -.06 ? .05 * Math.exp(-Math.pow((u + .13) / .05, 2)) : 0); x.lineTo(u, y); }
  x.lineTo(LW / 2, -.4); x.closePath(); x.fill();
  x.lineWidth = .0007; x.strokeStyle = PAPER; x.lineCap = 'round';
  for (let i = 0; i < 70; i++) { const u = -LW / 2 + R() * LW, b = -.21 + .02 * Math.sin(u * 22 + 1) + (u < -.06 ? .05 * Math.exp(-Math.pow((u + .13) / .05, 2)) : 0); const h = .01 + R() * .02; x.beginPath(); x.moveTo(u, b - .005); x.quadraticCurveTo(u + .003, b + h * .6, u + (R() - .5) * .01, b + h); x.stroke(); }
}
function clouds(x) {
  const R = mulberry(4);
  for (let i = 0; i < 9; i++) { const cx = -.2 + R() * .4, cy = .05 + R() * .2, w = .05 + R() * .08;
    x.beginPath(); x.ellipse(cx, cy, w, .006 + R() * .006, 0, 0, TAU); x.fill(); x.beginPath(); x.ellipse(cx + w * .3, cy + .006, w * .5, .008, 0, 0, TAU); x.fill(); }
}
function keeperTiny(x) {   // the keeper on the path, 1.6 cm tall, origin at his feet
  poly(x, [[-.0028, 0], [.0028, 0], [.0024, .009], [.0032, .0105], [.0018, .0118], [-.0018, .0118], [-.0032, .0105], [-.0024, .009]]);
  x.beginPath(); x.arc(0, .0133, .0017, 0, TAU); x.fill(); x.fillRect(-.0024, .0144, .0048, .0007); x.fillRect(-.0014, .0148, .0028, .0012);   // head, cap
  x.fillRect(.0026, .0045, .0035, .0007); x.fillRect(.0056, .0028, .0006, .0018); x.fillRect(.0047, .0016, .0024, .0014);                  // arm + lantern
}
function keeperGlow(x) { x.fillStyle = '#fff'; x.beginPath(); x.arc(.0059, .0023, .0016, 0, TAU); x.fill(); }

// —— the world stack ——
export function world(E) {
  const H = E.H;
  const S = stage({ light: [0, .1, -.13], lightR: .3, lightCol: '#ffe2b4', key: 1.6, keyPos: [0, .45, .35], keyTarget: [0, 0, -.1], amb: .32, ambCol: '#9fb0e0', floor: .35, fov: 40, beamCol: '#ffcf86' });
  const { U } = S; S.cam.aspect = E.aspect; S.cam.updateProjectionMatrix();
  const night = S.add(skyPanel({ w: .5, h: .82, z: -.142, stops: [[0, '#060a24'], [.55, '#1a2358'], [1, '#3c4888']], stars: 260, starMinY: -.02, gain: 1 }));
  const dusk = S.add(skyPanel({ w: .5, h: .82, z: -.1415, stops: [[0, '#151a48'], [.45, '#4a3f78'], [.7, '#b8707a'], [1, '#f0a476']], gain: 1 }));
  dusk.material.transparent = true;
  const cl = S.add(sheet({ U, w: LW, h: LH, z: -.134, trans: .9, shadow: false, draw: x => { x.fillStyle = PAPER; clouds(x); } })); tint(cl, '#6e7bb8');
  const far = S.add(sheet({ U, w: LW, h: LH, z: -.126, trans: .85, draw: x => { x.fillStyle = PAPER; x.fillRect(-LW / 2, -LH / 2, LW, HY + LH / 2); } })); tint(far, '#7d8dc4');
  const sh = S.add(sheet({ U, w: .07, h: .05, x: SHIP[0], y: SHIP[1], z: -.1235, trans: .4, glow: 0, glowCol: '#ffe6b0',
    draw: x => { x.translate(-SHIP[0], -SHIP[1]); x.fillStyle = PAPER; ship(x); },
    glowDraw: x => { x.translate(-SHIP[0], -SHIP[1]); x.fillStyle = '#fff'; x.beginPath(); x.arc(SHIP[0] - .0095, SHIP[1] + .0285, .0026, 0, TAU); x.fill(); }, glowRes: 1 })); tint(sh, '#2c3870');
  const SK = 1.9; sh.scale.set(SK, SK, 1);   // the coaster, scaled up so it reads at Shorts size
  const shipFlare = burst(.05, .05, '#ffe2a8'); shipFlare.position.set(SHIP[0] - .0095 * SK, SHIP[1] + .0285 * SK, -.123); S.add(shipFlare);
  const mid = S.add(sheet({ U, w: LW, h: LH, z: -.104, trans: .6, draw: x => { x.fillStyle = PAPER; waves(x, -.092, .004, 60, 1); } })); tint(mid, '#56679f');
  const cf = S.add(sheet({ U, w: LW, h: LH, z: -.089, trans: .35, draw: x => { x.fillStyle = PAPER; cliff(x); } })); tint(cf, '#2e3b70');
  const kp = S.add(sheet({ U, w: .02, h: .02, ax: 0, ay: -.008, z: -.0875, trans: .1, glow: 0, glowCol: '#ffc066', draw: x => { x.translate(0, -.008); x.fillStyle = PAPER; keeperTiny(x); }, glowDraw: x => { x.translate(0, -.008); keeperGlow(x); }, glowRes: 2, finish: { rimPx: 1, underPx: 1 } })); tint(kp, '#0d1230');
  const tw = S.add(sheet({ U, w: LW, h: LH, z: -.083, trans: .3, glow: 0, glowCol: '#ffbe6a',
    draw: x => { x.fillStyle = PAPER; tower(x); },
    glowDraw: x => { x.fillStyle = '#fff'; for (const [wx, wy] of WINDOWS) { x.beginPath(); x.ellipse(wx, wy, .0021, .0036, 0, 0, TAU); x.fill(); } }, glowRes: 1 })); tint(tw, '#a7b0d8');
  const bd = S.add(sheet({ U, w: LW, h: LH, z: -.0822, trans: .25, draw: x => { x.fillStyle = PAPER; bands(x); } })); tint(bd, '#c4392c');
  const door = S.add(sheet({ U, w: .02, h: .02, x: TX, y: TB + .008, z: -.0825, trans: 0, glow: 0, glowCol: '#ffb860', shadow: false, recv: false,
    draw: x => { x.fillStyle = PAPER; x.fillRect(-.0001, -.0001, .0002, .0002); }, glowDraw: x => { x.fillStyle = '#fff'; x.beginPath(); x.moveTo(-.0038, -.008); x.lineTo(-.0038, .001); x.arc(0, .001, .0038, Math.PI, 0, true); x.lineTo(.0038, -.008); x.closePath(); x.fill(); }, glowRes: 2 }));
  const gl = S.add(sheet({ U, w: LW, h: LH, z: -.0815, trans: .1, glow: 0, glowCol: '#ffcf86', draw: x => { x.fillStyle = PAPER; gallery(x); }, glowDraw: glazingGlow })); tint(gl, '#151a40');
  const lampGlow = burst(.06, .06, '#ffc874'); lampGlow.position.set(LAMP[0], LAMP[1], -.0812); S.add(lampGlow);
  const sf = shaft(); S.add(sf);
  const near = S.add(sheet({ U, w: LW, h: LH, z: -.05, trans: .2, draw: x => { x.fillStyle = PAPER; waves(x, -.165, .006, 45, 3); } })); tint(near, '#27346a');
  const fr = S.add(sheet({ U, w: LW, h: LH, z: -.014, trans: .05, draw: x => { x.fillStyle = PAPER; front(x); } })); tint(fr, '#070b22');
  // Morse strip: dash, dot, dot, dash, cut from a pale paper strip below the ship, each mark grows on its flash
  const marks = H.morse.map(([a, b], i) => {
    const long = b - a > .5, w = long ? .011 : .0034;
    const m = S.add(sheet({ U, w, h: .0034, ax: -w / 2, ay: 0, x: SHIP[0] - .03 + [0, .018, .0255, .033][i], y: HY - .024, z: -.118, trans: .5, shadow: false, recv: false,
      draw: x => { x.fillStyle = PAPER; long ? x.fillRect(-w / 2, -.0017, w, .0034) : (x.beginPath(), x.arc(0, 0, .0017, 0, TAU), x.fill()); }, finish: { rimPx: 1, underPx: 1 } }));
    tint(m, '#f2dfb4', 1.4); m.userData.t = a; return m;
  });
  // title strip: cut paper grown from its left edge, in the sky
  const title = S.add(sheet({ U, w: .2, h: .062, ax: -.1, ay: 0, x: -.05, y: .12, z: -.13, trans: .55, shadow: false, recv: false,
    draw: x => { x.fillStyle = PAPER; x.fillRect(-.1, -.031, .2, .062);
      cut(x, () => { text(x, 'THE LAST', 0, .012, .0165, "'IM Fell English'", { fill: '#000' }); text(x, 'LIGHTHOUSE KEEPER', 0, -.013, .0145, "'IM Fell English'", { fill: '#000' }); }); },
    finish: { rimPx: 2, underPx: 2 } })); tint(title, '#e9d7b0');
  // the box itself (seen only when the camera pulls out): wooden frame, shell, table, warm spill
  const box = new THREE.Group(); S.scene.add(box);
  const wood = new THREE.MeshStandardMaterial({ color: '#5b3a22', roughness: .7 });
  const OW = .43, OH = .66, CWv = .33, CHv = .56;
  const fs = new THREE.Shape(); fs.moveTo(-OW / 2, -OH / 2); fs.lineTo(OW / 2, -OH / 2); fs.lineTo(OW / 2, OH / 2); fs.lineTo(-OW / 2, OH / 2); fs.closePath();
  const hole = new THREE.Path(); hole.moveTo(-CWv / 2, -CHv / 2); hole.lineTo(-CWv / 2, CHv / 2); hole.lineTo(CWv / 2, CHv / 2); hole.lineTo(CWv / 2, -CHv / 2); hole.closePath(); fs.holes.push(hole);
  const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(fs, { depth: .025, bevelEnabled: true, bevelSize: .004, bevelThickness: .004, bevelSegments: 2 }), wood); frame.position.z = -.002; box.add(frame);
  const side = new THREE.MeshStandardMaterial({ color: '#43291a', roughness: .8 });   // the box shell: four outer walls + back, open at the front
  for (const [w, h, x, y] of [[.012, OH, -OW / 2 + .006, 0], [.012, OH, OW / 2 - .006, 0], [OW, .012, 0, OH / 2 - .006], [OW, .012, 0, -OH / 2 + .006]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, .17), side); b.position.set(x, y, -.087); box.add(b); }
  const back = new THREE.Mesh(new THREE.BoxGeometry(OW, OH, .006), side); back.position.z = -.175; box.add(back);
  const table = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), new THREE.MeshStandardMaterial({ color: '#2a1a10', roughness: .55 })); table.rotation.x = -Math.PI / 2; table.position.set(0, -OH / 2 - .004, .6); table.receiveShadow = true; box.add(table);
  const spill = new THREE.PointLight('#ffb766', 0, 1.4, 1.6); spill.position.set(0, -.2, .12); box.add(spill);
  // occluder for the wipe into the lamp room: a dark rail post that crosses the lens
  const occ = new THREE.Mesh(new THREE.PlaneGeometry(.05, .12), new THREE.MeshBasicMaterial({ color: '#04050f' })); occ.position.set(.2, 0, -.06); S.cam.add(occ); S.scene.add(S.cam);

  const camKeys = track([
    [0, [.04, -.052, .50, .05, -.062, -.1]], [6.6, [.068, -.036, .38, .08, -.03, -.1]],
    [15.0, [.08, .128, .30, .085, .19, -.09]], [15.6, [.08, .138, .29, .085, .196, -.09]],
    [22.0, [.02, .02, .40, .025, .02, -.1]], [24.0, [.0, -.01, .52, -.008, -.02, -.1]], [29.6, [-.01, -.02, .56, -.012, -.03, -.1]],
    [32.0, [-.05, -.045, .30, -.066, -.052, -.12]], [35.2, [-.054, -.047, .28, -.068, -.053, -.12]],
    [39.6, [0, -.008, 1.25, 0, -.004, -.07]], [41, [0, -.008, 1.29, 0, -.004, -.07]],
  ]);
  let focus = .5, aper = 6;
  return {
    S,
    update(t) {
      const p = camKeys(t); aim(S.cam, p, t, { hand: t > 35.2 ? .0015 : .0006 });
      // dusk → night across the climb
      dusk.material.opacity = 1 - ss(seg(t, 6, 14.5)); night.material.color.setScalar(.6 + .4 * ss(seg(t, 4, 14)));
      // sea drifts
      mid.position.x = .004 * Math.sin(t * .35); near.position.x = .007 * Math.sin(t * .5 + 1); sh.position.x = SHIP[0] + .0002 * t; shipFlare.position.x = sh.position.x - .0095 * SK;
      // the keeper: up the path (0.3–6.4 s), inside the tower until the end, down the path at the end
      let ku = -1; if (t < 6.4) ku = seg(t, .3, 6.2); else if (t > H.home + .6) ku = 1 - seg(t, H.home + .6, H.home + 5.5);
      kp.visible = ku >= 0 && (t < 6.2 || t > H.home + .6);
      if (kp.visible) { const [px, py] = pathAt(ku); kp.position.set(px, py + .0004 * Math.abs(Math.sin(t * 7)), -.0875); kp.scale.x = t > 20 ? -1 : 1; kp.material.userData.u.uGlowLit.value = 1; kp.material.emissiveIntensity = 2.2 * (1 + .06 * Math.sin(7.3 * t) * Math.sin(3.1 * t)); }
      // door: a warm slit opens at H.door, closes behind him
      door.material.emissiveIntensity = 2.4 * env(t, H.door, 7.4, .5, .8);
      // stair windows: a band of light climbs with his lantern; the ones below stay softly lit
      const ly = lerp(TB + .01, TT, eio(seg(t, H.climb[0], H.climb[1])));
      const twU = tw.material.userData.u; twU.uGY.value.set(ly, .016, t > H.climb[0] ? .45 : 0, 1); tw.material.emissiveIntensity = t > H.climb[0] - .2 ? 5 : 0;
      if (t > 20) { twU.uGY.value.set(0, 1, 1, 0); tw.material.emissiveIntensity = 1.6; }   // after the lamp: the stair windows glow softly
      // the lamp
      const lit = ss(seg(t, H.light, H.light + .8)), B = beamAt(t, H);
      gl.material.emissiveIntensity = lit * (2.2 + 1.6 * (B.u !== undefined ? Math.pow(Math.max(0, Math.cos(TAU * B.u)), 8) : 0));
      lampGlow.userData.set(lit * (.5 + 1.2 * (B.u !== undefined ? Math.pow(Math.max(0, Math.cos(TAU * B.u)), 6) : 0)));
      const tq = 1 - .55 * ss(seg(t, H.title - .4, H.title + .4)); sf.material.uniforms.a.value = B.a; sf.material.uniforms.k.value = B.k * .85 * tq;
      U.uBeamO.value.set(LAMP[0], LAMP[1], B.k * 2.2); U.uBeamD.value.set(B.a, .06, .32);
      // ship lamp: steady faint, then the Morse reply
      let mo = 0; for (const [a, b] of H.morse) mo = Math.max(mo, env(t, a, b, .04, .06));
      sh.material.emissiveIntensity = t > 22 ? (.6 + 5 * mo) : 0; shipFlare.userData.set(mo * 1.4);
      for (const m of marks) { const g = eo(seg(t, m.userData.t, m.userData.t + .22)); m.scale.x = Math.max(.001, g); m.visible = t > m.userData.t; m.material.opacity = 1; }
      // title grows from its left edge
      const tg = eo(seg(t, H.title, H.title + .9)); title.scale.x = Math.max(.001, tg); title.visible = t > H.title;
      // the box: frame visible only once we leave the box
      box.visible = t > 35; spill.intensity = 1.2 * ss(seg(t, 36, 39));
      // occluder: slides across the lens 15.25 → 15.6
      occ.position.x = lerp(.06, 0, ss(seg(t, 15.2, 15.6))); occ.visible = t > 15.1 && t < 16;
      // lighting
      U.uLit.value = .55 + .25 * ss(seg(t, 0, 3)) + .25 * lit;
      U.uLightCol.value.set(t < 15 ? '#ffd2a0' : '#d8dcff').lerp(new THREE.Color('#ffd8a0'), lit);
      // focus: subject plane by shot; rack focus to the ship at 29.6–31.2
      const subj = t < 15.6 ? -.083 : t < 29.6 ? -.09 : t < 35.2 ? lerp(-.05, -.1235, ss(seg(t, 29.6, 31.2))) : -.07;
      focus = S.cam.position.z - subj; aper = t < 35.2 ? 7 : 3;
    },
    post() { return { focus, aper, maxCoc: 10, bloom: { strength: .42, radius: .55, threshold: 1.05 } }; },
    grade() { return {}; },
  };
}

// —— the lamp room ——
export function room(E) {
  const H = E.H;
  const S = stage({ light: [.02, .02, -.09], lightR: .09, lightCol: '#aab8f0', key: 1.4, keyPos: [-.1, .4, .35], keyTarget: [0, 0, -.06], amb: .3, ambCol: '#8fa0d8', floor: .3, fov: 40 });
  const { U } = S; S.cam.aspect = E.aspect; S.cam.updateProjectionMatrix();
  S.add(skyPanel({ w: .5, h: .82, z: -.142, stops: [[0, '#05081f'], [.6, '#18204e'], [1, '#2c3770']], stars: 220 }));
  const sea = S.add(sheet({ U, w: LW, h: LH, z: -.13, trans: .8, draw: x => { x.fillStyle = PAPER; waves(x, -.095, .003, 70, 5); } })); tint(sea, '#5466a2');
  const win = S.add(sheet({ U, w: LW, h: LH, z: -.112, trans: .2, draw: x => {   // the back windows: a mullion grid, glazing cut out
    x.fillStyle = PAPER; x.fillRect(-LW / 2, -LH / 2, LW, LH);
    cut(x, () => { for (let i = -2; i <= 2; i++) for (let j = 0; j < 2; j++) x.fillRect(i * .07 - .03, -.06 + j * .085, .06, .075); });
  } })); tint(win, '#1d2556');
  const lens = S.add(sheet({ U, w: .14, h: .2, x: .035, y: .015, z: -.08, trans: .75, glow: 0, glowCol: '#ffd690',
    draw: x => { x.fillStyle = PAPER; x.beginPath(); x.ellipse(0, 0, .052, .078, 0, 0, TAU); x.fill(); x.fillRect(-.056, -.082, .112, .008); x.fillRect(-.056, .074, .112, .008);
      cut(x, () => { x.lineWidth = .0012; for (let k = 1; k < 8; k++) { const yy = -.072 + k * .018; if (Math.abs(yy) < .022) continue; x.beginPath(); x.moveTo(-.05 * Math.sqrt(1 - (yy / .078) ** 2), yy); x.lineTo(.05 * Math.sqrt(1 - (yy / .078) ** 2), yy); x.stroke(); }
        x.beginPath(); x.arc(0, 0, .02, 0, TAU); x.stroke(); x.beginPath(); x.arc(0, 0, .011, 0, TAU); x.stroke(); }); },
    glowDraw: x => { const g = x.createRadialGradient(0, 0, 0, 0, 0, .08); g.addColorStop(0, '#fff'); g.addColorStop(.35, '#ddd'); g.addColorStop(1, '#333'); x.fillStyle = g; x.beginPath(); x.ellipse(0, 0, .052, .078, 0, 0, TAU); x.fill(); } })); tint(lens, '#9a8e68');
  const ped = S.add(sheet({ U, w: LW, h: LH, z: -.074, trans: .15, draw: x => { x.fillStyle = PAPER; poly(x, [[.015, -.067], [.055, -.067], [.063, -.4], [.007, -.4]]); x.fillRect(-.015, -.075, .1, .009); } })); tint(ped, '#232955');
  const flare = burst(.22, .22, '#ffcb7c'); flare.position.set(.035, .015, -.079); S.add(flare);
  // the keeper: jointed silhouette (body, head, upper arm, forearm + taper), rotation only
  const KC = '#0b0e28', FEET = [-.052, -.14];
  const body = S.add(sheet({ U, w: .08, h: .17, ax: 0, ay: -.085, x: FEET[0], y: FEET[1] + .085, z: -.046, trans: .05, draw: x => { x.translate(0, -.085); x.fillStyle = PAPER;
    poly(x, [[-.017, 0], [-.004, 0], [-.003, .05], [.002, .05], [.004, 0], [.017, 0], [.013, .058], [.02, .108], [.016, .128], [.003, .134], [-.012, .13], [-.02, .112], [-.016, .06]]);   // legs + coat
    x.fillRect(-.004, .13, .009, .008); } })); tint(body, KC);   // neck
  const head = new THREE.Group(); head.position.set(FEET[0] + .001, FEET[1] + .138, -.0455); S.scene.add(head);
  const hd = sheet({ U, w: .05, h: .05, z: 0, trans: .05, draw: x => { x.fillStyle = PAPER;
    x.beginPath(); x.ellipse(.002, .012, .0105, .012, 0, 0, TAU); x.fill();                            // head
    poly(x, [[-.012, .021], [.016, .021], [.022, .018], [.013, .015], [-.012, .016]]);                   // cap + peak
    x.fillRect(-.009, .021, .019, .006);
    poly(x, [[.004, .006], [.012, .004], [.010, -.004], [.002, -.002]]);                                   // beard
    poly(x, [[.011, .012], [.0155, .009], [.011, .007]]); } });                                             // nose
  tint(hd, KC); head.add(hd);
  const shoulder = new THREE.Group(); shoulder.position.set(FEET[0] + .01, FEET[1] + .122, -.044); S.scene.add(shoulder);
  const upper = sheet({ U, w: .06, h: .02, z: 0, trans: .05, draw: x => { x.fillStyle = PAPER; poly(x, [[-.003, .006], [.044, .004], [.046, -.004], [-.003, -.007]]); x.beginPath(); x.arc(0, 0, .0066, 0, TAU); x.fill(); } });
  tint(upper, KC); shoulder.add(upper);
  const elbow = new THREE.Group(); elbow.position.set(.042, 0, .0005); shoulder.add(elbow);
  const fore = sheet({ U, w: .14, h: .02, z: 0, trans: .05, draw: x => { x.fillStyle = PAPER; poly(x, [[0, .004], [.038, .0035], [.04, -.004], [0, -.0045]]); x.beginPath(); x.arc(.043, 0, .0045, 0, TAU); x.fill();
    x.fillRect(.044, -.0007, .062, .0014); } });   // forearm, hand, taper (a long lighting rod)
  tint(fore, KC); elbow.add(fore);
  const wick = burst(.03, .03, '#ffb050'); wick.position.set(.108, -.004, .001); elbow.add(wick);
  const front = S.add(sheet({ U, w: LW, h: LH, z: -.016, trans: .03, draw: x => { x.fillStyle = PAPER;
    x.fillRect(-LW / 2, -LH / 2, LW, LH / 2 - .148);                                       // floor + rail base
    x.fillRect(-LW / 2, -.148, LW, .004); for (let k = -6; k <= 6; k++) x.fillRect(k * .028 - .0012, -.148, .0024, .03); x.fillRect(-LW / 2, -.12, LW, .003);   // rail
    x.fillRect(-LW / 2, -LH / 2, .03, LH); x.fillRect(LW / 2 - .03, -LH / 2, .03, LH); x.fillRect(-LW / 2, LH / 2 - .06, LW, .06); } })); tint(front, '#05071a');
  const occ = new THREE.Mesh(new THREE.PlaneGeometry(.05, .12), new THREE.MeshBasicMaterial({ color: '#04050f' })); occ.position.set(0, 0, -.06); S.cam.add(occ); S.scene.add(S.cam);
  const layers = [sea, win, lens, ped, body, hd, upper, fore, front];
  const T0 = layers.map(m => m.material.userData.u.uTrans.value);
  // arm keys (radians): shoulder angle from +x, elbow relative
  const arm = track([[15.6, [-1.25, .9]], [16.0, [-1.3, .95]], [16.3, [-1.38, 1.0]], [17.5, [.42, -.18]], [17.85, [.47, -.2]], [18.6, [.47, -.2]], [19.8, [-.6, .7]], [22, [-1.2, .9]]]);
  return {
    S,
    update(t) {
      aim(S.cam, [-.012 + .004 * ss(seg(t, 17.6, 18.4)), -.012, .33 - .02 * ss(seg(t, 17.4, 18.6)), -.006, .0, -.07], t);
      const [sa, ea] = arm(t); shoulder.rotation.z = sa; elbow.rotation.z = ea;
      head.rotation.z = .16 * ss(seg(t, 18.3, 19.0)) - .05 * ss(seg(t, 19.8, 21));
      body.rotation.z = -.03 * ss(seg(t, 16.3, 17.5)) + .03 * ss(seg(t, 18.6, 19.8));
      const lit = ss(seg(t, H.light, H.light + .5));
      wick.userData.set((t < H.light + .3 ? 1.1 : 1.1 * (1 - ss(seg(t, H.light + .3, H.light + 1.2)))) * (1 + .1 * Math.sin(17 * t) * Math.sin(5.3 * t)));
      lens.material.emissiveIntensity = lit * (2.3 + (t > H.turn ? .7 * Math.pow(Math.max(0, Math.cos(TAU * (t - H.turn) / 3)), 6) : 0));
      flare.userData.set(lit * (1.4 - .9 * ss(seg(t, H.light + .2, H.light + 1.6))) + (t > H.turn ? .5 * Math.pow(Math.max(0, Math.cos(TAU * (t - H.turn) / 3)), 6) : 0));
      // the lamp turns on: source, then each layer's translucency in a 0.4 s stagger
      U.uLight.value.set(.035, .015, -.09);
      U.uLightCol.value.set('#a8b4ea').lerp(new THREE.Color('#ffd28c'), lit);
      U.uLightR.value = lerp(.09, .2, lit); U.uLit.value = .5 + 1.1 * lit;
      layers.forEach((m, i) => { const k = ss(seg(t, H.light + .1 + i * .07, H.light + .5 + i * .07)); m.material.userData.u.uTrans.value = T0[i] * (.6 + .9 * k); });
      occ.position.x = lerp(0, -.06, ss(seg(t, 15.6, 15.95))); occ.visible = t < 16;
    },
    post() { return { focus: S.cam.position.z + .05, aper: 6, maxCoc: 9, bloom: { strength: .5, radius: .55, threshold: 1.0 } }; },
    grade() { return {}; },
  };
}

// screen box of the paper title, for readcheck (approximate: the title sits in the upper middle of the frame)
export const TITLE_BOX = (W, H) => ({ x0: Math.round(W * .12), y0: Math.round(H * .3), x1: Math.round(W * .72), y1: Math.round(H * .42) });
