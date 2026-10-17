'use client';

import { useState } from 'react';
import { Plus, ArrowUpRight } from 'lucide-react';
import { badam, money, priceFor, type Product } from '@/lib/products';

const bubbles = Array.from({ length: 10 }, (_, i) => ({ left: `${12 + ((i * 29) % 76)}%`, delay: `${(i * 0.7) % 6}s`, size: `${5 + (i % 3) * 4}px` }));

export default function BadamFeature({ add, open }: { add: (p: Product, size?: number, from?: HTMLElement) => void; open: (p: Product) => void }) {
  const [size, setSize] = useState(250);
  return (
    <section id="badam-geer" className="badam section-pad" aria-labelledby="badam-title">
      <div className="badam-copy reveal">
        <p className="eyebrow">THE GOLDEN SIP</p>
        <h2 id="badam-title">
          Sip slow.
          <br />
          <em>Stay golden.</em>
        </h2>
        <p className="lead">Meet our Badam Geer. Creamy almond milk with a saffron glow, topped with almond and pistachio slivers. The perfect partner for hot snacks.</p>
        <div className="badam-order">
          <div className="badam-price">
            <strong key={size} className="price-pop">{money(priceFor(badam, size))}</strong>
            <span>{size} ml glass</span>
          </div>
          <div className="pack-chips" role="group" aria-label="Badam Geer serving size">
            {[250, 500].map(n => (
              <button key={n} aria-pressed={size === n} className={size === n ? 'active' : ''} onClick={() => setSize(n)}>
                {n} ml
              </button>
            ))}
          </div>
        </div>
        <div className="badam-actions">
          <button className="button primary" onClick={e => add(badam, size, e.currentTarget)}>
            <Plus size={17} /> Add to bag
          </button>
          <button className="text-link" onClick={() => open(badam)}>
            More about it <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
      <div className="badam-visual reveal" aria-hidden="true">
        <div className="badam-halo" />
        <div className="badam-orbit" />
        <div className="badam-orbit two" />
        <div className="badam-glass">
          <img src="/images/badam-geer-refined.webp" alt="" loading="lazy" />
          <svg className="steam" viewBox="0 0 160 160">
            <path d="M45 150C0 100 85 75 42 15" />
            <path d="M85 150C35 100 125 70 83 0" />
            <path d="M125 150C80 100 165 70 122 15" />
          </svg>
        </div>
        {bubbles.map((b, i) => (
          <i key={i} className="badam-bubble" style={{ left: b.left, animationDelay: b.delay, width: b.size, height: b.size }} />
        ))}
        <span className="almond a1" />
        <span className="almond a2" />
        <span className="almond a3" />
      </div>
    </section>
  );
}
