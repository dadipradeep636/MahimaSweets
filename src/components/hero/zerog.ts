/*
 * "Zero Gravity": real sweets from the shop's own photos, levitating above a glowing ring.
 * Each one dissolves into thousands of sugar pearls (coloured from the photo), swirls weightlessly,
 * and the pearls gather into the next sweet – which then turns back into the real photo.
 * Move the mouse through the pearls, or tap, and they scatter.
 */
import * as THREE from 'three';
import { glowSprite, sparkles, rng, LOW } from './sweets3d';
import { ease, type SceneBuilder } from './stage3d';

const N = LOW ? 3600 : 6500;
const GRID = 200; // sampling resolution of each photo

export const FLOAT_SWEETS = [
  { id: 'ladoo', name: 'Motichoor Ladoo' },
  { id: 'poothrekulu', name: 'Bellam Poothrekulu' },
  { id: 'rasmalai', name: 'Kesar Rasmalai' },
  { id: 'jalebi', name: 'Crispy Jalebi' },
  { id: 'burfi', name: 'Coconut Burfi' },
  { id: 'dharwad', name: 'Dharwad Peda' },
];

type Shape = { name: string; pos: Float32Array; nrm: Float32Array; col: Float32Array; size: number; tex?: THREE.Texture; w: number; h: number };

/* Turn a cut-out photo into a pearl cloud: same colours, puffed into a soft 3D relief (thicker in the middle). */
function shapeFromPhoto(img: HTMLImageElement, name: string, seed: number): Shape {
  const aspect = img.naturalWidth / img.naturalHeight;
  const w = aspect >= 1 ? 3.7 : 3.7 * aspect, h = w / aspect;
  const gw = aspect >= 1 ? GRID : Math.round(GRID * aspect), gh = aspect >= 1 ? Math.round(GRID / aspect) : GRID;
  const c = document.createElement('canvas');
  c.width = gw; c.height = gh;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, gw, gh);
  const px = ctx.getImageData(0, 0, gw, gh).data;

  // distance to the edge of the sweet (chamfer distance transform) → height of the relief
  const inside = new Uint8Array(gw * gh), dist = new Float32Array(gw * gh);
  for (let i = 0; i < gw * gh; i++) { inside[i] = px[i * 4 + 3] > 140 ? 1 : 0; dist[i] = inside[i] ? 1e9 : 0; }
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= gw || y >= gh ? 0 : dist[y * gw + x]);
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) { const i = y * gw + x; if (inside[i]) dist[i] = Math.min(dist[i], at(x - 1, y) + 1, at(x, y - 1) + 1, at(x - 1, y - 1) + 1.414, at(x + 1, y - 1) + 1.414); }
  for (let y = gh - 1; y >= 0; y--) for (let x = gw - 1; x >= 0; x--) { const i = y * gw + x; if (inside[i]) dist[i] = Math.min(dist[i], at(x + 1, y) + 1, at(x, y + 1) + 1, at(x + 1, y + 1) + 1.414, at(x - 1, y + 1) + 1.414); }
  let maxD = 1;
  for (let i = 0; i < gw * gh; i++) if (dist[i] > maxD) maxD = dist[i];
  const T = 0.55; // thickness of the relief in world units
  const zAt = (x: number, y: number) => Math.sqrt(Math.min(1, at(x, y) / (maxD * 0.55))) * T;

  const cells: number[] = [];
  for (let i = 0; i < gw * gh; i++) if (inside[i]) cells.push(i);
  const pos = new Float32Array(N * 3), nrm = new Float32Array(N * 3), col = new Float32Array(N * 4);
  const r = rng(seed), C = new THREE.Color(), n = new THREE.Vector3();
  for (let k = 0; k < N; k++) {
    const i = cells[Math.floor(r() * cells.length)] ?? 0;
    const gx = i % gw, gy = Math.floor(i / gw);
    const fx = gx + r(), fy = gy + r();
    const z = zAt(gx, gy);
    const back = r() < 0.22;
    const x = (fx / gw - 0.5) * w, y = (0.5 - fy / gh) * h;
    n.set((zAt(gx - 1, gy) - zAt(gx + 1, gy)) * 6, (zAt(gx, gy + 1) - zAt(gx, gy - 1)) * 6, 1).normalize();
    if (back) n.z = -n.z;
    pos.set([x, y, back ? -z * 0.7 : z], k * 3);
    nrm.set([n.x, n.y, n.z], k * 3);
    C.setRGB(px[i * 4] / 255, px[i * 4 + 1] / 255, px[i * 4 + 2] / 255, THREE.SRGBColorSpace);
    if (back) C.multiplyScalar(0.55);
    col.set([C.r, C.g, C.b, 0.55], k * 4);
  }
  const tex = new THREE.Texture(img);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return { name, pos, nrm, col, size: 0.72, tex, w, h };
}

/* Floating gold dust cloud – where the first sweet gathers from. */
function cloud(): Shape {
  const pos = new Float32Array(N * 3), nrm = new Float32Array(N * 3), col = new Float32Array(N * 4);
  const r = rng(9), C = new THREE.Color();
  for (let k = 0; k < N; k++) {
    const u = r() * 2 - 1, a = r() * Math.PI * 2, q = Math.sqrt(1 - u * u), R = 2.2 + r() * 2.6;
    pos.set([Math.cos(a) * q * R, u * R * 0.7, Math.sin(a) * q * R], k * 3);
    nrm.set([Math.cos(a) * q, u, Math.sin(a) * q], k * 3);
    C.setHSL(0.1 + r() * 0.03, 0.8, 0.55 + r() * 0.15);
    col.set([C.r, C.g, C.b, 1], k * 4);
  }
  return { name: '', pos, nrm, col, size: 0.6, w: 0, h: 0 };
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export const buildZeroG: SceneBuilder = (scene, renderer) => {
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const root = new THREE.Group();
  scene.add(root);
  const start = cloud();
  const sweets: Shape[] = [];
  const ready = Promise.all(FLOAT_SWEETS.map(s => loadImage(`/images/float/${s.id}.webp`)))
    .then(imgs => imgs.forEach((img, i) => sweets.push(shapeFromPhoto(img, FLOAT_SWEETS[i].name, 10 + i))));

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
    uP: { value: 0 }, uTime: { value: 0 }, uPx: { value: 500 }, uSolid: { value: 0 },
    uSizeFrom: { value: 1 }, uSizeTo: { value: 1 },
    uHover: { value: new THREE.Vector3(99, 99, 99) }, uHoverOn: { value: 0 },
    uBurst: { value: new THREE.Vector3(99, 99, 99) }, uBurstT: { value: -99 },
    uBase: { value: LOW ? 0.105 : 0.082 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      attribute vec3 aFrom; attribute vec3 aTo; attribute vec3 nFrom; attribute vec3 nTo;
      attribute vec4 cFrom; attribute vec4 cTo; attribute vec4 aRand;
      uniform float uP, uTime, uPx, uSizeFrom, uSizeTo, uHoverOn, uBurstT, uBase, uSolid;
      uniform vec3 uHover, uBurst;
      varying vec4 vColor; varying vec3 vNormal; varying float vM;
      void main() {
        // a graceful wave: pearls lift off from the top first, with a little individual variation
        float wave = clamp((1.6 - aFrom.y) / 3.6, 0., 1.) * .42 + aRand.x * .12;
        float k = clamp((uP - wave) / .46, 0., 1.);
        float e = k < .5 ? 4. * k * k * k : 1. - pow(-2. * k + 2., 3.) / 2.;   // ease in-out cubic
        float m = sin(3.14159265 * e);
        vec3 dir = normalize(aRand.yzw - .5 + 1e-4);
        vec3 p = mix(aFrom, aTo, e);
        float ang = m * (2.1 + aRand.y * .5);                // one smooth vortex, all turning the same way
        float ca = cos(ang), sa = sin(ang);
        p.xz = mat2(ca, -sa, sa, ca) * p.xz;
        p.xz *= 1. + m * (.28 + aRand.x * .22);              // gently opens outward
        p.y += m * (.25 + aRand.z * .55);                    // weightless lift
        p += dir * m * .12;
        p += .016 * vec3(sin(uTime * 1.3 + aRand.y * 40.), sin(uTime * 1.1 + aRand.z * 40.), sin(uTime * .9 + aRand.w * 40.));
        vec4 wp = modelMatrix * vec4(p, 1.);
        vec3 d = wp.xyz - uHover; float l = length(d);
        wp.xyz += normalize(d + dir * .2) * smoothstep(1.25, 0., l) * .75 * uHoverOn;   // part around the cursor
        float age = uTime - uBurstT;
        float s = age > 0. ? exp(-age * 2.2) * (1. - exp(-age * 14.)) : 0.;
        vec3 bd = wp.xyz - uBurst;
        wp.xyz += normalize(bd + dir * .35) * s * (.9 + aRand.x * .9) * smoothstep(4., 0., length(bd));  // tap shockwave
        vec4 mv = viewMatrix * wp;
        gl_Position = projectionMatrix * mv;
        // pearls shrink away (in a ripple) as the real photo takes over
        float solid = clamp(uSolid * 1.6 - aRand.w * .6, 0., 1.);
        float size = mix(uSizeFrom, uSizeTo, e) * (.8 + aRand.w * .4) * (1. - m * .2) * (1. - solid);
        gl_PointSize = uBase * size * uPx / -mv.z;
        vColor = mix(cFrom, cTo, e);
        vNormal = normalize(mat3(viewMatrix) * mat3(modelMatrix) * normalize(mix(nFrom, nTo, e) + 1e-4));
        vM = m;
      }`,
    fragmentShader: /* glsl */ `
      varying vec4 vColor; varying vec3 vNormal; varying float vM;
      void main() {
        vec2 c = gl_PointCoord * 2. - 1.; c.y = -c.y;
        float r2 = dot(c, c);
        if (r2 > 1.) discard;
        vec3 sp = vec3(c, sqrt(1. - r2));
        vec3 n = normalize(mix(normalize(vNormal + vec3(c * .25, 0.)), sp, .35 + vM * .65));
        vec3 L = normalize(vec3(-.45, .7, .6));
        float diff = max(dot(n, L), 0.);
        float spec = pow(max(dot(reflect(-L, n), vec3(0., 0., 1.)), 0.), 30.) * vColor.a;
        float rim = pow(1. - max(sp.z, 0.), 3.);
        vec3 col = vColor.rgb * (.66 + .46 * diff - rim * .25) + vec3(1., .94, .82) * spec * .55;
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

  /* the real photo – appears once the pearls have gathered; a light sheen sweeps across as it lands */
  const photoMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, toneMapped: false,
    uniforms: { map: { value: null as THREE.Texture | null }, uOpacity: { value: 0 }, uSweep: { value: -1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform sampler2D map; uniform float uOpacity, uSweep; varying vec2 vUv;
      void main(){
        vec4 c = texture2D(map, vUv);
        float band = smoothstep(.1, 0., abs((vUv.x + vUv.y * .45) - uSweep));
        c.rgb += band * .1 * c.a * vec3(1., .85, .6);
        // reveal from the middle outwards
        float d = length(vUv - .5) * 1.5;
        float reveal = smoothstep(d - .18, d + .02, uOpacity * 1.25);
        gl_FragColor = vec4(c.rgb, c.a * reveal);
        #include <colorspace_fragment>
      }`,
  });
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), photoMat);
  photo.position.z = 0.32;
  photo.renderOrder = 2;
  holder.add(photo);

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
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.9, 4.2, 48, 1, true),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
      fragmentShader: `varying vec2 vUv; uniform float uTime;
        void main(){ float a = pow(1. - vUv.y, 2.2) * .14; a *= .75 + .25 * sin(vUv.x * 40. + uTime * 1.5); gl_FragColor = vec4(vec3(1., .72, .38) * a, a); }`,
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
  const drops = Array.from({ length: 6 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.05 + rr() * 0.09, 24, 16), dropMat);
    root.add(m);
    return { m, a: (i / 6) * Math.PI * 2, r: 2.6 + rr() * 0.5, y: (rr() - 0.5) * 2.2, sp: 0.1 + rr() * 0.08, ph: rr() * 6 };
  });

  /* shockwave ring for taps */
  const wave = new THREE.Mesh(new THREE.RingGeometry(0.95, 1, 128), ringMat(0));
  root.add(wave);

  /* ---------- timeline ---------- */
  // per sweet: pearls gather (MORPH) → real photo fades in (SOLID_IN) → hold → photo dissolves back into pearls (SOLID_OUT) → next
  const MORPH = 3.2, SOLID_IN = 1.0, HOLD = 4.0, SOLID_OUT = 0.9, P = MORPH + SOLID_IN + HOLD + SOLID_OUT;
  const A = geo.attributes as Record<string, THREE.BufferAttribute>;
  let seg = -1, curW = 1, curH = 1;
  const load = (s: number) => {
    const from = s === 0 ? start : sweets[(s - 1) % sweets.length];
    const to = sweets[s % sweets.length];
    (A.aFrom.array as Float32Array).set(from.pos); (A.aTo.array as Float32Array).set(to.pos);
    (A.nFrom.array as Float32Array).set(from.nrm); (A.nTo.array as Float32Array).set(to.nrm);
    (A.cFrom.array as Float32Array).set(from.col); (A.cTo.array as Float32Array).set(to.col);
    (A.position.array as Float32Array).set(to.pos);
    for (const k of ['aFrom', 'aTo', 'nFrom', 'nTo', 'cFrom', 'cTo', 'position']) A[k].needsUpdate = true;
    uniforms.uSizeFrom.value = from.size; uniforms.uSizeTo.value = to.size;
    photoMat.uniforms.map.value = to.tex ?? null;
    curW = to.w; curH = to.h;
    renderer.domElement.dispatchEvent(new CustomEvent('hero-label', { detail: { name: to.name, delay: MORPH * 0.75 } }));
  };

  const ray = new THREE.Raycaster(), plane = new THREE.Plane(), hit = new THREE.Vector3(), camDir = new THREE.Vector3();
  const worldAt = (nx: number, ny: number) => {
    camera.getWorldDirection(camDir);
    plane.setFromNormalAndCoplanarPoint(camDir.negate(), new THREE.Vector3(0, 0, 0));
    ray.setFromCamera(new THREE.Vector2(nx, ny), camera);
    return ray.ray.intersectPlane(plane, hit) ? hit.clone() : null;
  };
  let now = 0, waveT = -99, t0 = 0, began = false, tapT = -99, skip = 0;
  const size = new THREE.Vector2();

  return {
    camera,
    ready,
    stillAt: MORPH + SOLID_IN + 1.5,
    tap(nx, ny) {
      const p = worldAt(nx, ny);
      if (!p) return;
      uniforms.uBurst.value.copy(p);
      uniforms.uBurstT.value = now;
      // a tap sends a ripple through the pearls and moves on to the next sweet
      if (now - tapT > 1.4) skip = 1;
      tapT = now;
      wave.position.copy(p);
      wave.lookAt(camera.position);
      waveT = now;
    },
    update({ t, px, py, nx, ny, hover, dt }) {
      now = t;
      renderer.getDrawingBufferSize(size);
      uniforms.uPx.value = size.y / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const need = 3.4 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
      const dist = Math.max(10.2, need);
      camera.position.set(px * 0.45, 0.9 - py * 0.3, dist);
      camera.lookAt(0, -0.25, 0);
      uniforms.uTime.value = t;

      if (sweets.length) {
        if (!began) { began = true; t0 = t; }
        let lt = t - t0, local = lt % P;
        if (skip) { // jump to the moment the current sweet starts dissolving
          skip = 0;
          if (local >= MORPH && local < P - SOLID_OUT) { t0 -= P - SOLID_OUT - local; lt = t - t0; local = lt % P; }
        }
        const s = Math.floor(lt / P);
        if (s !== seg) { seg = s; load(s); }
        uniforms.uP.value = ease.clamp(local / MORPH);
        const sIn = ease.inOutSine(ease.clamp((local - MORPH) / SOLID_IN));
        const sOut = ease.inOutSine(ease.clamp((local - (P - SOLID_OUT)) / SOLID_OUT));
        const solid = sIn * (1 - sOut);
        uniforms.uSolid.value = solid;
        photoMat.uniforms.uOpacity.value = solid;
        photoMat.uniforms.uSweep.value = -0.4 + ease.clamp((local - MORPH - 0.3) / 1.4) * 2.2;
        photo.visible = solid > 0.001;
        // the real photo is flat, so it turns only gently while visible
        holder.rotation.y = Math.sin(t * 0.25) * 0.22 * (1 - 0.75 * solid) + px * 0.22 * (1 - 0.6 * solid);
        holder.rotation.x = py * 0.08;
        const sc = 0.965 + 0.035 * ease.outCubic(solid); // settles into place
        photo.scale.set(curW * sc, curH * sc, 1);
      } else {
        holder.rotation.y = Math.sin(t * 0.25) * 0.22;
      }
      holder.position.y = Math.sin(t * 0.7) * 0.08 + 0.15;

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
        const y = (t * d.sp + d.ph) % 4.6;
        const a = d.a + t * 0.2;
        rp.setXYZ(i, Math.cos(a) * d.r * (1 - y * 0.08), -2 + y, Math.sin(a) * d.r * (1 - y * 0.08));
      });
      rp.needsUpdate = true;
      (rise.material as THREE.ShaderMaterial).uniforms.uTime.value = t;

      drops.forEach(d => {
        const a = d.a + t * d.sp;
        d.m.position.set(Math.cos(a) * d.r, d.y + Math.sin(t * 0.5 + d.ph) * 0.25, Math.sin(a) * d.r * 0.4 - 0.8);
        const w = Math.sin(t * 2 + d.ph) * 0.05;
        d.m.scale.set(1 + w, 1 - w, 1 + w);
      });

      const wa = t - waveT;
      wave.visible = wa < 0.9;
      if (wave.visible) { const k = wa / 0.9; wave.scale.setScalar(0.25 + ease.outCubic(k) * 1.7); (wave.material as THREE.MeshBasicMaterial).opacity = Math.pow(1 - k, 2) * 0.55; }
    },
  };
};
