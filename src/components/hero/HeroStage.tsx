'use client';

import { useEffect, useState } from 'react';
import HeroSweets from '@/components/HeroSweets';
import DiwaliGlow from './DiwaliGlow';
import type { HeroStyle } from '@/lib/products';

export const HERO_STYLES: HeroStyle[] = ['classic', 'diwali'];
const KEY = 'mahima-hero';
const isStyle = (v: unknown): v is HeroStyle => HERO_STYLES.includes(v as HeroStyle);

/* Shows the homepage animation the owner picked in /admin. `?hero=` previews a style without saving. */
export default function HeroStage({ style }: { style: HeroStyle | undefined }) {
  const [shown, setShown] = useState<HeroStyle | null>(null);

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
    const pick = isStyle(style) ? style : 'classic';
    setShown(pick);
    try { localStorage.setItem(KEY, pick); } catch {}
  }, [style]);

  if (!shown) return <div className="hero-visual hero-wait" aria-hidden="true"><div className="hv-glow" /></div>;
  if (shown === 'diwali') return <DiwaliGlow />;
  return <HeroSweets />;
}
