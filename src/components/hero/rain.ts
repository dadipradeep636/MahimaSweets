/* "Sweet Rain": sweets tumble down in slow motion through warm light and settle softly onto a brass thali. */
import * as THREE from 'three';
import { ladoo, kajuKatli, jalebi, gulabJamun, peda, mysorePak, thali, contactShadow, sparkles, sparkSprite, rng, type Sweet } from './sweets3d';
import { ease, type SceneBuilder } from './stage3d';

/* how far above its origin each sweet's bottom sits (so it rests on the plate, not inside it) */
const LIFT: Record<string, (s: Sweet) => number> = {
  ladoo: s => s.userData.radius * 0.9,
  katli: () => 0.02,
  jalebi: s => s.userData.radius * 0.09,
  jamun: s => s.userData.radius * 0.88,
  mysore: s => s.userData.radius * 0.36,
  peda: s => s.userData.radius * 0.58,
};

export const buildRain: SceneBuilder = scene => {
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const root = new THREE.Group();
  scene.add(root);

  const BASE_Y = -1.35;
  const plateR = 2.25;
  const plateGroup = new THREE.Group();
  plateGroup.position.y = BASE_Y;
  root.add(plateGroup);
  plateGroup.add(thali(plateR));
  const shadow = contactShadow(plateR * 1.5, 0.6);
  shadow.position.y = -0.04;
  plateGroup.add(shadow);

  /* resting places: an outer ring, an inner ring a little higher, and a crown on top */
  const slots: { x: number; z: number; y: number }[] = [];
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.2; slots.push({ x: Math.cos(a) * 1.42, z: Math.sin(a) * 1.42, y: 0.03 }); }
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + 0.7; slots.push({ x: Math.cos(a) * 0.72, z: Math.sin(a) * 0.72, y: 0.12 }); }
  slots.push({ x: 0, z: 0, y: 0.42 });

  const makers: ((i: number) => Sweet)[] = [
    i => ladoo(0.4, 300 + i), i => kajuKatli(0.72, 300 + i), i => gulabJamun(0.33, 300 + i), i => peda(0.35, 300 + i),
    i => jalebi(0.5, 300 + i), i => mysorePak(0.48, 300 + i), i => ladoo(0.37, 400 + i),
  ];
  const r = rng(91);
  const PERIOD = 15, FALL = 2.6, OUT = 0.9;
  const drops = slots.map((slot, i) => {
    const s = makers[i % makers.length](i);
    const holder = new THREE.Group();
    holder.add(s);
    plateGroup.add(holder);
    const rest = new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.25, r() * Math.PI * 2, (r() - 0.5) * 0.25));
    return {
      holder, s, slot, rest,
      lift: LIFT[s.userData.kind]?.(s) ?? 0.2,
      axis: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(),
      turns: 5 + r() * 5,
      sway: (r() - 0.5) * 1.6,
      // stagger: centre pieces land after the outer ring; the cycle keeps something falling at all times
      offset: (i < 8 ? i * 0.55 : i < 13 ? 4.6 + (i - 8) * 0.6 : 8) ,
    };
  });

  /* silver varq flakes drifting down */
  const FLAKES = 38;
  const flakeMat = new THREE.MeshStandardMaterial({ color: 0xf2f2f5, metalness: 0.85, roughness: 0.3, side: THREE.DoubleSide, envMapIntensity: 1.6, emissive: 0x6a6258 });
  const flakes = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.08, 0.06), flakeMat, FLAKES);
  const fr = rng(4);
  const flakeData = Array.from({ length: FLAKES }, () => ({ x: (fr() - 0.5) * 7, z: (fr() - 0.5) * 3.5, ph: fr() * 20, sp: 0.25 + fr() * 0.35, rx: fr() * 6, ry: fr() * 6, sc: 0.6 + fr() * 0.9 }));
  root.add(flakes);

  /* sugar dust + landing sparkles */
  const dust = sparkles(140, new THREE.Vector3(8, 7, 4), 19);
  (dust.material as THREE.ShaderMaterial).uniforms.uScale.value = 55;
  dust.position.y = 1;
  root.add(dust);
  const pops = drops.map(() => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkSprite(), color: 0xffe2a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    plateGroup.add(sp);
    return sp;
  });


  const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  const qa = new THREE.Quaternion();
  return {
    camera,
    stillAt: 13.2,
    update({ t, px, py }) {
      const fit = camera.userData.fit ?? 1;
      camera.position.set(px * 1.1, 3.1 - py * 0.5, 10.5 * fit);
      camera.lookAt(0, 0.1, 0);
      plateGroup.rotation.y = t * 0.06 + px * 0.15;

      drops.forEach((d, i) => {
        // local time within this sweet's cycle (first cycle starts empty so the plate fills up on load)
        const lt = ((t - d.offset) % PERIOD + PERIOD) % PERIOD;
        const started = t >= d.offset;
        const restY = d.slot.y + d.lift;
        const pop = pops[i];
        if (!started) { d.holder.scale.setScalar(0); pop.material.opacity = 0; return; }
        if (lt < FALL) {
          const p = lt / FALL;
          const fallE = p * p * (1.4 - 0.4 * p); // slow-motion gravity, softened at the end
          d.holder.position.set(d.slot.x + d.sway * (1 - fallE), restY + (1 - fallE) * 7.5, d.slot.z);
          qa.setFromAxisAngle(d.axis, Math.pow(1 - p, 1.6) * d.turns);
          d.holder.quaternion.copy(d.rest).multiply(qa);
          d.holder.scale.setScalar(ease.clamp(p * 4));
          d.s.scale.set(1, 1, 1);
          pop.material.opacity = 0;
        } else {
          const since = lt - FALL;
          d.holder.position.set(d.slot.x, restY, d.slot.z);
          d.holder.quaternion.copy(d.rest);
          // soft squash on landing
          const sq = Math.exp(-since * 7) * Math.sin(since * 22) * 0.1;
          d.s.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5);
          const out = ease.clamp((lt - (PERIOD - OUT)) / OUT);
          d.holder.scale.setScalar(1 - ease.inOutSine(out));
          // little sparkle burst when it lands
          const b = ease.clamp(since / 0.7);
          pop.position.set(d.slot.x, d.slot.y + 0.15, d.slot.z);
          pop.scale.setScalar(0.4 + b * 1.6);
          pop.material.opacity = (1 - b) * 0.9 + out * (1 - out) * 2.4;
        }
      });

      for (let i = 0; i < FLAKES; i++) {
        const f = flakeData[i];
        const y = 4.6 - (((t * f.sp + f.ph) % 9.5));
        v.set(f.x + Math.sin(t * 0.8 + f.ph) * 0.4, y, f.z + Math.cos(t * 0.6 + f.ph) * 0.2);
        e.set(f.rx + t * 1.3, f.ry + t * 0.9, Math.sin(t * 2 + f.ph) * 0.8);
        qq.setFromEuler(e);
        const fade = ease.clamp((4.6 - y) / 1) * ease.clamp((y + 4.6) / 1.5);
        sc.setScalar(f.sc * fade);
        m4.compose(v, qq, sc);
        flakes.setMatrixAt(i, m4);
      }
      flakes.instanceMatrix.needsUpdate = true;
      (dust.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
    },
  };
};
