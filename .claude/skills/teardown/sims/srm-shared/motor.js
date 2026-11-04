// The motor's parts, built from code in millimetres (the root is scaled to scene units by the stage). Axis along z.
// buildMotor().update(state, view) poses it: the rotor turns by the same angle the maths integrates.
import * as THREE from 'three';
import {D2R, MOTOR as M, POLE, wrap90} from './srm.js';

const V2 = (p) => new THREE.Vector2(p[0], p[1]);
const lat = (aDeg, s, w) => { const a = aDeg * D2R, c = Math.cos(a), n = Math.sin(a); return [c * s - n * w, n * s + c * w]; };
const pol = (r, aDeg) => [r * Math.cos(aDeg * D2R), r * Math.sin(aDeg * D2R)];
const arc = (r, a0, a1, n) => { const o = []; for (let i = 0; i <= n; i++) o.push(pol(r, a0 + ((a1 - a0) * i) / n)); return o; };

function statorShape() {
  const {Ro, Ry, Rb, wt, shoulder, bs} = M;
  const outer = new THREE.Shape();
  outer.absarc(0, 0, Ro, 0, Math.PI * 2, false);
  const pts = [];
  for (let k = 0; k < 6; k++) {
    const a = k * 60, a2 = a + 60, root = Ry - 1;
    pts.push(...arc(Rb, a - bs / 2, a + bs / 2, 12));                       // tooth tip, facing the rotor
    pts.push(lat(a, shoulder, wt), lat(a, root, wt));                       // tooth side
    const r0 = Math.hypot(...lat(a, root, wt)), t0 = Math.atan2(...lat(a, root, wt).reverse()) / D2R;
    let t1 = Math.atan2(...lat(a2, root, -wt).reverse()) / D2R; while (t1 < t0) t1 += 360;
    pts.push(...arc(r0, t0, t1, 10).slice(1, -1));                          // slot floor
    pts.push(lat(a2, root, -wt), lat(a2, shoulder, -wt));
  }
  outer.holes.push(new THREE.Path(pts.map(V2)));
  return outer;
}
function rotorShape() {
  const {Rr, hub, shaft, rotorW, br} = M, pts = [];
  const sRoot = hub - 1, rRoot = Math.hypot(sRoot, rotorW), aRoot = Math.atan2(rotorW, sRoot) / D2R;
  for (let n = 0; n < 4; n++) {
    const a = n * 90;
    pts.push(...arc(Rr, a - br / 2, a + br / 2, 12));
    pts.push(lat(a, sRoot, rotorW));
    pts.push(...arc(rRoot, a + aRoot, a + 90 - aRoot, 8).slice(0, -1));
    pts.push(lat(a + 90, sRoot, -rotorW));
  }
  const s = new THREE.Shape(pts.map(V2));
  const h = new THREE.Path(); h.absarc(0, 0, shaft, 0, Math.PI * 2, true); s.holes.push(h);
  return s;
}
function rrShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2, P = Math.PI;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -P / 2, 0, false);
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, P / 2, false);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, P / 2, P, false);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, P, P * 1.5, false);
  return s;
}
const ext = (shape, depth, bevel = 0) => new THREE.ExtrudeGeometry(shape, {depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1, curveSegments: 24, steps: 1});
const zcyl = (r0, r1, len, z0, seg = 64, open = false) => { const g = new THREE.CylinderGeometry(r0, r1, len, seg, 1, open); g.rotateX(Math.PI / 2); g.translate(0, 0, z0); return g; };

export const ACCENT = '#ff5a1f';

export function buildMotor() {
  const root = new THREE.Group();
  const mats = {
    iron: new THREE.MeshStandardMaterial({color: '#8a929c', roughness: 0.55, metalness: 0.35, envMapIntensity: 0.45}),
    rotor: new THREE.MeshStandardMaterial({color: '#a3acb6', roughness: 0.5, metalness: 0.4, envMapIntensity: 0.5}),
    steel: new THREE.MeshStandardMaterial({color: '#d7dbe0', roughness: 0.28, metalness: 0.85, envMapIntensity: 0.8}),
    dark: new THREE.MeshStandardMaterial({color: '#2c3239', roughness: 0.6, metalness: 0.3}),
    mark: new THREE.MeshStandardMaterial({color: ACCENT, roughness: 0.5, emissive: ACCENT, emissiveIntensity: 0.25}),
    glass: new THREE.MeshPhysicalMaterial({color: '#cfd8e0', roughness: 0.2, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide}),
    coil: [0, 1, 2].map(() => new THREE.MeshStandardMaterial({color: '#c4723d', roughness: 0.38, metalness: 0.7, emissive: ACCENT, emissiveIntensity: 0, envMapIntensity: 0.7})),
    led: [0, 1, 2].map(() => new THREE.MeshStandardMaterial({color: '#4a4f55', emissive: ACCENT, emissiveIntensity: 0, roughness: 0.5})),
  };
  const add = (parent, geo, mat, name) => { const m = new THREE.Mesh(geo, mat); m.name = name; m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const half = M.stack / 2;

  // stator: the laminated iron core
  const stator = new THREE.Group(); root.add(stator);
  const sg = ext(statorShape(), M.stack); sg.translate(0, 0, -half);
  add(stator, sg, mats.iron, 'Stator core');

  // coils: one rectangular winding round each stator tooth; opposite teeth belong to the same phase
  const coils = [];
  for (let k = 0; k < 6; k++) {
    const ph = k % 3, a = k * 60, u = new THREE.Vector3(Math.cos(a * D2R), Math.sin(a * D2R), 0), n = new THREE.Vector3(-Math.sin(a * D2R), Math.cos(a * D2R), 0);
    const t = 7, w = (M.wt + 0.4 + t) * 2, h = (M.stack + 0.8 + t * 2);
    const shape = rrShape(w, h, 6), hole = rrShape(M.wt * 2 + 0.8, M.stack + 0.8, 1.2);
    shape.holes.push(new THREE.Path(hole.getPoints().reverse()));
    const s0 = 36, len = 11;
    const g = ext(shape, len, 0.5);
    g.applyMatrix4(new THREE.Matrix4().makeBasis(n, new THREE.Vector3(0, 0, 1), u));
    g.translate(u.x * s0, u.y * s0, 0);
    const m = add(stator, g, mats.coil[ph], 'Coil ' + 'ABC'[ph] + (k < 3 ? '1' : '2'));
    m.userData = {ph, dir: u.clone()};
    coils.push(m);
  }

  // rotor: laminated iron with four salient poles, on a steel shaft; a position disc rides at the rear
  const rotor = new THREE.Group(); root.add(rotor);
  const rg = ext(rotorShape(), M.stack); rg.translate(0, 0, -half);
  add(rotor, rg, mats.rotor, 'Rotor core');
  add(rotor, zcyl(M.shaft, M.shaft, 126, 7, 40), mats.steel, 'Shaft');
  const key = add(rotor, new THREE.BoxGeometry(4, 2.4, 26), mats.steel, 'Key'); key.position.set(0, M.shaft - 0.2, 56);
  const mark = add(rotor, new THREE.BoxGeometry(2.4, 1.2, M.stack - 4), mats.mark, 'Rotor pole mark'); mark.position.set(M.Rr + 0.2, 0, 0); mark.rotation.z = 0;
  const dshape = new THREE.Shape(); dshape.absarc(0, 0, 22, 0, Math.PI * 2, false);
  for (let n = 0; n < 4; n++) { const a = n * 90 + 45, p = new THREE.Path(); const pts = [...arc(11, a - 18, a + 18, 6), ...arc(19.5, a + 18, a - 18, 6)]; p.setFromPoints(pts.map(V2)); dshape.holes.push(p); }
  const dg = ext(dshape, 1.6); dg.translate(0, 0, -51);
  const disc = add(rotor, dg, mats.dark, 'Position disc');
  disc.castShadow = false;

  // sensors on a bracket at the rear: one per phase, they light with the phase they switch
  const rear = new THREE.Group(); root.add(rear);
  for (let k = 0; k < 3; k++) {
    const a = POLE[k], p = pol(24, a), box = add(rear, new THREE.BoxGeometry(7, 7, 9), mats.led[k], 'Sensor ' + 'ABC'[k]);
    box.position.set(p[0], p[1], -51); box.rotation.z = a * D2R;
  }
  const bracket = add(rear, zcyl(M.Ro + 2, M.Ro + 2, 3, -44.5, 64), mats.dark, 'Rear plate');
  bracket.visible = false;

  // housing: a shell and two end bells with bearings; hidden by default so the iron and copper show
  const housing = new THREE.Group(); root.add(housing);
  const shell = add(housing, zcyl(M.Ro + 5, M.Ro + 5, 80, 0, 80, true), mats.glass, 'Housing shell'); shell.castShadow = false;
  const bellF = new THREE.Group(), bellR = new THREE.Group(); housing.add(bellF, bellR);
  add(bellF, zcyl(M.Ro + 5, M.Ro + 5, 6, 39, 80), mats.dark, 'Front end bell');
  add(bellF, zcyl(15, 15, 12, 48, 40), mats.dark, 'Front bearing');
  add(bellR, zcyl(M.Ro + 5, M.Ro + 5, 6, -39, 80), mats.dark, 'Rear end bell');
  add(bellR, zcyl(15, 15, 12, -48, 40), mats.dark, 'Rear bearing');
  housing.visible = false;

  // flux paths: glowing loops through tooth -> gap -> rotor -> gap -> opposite tooth -> yoke, drawn through the iron
  const fluxGroup = new THREE.Group(); root.add(fluxGroup);
  const fluxMat = new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false,
    uniforms: {uA: {value: 0}, uT: {value: 0}, uC: {value: new THREE.Color(ACCENT)}},
    vertexShader: 'varying float vU; void main(){ vU = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uA; uniform float uT; uniform vec3 uC; varying float vU; void main(){ float d = fract(vU * 14.0 - uT); float b = 0.45 + 0.55 * smoothstep(0.0, 0.5, d) * (1.0 - smoothstep(0.7, 1.0, d)); gl_FragColor = vec4(uC, uA * b); }',
  });
  const fluxMats = [0, 1, 2].map(() => fluxMat.clone());
  let fluxMeshes = [];
  const fluxPath = (k, side, th) => {
    const a0 = POLE[k], rho = a0 - wrap90(a0 - th), z = side * 1.8, P = (r, a) => { const p = pol(r, a); return new THREE.Vector3(p[0], p[1], z); };
    const yk = 57, pts = [P(yk, a0), P(42, a0), P(31.5, a0), P(M.Rb - 0.25, a0), P(22, rho), P(14, rho), P(5, rho), new THREE.Vector3(0, 0, z), P(5, rho + 180), P(14, rho + 180), P(22, rho + 180),
      P(M.Rb - 0.25, a0 + 180), P(31.5, a0 + 180), P(42, a0 + 180), P(yk, a0 + 180), P(yk, a0 + 180 + side * 45), P(yk, a0 + 180 + side * 90), P(yk, a0 + 180 + side * 135)];
    return new THREE.CatmullRomCurve3(pts, true, 'centripetal');
  };
  function updateFlux(state, show) {
    fluxMeshes.forEach((m) => { fluxGroup.remove(m); m.geometry.dispose(); });
    fluxMeshes = [];
    if (!show) return;
    for (let k = 0; k < 3; k++) {
      const psi = state.psi[k];
      if (psi < 0.012) continue;
      fluxMats[k].uniforms.uA.value = Math.min(0.95, 0.25 + psi * 7);
      fluxMats[k].uniforms.uT.value = state.flow;
      for (const side of [-1, 1]) {
        const m = new THREE.Mesh(new THREE.TubeGeometry(fluxPath(k, side, state.th), 90, 0.75, 5, true), fluxMats[k]);
        m.renderOrder = 8; fluxGroup.add(m); fluxMeshes.push(m);
      }
    }
  }

  // label anchors (objects that ride the part they name)
  const anchor = (parent, p) => { const o = new THREE.Object3D(); o.position.set(...p); parent.add(o); return o; };
  const anchors = {
    stator: anchor(stator, [...pol(57, 118), half]), coil: anchor(stator, [43, 11, 32.5]), rotor: anchor(rotor, [27, 3, half]),
    gap: anchor(stator, [...pol(29.75, 240), half]), shaft: anchor(rotor, [0, 0, 69]), disc: anchor(rotor, [20, 0, -50]), housing: anchor(housing, [-50, -50, 40]),
  };

  const ex = {rotor: 78, bellF: 128, bellR: -46, coil: 13};
  function update(state, view) {
    rotor.rotation.z = state.th;
    const e = view.explode;
    rotor.position.z = e * ex.rotor;
    bellF.position.z = e * ex.bellF; bellR.position.z = e * ex.bellR; rear.position.z = e * ex.bellR;
    coils.forEach((c) => { c.position.copy(c.userData.dir).multiplyScalar(e * ex.coil); c.visible = !!view.coils; });
    housing.visible = !!view.housing;
    for (let k = 0; k < 3; k++) {
      mats.coil[k].emissiveIntensity = Math.min(1, (state.i[k] / M.Imax) * 1.4);
      mats.led[k].emissiveIntensity = state.on[k] ? 1.2 : 0;
    }
    updateFlux(state, view.flux && e < 0.4);
  }
  return {root, update, anchors, mats, rotor, stator, coils, housing};
}
