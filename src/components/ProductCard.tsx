'use client';

import { useEffect, useRef, useState } from 'react';
import { Ban, Check, Eye, Flame, Plus } from 'lucide-react';
import { defaultPack, money, packLabel, packOptions, priceFor, type Product } from '@/lib/products';

/* Shared by the website and the admin preview, so an added item looks exactly like the rest of the menu. */
export function SteamWaves() {
  return (
    <svg className="steam" viewBox="0 0 240 200" aria-hidden="true">
      <path d="M65 185 C20 145 105 125 65 83 C28 42 80 20 63 -10" />
      <path d="M125 195 C80 155 165 130 125 90 C88 48 140 25 123 -5" />
      <path d="M185 185 C140 145 225 125 185 83 C148 42 200 20 183 -10" />
    </svg>
  );
}

export type AddFn = (p: Product, size?: number, from?: HTMLElement) => void;

export function ProductCard({ product: p, index, open, add, className = '' }: { product: Product; index: number; open: (p: Product) => void; add: AddFn; className?: string }) {
  const [pack, setPack] = useState(defaultPack(p));
  // If the owner changes how an item is sold, fall back to its new default pack.
  const validPack = packOptions(p).includes(pack) ? pack : defaultPack(p);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <article className={`card ${p.hot ? 'is-hot' : ''} ${p.soldOut ? 'is-soldout' : ''} ${className}`} style={{ '--i': index } as React.CSSProperties}>
      <button className="card-media" onClick={() => open(p)} aria-label={`View ${p.name} details`}>
        <img src={p.image} alt={p.name} loading="lazy" />
        {p.hot && <SteamWaves />}
        {p.soldOut ? (
          <span className="card-badge is-soldout-badge"><Ban size={12} /> Sold out today</span>
        ) : (
          <span className={`card-badge ${p.special ? 'is-special' : ''}`}>
            {p.hot && <Flame size={12} />}
            {p.special || p.tag}
          </span>
        )}
        <span className="card-peek">
          <Eye size={15} /> Quick look
        </span>
        <span className="card-shine" aria-hidden="true" />
      </button>
      <div className="card-body">
        <button className="card-title" onClick={() => open(p)}>
          <h3>{p.name}</h3>
        </button>
        <p className="card-sub">{p.subtitle}</p>
        {packOptions(p).length > 1 && (
          <div className="pack-chips" role="group" aria-label={`Choose pack for ${p.name}`}>
            {packOptions(p).map(size => (
              <button key={size} className={validPack === size ? 'active' : ''} aria-pressed={validPack === size} onClick={() => setPack(size)}>
                {packLabel(p, size)}
              </button>
            ))}
          </div>
        )}
        <div className="card-foot">
          <div className="card-price">
            <strong key={validPack} className="price-pop">{money(priceFor(p, validPack))}</strong>
            <span>{packLabel(p, validPack)}</span>
          </div>
          <button
            className={`add-btn ${added ? 'is-added' : ''}`}
            disabled={p.soldOut}
            aria-label={p.soldOut ? `${p.name} is sold out today` : `Add ${packLabel(p, validPack)} of ${p.name} to bag`}
            onClick={e => {
              add(p, validPack, e.currentTarget);
              setAdded(true);
              clearTimeout(timer.current);
              timer.current = setTimeout(() => setAdded(false), 1500);
            }}
          >
            {p.soldOut ? <Ban size={16} /> : added ? <Check size={17} /> : <Plus size={17} />}
            <span>{p.soldOut ? 'Sold out' : added ? 'Added' : 'Add'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
