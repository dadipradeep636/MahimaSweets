'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import OrderTracker from '@/components/OrderTracker';
import { businessDefaults, type Business } from '@/lib/products';
import { saveMyOrder } from '@/lib/my-orders';

export default function OrderPage() {
  const [params, setParams] = useState<{ id: string; t: string } | null>(null);
  const [business, setBusiness] = useState<Business>(businessDefaults);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const id = q.get('id') || '', t = q.get('t') || '';
    if (!/^MS\d{6}$/.test(id) || !/^[a-f0-9]{32}$/.test(t)) { setMissing(true); return; }
    setParams({ id, t });
    saveMyOrder({ id, t, at: Math.floor(Date.now() / 1000) });
    fetch('/api/shop/', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(d => { if (d?.business) setBusiness(d.business); }).catch(() => {});
  }, []);

  return (
    <div className="legal-page order-page">
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
      <main className="order-main">
        {missing ? (
          <div className="tracker tracker-missing">
            <h2>We could not find that order.</h2>
            <p>Please open the tracking link again, or call the shop with your order number.</p>
            <a className="button primary" href="/">Back to the shop</a>
          </div>
        ) : params ? (
          <OrderTracker id={params.id} token={params.t} business={business} />
        ) : (
          <div className="tracker tracker-loading"><span className="adm-spinner" /></div>
        )}
      </main>
    </div>
  );
}
