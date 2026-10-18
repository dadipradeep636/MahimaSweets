/*
 * Runs a three.js hero scene inside a canvas: sizing, pointer/tilt, pausing when hidden, still frame for reduced motion.
 * Loaded lazily (dynamic import) so three.js never slows the first paint of the page.
 */
import * as THREE from 'three';
import { makeRenderer, studio } from './sweets3d';

export type SceneInput = { t: number; dt: number; px: number; py: number };
export type SceneDef = {
  camera: THREE.PerspectiveCamera;
  update: (i: SceneInput) => void;
  /* time at which a still frame looks best (reduced motion) */
  stillAt: number;
};
export type SceneBuilder = (scene: THREE.Scene, renderer: THREE.WebGLRenderer) => SceneDef;

export function runScene(canvas: HTMLCanvasElement, build: SceneBuilder, opts: { still?: boolean; freezeAt?: number; onReady?: () => void } = {}) {
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  studio(scene, renderer);
  const def = build(scene, renderer);
  const host = canvas.parentElement!;

  const size = () => {
    const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
    renderer.setSize(w, h, false);
    def.camera.aspect = w / h;
    // keep the composition inside narrow (portrait) boxes
    def.camera.userData.fit = Math.max(1, 0.95 / (w / h));
    def.camera.updateProjectionMatrix();
  };
  size();
  let ro = new ResizeObserver(size);
  ro.observe(host);

  // pointer tilt (desktop) – smoothed; gentle automatic sway on touch screens
  let tx = 0, ty = 0, px = 0, py = 0, touch = matchMedia('(hover: none)').matches;
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const r = host.getBoundingClientRect();
    tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
    ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
  };
  const onLeave = () => { tx = 0; ty = 0; };
  window.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);

  let visible = true, onScreen = true, raf = 0, last = performance.now(), t = 0, alive = true;
  const fixed = opts.freezeAt ?? (opts.still ? def.stillAt : undefined);

  const frame = (now: number) => {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    if (touch) { tx = Math.sin(t * 0.35) * 0.35; ty = Math.sin(t * 0.27) * 0.2; }
    px += (tx - px) * Math.min(1, dt * 3);
    py += (ty - py) * Math.min(1, dt * 3);
    def.update({ t, dt, px, py });
    renderer.render(scene, def.camera);
    raf = visible && onScreen ? requestAnimationFrame(frame) : 0;
  };
  const resume = () => {
    if (!raf && visible && onScreen && fixed === undefined && alive) { last = performance.now(); raf = requestAnimationFrame(frame); }
  };

  const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; resume(); }, { rootMargin: '80px' });
  io.observe(host);
  const onVis = () => { visible = document.visibilityState === 'visible'; resume(); };
  document.addEventListener('visibilitychange', onVis);

  if (fixed !== undefined) {
    // jump straight to a good-looking moment and draw once
    const step = 1 / 30;
    for (let s = 0; s < fixed; s += step) def.update({ t: s, dt: step, px: 0, py: 0 });
    def.update({ t: fixed, dt: step, px: 0, py: 0 });
    renderer.render(scene, def.camera);
    ro.disconnect();
    ro = new ResizeObserver(() => { size(); renderer.render(scene, def.camera); });
    ro.observe(host);
  } else {
    raf = requestAnimationFrame(frame);
  }
  requestAnimationFrame(() => opts.onReady?.());

  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    ro.disconnect(); io.disconnect();
    window.removeEventListener('pointermove', onMove);
    document.documentElement.removeEventListener('pointerleave', onLeave);
    document.removeEventListener('visibilitychange', onVis);
    scene.traverse(o => { if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose(); });
    renderer.dispose();
    renderer.forceContextLoss();
  };
}

export const ease = {
  outCubic: (x: number) => 1 - Math.pow(1 - x, 3),
  inOutSine: (x: number) => -(Math.cos(Math.PI * x) - 1) / 2,
  outBack: (x: number) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  clamp: (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x)),
};
