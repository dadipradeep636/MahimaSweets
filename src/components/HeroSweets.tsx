'use client';

import { useRef } from 'react';
import { Plus } from 'lucide-react';

/* Decorative values are fixed (not random) so the server and browser render the same markup. */
const sparkles = Array.from({ length: 16 }, (_, i) => ({
  left: `${(i * 37 + 11) % 96}%`,
  top: `${(i * 53 + 7) % 92}%`,
  delay: `${(i * 0.43) % 4}s`,
  size: `${6 + (i % 4) * 3}px`,
}));

function Mandala() {
  return (
    <svg className="hv-mandala" viewBox="0 0 400 400" aria-hidden="true">
      <circle cx="200" cy="200" r="196" />
      <circle cx="200" cy="200" r="170" strokeDasharray="2 9" />
      <circle cx="200" cy="200" r="122" />
      {Array.from({ length: 24 }, (_, i) => (
        <ellipse key={i} cx="200" cy="58" rx="13" ry="34" transform={`rotate(${i * 15} 200 200)`} />
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <path key={`p${i}`} d="M200 82 Q214 118 200 150 Q186 118 200 82Z" transform={`rotate(${i * 30} 200 200)`} />
      ))}
    </svg>
  );
}

export default function HeroSweets({ onPick }: { onPick: (el: HTMLElement) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  function move(x: number, y: number) {
    ref.current?.style.setProperty('--mx', x.toFixed(3));
    ref.current?.style.setProperty('--my', y.toFixed(3));
  }
  return (
    <div
      className="hero-visual"
      ref={ref}
      onPointerMove={e => {
        if (e.pointerType === 'touch') return;
        const r = e.currentTarget.getBoundingClientRect();
        move(((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2);
      }}
      onPointerLeave={() => move(0, 0)}
    >
      <div className="hv-glow" aria-hidden="true" />
      <div className="hv-rays" aria-hidden="true" />
      <Mandala />
      <div className="hv-plate">
        <img
          src="/images/hero-platter-luxe.webp"
          width="1600"
          height="1067"
          alt="Golden brass platter with motichoor ladoo, kaju burfi, gulab jamun, kesar peda and jalebi"
          fetchPriority="high"
          draggable={false}
        />
      </div>
      <div className="hv-float hv-ladoo" aria-hidden="true">
        <img src="/images/hero-ladoo-cutout.webp" width="640" height="640" alt="" draggable={false} />
      </div>
      <div className="hv-float hv-kaju" aria-hidden="true">
        <img src="/images/hero-kaju-cutout.webp" width="640" height="640" alt="" draggable={false} />
      </div>
      <div className="hv-sparkles" aria-hidden="true">
        {sparkles.map((s, i) => (
          <i key={i} style={{ left: s.left, top: s.top, animationDelay: s.delay, width: s.size, height: s.size }} />
        ))}
      </div>
      <div className="hv-card">
        <img src="/images/katli.webp" alt="" />
        <div>
          <span>Mahima favourite</span>
          <strong>Kaju Burfi</strong>
          <small>₹460 · 500 g</small>
        </div>
        <button type="button" aria-label="Add 500 g of Kaju Burfi to bag" onClick={e => onPick(e.currentTarget)}>
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}
