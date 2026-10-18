'use client';

import { useEffect, useRef, useState } from 'react';
import HeroSweets from '@/components/HeroSweets';
import DiwaliGlow from './DiwaliGlow';
import type { HeroStyle } from '@/lib/products';

export const HERO_STYLES: HeroStyle[] = ['classic', 'orbit', 'rain', 'diwali'];
const KEY = 'mahima-hero';
const isStyle = (v: unknown): v is HeroStyle => HERO_STYLES.includes(v as HeroStyle);

let gl: boolean | undefined;
function webglOk() {
  if (gl !== undefined) return gl;
  try {
    const c = document.createElement('canvas');
    const ctx = c.getContext('webgl2') || c.getContext('webgl');
    ctx?.getExtension('WEBGL_lose_context')?.loseContext();
    return (gl = !!ctx);
  } catch {
    return (gl = false);
  }
}

/* True 3D scenes (three.js) – loaded only when chosen, so other styles never download it. */
function Hero3D({ kind, onFail }: { kind: 'orbit' | 'rain'; onFail: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let stop: (() => void) | undefined, dead = false;
    const params = new URLSearchParams(location.search);
    const freeze = params.has('heroT') ? Number(params.get('heroT')) : undefined;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    Promise.all([import('./stage3d'), kind === 'orbit' ? import('./orbit').then(m => m.buildOrbit) : import('./rain').then(m => m.buildRain)])
      .then(([{ runScene }, build]) => {
        if (dead || !canvas.current) return;
        stop = runScene(canvas.current, build, { still, freezeAt: Number.isFinite(freeze) ? freeze : undefined, onReady: () => setReady(true) });
      })
      .catch(() => { if (!dead) onFail(); });
    return () => { dead = true; stop?.(); };
  }, [kind, onFail]);
  return (
    <div className={`hero-visual h3 h3-${kind}${ready ? ' is-ready' : ''}`}>
      <div className="h3-glow" aria-hidden="true" />
      {kind === 'rain' && <div className="h3-shafts" aria-hidden="true"><i /><i /><i /></div>}
      <canvas ref={canvas} role="img" aria-label="Animated festive sweets – ladoo, kaju katli, jalebi, gulab jamun, peda and Mysore pak" />
    </div>
  );
}

/* Shows the homepage animation the owner picked in /admin. `?hero=` previews a style without saving. */
export default function HeroStage({ style }: { style: HeroStyle | undefined }) {
  const [shown, setShown] = useState<HeroStyle | null>(null);
  const [failed, setFailed] = useState(false);

  // first paint: use the last known choice so returning visitors never see a flash of the wrong one
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('hero');
    if (isStyle(q)) { setShown(q); return; }
    let saved: string | null = null;
    try { saved = localStorage.getItem(KEY); } catch {}
    if (isStyle(saved)) setShown(saved);
    const t = setTimeout(() => setShown(s => s ?? 'classic'), 1800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!style) return;
    if (isStyle(new URLSearchParams(location.search).get('hero'))) return;
    setShown(style);
    try { localStorage.setItem(KEY, style); } catch {}
  }, [style]);

  const pick = shown && (shown === 'orbit' || shown === 'rain') && (failed || !webglOk()) ? 'classic' : shown;
  const fail = useRef(() => setFailed(true)).current;

  if (!pick) return <div className="hero-visual h3 h3-wait" aria-hidden="true"><div className="h3-glow" /></div>;
  if (pick === 'orbit' || pick === 'rain') return <Hero3D key={pick} kind={pick} onFail={fail} />;
  if (pick === 'diwali') return <DiwaliGlow />;
  return <HeroSweets />;
}
