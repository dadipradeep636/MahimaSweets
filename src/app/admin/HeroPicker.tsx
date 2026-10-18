'use client';

import { useState } from 'react';
import { Check, ExternalLink, Sparkles } from 'lucide-react';
import type { HeroStyle } from '@/lib/products';

type Change = (body: object, done: string) => Promise<unknown>;

const STYLES: { id: HeroStyle; name: string; tag: string; about: string }[] = [
  { id: 'classic', name: 'Classic', tag: 'Simple', about: 'The original floating platter with a ladoo and kaju katli. Lightest on old phones.' },
  { id: 'diwali', name: 'Diwali Glow', tag: 'Festive', about: 'Our real platter photo on a colourful rangoli, ringed by flickering diyas, with marigold petals drifting down.' },
];

/* Owner picks which animation greets customers at the top of the homepage. */
export default function HeroPicker({ hero, change }: { hero?: HeroStyle; change: Change }) {
  const current = hero || 'classic';
  const [busy, setBusy] = useState<HeroStyle | null>(null);
  async function use(id: HeroStyle) {
    setBusy(id);
    await change({ action: 'setHero', hero: id }, `Homepage now shows “${STYLES.find(s => s.id === id)?.name}”`);
    setBusy(null);
  }
  return (
    <div className="adm-card adm-form-card adm-hero-pick">
      <h2><Sparkles size={18} /> Homepage animation</h2>
      <p className="adm-hint">Choose what customers see first on the website. Tap <b>Preview</b> to watch it live before switching. The change shows for everyone within a minute.</p>
      <div className="adm-hero-grid">
        {STYLES.map(s => {
          const on = s.id === current;
          return (
            <article key={s.id} className={`adm-hero-opt${on ? ' on' : ''}`}>
              <div className="adm-hero-thumb">
                <img src={`/images/hero-previews/${s.id}.webp`} alt="" width="480" height="360" loading="lazy" />
                <span className="adm-hero-tag">{s.tag}</span>
                {on && <span className="adm-hero-live"><Check size={13} /> Live now</span>}
              </div>
              <div className="adm-hero-body">
                <strong>{s.name}</strong>
                <p>{s.about}</p>
                <div className="adm-hero-actions">
                  <a className="button secondary" href={`/?hero=${s.id}`} target="_blank" rel="noopener">
                    <ExternalLink size={15} /> Preview
                  </a>
                  <button type="button" className="button primary" disabled={on || !!busy} onClick={() => use(s.id)}>
                    {on ? <><Check size={15} /> In use</> : busy === s.id ? 'Switching…' : 'Use this'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
