'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Mail, MapPin, Phone, UserRound } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { businessDefaults, type Business } from '@/lib/products';
import { shop } from '@/lib/shop';

export const UPDATED = '18 October 2026';
export const ADDRESS = 'Opposite Amar Hospitals, Gangavathi, Koppal District, Karnataka – 583227';

/* Live shop details from /admin → Shop details. */
export function useBusiness(): Business {
  const [b, setB] = useState<Business>(businessDefaults);
  useEffect(() => {
    fetch('/api/shop/', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(d => { if (d?.business) setB(d.business); }).catch(() => {});
  }, []);
  return b;
}

export function GrievanceContact({ b }: { b: Business }) {
  const phone = b.grievancePhone ? `+91 ${b.grievancePhone.slice(0, 5)} ${b.grievancePhone.slice(5)}` : shop.phone;
  const tel = b.grievancePhone ? `+91${b.grievancePhone}` : shop.telephone;
  const email = b.grievanceEmail || b.email;
  return (
    <div className="legal-contact">
      <div><UserRound size={17} /><span><strong>{b.grievanceName || 'The owner, Mahima Sweets'}</strong> – Grievance Officer</span></div>
      <div><Phone size={17} /><a href={`tel:${tel}`}>{phone}</a></div>
      <div><Mail size={17} />{email ? <a href={`mailto:${email}`}>{email}</a> : <span className="legal-blank">Email will be added soon – please call or WhatsApp meanwhile.</span>}</div>
      <div><MapPin size={17} /><span>{b.legalName || 'Mahima Sweets'}, {ADDRESS}</span></div>
    </div>
  );
}

const tabs: [string, string][] = [['/privacy/', 'Privacy Policy'], ['/terms/', 'Terms'], ['/refund-policy/', 'Refund & Cancellation']];

export default function LegalPage({ path, eyebrow, title, intro, children }: { path: string; eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="legal-page">
      <header className="adm-header">
        <a className="brand" href="/" aria-label="Mahima Sweets home">
          <span className="brand-mark">M<span>✦</span></span>
          <span className="brand-text">
            <span className="brand-name">Mahima</span>
            <span className="brand-sub">Sweets</span>
          </span>
        </a>
        <div className="adm-header-actions">
          <ThemeToggle />
          <a className="adm-link" href="/"><ArrowLeft size={15} /> Shop</a>
        </div>
      </header>
      <main className="legal-main">
        <div className="legal-head">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{intro}</p>
          <p className="legal-updated">Last updated: {UPDATED}</p>
          <nav className="legal-tabs" aria-label="Policies">
            {tabs.map(([href, label]) => <a key={href} href={href} aria-current={href === path ? 'page' : undefined}>{label}</a>)}
          </nav>
        </div>
        {children}
        <p className="legal-foot">Questions? Call {shop.phone} or visit us at the shop. These policies are written in plain language; if anything is unclear, please ask us.</p>
      </main>
    </div>
  );
}
