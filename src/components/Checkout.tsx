'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Clock3, Lock, Package, QrCode, Store, Truck } from 'lucide-react';
import { money, type Business, type CartItem } from '@/lib/products';
import { pickupDays, formatDay, formatTime } from '@/lib/pickup.mjs';
import { shop, whatsappLink } from '@/lib/shop';
import type { OrderView } from '@/lib/my-orders';

export function Steps({ step }: { step: 1 | 2 | 3 }) {
  const names = ['Your details', 'Pay', 'Track'];
  return (
    <ol className="steps" aria-label="Order steps">
      {names.map((n, i) => (
        <li key={n} className={i + 1 < step ? 'done' : i + 1 === step ? 'now' : ''} aria-current={i + 1 === step ? 'step' : undefined}>
          <span>{i + 1}</span>
          {n}
        </li>
      ))}
    </ol>
  );
}

export default function Checkout({ cart, subtotal, count, business, onBack, onPlaced }: {
  cart: CartItem[]; subtotal: number; count: number; business: Business;
  onBack: () => void; onPlaced: (order: OrderView, token: string) => void;
}) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => { const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 30000); return () => clearInterval(t); }, []);
  const days = useMemo(() => pickupDays(now, business.prepMinutes), [now, business.prepMinutes]);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [pay, setPay] = useState<'advance' | 'full'>('advance');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Keep the chosen slot valid as time passes.
  useEffect(() => {
    const d = days[Math.min(day, days.length - 1)];
    if (!d) return;
    if (day >= days.length) setDay(0);
    if (slot === null || !days.some(x => x.slots.includes(slot))) setSlot(d.slots[0]);
  }, [days, day, slot]);

  const advance = Math.min(subtotal, Math.ceil((subtotal * business.advancePercent) / 100));
  const payNow = pay === 'full' ? subtotal : advance;
  const paymentReady = !!(business.upiId || business.qrImage);
  const phoneOk = /^[6-9]\d{9}$/.test(phone);
  const ready = paymentReady && name.trim().length >= 2 && phoneOk && slot !== null && agree && !busy;
  const current = days[Math.min(day, days.length - 1)];

  async function place(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/order/', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', items: cart, name: name.trim(), phone, pickupAt: slot, pay, note: note.trim(), agree }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.order) throw new Error(data.error || 'Could not place the order. Please try again.');
      onPlaced(data.order, data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not place the order. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="checkout-form" onSubmit={place}>
      <Steps step={1} />

      <section className="co-block">
        <h3 className="co-title">How you’ll get it</h3>
        <div className="fulfilment-options">
          <button type="button" className="active" aria-pressed="true">
            <Store size={19} />
            <strong>Store pickup</strong>
            <span>Opposite Amar Hospitals</span>
          </button>
          <button type="button" className="soon" disabled aria-disabled="true">
            <Truck size={19} />
            <strong>Home delivery</strong>
            <span className="soon-badge">Coming soon</span>
          </button>
        </div>
      </section>

      <section className="co-block">
        <h3 className="co-title"><Clock3 size={16} /> Pickup time</h3>
        <div className="day-chips" role="group" aria-label="Pickup day">
          {days.map((d, i) => (
            <button type="button" key={d.day} className={i === day ? 'active' : ''} aria-pressed={i === day} onClick={() => { setDay(i); setSlot(d.slots[0]); }}>
              {formatDay(d.day + 12 * 3600, now)}
            </button>
          ))}
        </div>
        {current && (
          <div className="time-chips" role="group" aria-label="Pickup time">
            {current.slots.map(t => (
              <button type="button" key={t} className={t === slot ? 'active' : ''} aria-pressed={t === slot} onClick={() => setSlot(t)}>
                {formatTime(t)}
              </button>
            ))}
          </div>
        )}
        <p className="co-hint">We need about {business.prepMinutes >= 60 ? `${Math.round(business.prepMinutes / 6) / 10} hour${business.prepMinutes > 60 ? 's' : ''}` : `${business.prepMinutes} minutes`} to get your order ready. Shop open 8:00 AM – 9:30 PM.</p>
      </section>

      <section className="co-block">
        <h3 className="co-title">Your details</h3>
        <div className="form-grid">
          <label>Your name<input value={name} onChange={e => setName(e.target.value)} autoComplete="name" placeholder="Name for the order" required maxLength={60} /></label>
          <label>Mobile number
            <div className="phone-field"><span>+91</span><input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} type="tel" autoComplete="tel-national" inputMode="numeric" placeholder="10-digit mobile" required /></div>
          </label>
        </div>
        {phone.length === 10 && !phoneOk && <small className="co-error-text">Please check the mobile number.</small>}
        <label>
          Gift message <span>(optional)</span>
          <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={200} placeholder="A little sweetness, with lots of love." />
        </label>
      </section>

      <section className="co-block">
        <h3 className="co-title">Pay now</h3>
        <div className="pay-options" role="radiogroup" aria-label="How much to pay now">
          <button type="button" role="radio" aria-checked={pay === 'advance'} className={pay === 'advance' ? 'active' : ''} onClick={() => setPay('advance')}>
            <span className="pay-radio" />
            <span>
              <strong>{business.advancePercent}% advance · {money(advance)}</strong>
              <small>Pay {money(subtotal - advance)} at the shop when you pick up</small>
            </span>
          </button>
          <button type="button" role="radio" aria-checked={pay === 'full'} className={pay === 'full' ? 'active' : ''} onClick={() => setPay('full')}>
            <span className="pay-radio" />
            <span>
              <strong>Full amount · {money(subtotal)}</strong>
              <small>Nothing to pay at the shop</small>
            </span>
          </button>
        </div>
        <p className="co-hint"><Lock size={13} /> You pay by UPI to the shop’s own account (GPay, PhonePe, Paytm or any UPI app). We never ask for card or bank details.</p>
      </section>

      <div className="checkout-totals">
        <div><span>Items ({count})</span><b>{money(subtotal)}</b></div>
        <div><span>Store pickup</span><b>Free</b></div>
        <div className="total-row"><span>Total</span><strong>{money(subtotal)}</strong></div>
        <div className="pay-row"><span>Pay now</span><b>{money(payNow)}</b></div>
        {payNow < subtotal && <div><span>Pay at the shop</span><b>{money(subtotal - payNow)}</b></div>}
      </div>

      {!paymentReady && (
        <div className="co-closed">
          <span className="qr-blank" aria-hidden="true"><QrCode size={34} /></span>
          <div>
            <strong>Online payment is opening soon</strong>
            <p>Please call <a href={`tel:${shop.telephone}`}>{shop.phone}</a> or <a href={whatsappLink('Hi Mahima Sweets! I would like to place a pickup order.')} target="_blank" rel="noopener noreferrer">WhatsApp us</a> to order today.</p>
          </div>
        </div>
      )}

      <label className="consent">
        <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} required />
        <span>
          I agree to the <a href="/terms/" target="_blank" rel="noopener noreferrer">Terms</a>, <a href="/refund-policy/" target="_blank" rel="noopener noreferrer">Refund &amp; Cancellation Policy</a> and <a href="/privacy/" target="_blank" rel="noopener noreferrer">Privacy Policy</a>. Orders can be cancelled within 30 minutes.
        </span>
      </label>

      {error && <p className="co-error" role="alert">{error}</p>}
      <button className="button primary full glow" type="submit" disabled={!ready}>
        {busy ? 'Placing your order…' : <>Place order &amp; pay {money(payNow)} <ArrowRight size={17} /></>}
      </button>
      <button type="button" className="continue-shopping" onClick={onBack}><ArrowLeft size={15} /> Back to bag</button>
      <p className="co-hint center"><Package size={13} /> Your order is confirmed once the shop sees your payment.</p>
    </form>
  );
}
