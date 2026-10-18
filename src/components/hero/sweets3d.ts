/*
 * Procedural 3D Indian sweets for the homepage hero scenes (three.js).
 * Everything is modelled in code – no downloads – so it loads fast and stays sharp on every screen.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/* ---------- small helpers ---------- */
/* phones get lighter models */
const LOW = typeof window !== 'undefined' && (matchMedia('(max-width: 760px)').matches || (navigator.hardwareConcurrency || 8) <= 4);

export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/* Value-noise canvas texture: used for grain, pores, brushed metal and crinkled silver leaf. */
function noiseCanvas(size: number, seed: number, draw: (ctx: CanvasRenderingContext2D, r: () => number, size: number) => void) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  draw(ctx, rng(seed), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
const texCache = new Map<string, THREE.Texture>();
function tex(key: string, make: () => THREE.Texture) {
  if (!texCache.has(key)) texCache.set(key, make());
  return texCache.get(key)!;
}

/* Fine speckle noise (grainy milk sweets, crisp jalebi surface). */
const grain = () => tex('grain', () => noiseCanvas(256, 3, (ctx, r, s) => {
  const img = ctx.createImageData(s, s);
  for (let i = 0; i < s * s; i++) { const v = 110 + r() * 145; img.data.set([v, v, v, 255], i * 4); }
  ctx.putImageData(img, 0, 0);
}));
/* Porous holes (Mysore pak). */
const pores = () => tex('pores', () => noiseCanvas(512, 9, (ctx, r, s) => {
  ctx.fillStyle = '#c8c8c8'; ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 2600; i++) {
    const x = r() * s, y = r() * s, rad = 1 + r() * r() * 7;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, 'rgba(20,20,20,.95)'); g.addColorStop(1, 'rgba(20,20,20,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
  }
}));
/* Crinkled foil (silver varq on kaju katli). */
const foil = () => tex('foil', () => noiseCanvas(512, 21, (ctx, r, s) => {
  ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 900; i++) {
    ctx.strokeStyle = `rgba(${r() > .5 ? 255 : 0},${r() > .5 ? 255 : 0},${r() > .5 ? 255 : 0},${.08 + r() * .2})`;
    ctx.lineWidth = .5 + r() * 2.5;
    ctx.beginPath(); let x = r() * s, y = r() * s; ctx.moveTo(x, y);
    for (let k = 0; k < 4; k++) { x += (r() - .5) * 60; y += (r() - .5) * 60; ctx.lineTo(x, y); }
    ctx.stroke();
  }
}));
/* Concentric brushed rings (brass thali). */
const brushed = () => tex('brushed', () => noiseCanvas(1024, 5, (ctx, r, s) => {
  ctx.fillStyle = '#5a5a5a'; ctx.fillRect(0, 0, s, s);
  for (let rad = 4; rad < s * .72; rad += 1.6 + r() * 2) {
    ctx.strokeStyle = `rgba(${r() > .5 ? 255 : 0},${r() > .5 ? 255 : 0},${r() > .5 ? 255 : 0},${.04 + r() * .09})`;
    ctx.lineWidth = .6 + r(); ctx.beginPath(); ctx.arc(s / 2, s / 2, rad, 0, Math.PI * 2); ctx.stroke();
  }
  // engraved decorative band
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 3;
  for (const rr of [s * .33, s * .36, s * .455]) { ctx.beginPath(); ctx.arc(s / 2, s / 2, rr, 0, Math.PI * 2); ctx.stroke(); }
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2; ctx.beginPath();
    ctx.ellipse(s / 2 + Math.cos(a) * s * .345, s / 2 + Math.sin(a) * s * .345, 9, 4, a, 0, Math.PI * 2); ctx.stroke();
  }
}));
/* Soft round sprite for sparkles / dust. */
export const sparkSprite = () => tex('spark', () => {
  const c = document.createElement('canvas'); c.width = c.height = 128; const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,248,225,1)'); g.addColorStop(.18, 'rgba(255,224,150,.85)'); g.addColorStop(.5, 'rgba(255,190,90,.18)'); g.addColorStop(1, 'rgba(255,190,90,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = 'rgba(255,250,235,.9)';
  ctx.beginPath(); ctx.moveTo(64, 6); ctx.lineTo(70, 58); ctx.lineTo(122, 64); ctx.lineTo(70, 70); ctx.lineTo(64, 122); ctx.lineTo(58, 70); ctx.lineTo(6, 64); ctx.lineTo(58, 58); ctx.closePath(); ctx.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
});
/* Pure soft glow (no star rays) for halos. */
export const glowSprite = () => tex('glow', () => {
  const c = document.createElement('canvas'); c.width = c.height = 256; const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.3, 'rgba(255,255,255,.45)'); g.addColorStop(.65, 'rgba(255,255,255,.1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
});
/* Soft shadow under objects. */
export function contactShadow(radius: number, opacity = .55) {
  const t = tex('shadow', () => {
    const c = document.createElement('canvas'); c.width = c.height = 256; const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.45, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

/* ---------- renderer, lights, environment ---------- */
export function makeRenderer(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !LOW || (window.devicePixelRatio || 1) < 2, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, LOW ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.setClearColor(0x000000, 0);
  return renderer;
}
/* A dark warm studio with soft boxes: gives metal and syrup rich, contrasty reflections. */
function studioEnvScene() {
  const env = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({ color: 0x7a4824, side: THREE.BackSide }));
  env.add(room);
  const panel = (w: number, h: number, color: [number, number, number], pos: [number, number, number]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(...color), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m);
  };
  panel(14, 7, [5, 4.3, 3.4], [0, 13, 4]);      // big top softbox
  panel(13, 4, [2.6, 2.2, 1.45], [1, 7, -12]);   // high back softbox – a bright sweep across flat plate tops
  panel(12, 6, [2.3, 1.85, 1.2], [0, 11, -9]);  // upper back sweep (tilted plates)
  panel(3, 12, [3.2, 2.4, 1.5], [-12, 3, 5]);  // left strip
  panel(3, 12, [4, 1.8, 0.7], [12, 2, -4]);    // warm orange rim
  panel(10, 2, [2.2, 1.7, 1.2], [0, 2, -14]);  // back line (bright edge on plates)
  panel(6, 6, [1.4, 1.1, 0.8], [6, -6, 10]);   // floor bounce
  return env;
}
export function studio(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = studioEnvScene();
  scene.environment = pmrem.fromScene(envScene, 0.02).texture;
  scene.environmentIntensity = 1;
  envScene.traverse(o => { if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose(); });
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffe2b8, 0x2a0c14, 0.35));
  const key = new THREE.DirectionalLight(0xffe0b0, 1.9); key.position.set(-3.5, 6, 4.5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff9050, 2.4); rim.position.set(4, 2.5, -5); scene.add(rim);
  const fill = new THREE.PointLight(0xffb060, 4, 14, 1.6); fill.position.set(2.5, 1.2, 4); scene.add(fill);
  return { key, rim, fill };
}

/* ---------- materials (shared) ---------- */
const M = {
  gold: () => new THREE.MeshStandardMaterial({ color: 0xe2ad4c, metalness: 1, roughness: 0.3, roughnessMap: brushed(), envMapIntensity: 1.15 }),
  ladooCore: () => new THREE.MeshStandardMaterial({ color: 0xd9530a, roughness: 0.75 }),
  boondi: () => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.42, envMapIntensity: 0.7 }),
  pista: () => new THREE.MeshStandardMaterial({ color: 0x7f9e3c, roughness: 0.6 }),
  katli: () => new THREE.MeshStandardMaterial({ color: 0xe6d1ae, roughness: 0.7, bumpMap: grain(), bumpScale: 0.6 }),
  varq: () => new THREE.MeshStandardMaterial({ color: 0xf4f4f6, metalness: 0.75, roughness: 0.42, bumpMap: foil(), bumpScale: 2.4, envMapIntensity: 1.3, emissive: 0x2a2826 }),
  jalebi: () => new THREE.MeshPhysicalMaterial({ color: 0xff7d14, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.1, bumpMap: grain(), bumpScale: 0.9, emissive: 0x8a2400, emissiveIntensity: 0.3 }),
  jamun: () => new THREE.MeshPhysicalMaterial({ color: 0x5b230f, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.04, bumpMap: grain(), bumpScale: 0.25 }),
  mysore: () => new THREE.MeshStandardMaterial({ color: 0xd98a22, roughness: 0.82, bumpMap: pores(), bumpScale: 2.2, roughnessMap: pores() }),
  peda: () => new THREE.MeshStandardMaterial({ color: 0xf2b83e, roughness: 0.66, bumpMap: grain(), bumpScale: 0.7 }),
  saffron: () => new THREE.MeshStandardMaterial({ color: 0xc8320f, roughness: 0.5, emissive: 0x5a0d00, emissiveIntensity: 0.3 }),
  syrup: () => new THREE.MeshStandardMaterial({ color: 0x6a2a08, roughness: 0.04, metalness: 0.2, envMapIntensity: 1.6 }),
};
const mats: Partial<Record<keyof typeof M, THREE.Material>> = {};
const mat = (k: keyof typeof M) => (mats[k] ??= M[k]());

/* ---------- sweets ---------- */
export type Sweet = THREE.Group & { userData: { kind: string; radius: number } };
function group(kind: string, radius: number) { const g = new THREE.Group() as Sweet; g.userData = { kind, radius }; return g; }

function pistachioBits(g: THREE.Group, r: () => number, count: number, radius: number, top = true) {
  const geo = new THREE.BoxGeometry(radius * .2, radius * .05, radius * .08);
  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(geo, mat('pista'));
    const a = r() * Math.PI * 2, rr = radius * (top ? .25 + r() * .45 : .9);
    m.position.set(Math.cos(a) * rr, radius * (top ? .9 + r() * .08 : r() - .5), Math.sin(a) * rr);
    m.rotation.set(r() * .6, r() * Math.PI, r() * .6);
    g.add(m);
  }
}

/* Motichoor ladoo: hundreds of tiny glossy boondi pearls packed into a ball. */
export function ladoo(radius = .42, seed = 1): Sweet {
  const g = group('ladoo', radius), r = rng(seed);
  const core = new THREE.Mesh(new THREE.SphereGeometry(radius * .93, 32, 24), mat('ladooCore'));
  g.add(core);
  const n = LOW ? 360 : 640, pearl = new THREE.SphereGeometry(radius * .082, 7, 5);
  const inst = new THREE.InstancedMesh(pearl, mat('boondi'), n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), col = new THREE.Color();
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2, rad = Math.sqrt(1 - y * y), th = golden * i + r() * .4;
    p.set(Math.cos(th) * rad, y, Math.sin(th) * rad).multiplyScalar(radius * (.94 + r() * .07));
    const k = .8 + r() * .45; s.set(k, k, k);
    q.setFromEuler(new THREE.Euler(r() * 3, r() * 3, r() * 3));
    m4.compose(p, q, s); inst.setMatrixAt(i, m4);
    col.setHSL(.055 + r() * .03, 1, .42 + r() * .12); inst.setColorAt(i, col);
  }
  g.add(inst);
  pistachioBits(g, r, 6, radius);
  g.scale.y = .94;
  return g;
}

/* Kaju katli: cashew-fudge diamond with crinkled silver varq on top. */
export function kajuKatli(size = .62, seed = 2): Sweet {
  const g = group('katli', size * .6), r = rng(seed);
  const shape = new THREE.Shape();
  shape.moveTo(0, size * .62); shape.lineTo(size * .42, 0); shape.lineTo(0, -size * .62); shape.lineTo(-size * .42, 0); shape.closePath();
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: size * .19, bevelEnabled: true, bevelThickness: size * .025, bevelSize: size * .025, bevelSegments: 3 }), mat('katli'));
  body.rotation.x = -Math.PI / 2;
  g.add(body);
  const leaf = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: size * .006, bevelEnabled: false }), mat('varq'));
  leaf.scale.setScalar(.93); leaf.rotation.x = -Math.PI / 2; leaf.position.y = size * .218;
  g.add(leaf);
  g.rotation.y = r() * Math.PI;
  return g;
}

/* Jalebi: a crisp, syrup-glazed spiral – a tube following a hand-piped path. */
export function jalebi(size = .62, seed = 3): Sweet {
  const g = group('jalebi', size), r = rng(seed);
  const pts: THREE.Vector3[] = [];
  const turns = 2.6, steps = 260;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, a = t * turns * Math.PI * 2;
    const rad = size * (.12 + t * .8) * (1 + Math.sin(a * 3 + seed) * .04);
    pts.push(new THREE.Vector3(Math.cos(a) * rad, Math.sin(a * 2.3) * size * .03 + (r() - .5) * size * .01, Math.sin(a) * rad));
  }
  // the classic cross-over loop
  const end = pts[pts.length - 1];
  pts.push(new THREE.Vector3(end.x * .4, size * .06, end.z * -.2), new THREE.Vector3(-end.x * .5, size * .03, -end.z * .6));
  const curve = new THREE.CatmullRomCurve3(pts);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 420, size * .1, 10, false), mat('jalebi'));
  g.add(mesh);
  return g;
}

/* Gulab jamun: dark, glossy, syrup-soaked dumpling. */
export function gulabJamun(radius = .3, seed = 4): Sweet {
  const g = group('jamun', radius), r = rng(seed);
  const geo = new THREE.SphereGeometry(radius, 48, 32);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) { // gentle irregular surface
    const v = new THREE.Vector3().fromBufferAttribute(pos, i);
    v.multiplyScalar(1 + Math.sin(v.x * 18 + seed) * Math.cos(v.z * 16) * .018);
    pos.setXYZ(i, v.x, v.y * .9, v.z);
  }
  geo.computeVertexNormals();
  g.add(new THREE.Mesh(geo, mat('jamun')));
  pistachioBits(g, r, 3, radius);
  return g;
}

/* Ghee Mysore pak: golden porous block. */
export function mysorePak(size = .55, seed = 5): Sweet {
  const g = group('mysore', size * .7), r = rng(seed);
  const m = new THREE.Mesh(new RoundedBoxGeometry(size * 1.1, size * .5, size * .8, 3, size * .06), mat('mysore'));
  g.add(m);
  g.rotation.y = r() * Math.PI;
  return g;
}

/* Kesar peda: soft round with a thumb press, saffron strands and pistachio. */
export function peda(radius = .34, seed = 6): Sweet {
  const g = group('peda', radius), r = rng(seed);
  const prof: THREE.Vector2[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24, a = t * Math.PI;
    const x = Math.sin(a) * radius, y = -Math.cos(a) * radius * .58;
    const dent = t > .78 ? Math.pow((t - .78) / .22, 1.5) * radius * .22 : 0; // thumb dent on top
    prof.push(new THREE.Vector2(Math.max(0.0001, x), y - dent));
  }
  g.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 48), mat('peda')));
  const strand = new THREE.CylinderGeometry(radius * .012, radius * .012, radius * .5, 5);
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(strand, mat('saffron'));
    s.position.set((r() - .5) * radius * .4, radius * .38, (r() - .5) * radius * .4);
    s.rotation.set(Math.PI / 2 + (r() - .5) * .4, 0, r() * Math.PI);
    g.add(s);
  }
  pistachioBits(g, r, 3, radius * .8);
  return g;
}

/* Brass thali with engraved rim, and a small katori (bowl). */
export function thali(radius = 2): THREE.Group {
  const g = new THREE.Group();
  const prof = [
    new THREE.Vector2(0.001, 0), new THREE.Vector2(radius * .86, 0), new THREE.Vector2(radius * .9, .02),
    new THREE.Vector2(radius * .94, radius * .05), new THREE.Vector2(radius, radius * .1), new THREE.Vector2(radius * 1.015, radius * .105),
    new THREE.Vector2(radius * 1.01, radius * .085), new THREE.Vector2(radius * .95, radius * .04), new THREE.Vector2(radius * .9, -.01),
    new THREE.Vector2(0.001, -.02),
  ];
  const plate = new THREE.Mesh(new THREE.LatheGeometry(prof, 128), mat('gold'));
  g.add(plate);
  return g;
}
export function katori(radius = .62): THREE.Group {
  const g = new THREE.Group();
  const prof: THREE.Vector2[] = [];
  for (let i = 0; i <= 20; i++) { const t = i / 20; prof.push(new THREE.Vector2(radius * (.55 + .45 * Math.sin(t * Math.PI / 2)), radius * .62 * t * t * (3 - 2 * t))); }
  prof.push(new THREE.Vector2(radius * 1.04, radius * .64), new THREE.Vector2(radius * .97, radius * .62));
  for (let i = 20; i >= 0; i--) { const t = i / 20; prof.push(new THREE.Vector2(radius * .95 * (.55 + .45 * Math.sin(t * Math.PI / 2)), radius * .04 + radius * .58 * t * t * (3 - 2 * t))); }
  g.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 64), mat('gold')));
  const syrup = new THREE.Mesh(new THREE.CircleGeometry(radius * .9, 48), mat('syrup'));
  syrup.rotation.x = -Math.PI / 2; syrup.position.y = radius * .4;
  g.add(syrup);
  return g;
}

/* Twinkling gold sparkles (custom shader: each point has its own phase). */
export function sparkles(count: number, spread: THREE.Vector3, seed = 11) {
  const r = rng(seed);
  const pos = new Float32Array(count * 3), phase = new Float32Array(count), size = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos.set([(r() - .5) * spread.x, (r() - .5) * spread.y, (r() - .5) * spread.z], i * 3);
    phase[i] = r() * Math.PI * 2; size[i] = .5 + r() * 1.2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('phase', new THREE.BufferAttribute(phase, 1));
  geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uMap: { value: sparkSprite() }, uScale: { value: 60 } },
    vertexShader: `attribute float phase; attribute float size; uniform float uTime; uniform float uScale; varying float vA;
      void main(){ vec3 p = position; p.y += sin(uTime*.4 + phase*3.)*.12; vec4 mv = modelViewMatrix*vec4(p,1.);
      float tw = .5 + .5*sin(uTime*2.2 + phase*6.); vA = tw*tw; gl_PointSize = size*uScale*(.6+.6*tw)/-mv.z; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform sampler2D uMap; varying float vA; void main(){ vec4 c = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(c.rgb, c.a*vA); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geo, material);
}

/* A full plate of sweets, arranged like the shop's festive thali. */
export function sweetsPlate(radius = 2) {
  const g = new THREE.Group();
  g.add(thali(radius));
  const k = katori(radius * .3); k.position.set(-radius * .05, 0.01, -radius * .38); g.add(k);
  [[-.16, -.42], [.08, -.36], [-.04, -.22]].forEach(([x, z], i) => { const j = gulabJamun(radius * .1, 40 + i); j.position.set(x * radius, radius * .17, z * radius); g.add(j); });
  const place = (o: THREE.Object3D, x: number, z: number, y: number, ry = 0) => { o.position.set(x * radius, y, z * radius); o.rotation.y += ry; g.add(o); return o; };
  place(ladoo(radius * .17, 1), -.55, .05, radius * .17);
  place(ladoo(radius * .17, 2), -.3, .38, radius * .17);
  place(ladoo(radius * .16, 3), -.62, -.32, radius * .16);
  place(kajuKatli(radius * .3, 4), .12, .12, .02, .4);
  place(kajuKatli(radius * .3, 5), .36, .02, .02, -.3);
  const kk = place(kajuKatli(radius * .3, 6), .24, .1, radius * .1, .9); kk.rotation.z = .12;
  place(jalebi(radius * .26, 7), .02, .58, .04);
  place(peda(radius * .13, 8), .5, -.38, radius * .07);
  place(peda(radius * .13, 9), .62, -.08, radius * .07);
  place(mysorePak(radius * .2, 10), .5, .42, radius * .065, .3);
  return g;
}
