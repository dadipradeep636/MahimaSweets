'use client';

import { useRef } from 'react';

/* "Diwali Glow": the real platter photo resting on a hand-drawn rangoli, ringed by flickering diyas,
   with marigold petals drifting down, soft steam and warm light. Pure HTML/SVG/CSS – light on every phone. */

const PETAL_COLORS = ['#ff9f1c', '#ffb627', '#f77f00', '#ffc94a', '#e85d04'];
const petals = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 41 + 7) % 98}%`,
  delay: `${-((i * 1.37) % 11).toFixed(2)}s`,
  dur: `${9 + (i % 5) * 1.6}s`,
  size: `${10 + (i % 4) * 4}px`,
  sway: `${((i % 2) * 2 - 1) * (18 + (i % 3) * 14)}px`,
  spin: `${(i % 2 ? 1 : -1) * (300 + (i % 4) * 90)}deg`,
  color: PETAL_COLORS[i % PETAL_COLORS.length],
}));
const sparks = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 29 + 13) % 94}%`,
  top: `${(i * 47 + 5) % 70}%`,
  delay: `${(i * 0.53) % 4}s`,
  size: `${5 + (i % 4) * 3}px`,
}));
/* diyas sit on an ellipse in front of the plate (x %, y %, scale, flicker delay) */
const diyas = [
  { x: 6, y: 74, s: 0.82, d: '0s' },
  { x: 22, y: 86, s: 0.95, d: '-.7s' },
  { x: 41, y: 92, s: 1.05, d: '-1.3s' },
  { x: 59, y: 92, s: 1.05, d: '-.35s' },
  { x: 78, y: 86, s: 0.95, d: '-1.9s' },
  { x: 94, y: 74, s: 0.82, d: '-1.1s' },
];

function Rangoli() {
  const ring = (n: number, r: number, render: (i: number) => React.ReactNode) =>
    Array.from({ length: n }, (_, i) => <g key={i} transform={`rotate(${(360 / n) * i} 300 300)`}>{render(i)}</g>);
  return (
    <svg className="hd-rangoli" viewBox="0 0 600 600" aria-hidden="true">
      <defs>
        <filter id="hd-powder" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="5" />
        </filter>
        <radialGradient id="hd-pink" cx="50%" cy="20%" r="80%"><stop offset="0" stopColor="#ff5fa2" /><stop offset="1" stopColor="#c2185b" /></radialGradient>
        <radialGradient id="hd-orange" cx="50%" cy="20%" r="80%"><stop offset="0" stopColor="#ffb347" /><stop offset="1" stopColor="#e8590c" /></radialGradient>
        <radialGradient id="hd-teal" cx="50%" cy="20%" r="80%"><stop offset="0" stopColor="#3fd0c9" /><stop offset="1" stopColor="#0b7a75" /></radialGradient>
        <radialGradient id="hd-yellow" cx="50%" cy="20%" r="80%"><stop offset="0" stopColor="#ffe066" /><stop offset="1" stopColor="#f4a300" /></radialGradient>
      </defs>
      <g filter="url(#hd-powder)">
        <circle cx="300" cy="300" r="292" fill="#5b0f2a" opacity=".55" />
        <g className="hd-draw" style={{ '--i': 0 } as React.CSSProperties}>
          {ring(24, 0, () => <path d="M300 18 Q326 60 300 104 Q274 60 300 18Z" fill="url(#hd-pink)" />)}
        </g>
        <g className="hd-draw" style={{ '--i': 1 } as React.CSSProperties}>
          {ring(24, 0, () => <path d="M300 60 Q318 92 300 124 Q282 92 300 60Z" fill="url(#hd-yellow)" transform="rotate(7.5 300 300)" />)}
        </g>
        <circle className="hd-draw hd-stroke" style={{ '--i': 2 } as React.CSSProperties} cx="300" cy="300" r="176" fill="none" stroke="#fff4dc" strokeWidth="5" strokeDasharray="2 12" strokeLinecap="round" />
        <g className="hd-draw" style={{ '--i': 3 } as React.CSSProperties}>
          {ring(16, 0, () => <path d="M300 128 C340 150 340 200 300 214 C260 200 260 150 300 128Z" fill="url(#hd-orange)" />)}
        </g>
        <g className="hd-draw" style={{ '--i': 4 } as React.CSSProperties}>
          {ring(16, 0, () => <path d="M300 150 C322 166 322 192 300 200 C278 192 278 166 300 150Z" fill="url(#hd-teal)" transform="rotate(11.25 300 300)" />)}
        </g>
        <circle cx="300" cy="300" r="92" fill="url(#hd-yellow)" className="hd-draw" style={{ '--i': 5 } as React.CSSProperties} />
        <g className="hd-draw" style={{ '--i': 6 } as React.CSSProperties}>
          {ring(8, 0, () => <path d="M300 214 Q316 250 300 286 Q284 250 300 214Z" fill="url(#hd-pink)" />)}
        </g>
        <circle cx="300" cy="300" r="22" fill="#fff4dc" className="hd-draw" style={{ '--i': 7 } as React.CSSProperties} />
        {ring(48, 0, i => <circle cx="300" cy={i % 2 ? 10 : 8} r={i % 2 ? 3 : 4.5} fill="#fff4dc" className="hd-draw" style={{ '--i': 2 } as React.CSSProperties} />)}
      </g>
    </svg>
  );
}

function Diya({ x, y, s, d }: { x: number; y: number; s: number; d: string }) {
  return (
    <div className="hd-diya" style={{ left: `${x}%`, top: `${y}%`, '--s': s, '--d': d } as React.CSSProperties}>
      <span className="hd-diya-glow" />
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <linearGradient id="hd-clay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c8642a" /><stop offset=".55" stopColor="#8a3412" /><stop offset="1" stopColor="#4a1606" /></linearGradient>
          <linearGradient id="hd-rim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ffd27a" /><stop offset=".5" stopColor="#fff2c4" /><stop offset="1" stopColor="#c98a2a" /></linearGradient>
          <radialGradient id="hd-flame" cx="50%" cy="72%" r="60%"><stop offset="0" stopColor="#fffbe6" /><stop offset=".35" stopColor="#ffe08a" /><stop offset=".7" stopColor="#ff9a1f" /><stop offset="1" stopColor="#ff5a00" stopOpacity="0" /></radialGradient>
          <radialGradient id="hd-oil" cx="50%" cy="40%" r="60%"><stop offset="0" stopColor="#ffd56b" /><stop offset="1" stopColor="#a8560f" /></radialGradient>
        </defs>
        <g className="hd-flame">
          <path d="M60 18 C70 38 74 52 66 62 C62 67 58 67 54 62 C46 52 50 38 60 18Z" fill="url(#hd-flame)" />
          <path d="M60 38 C64 48 65 55 61 60 C59.5 62 58.5 62 57 60 C55 55 56 48 60 38Z" fill="#fffef5" opacity=".9" />
        </g>
        <path d="M14 70 Q60 64 106 70 Q100 100 60 104 Q20 100 14 70Z" fill="url(#hd-clay)" />
        <ellipse cx="60" cy="70" rx="46" ry="8" fill="url(#hd-rim)" />
        <ellipse cx="60" cy="70.5" rx="38" ry="5" fill="url(#hd-oil)" />
        <path d="M24 84 Q60 92 96 84" stroke="#ffcf7a" strokeWidth="2" fill="none" opacity=".55" strokeDasharray="3 5" />
      </svg>
    </div>
  );
}

export default function DiwaliGlow() {
  const ref = useRef<HTMLDivElement>(null);
  const move = (x: number, y: number) => {
    ref.current?.style.setProperty('--mx', x.toFixed(3));
    ref.current?.style.setProperty('--my', y.toFixed(3));
  };
  return (
    <div
      className="hero-visual hd"
      ref={ref}
      onPointerMove={e => {
        if (e.pointerType === 'touch') return;
        const r = e.currentTarget.getBoundingClientRect();
        move(((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2);
      }}
      onPointerLeave={() => move(0, 0)}
    >
      <div className="hd-glow" aria-hidden="true" />
      <div className="hd-rays" aria-hidden="true" />
      <div className="hd-floor" aria-hidden="true">
        <div className="hd-spin"><Rangoli /></div>
      </div>
      <div className="hd-plate">
        <img
          src="/images/hero-platter-luxe.webp"
          width="1600"
          height="1067"
          alt="Golden brass platter with motichoor ladoo, kaju burfi, gulab jamun, kesar peda and jalebi"
          fetchPriority="high"
          draggable={false}
        />
        <div className="hd-steam" aria-hidden="true"><i /><i /><i /></div>
      </div>
      <div className="hd-diyas" aria-hidden="true">
        {diyas.map((d, i) => <Diya key={i} {...d} />)}
      </div>
      <div className="hd-petals" aria-hidden="true">
        {petals.map((p, i) => (
          <i key={i} style={{ left: p.left, animationDelay: p.delay, animationDuration: p.dur, '--sz': p.size, '--sway': p.sway, '--spin': p.spin, '--c': p.color } as React.CSSProperties} />
        ))}
      </div>
      <div className="hv-sparkles" aria-hidden="true">
        {sparks.map((s, i) => (
          <i key={i} style={{ left: s.left, top: s.top, animationDelay: s.delay, width: s.size, height: s.size }} />
        ))}
      </div>
    </div>
  );
}
