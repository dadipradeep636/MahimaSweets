'use client';

import { useEffect, useRef, useState } from 'react';
import HeroSweets from '@/components/HeroSweets';
import DiwaliGlow from './DiwaliGlow';
import type { HeroStyle } from '@/lib/products';

export const HERO_STYLES: HeroStyle[] = ['classic', 'orbit', 'rain', 'diwali', 'zerog'];
type Kind3D = 'orbit' | 'rain' | 'zerog';
const is3D = (s: HeroStyle): s is Kind3D => s === 'orbit' || s === 'rain' || s === 'zerog';
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
function Hero3D({ kind, onFail }: { kind: Kind3D; onFail: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [label, setLabel] = useState<{ name: string; delay: number; n: number } | null>(null);
  const [played, setPlayed] = useState(false);
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    let n = 0;
    const on = (e: Event) => { const d = (e as CustomEvent).detail; setLabel({ name: d.name, delay: d.delay, n: ++n }); };
    const tapped = () => setPlayed(true);
    c.addEventListener('hero-label', on);
    c.addEventListener('click', tapped);
    return () => { c.removeEventListener('hero-label', on); c.removeEventListener('click', tapped); };
  }, []);
  useEffect(() => {
    let stop: (() => void) | undefined, dead = false;
    const params = new URLSearchParams(location.search);
    const freeze = params.has('heroT') ? Number(params.get('heroT')) : undefined;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = kind === 'orbit' ? import('./orbit').then(m => m.buildOrbit) : kind === 'rain' ? import('./rain').then(m => m.buildRain) : import('./zerog').then(m => m.buildZeroG);
    Promise.all([import('./stage3d'), scene])
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
      <canvas ref={canvas} role="img" aria-label={kind === 'zerog' ? 'Floating sweets – motichoor ladoo, poothrekulu, rasmalai, jalebi, coconut burfi and Dharwad peda' : 'Animated festive sweets – ladoo, kaju katli, jalebi, gulab jamun, peda and Mysore pak'} />
      {kind === 'zerog' && (
        <>
          {label?.name && <p key={label.n} className="zg-label" style={{ animationDelay: `${label.delay}s` } as React.CSSProperties}><span>Now floating</span>{label.name}</p>}
          <p className={`zg-hint${played ? ' gone' : ''}`} aria-hidden="true">✦ Tap the sweet</p>
        </>
      )}
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

  const pick = shown && is3D(shown) && (failed || !webglOk()) ? 'classic' : shown;
  const fail = useRef(() => setFailed(true)).current;

  if (!pick) return <div className="hero-visual h3 h3-wait" aria-hidden="true"><div className="h3-glow" /></div>;
  if (is3D(pick)) return <Hero3D key={pick} kind={pick} onFail={fail} />;
  if (pick === 'diwali') return <DiwaliGlow />;
  return <HeroSweets />;
}
