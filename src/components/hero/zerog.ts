/*
 * "Zero Gravity": every sweet is built from thousands of glossy sugar pearls levitating above a glowing ring.
 * They break apart, swirl weightlessly and re-form into the next sweet. Move the mouse through them, or tap, and they scatter.
 */
import * as THREE from 'three';
import { glowSprite, sparkles, rng, LOW } from './sweets3d';
import { ease, type SceneBuilder } from './stage3d';

const N = LOW ? 3400 : 6000;
type Shape = { name: string; pos: Float32Array; nrm: Float32Array; col: Float32Array; size: number; smooth: number };

/* ---------- shape helpers ---------- */
const C = new THREE.Color();
function shape(name: string, size: number, smooth: number, seed: number, fill: (put: Put, r: () => number) => void, rx = 0, ry = 0, rz = 0): Shape {
  const pos = new Float32Array(N * 3), nrm = new Float32Array(N * 3), col = new Float32Array(N * 4);
  const r = rng(seed);
  const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz));
  const v = new THREE.Vector3(), n = new THREE.Vector3();
  let i = 0;
  const put: Put = (x, y, z, nx, ny, nz, h, s, l, gloss) => {
    if (i >= N) return;
    v.set(x, y, z).applyMatrix4(m); n.set(nx, ny, nz).normalize().transformDirection(m);
    pos.set([v.x, v.y, v.z], i * 3); nrm.set([n.x, n.y, n.z], i * 3);
    C.setHSL(((h % 1) + 1) % 1, Math.min(1, s), Math.min(1, l));
    col.set([C.r, C.g, C.b, gloss], i * 4);
    i++;
  };
  while (i < N) fill(put, r);
  return { name, pos, nrm, col, size, smooth };
}
type Put = (x: number, y: number, z: number, nx: number, ny: number, nz: number, h: number, s: number, l: number, gloss: number) => void;
const sphereDir = (r: () => number) => { const u = r() * 2 - 1, a = r() * Math.PI * 2, k = Math.sqrt(1 - u * u); return [Math.cos(a) * k, u, Math.sin(a) * k]; };

/* Motichoor ladoo – a ball of tiny orange boondi with pistachio and saffron. */
const ladoo = () => shape('Motichoor Ladoo', 1.12, 0.15, 1, (put, r) => {
  const [x, y, z] = sphereDir(r), R = 1.55 * (0.96 + r() * 0.07);
  const k = r();
  if (k < 0.035 && y > 0.2) put(x * R * 1.02, y * R * 0.94 * 1.02, z * R * 1.02, x, y, z, 0.24, 0.55, 0.42, 0.3); // pistachio
  else if (k < 0.045 && y > 0.3) put(x * R * 1.02, y * R * 0.94 * 1.02, z * R * 1.02, x, y, z, 0.01, 0.9, 0.38, 0.5); // saffron
  else put(x * R, y * R * 0.94, z * R, x, y, z, 0.035 + r() * 0.028, 1, 0.37 + r() * 0.12, 0.75);
});

/* Bellam poothrekulu – paper-thin rice sheets rolled around jaggery and dry fruit; the ends show the layers. */
const poothrekulu = () => shape('Bellam Poothrekulu', 1.0, 0.92, 2, (put, r) => {
  const L = 1.55, A = 0.62, B = 0.85; // half length, half height, half depth (rounded oval roll)
  if (r() < 0.82) {
    const x = (r() * 2 - 1) * L, a = r() * Math.PI * 2;
    const y = Math.sin(a) * A, z = Math.cos(a) * B;
    const stripe = Math.sin(a * 26 + x * 1.5) > 0.55 ? -0.06 : 0; // folds of the sheet
    const brown = Math.sin(x * 9 + a * 3) > 0.92 ? 1 : 0; // jaggery showing through
    put(x, y, z, 0, Math.sin(a) / A, Math.cos(a) / B, brown ? 0.08 : 0.11, brown ? 0.6 : 0.35, (brown ? 0.55 : 0.88) + stripe + r() * 0.04, 0.45);
  } else {
    const side = r() < 0.5 ? -1 : 1, rr = Math.sqrt(r()), a = r() * Math.PI * 2;
    const y = Math.sin(a) * A * rr, z = Math.cos(a) * B * rr;
    const layer = Math.sin(rr * 34 + a * 0.9) > 0.1; // spiral of sheets and jaggery
    const nut = r() < 0.06;
    put(side * L, y, z, side, 0, 0, nut ? 0.09 : layer ? 0.11 : 0.07, nut ? 0.45 : layer ? 0.3 : 0.75, nut ? 0.75 : layer ? 0.9 : 0.34, 0.5);
  }
}, 0.35, 0.55, 0.12);

/* Coconut burfi – snowy coconut square with a rose-pink top layer. */
const coconutBurfi = () => shape('Coconut Burfi', 1.0, 0.9, 3, (put, r) => {
  const W = 1.15, H = 0.5, D = 1.15;
  const f = r() * 6.3; // area-weighted faces: top/bottom 2×(2.3²), sides 4×(2.3×1)
  let x: number, y: number, z: number, nx = 0, ny = 0, nz = 0;
  if (f < 2.2) { x = (r() * 2 - 1) * W; z = (r() * 2 - 1) * D; y = f < 1.6 ? H : -H; ny = y > 0 ? 1 : -1; }
  else { const side = Math.floor(r() * 4); y = (r() * 2 - 1) * H; const u = (r() * 2 - 1) * W;
    if (side === 0) { x = W; z = u; nx = 1; } else if (side === 1) { x = -W; z = u; nx = -1; } else if (side === 2) { z = D; x = u; nz = 1; } else { z = -D; x = u; nz = -1; } }
  const j = r() * 0.05; // grated, rough surface
  x += nx * j; y += ny * j; z += nz * j;
  const pink = y > H * 0.15;
  put(x, y, z, nx, ny, nz, pink ? 0.96 : 0.1, pink ? 0.65 : 0.25, pink ? 0.76 + r() * 0.06 : 0.9 + r() * 0.07, 0.25);
}, 0.55, 0.75, 0);

/* Kesar rasmalai – soft chenna disc soaked in saffron milk, with pistachio slivers and saffron threads. */
const rasmalai = () => shape('Kesar Rasmalai', 1.0, 0.88, 4, (put, r) => {
  const [x, y, z] = sphereDir(r), Rr = 1.5 * (0.97 + r() * 0.05), Ry = 0.62;
  const px = x * Rr, py = y * Ry, pz = z * Rr;
  const top = y > 0.35, k = r();
  if (top && k < 0.05) put(px, py * 1.04, pz, x, y * 2, z, 0.25, 0.6, 0.45, 0.4);
  else if (top && k < 0.075) put(px, py * 1.04, pz, x, y * 2, z, 0.02, 0.95, 0.42, 0.6);
  else {
    const saffron = Math.sin(px * 3.2 + Math.sin(pz * 2.4) * 2) > 0.7 && y > 0 ? 1 : 0; // saffron-milk streaks
    put(px, py, pz, x / Rr, y / Ry, z / Rr, saffron ? 0.1 : 0.12, saffron ? 0.9 : 0.4, saffron ? 0.66 : 0.9 + r() * 0.05, 0.7);
  }
}, 0.5, 0, 0);

/* Dharwad peda – deep caramel milk fudge, rolled in sparkling sugar. */
const dharwadPeda = () => shape('Dharwad Peda', 0.95, 0.8, 5, (put, r) => {
  const R = 1.25, H = 0.48, e = 0.32; // radius, half height, rounded edge
  const a = r() * Math.PI * 2, f = r();
  let rad: number, y: number, nr: number, ny: number;
  if (f < 0.55) { rad = Math.sqrt(r()) * (R - e); y = r() < 0.6 ? H : -H; nr = 0; ny = Math.sign(y); }
  else { const b = (r() - 0.5) * Math.PI; rad = R - e + Math.cos(b) * e; y = Math.sin(b) * H; nr = Math.cos(b); ny = Math.sin(b) * 1.5; }
  const sugar = r() < 0.17;
  const out = sugar ? 0.03 : 0;
  put(Math.cos(a) * (rad + nr * out), y + ny * out, Math.sin(a) * (rad + nr * out), Math.cos(a) * nr, ny, Math.sin(a) * nr,
    sugar ? 0.1 : 0.06 + r() * 0.02, sugar ? 0.2 : 0.6, sugar ? 0.9 : 0.24 + r() * 0.08, sugar ? 1 : 0.4);
}, 0.6, 0, 0.08);

/* Floating gold dust cloud – where the first sweet gathers from. */
const cloud = () => shape('', 0.7, 0, 9, (put, r) => {
  const [x, y, z] = sphereDir(r), R = 2.2 + r() * 2.6;
  put(x * R, y * R * 0.7, z * R, x, y, z, 0.1, 0.8, 0.6, 1);
});

export const buildZeroG: SceneBuilder = (scene, renderer) => {
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const root = new THREE.Group();
  scene.add(root);
  const sweets = [ladoo(), poothrekulu(), coconutBurfi(), rasmalai(), dharwadPeda()];
  const start = cloud();

  /* ---------- the pearl cloud ---------- */
  const geo = new THREE.BufferGeometry();
  const attr = (n: number) => new THREE.BufferAttribute(new Float32Array(N * n), n);
  geo.setAttribute('position', attr(3));
  for (const k of ['aFrom', 'aTo', 'nFrom', 'nTo']) geo.setAttribute(k, attr(3));
  geo.setAttribute('cFrom', attr(4));
  geo.setAttribute('cTo', attr(4));
  const rand = new Float32Array(N * 4), rr = rng(42);
  for (let i = 0; i < N * 4; i++) rand[i] = rr();
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 8);

  const uniforms = {
    uP: { value: 0 }, uTime: { value: 0 }, uPx: { value: 500 },
    uSizeFrom: { value: 1 }, uSizeTo: { value: 1 }, uSmoothFrom: { value: 0 }, uSmoothTo: { value: 0 },
    uHover: { value: new THREE.Vector3(99, 99, 99) }, uHoverOn: { value: 0 },
    uBurst: { value: new THREE.Vector3(99, 99, 99) }, uBurstT: { value: -99 },
    uBase: { value: (LOW ? 0.115 : 0.088) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      attribute vec3 aFrom; attribute vec3 aTo; attribute vec3 nFrom; attribute vec3 nTo;
      attribute vec4 cFrom; attribute vec4 cTo; attribute vec4 aRand;
      uniform float uP, uTime, uPx, uSizeFrom, uSizeTo, uSmoothFrom, uSmoothTo, uHoverOn, uBurstT, uBase;
      uniform vec3 uHover, uBurst;
      varying vec4 vColor; varying vec3 vNormal; varying float vSmooth;
      void main() {
        float e = smoothstep(0., 1., clamp((uP - aRand.x * .38) / .62, 0., 1.));
        float m = sin(3.14159265 * e);
        vec3 dir = normalize(aRand.yzw - .5 + 1e-4);
        vec3 p = mix(aFrom, aTo, e) + dir * m * (.55 + aRand.x * 1.1);
        float ang = m * (1.4 + aRand.y * 2.2);
        float ca = cos(ang), sa = sin(ang);
        p.xz = mat2(ca, -sa, sa, ca) * p.xz;
        p.y += m * (aRand.z * 1.0 - .15);                       // weightless: drifts upwards while apart
        p += .018 * vec3(sin(uTime * 1.3 + aRand.y * 40.), sin(uTime * 1.1 + aRand.z * 40.), sin(uTime * .9 + aRand.w * 40.));
        vec4 wp = modelMatrix * vec4(p, 1.);
        vec3 d = wp.xyz - uHover; float l = length(d);
        wp.xyz += normalize(d + dir * .2) * smoothstep(1.25, 0., l) * .75 * uHoverOn;   // part around the cursor
        float age = uTime - uBurstT;
        float s = age > 0. ? exp(-age * 1.3) * (1. - exp(-age * 16.)) : 0.;
        vec3 bd = wp.xyz - uBurst;
        wp.xyz += normalize(bd + dir * .5) * s * (1.6 + aRand.x * 1.8) * smoothstep(4.5, 0., length(bd));  // tap shockwave
        vec4 mv = viewMatrix * wp;
        gl_Position = projectionMatrix * mv;
        float size = mix(uSizeFrom, uSizeTo, e) * (.75 + aRand.w * .5) * (1. - m * .25);
        gl_PointSize = uBase * size * uPx / -mv.z;
        vColor = mix(cFrom, cTo, e);
        vNormal = normalize(mat3(viewMatrix) * mat3(modelMatrix) * normalize(mix(nFrom, nTo, e) + 1e-4));
        vSmooth = mix(uSmoothFrom, uSmoothTo, e) * (1. - m);
      }`,
    fragmentShader: /* glsl */ `
      varying vec4 vColor; varying vec3 vNormal; varying float vSmooth;
      void main() {
        vec2 c = gl_PointCoord * 2. - 1.; c.y = -c.y;
        float r2 = dot(c, c);
        if (r2 > 1.) discard;
        vec3 sp = vec3(c, sqrt(1. - r2));
        vec3 n = normalize(mix(sp, normalize(vNormal + vec3(c * .22, 0.)), vSmooth));
        vec3 L = normalize(vec3(-.45, .7, .6));
        float diff = max(dot(n, L), 0.);
        float spec = pow(max(dot(reflect(-L, n), vec3(0., 0., 1.)), 0.), 30.) * vColor.a;
        float rim = pow(1. - max(n.z, 0.), 2.5);
        float fill = max(dot(n, normalize(vec3(.6, -.2, .5))), 0.);
        vec3 col = vColor.rgb * (.22 + .82 * diff + .22 * fill) + vec3(1., .94, .82) * spec + vec3(1., .55, .2) * rim * .2;
        gl_FragColor = vec4(col, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const pearls = new THREE.Points(geo, material);
  pearls.frustumCulled = false;
  const holder = new THREE.Group();
  holder.add(pearls);
  root.add(holder);

  /* ---------- the levitation ring underneath ---------- */
  const base = new THREE.Group();
  base.position.y = -2.05;
  root.add(base);
  const ringMat = (o: number) => new THREE.MeshBasicMaterial({ color: 0xffc66b, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false });
  const rings = [1.25, 1.7, 2.15].map((rad, i) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(rad, i === 0 ? 0.022 : 0.012, 8, 160), ringMat(0.6));
    m.rotation.x = Math.PI / 2;
    base.add(m);
    return m;
  });
  const disc = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 5.6), new THREE.MeshBasicMaterial({ map: glowSprite(), color: 0xff9a3c, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2;
  base.add(disc);
  // light column rising from the ring
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.9, 4.2, 48, 1, true),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
      fragmentShader: `varying vec2 vUv; uniform float uTime;
        void main(){ float a = pow(1. - vUv.y, 2.2) * .16; a *= .75 + .25 * sin(vUv.x * 40. + uTime * 1.5); gl_FragColor = vec4(vec3(1., .72, .38) * a, a); }`,
    }),
  );
  beam.position.y = 2.1;
  base.add(beam);

  /* sparks rising upwards – the anti-gravity field */
  const RISE = LOW ? 90 : 160;
  const rise = sparkles(RISE, new THREE.Vector3(1, 1, 1), 23);
  (rise.material as THREE.ShaderMaterial).uniforms.uScale.value = 46;
  const riseData = Array.from({ length: RISE }, () => ({ a: rr() * Math.PI * 2, r: 0.4 + rr() * 2.2, sp: 0.35 + rr() * 0.6, ph: rr() * 5 }));
  root.add(rise);

  /* glossy syrup droplets floating around */
  const dropMat = new THREE.MeshPhysicalMaterial({ color: 0xe0801a, roughness: 0.05, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6, emissive: 0x4a1800, emissiveIntensity: 0.4 });
  const drops = Array.from({ length: 9 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.05 + rr() * 0.09, 24, 16), dropMat);
    root.add(m);
    return { m, a: (i / 9) * Math.PI * 2, r: 2.25 + rr() * 0.8, y: (rr() - 0.5) * 2.4, sp: 0.15 + rr() * 0.2, ph: rr() * 6 };
  });

  /* shockwave ring for taps */
  const wave = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 96), ringMat(0));
  root.add(wave);

  /* ---------- timeline ---------- */
  const MORPH = 2.8, HOLD = 4.6, P = MORPH + HOLD;
  const A = geo.attributes as Record<string, THREE.BufferAttribute>;
  let seg = -1;
  const load = (s: number) => {
    const from = s === 0 ? start : sweets[(s - 1) % sweets.length];
    const to = sweets[s % sweets.length];
    (A.aFrom.array as Float32Array).set(from.pos); (A.aTo.array as Float32Array).set(to.pos);
    (A.nFrom.array as Float32Array).set(from.nrm); (A.nTo.array as Float32Array).set(to.nrm);
    (A.cFrom.array as Float32Array).set(from.col); (A.cTo.array as Float32Array).set(to.col);
    (A.position.array as Float32Array).set(to.pos);
    for (const k of ['aFrom', 'aTo', 'nFrom', 'nTo', 'cFrom', 'cTo', 'position']) A[k].needsUpdate = true;
    uniforms.uSizeFrom.value = from.size; uniforms.uSizeTo.value = to.size;
    uniforms.uSmoothFrom.value = from.smooth; uniforms.uSmoothTo.value = to.smooth;
    renderer.domElement.dispatchEvent(new CustomEvent('hero-label', { detail: { name: to.name, delay: MORPH * 0.6 } }));
  };

  const ray = new THREE.Raycaster(), plane = new THREE.Plane(), hit = new THREE.Vector3(), camDir = new THREE.Vector3();
  const worldAt = (nx: number, ny: number) => {
    camera.getWorldDirection(camDir);
    plane.setFromNormalAndCoplanarPoint(camDir.negate(), new THREE.Vector3(0, 0, 0));
    ray.setFromCamera(new THREE.Vector2(nx, ny), camera);
    return ray.ray.intersectPlane(plane, hit) ? hit.clone() : null;
  };
  let now = 0, waveT = -99;
  const size = new THREE.Vector2();

  return {
    camera,
    stillAt: P * 0.5,
    tap(nx, ny) {
      const p = worldAt(nx, ny);
      if (!p) return;
      uniforms.uBurst.value.copy(p);
      uniforms.uBurstT.value = now;
      wave.position.copy(p);
      wave.lookAt(camera.position);
      waveT = now;
    },
    update({ t, px, py, nx, ny, hover, dt }) {
      now = t;
      const s = Math.floor(t / P);
      if (s !== seg) { seg = s; load(s); }
      uniforms.uP.value = ease.clamp((t - s * P) / MORPH);
      uniforms.uTime.value = t;
      renderer.getDrawingBufferSize(size);
      uniforms.uPx.value = size.y / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

      const need = 3.3 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
      const dist = Math.max(10.2, need);
      camera.position.set(px * 0.8, 0.9 - py * 0.5, dist);
      camera.lookAt(0, -0.25, 0);

      holder.position.y = Math.sin(t * 0.8) * 0.12;
      holder.rotation.y = Math.sin(t * 0.32) * 0.45 + px * 0.4;
      holder.rotation.x = py * 0.15;

      if (hover) { const p = worldAt(nx, ny); if (p) uniforms.uHover.value.lerp(p, Math.min(1, dt * 12)); }
      uniforms.uHoverOn.value += ((hover ? 1 : 0) - uniforms.uHoverOn.value) * Math.min(1, dt * 4);

      rings.forEach((m, i) => {
        const k = (t * 0.45 + i / 3) % 1;
        m.scale.setScalar(0.85 + k * 0.35);
        (m.material as THREE.MeshBasicMaterial).opacity = Math.sin(k * Math.PI) * 0.75;
      });
      (disc.material as THREE.MeshBasicMaterial).opacity = 0.45 + Math.sin(t * 1.6) * 0.08;
      (beam.material as THREE.ShaderMaterial).uniforms.uTime.value = t;

      const rp = rise.geometry.getAttribute('position') as THREE.BufferAttribute;
      riseData.forEach((d, i) => {
        const y = ((t * d.sp + d.ph) % 4.6);
        const a = d.a + t * 0.2;
        rp.setXYZ(i, Math.cos(a) * d.r * (1 - y * 0.08), -2 + y, Math.sin(a) * d.r * (1 - y * 0.08));
      });
      rp.needsUpdate = true;
      (rise.material as THREE.ShaderMaterial).uniforms.uTime.value = t;

      drops.forEach(d => {
        const a = d.a + t * d.sp;
        d.m.position.set(Math.cos(a) * d.r, d.y + Math.sin(t * 0.7 + d.ph) * 0.3, Math.sin(a) * d.r * 0.6);
        const w = Math.sin(t * 3 + d.ph) * 0.08;
        d.m.scale.set(1 + w, 1 - w, 1 + w);
      });

      const wa = t - waveT;
      wave.visible = wa < 1;
      if (wave.visible) { wave.scale.setScalar(0.2 + ease.outCubic(wa) * 2.6); (wave.material as THREE.MeshBasicMaterial).opacity = (1 - wa) * 0.8; }
    },
  };
};
