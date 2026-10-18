/* "Golden Orbit": a festive thali floats in the centre while sweets circle it like a slow golden galaxy. */
import * as THREE from 'three';
import { ladoo, kajuKatli, jalebi, gulabJamun, peda, mysorePak, sweetsPlate, sparkles, rng, type Sweet } from './sweets3d';
import { ease, type SceneBuilder } from './stage3d';

export const buildOrbit: SceneBuilder = scene => {
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const camBase = new THREE.Vector3(0, 3.3, 11.6);
  const look = new THREE.Vector3(0, 0.1, 0);

  const root = new THREE.Group();
  scene.add(root);

  /* centre: the plate, tilted towards the viewer */
  const plateHolder = new THREE.Group();
  plateHolder.rotation.x = 0.32;
  root.add(plateHolder);
  const plate = sweetsPlate(1.55);
  plateHolder.add(plate);

  /* the orbit plane */
  const orbit = new THREE.Group();
  orbit.rotation.set(0.3, 0, -0.16);
  root.add(orbit);
  const R = 2.7;

  const makers: ((i: number) => Sweet)[] = [
    i => ladoo(0.46, 100 + i), i => kajuKatli(0.8, 100 + i), i => jalebi(0.6, 100 + i), i => gulabJamun(0.38, 100 + i),
    i => peda(0.42, 100 + i), i => ladoo(0.42, 200 + i), i => mysorePak(0.56, 100 + i), i => kajuKatli(0.74, 200 + i),
  ];
  const r = rng(77);
  const riders = makers.map((make, i) => {
    const holder = new THREE.Group();
    const tilt = new THREE.Group(); // flat sweets lean towards the viewer so their tops show
    const s = make(i);
    const flat = s.userData.kind !== 'ladoo' && s.userData.kind !== 'jamun';
    tilt.rotation.set(flat ? 0.75 + r() * 0.3 : 0, 0, (r() - 0.5) * 0.5);
    tilt.add(s);
    holder.add(tilt);
    orbit.add(holder);
    return { holder, tilt, s, a0: (i / makers.length) * Math.PI * 2, speed: (0.5 + r() * 0.5) * (i % 2 ? 1 : -1), bob: r() * 6, wob: r() * 6 };
  });

  /* gold ring line + dust that travels with the orbit */
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(R, 0.006, 6, 220),
    new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  ring.rotation.x = Math.PI / 2;
  orbit.add(ring);
  const ring2 = ring.clone();
  ring2.scale.setScalar(1.1);
  (ring2.material as THREE.MeshBasicMaterial) = (ring.material as THREE.MeshBasicMaterial).clone();
  (ring2.material as THREE.MeshBasicMaterial).opacity = 0.14;
  orbit.add(ring2);

  const dustCount = 520;
  const dust = sparkles(dustCount, new THREE.Vector3(1, 1, 1), 31);
  {
    const pos = dust.geometry.getAttribute('position') as THREE.BufferAttribute;
    const d = rng(5);
    for (let i = 0; i < dustCount; i++) {
      const a = d() * Math.PI * 2, rr = R + (d() - 0.5) * (d() < 0.75 ? 0.3 : 1.0);
      pos.setXYZ(i, Math.cos(a) * rr, (d() - 0.5) * 0.28, Math.sin(a) * rr);
    }
    (dust.material as THREE.ShaderMaterial).uniforms.uScale.value = 34;
  }
  orbit.add(dust);

  /* ambient sparkles in the whole space */
  const air = sparkles(90, new THREE.Vector3(9, 6, 5), 12);
  (air.material as THREE.ShaderMaterial).uniforms.uScale.value = 70;
  root.add(air);


  return {
    camera,
    stillAt: 6.5,
    update({ t, dt, px, py }) {
      const intro = ease.outCubic(ease.clamp(t / 2.2));
      // camera: gentle dolly-in on load, parallax with pointer
      const fit = camera.userData.fit ?? 1;
      // keep the whole orbit inside the frame on narrow screens
      const need = 3.75 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
      const dist = Math.max(camBase.z * fit, need);
      camera.position.set(camBase.x + px * 0.9, camBase.y * (dist / camBase.z) - py * 0.6 + (1 - intro) * 1.2, dist + (1 - intro) * 3);
      camera.lookAt(look);

      root.rotation.y = px * 0.18;
      root.rotation.x = py * 0.08;

      plate.rotation.y = t * 0.12;
      plateHolder.position.y = Math.sin(t * 0.9) * 0.08;
      plateHolder.scale.setScalar(0.75 + 0.25 * ease.outBack(ease.clamp(t / 1.6)));

      orbit.rotation.y = t * 0.16;
      riders.forEach((o, i) => {
        const fly = ease.outCubic(ease.clamp((t - 0.25 - i * 0.12) / 1.6));
        const rr = R * (1.9 - 0.9 * fly);
        const a = o.a0 - (1 - fly) * 1.4;
        o.holder.position.set(Math.cos(a) * rr, Math.sin(t * 1.1 + o.bob) * 0.14, Math.sin(a) * rr);
        o.holder.scale.setScalar(fly);
        // face the camera-ish regardless of where on the orbit it is, then spin on its own axis
        o.holder.rotation.y = -orbit.rotation.y - root.rotation.y;
        o.s.rotation.y += dt * o.speed;
        o.tilt.rotation.z = Math.sin(t * 0.8 + o.wob) * 0.25;
      });

      ring.material.opacity = 0.35 * intro;
      (dust.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
      (air.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
    },
  };
};
