// Shared three.js helpers: materials, textures, rounded boxes.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export { THREE };
export const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
export const tex = (c, { srgb = true, rep = null } = {}) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); } return t; };
export const rbox = (w, h, d, r = 0.08) => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.01, h / 2.01, d / 2.01));
export const cyl = (r0, r1, h, seg = 20) => new THREE.CylinderGeometry(r0, r1, h, seg);
export const add = (parent, geo, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; };
const noiseTex = (() => { const c = cv(256, 256), g = c.getContext('2d'); g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 6000; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,.25)' : 'rgba(255,255,255,.25)'; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); } return tex(c, { srgb: false, rep: [4, 4] }); })();
const P = (o) => new THREE.MeshPhysicalMaterial({ roughnessMap: noiseTex, ...o });
export const M = {
  maroon: P({ color: '#8b1e24', roughness: 0.45, metalness: 0.2, clearcoat: 0.5, clearcoatRoughness: 0.35 }),
  cream: P({ color: '#efe4c6', roughness: 0.45, metalness: 0.1, clearcoat: 0.4 }),
  steel: P({ color: '#c7cbd0', roughness: 0.35, metalness: 0.75 }),
  coachRed: P({ color: '#b3262a', roughness: 0.4, metalness: 0.3, clearcoat: 0.4 }),
  roof: P({ color: '#8f959b', roughness: 0.6, metalness: 0.4 }),
  dark: P({ color: '#232629', roughness: 0.7, metalness: 0.35 }),
  black: P({ color: '#141516', roughness: 0.8, metalness: 0.2 }),
  metal: P({ color: '#9aa0a6', roughness: 0.3, metalness: 0.9 }),
  wheel: P({ color: '#5a5d61', roughness: 0.45, metalness: 0.85 }),
  rail: P({ color: '#7b7873', roughness: 0.3, metalness: 0.85 }),
  yellow: P({ color: '#f2c12e', roughness: 0.5, metalness: 0.05 }),
  glass: new THREE.MeshPhysicalMaterial({ color: '#0d161e', roughness: 0.05, metalness: 0.3, clearcoat: 1, envMapIntensity: 1.6 }),
  insul: P({ color: '#5d3a28', roughness: 0.5, metalness: 0.1 }),
  concrete: P({ color: '#b9b2a6', roughness: 0.95, metalness: 0 }),
  sleeper: P({ color: '#8d8880', roughness: 0.95, metalness: 0 }),
  lamp: new THREE.MeshStandardMaterial({ color: '#fff8e0', emissive: '#fff4c8', emissiveIntensity: 0.15 }),
  red: new THREE.MeshStandardMaterial({ color: '#3a0b0b', emissive: '#ff2a1a', emissiveIntensity: 0 }),
  amber: new THREE.MeshStandardMaterial({ color: '#3a2a08', emissive: '#ffb21a', emissiveIntensity: 0 }),
  green: new THREE.MeshStandardMaterial({ color: '#083a14', emissive: '#2aff6a', emissiveIntensity: 0 }),
  wire: new THREE.MeshStandardMaterial({ color: '#4d4a46', roughness: 0.5, metalness: 0.8 }),
};
