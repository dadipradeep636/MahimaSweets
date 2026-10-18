'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowUpRight, Check, CheckCircle2, Clock3, Copy, Download, MapPin, PackageCheck, Phone, QrCode, RefreshCw, ShoppingBag, Smartphone, Sparkles, X } from 'lucide-react';
import { money, type Business } from '@/lib/products';
import { formatWhen, formatTime, PAY_WINDOW } from '@/lib/pickup.mjs';
import { shop, shopDirectionsUrl, whatsappLink } from '@/lib/shop';
import { trackUrl, type OrderView } from '@/lib/my-orders';
import { Steps } from '@/components/Checkout';

const FINAL = ['picked_up', 'cancelled'];
const STEP_LIST: { key: OrderView['status']; label: string }[] = [
  { key: 'awaiting_payment', label: 'Order placed' },
  { key: 'payment_check', label: 'Payment sent' },
  { key: 'confirmed', label: 'Payment confirmed · preparing' },
  { key: 'ready', label: 'Ready for pickup' },
  { key: 'picked_up', label: 'Picked up' },
];
const HERO: Record<OrderView['status'], { title: string; text: string; tone: string }> = {
  awaiting_payment: { title: 'Pay to confirm your order', text: 'Scan the QR or open your UPI app, then send us the payment reference.', tone: 'pay' },
  payment_check: { title: 'Checking your payment', text: 'The shop is matching your UPI payment. This usually takes a few minutes during shop hours.', tone: 'check' },
  confirmed: { title: 'Order confirmed!', text: 'Payment received. We are getting your sweets ready.', tone: 'ok' },
  ready: { title: 'Ready for pickup!', text: 'Your order is packed and waiting at the counter.', tone: 'ready' },
  picked_up: { title: 'Enjoy your sweets!', text: 'Thank you for choosing Mahima Sweets.', tone: 'done' },
  cancelled: { title: 'Order cancelled', text: '', tone: 'off' },
};

function mmss(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return sec >= 3600 ? `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m` : `${m}:${String(s).padStart(2, '0')}`;
}

export default function OrderTracker({ id, token, business, initial, onClose }: { id: string; token: string; business: Business; initial?: OrderView; onClose?: () => void }) {
  const [order, setOrder] = useState<OrderView | null>(initial || null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [ref, setRef] = useState('');
  const [busy, setBusy] = useState<'' | 'pay' | 'cancel'>('');
  const [actionError, setActionError] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [copied, setCopied] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/order/?id=${encodeURIComponent(id)}&t=${encodeURIComponent(token)}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || 'We could not find that order.'); return; }
      setOrder(data.order);
      setError('');
    } catch {
      /* keep showing the last known state when offline */
    }
  }, [id, token]);

  useEffect(() => { if (!initial) load(); }, [initial, load]);
  // Live updates while the order is still moving.
  useEffect(() => {
    if (order && FINAL.includes(order.status)) return;
    const t = setInterval(load, 15000);
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVisible); };
  }, [order, load]);
  useEffect(() => { const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { if (!confirmCancel) return; const t = setTimeout(() => setConfirmCancel(false), 4000); return () => clearTimeout(t); }, [confirmCancel]);

  async function act(body: object, kind: 'pay' | 'cancel') {
    setBusy(kind);
    setActionError('');
    try {
      const res = await fetch('/api/order/', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, id, t: token }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setActionError(data.error || 'Please try again.'); if (res.status === 409) load(); return; }
      setOrder(data.order);
      setRef('');
    } catch {
      setActionError('Could not reach the shop. Check your internet and try again.');
    } finally {
      setBusy('');
    }
  }

  function copy(text: string, what: string) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(what);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(''), 1800);
    }).catch(() => {});
  }

  if (error && !order) {
    return (
      <div className="tracker tracker-missing">
        <span className="tr-hero-icon off"><X size={30} /></span>
        <h2>{error}</h2>
        <p>Please check the link, or call <a href={`tel:${shop.telephone}`}>{shop.phone}</a> with your order number.</p>
        <a className="button primary" href="/">Back to the shop</a>
      </div>
    );
  }
  if (!order) return <div className="tracker tracker-loading"><span className="adm-spinner" /></div>;

  const hero = HERO[order.status];
  const paidAmount = order.status === 'awaiting_payment' ? 0 : order.payNow;
  const reachedIndex = (s: OrderView['status']) => STEP_LIST.findIndex(x => x.key === s);
  const lastAt = (s: string) => [...order.history].reverse().find(h => h.status === s)?.at;
  const currentIndex = order.status === 'cancelled' ? -1 : reachedIndex(order.status);
  const cancelLeft = Math.max(0, order.cancelUntil - now);
  const payLeft = Math.max(0, (order.payBy ?? (lastAt('awaiting_payment') || order.createdAt) + PAY_WINDOW) - now);
  const upiLink = business.upiId
    ? `upi://pay?pa=${encodeURIComponent(business.upiId)}&pn=${encodeURIComponent(business.payeeName || 'Mahima Sweets')}&am=${order.payNow}.00&cu=INR&tn=${encodeURIComponent(`Order ${order.id}`)}`
    : '';
  const waText = `Hi Mahima Sweets! My order ${order.id} – pickup ${formatWhen(order.pickupAt, now)}. Total ${money(order.total)}${order.status === 'payment_check' ? `, paid ${money(order.payNow)} by UPI` : ''}. Name: ${order.name}.`;
  const fullLink = typeof window !== 'undefined' ? `${window.location.origin}${trackUrl({ id, t: token })}` : trackUrl({ id, t: token });

  function receipt() {
    const o = order!;
    const lines = o.lines.map(l => `${l.name} – ${l.pack} × ${l.qty}: ${money(l.amount)}`);
    const text = [
      business.legalName || 'Mahima Sweets',
      'Opposite Amar Hospitals, Gangavathi, Karnataka – 583227',
      `Phone: ${shop.phone}`,
      business.fssai ? `FSSAI Lic. No.: ${business.fssai}` : '',
      '',
      `ORDER ${o.id}`,
      `Placed: ${formatWhen(o.createdAt, o.createdAt)}`,
      `Pickup: ${formatWhen(o.pickupAt, o.createdAt)}`,
      `Name: ${o.name}`,
      '',
      ...lines,
      '',
      `Total: ${money(o.total)}`,
      `Paid online (UPI): ${money(paidAmount)}${o.paymentRef ? ` (ref ${o.paymentRef})` : ''}`,
      `To pay at shop: ${money(o.status === 'cancelled' ? 0 : o.total - paidAmount)}`,
      o.note ? `Gift message: ${o.note}` : '',
      `Status: ${HERO[o.status].title}`,
      '',
      'Thank you for choosing Mahima Sweets!',
    ].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mahima-Sweets-${o.id}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="tracker">
      <Steps step={order.status === 'awaiting_payment' ? 2 : 3} />

      <div className={`tr-hero tone-${hero.tone}`} key={order.status}>
        <span className={`tr-hero-icon ${hero.tone}`}>
          {order.status === 'awaiting_payment' && <QrCode size={30} />}
          {order.status === 'payment_check' && <RefreshCw size={28} />}
          {order.status === 'confirmed' && <Check size={32} />}
          {order.status === 'ready' && <ShoppingBag size={28} />}
          {order.status === 'picked_up' && <Sparkles size={28} />}
          {order.status === 'cancelled' && <X size={30} />}
        </span>
        <p className="eyebrow">ORDER {order.id}</p>
        <h2>{hero.title}</h2>
        <p>{order.status === 'cancelled' ? order.cancelReason : hero.text}</p>
        {order.status === 'picked_up' && <span className="tr-confetti" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ '--a': `${i * 30}deg` } as React.CSSProperties} />)}</span>}
      </div>

      {order.shopNote && order.status === 'awaiting_payment' && (
        <div className="tr-warning" role="alert"><AlertTriangle size={18} /><span>{order.shopNote}</span></div>
      )}

      {order.status === 'cancelled' && order.refund && (
        <div className={`tr-refund ${order.refund}`}>
          {order.refund === 'due' && <><Clock3 size={18} /><span>Your payment of {money(order.payNow)} will be refunded to the same UPI account within 5–7 working days.</span></>}
          {order.refund === 'check' && <><Clock3 size={18} /><span>If your payment of {money(order.payNow)} reached us, it will be refunded to the same UPI account within 5–7 working days. The shop is checking.</span></>}
          {order.refund === 'done' && <><CheckCircle2 size={18} /><span>Refund of {money(order.payNow)} has been sent to your UPI account.</span></>}
          {order.refund === 'kept' && <><AlertTriangle size={18} /><span>The order was not collected, so the advance was kept as per our <a href="/refund-policy/" target="_blank" rel="noopener noreferrer">refund policy</a>. Please call us if you think this is a mistake.</span></>}
        </div>
      )}

      {order.status === 'awaiting_payment' && (
        <section className="tr-pay">
          <div className="tr-amount">
            <span>Pay now</span>
            <strong>{money(order.payNow)}</strong>
            {order.payNow < order.total && <small>{money(order.total - order.payNow)} at the shop on pickup</small>}
          </div>
          <div className="tr-qr">
            {business.qrImage ? (
              <img src={business.qrImage} alt={`UPI QR code for ${business.payeeName || 'Mahima Sweets'}`} />
            ) : (
              <span className="qr-blank big"><QrCode size={46} /><small>Shop QR code<br />coming soon</small></span>
            )}
            <p>Scan with GPay, PhonePe, Paytm or any UPI app and pay <b>{money(order.payNow)}</b>.</p>
          </div>
          {upiLink && (
            <a className="button primary full glow tr-upi-btn" href={upiLink}>
              <Smartphone size={18} /> Pay {money(order.payNow)} with a UPI app
            </a>
          )}
          {business.upiId && (
            <button type="button" className="tr-copy" onClick={() => copy(business.upiId, 'upi')}>
              <span>UPI ID</span><b>{business.upiId}</b>{copied === 'upi' ? <Check size={16} /> : <Copy size={16} />}
            </button>
          )}
          <form className="tr-ref" onSubmit={e => { e.preventDefault(); act({ action: 'pay', ref }, 'pay'); }}>
            <label htmlFor="utr">After paying, enter the 12-digit UPI reference number</label>
            <div className="tr-ref-row">
              <input id="utr" inputMode="numeric" autoComplete="off" placeholder="e.g. 412345678901" value={ref} onChange={e => setRef(e.target.value.replace(/\D/g, '').slice(0, 12))} />
              <button className="button primary" disabled={ref.length !== 12 || busy === 'pay'}>{busy === 'pay' ? 'Sending…' : 'I have paid'}</button>
            </div>
            <small>Find it in your UPI app under this payment – it may be called “UPI Ref No.”, “UTR” or “Transaction ID”.</small>
          </form>
          <p className="co-hint center"><Clock3 size={13} /> Please pay within {mmss(payLeft)}, or the order is cancelled automatically.</p>
        </section>
      )}

      {actionError && <p className="co-error" role="alert">{actionError}</p>}

      <section className="tr-card tr-pickup">
        <div className="tr-row"><Clock3 size={18} /><div><span>Pickup</span><strong>{formatWhen(order.pickupAt, now)}</strong></div></div>
        <div className="tr-row"><MapPin size={18} /><div><span>Mahima Sweets</span><strong>Opposite Amar Hospitals, Gangavathi</strong><a href={shopDirectionsUrl} target="_blank" rel="noopener noreferrer">Get directions <ArrowUpRight size={13} /></a></div></div>
        {order.status !== 'cancelled' && (
          <div className="tr-row"><PackageCheck size={18} /><div><span>At the shop</span><strong>{order.total - paidAmount > 0 ? `Pay ${money(order.total - paidAmount)} when you pick up` : 'Fully paid – just collect'}</strong><small>Show order number {order.id}</small></div></div>
        )}
      </section>

      {order.status !== 'cancelled' && (
        <ol className="tr-timeline">
          {STEP_LIST.map((s, i) => {
            const at = lastAt(s.key);
            const state = i < currentIndex ? 'done' : i === currentIndex ? 'now' : '';
            return (
              <li key={s.key} className={state}>
                <span className="tr-dot">{state === 'done' ? <Check size={13} /> : null}</span>
                <span className="tr-step">{s.label}</span>
                {at && i <= currentIndex && <span className="tr-time">{formatTime(at)}</span>}
              </li>
            );
          })}
        </ol>
      )}

      <section className="tr-card">
        <h3>Your order</h3>
        <ul className="tr-lines">
          {order.lines.map(l => (
            <li key={`${l.id}-${l.grams}`}><span>{l.name} <small>{l.pack} × {l.qty}</small></span><b>{money(l.amount)}</b></li>
          ))}
        </ul>
        <div className="checkout-totals">
          <div className="total-row"><span>Total</span><strong>{money(order.total)}</strong></div>
          <div><span>Paid online</span><b>{money(paidAmount)}</b></div>
          {order.paymentRef && <div><span>UPI reference</span><b>{order.paymentRef}</b></div>}
        </div>
        {order.note && <p className="tr-note">Gift message: “{order.note}”</p>}
      </section>

      <div className="tr-actions">
        <a className="button whatsapp" href={whatsappLink(waText)} target="_blank" rel="noopener noreferrer"><Phone size={16} /> WhatsApp the shop</a>
        <a className="button secondary" href={`tel:${shop.telephone}`}><Phone size={16} /> Call {shop.phone}</a>
        <button type="button" className="button secondary" onClick={receipt}><Download size={16} /> Receipt</button>
        <button type="button" className="button secondary" onClick={() => copy(fullLink, 'link')}>{copied === 'link' ? <Check size={16} /> : <Copy size={16} />} {copied === 'link' ? 'Link copied' : 'Copy tracking link'}</button>
      </div>

      {order.canCancel && cancelLeft > 0 && (
        <div className="tr-cancel">
          <button type="button" className={`adm-danger ${confirmCancel ? 'confirm' : ''}`} disabled={busy === 'cancel'} onClick={() => { if (!confirmCancel) { setConfirmCancel(true); return; } setConfirmCancel(false); act({ action: 'cancel' }, 'cancel'); }}>
            <X size={16} /> {confirmCancel ? 'Tap again to cancel the order' : 'Cancel order'}
          </button>
          <small>You can cancel for {mmss(cancelLeft)} more.{paidAmount ? ' Your payment will be refunded.' : ''}</small>
        </div>
      )}

      <p className="co-hint center">This page updates by itself. Saved on this phone – find it again from the “Your order” button on the website.</p>
      {onClose && <button type="button" className="continue-shopping" onClick={onClose}>Back to the shop</button>}
    </div>
  );
}
