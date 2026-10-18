'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BellRing, Check, CheckCircle2, Clock3, Copy, IndianRupee, MessageCircle, PackageCheck, Phone, RefreshCw, ShoppingBag, X } from 'lucide-react';
import { money } from '@/lib/products';
import { formatWhen, formatTime, istDayStart } from '@/lib/pickup.mjs';
import type { OrderView } from '@/lib/my-orders';

type AdminOrder = OrderView & { phone: string; paymentRef: string | null };
type Tab = 'action' | 'preparing' | 'done' | 'cancelled';

export const STATUS_LABEL: Record<OrderView['status'], string> = {
  awaiting_payment: 'Waiting for payment',
  payment_check: 'Check payment',
  confirmed: 'Preparing',
  ready: 'Ready at counter',
  picked_up: 'Picked up',
  cancelled: 'Cancelled',
};
const TAB_OF: Record<OrderView['status'], Tab> = { awaiting_payment: 'action', payment_check: 'action', confirmed: 'preparing', ready: 'preparing', picked_up: 'done', cancelled: 'cancelled' };
const REASONS = ['Item finished today', 'Cannot make it on time', 'Customer asked to cancel', 'Shop closed'];

function ago(t: number, now: number) {
  const m = Math.max(0, Math.round((now - t) / 60));
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
}
function until(t: number, now: number) {
  const m = Math.round((t - now) / 60);
  if (m < -5) return `${Math.round(-m / 60) || 1} h late`;
  if (m <= 5) return 'now';
  return m < 60 ? `in ${m} min` : m < 1440 ? `in ${Math.round(m / 60)} h` : '';
}

/* A short chime for new orders that need attention (only after the owner has tapped the page once – browser rule). */
function chime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = f; o.type = 'sine';
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.18 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.35);
      o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + i * 0.18); o.stop(ctx.currentTime + i * 0.18 + 0.4);
    });
    navigator.vibrate?.(200);
  } catch {}
}

export default function OrdersPanel({ flash, onCount, onSignedOut }: { flash: (t: string, bad?: boolean) => void; onCount: (n: number) => void; onSignedOut: () => void }) {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [tab, setTab] = useState<Tab>('action');
  const [busyId, setBusyId] = useState('');
  const [loading, setLoading] = useState(false);
  const seen = useRef<Set<string> | null>(null);

  const load = useCallback(async (quiet = true) => {
    if (!quiet) setLoading(true);
    try {
      const res = await fetch('/api/admin/orders/', { cache: 'no-store', credentials: 'same-origin' });
      if (res.status === 401) { onSignedOut(); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { if (!quiet) flash(data.error || 'Could not load orders.', true); return; }
      const list: AdminOrder[] = data.orders || [];
      // New orders needing attention → chime.
      const needing = list.filter(o => o.status === 'payment_check' || o.status === 'awaiting_payment').map(o => `${o.id}:${o.status}`);
      if (seen.current && needing.some(k => !seen.current!.has(k))) { chime(); flash('New order activity'); }
      seen.current = new Set(needing);
      setOrders(list);
      setNow(data.now || Math.floor(Date.now() / 1000));
    } catch {
      if (!quiet) flash('Could not reach the website.', true);
    } finally {
      setLoading(false);
    }
  }, [flash, onSignedOut]);

  useEffect(() => {
    load(false);
    const t = setInterval(() => load(), 20000);
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVisible); };
  }, [load]);
  useEffect(() => { const t = setInterval(() => setNow(n => n + 30), 30000); return () => clearInterval(t); }, []);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { action: 0, preparing: 0, done: 0, cancelled: 0 };
    for (const o of orders || []) c[TAB_OF[o.status]]++;
    return c;
  }, [orders]);
  const refundsDue = (orders || []).filter(o => o.refund === 'due').length;
  useEffect(() => onCount(counts.action + refundsDue), [counts.action, refundsDue, onCount]);

  async function update(body: object, done: string) {
    setBusyId((body as { id: string }).id);
    try {
      const res = await fetch('/api/admin/orders/', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.status === 401) { onSignedOut(); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { flash(data.error || 'Could not save.', true); load(); return; }
      setOrders(data.orders);
      seen.current = new Set((data.orders as AdminOrder[]).filter(o => o.status === 'payment_check' || o.status === 'awaiting_payment').map(o => `${o.id}:${o.status}`));
      flash(done);
    } catch {
      flash('Could not reach the website.', true);
    } finally {
      setBusyId('');
    }
  }

  const list = (orders || [])
    .filter(o => TAB_OF[o.status] === tab)
    .sort((a, b) => (tab === 'preparing' ? a.pickupAt - b.pickupAt : tab === 'action' ? (a.status === 'payment_check' ? -1 : 1) - (b.status === 'payment_check' ? -1 : 1) || b.createdAt - a.createdAt : b.createdAt - a.createdAt));
  const tabs: [Tab, string][] = [['action', 'Needs action'], ['preparing', 'Preparing'], ['done', 'Picked up'], ['cancelled', 'Cancelled']];

  return (
    <section className="adm-orders">
      <div className="adm-orders-head">
        <div>
          <h2>Orders</h2>
          <p className="adm-muted"><BellRing size={14} /> New orders appear here by themselves, with a chime.</p>
        </div>
        <button className="adm-link" onClick={() => load(false)} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh</button>
      </div>
      <div className="adm-tabs" role="tablist">
        {tabs.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>
            {label}
            {counts[k] > 0 && <b className={k === 'action' ? 'hot' : ''}>{counts[k]}</b>}
            {k === 'cancelled' && refundsDue > 0 && <b className="hot" title="Refunds to send">₹{refundsDue}</b>}
          </button>
        ))}
      </div>

      {orders === null ? (
        <div className="adm-empty"><span className="adm-spinner" /></div>
      ) : list.length === 0 ? (
        <div className="adm-empty">
          <ShoppingBag size={34} />
          <p>{tab === 'action' ? 'No orders waiting. New orders will pop up here.' : tab === 'preparing' ? 'Nothing to prepare right now.' : tab === 'done' ? 'No picked-up orders in the last 30 days.' : 'No cancelled orders.'}</p>
        </div>
      ) : (
        <div className="adm-order-list">
          {list.map((o, i) => <OrderCard key={o.id} o={o} now={now} index={i} busy={busyId === o.id} update={update} />)}
        </div>
      )}
    </section>
  );
}

function OrderCard({ o, now, index, busy, update }: { o: AdminOrder; now: number; index: number; busy: boolean; update: (body: object, done: string) => void }) {
  const [cancelling, setCancelling] = useState<'' | 'cancel' | 'not_collected'>('');
  const [reason, setReason] = useState('');
  const [copied, setCopied] = useState(false);
  const paid = ['payment_check', 'confirmed', 'ready', 'picked_up'].includes(o.status) || (o.status === 'cancelled' && !!o.refund && o.refund !== null);
  const collect = o.total - (['confirmed', 'ready', 'picked_up'].includes(o.status) ? o.payNow : 0);
  const today = istDayStart(o.pickupAt) === istDayStart(now);
  const waMsg = (text: string) => `https://wa.me/91${o.phone}?text=${encodeURIComponent(text)}`;
  const readyMsg = `Hi ${o.name}, your Mahima Sweets order ${o.id} is ready for pickup! Please collect it at the shop, opposite Amar Hospitals.${collect > 0 ? ` Balance to pay: ${money(collect)}.` : ''}`;

  return (
    <article className={`adm-order st-${o.status}`} style={{ '--i': index } as React.CSSProperties}>
      <header className="adm-order-top">
        <div>
          <strong className="adm-order-id">{o.id}</strong>
          <span className={`adm-status st-${o.status}`}>{STATUS_LABEL[o.status]}</span>
          {o.refund === 'due' && <span className="adm-status refund">Refund {money(o.payNow)} due</span>}
          {o.refund === 'done' && <span className="adm-status done">Refunded</span>}
          {o.refund === 'kept' && <span className="adm-status off">Advance kept</span>}
        </div>
        <small className="adm-muted">{ago(o.createdAt, now)}</small>
      </header>

      <div className="adm-order-grid">
        <div className="adm-order-who">
          <b>{o.name}</b>
          <div className="adm-order-contact">
            <a href={`tel:+91${o.phone}`}><Phone size={14} /> {o.phone}</a>
            <a href={waMsg(`Hi ${o.name}, this is Mahima Sweets about your order ${o.id}.`)} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} /> WhatsApp</a>
          </div>
        </div>
        <div className={`adm-order-when ${today ? 'today' : ''}`}>
          <Clock3 size={15} />
          <div><b>{formatWhen(o.pickupAt, now)}</b>{!['picked_up', 'cancelled'].includes(o.status) && until(o.pickupAt, now) && <small>{until(o.pickupAt, now)}</small>}</div>
        </div>
      </div>

      <ul className="adm-order-lines">
        {o.lines.map(l => <li key={`${l.id}-${l.grams}`}><span><b>{l.qty} ×</b> {l.name} <small>{l.pack}</small></span><span>{money(l.amount)}</span></li>)}
      </ul>
      {o.note && <p className="adm-order-note">Gift message: “{o.note}”</p>}

      <div className="adm-order-money">
        <div><span>Total</span><b>{money(o.total)}</b></div>
        <div><span>{o.payType === 'full' ? 'Full payment' : 'Advance'} by UPI</span><b className={paid ? 'ok' : ''}>{money(o.payNow)}{paid ? '' : ' (not yet)'}</b></div>
        {o.status !== 'cancelled' && <div className="collect"><span>Collect at counter</span><b>{money(Math.max(0, collect))}</b></div>}
      </div>

      {o.paymentRef && (
        <button type="button" className="adm-utr" onClick={() => { navigator.clipboard?.writeText(o.paymentRef!).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {}); }}>
          <IndianRupee size={16} />
          <span>UPI ref <b>{o.paymentRef}</b></span>
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      )}
      {o.status === 'payment_check' && <p className="adm-hint">Open your bank or UPI business app and look for {money(o.payNow)} with this reference number.</p>}
      {o.status === 'cancelled' && o.cancelReason && <p className="adm-hint">Reason: {o.cancelReason}{o.cancelledBy === 'customer' ? ' (by customer)' : o.cancelledBy === 'system' ? ' (automatic)' : ''}</p>}

      {cancelling ? (
        <div className="adm-cancel-box">
          <p><b>{cancelling === 'cancel' ? 'Cancel this order?' : 'Mark as not collected?'}</b> {cancelling === 'cancel' ? (paid ? `The customer will see a refund of ${money(o.payNow)} is due.` : 'Nothing was paid.') : 'The advance is kept as per the refund policy.'}</p>
          {cancelling === 'cancel' && (
            <div className="adm-chips">
              {REASONS.map(r => <button key={r} type="button" className={reason === r ? 'active' : ''} onClick={() => setReason(r)}>{r}</button>)}
            </div>
          )}
          <input className="adm-input" placeholder="Reason the customer will see (optional)" value={reason} maxLength={160} onChange={e => setReason(e.target.value)} />
          <div className="adm-order-actions">
            <button type="button" className="button secondary" onClick={() => { setCancelling(''); setReason(''); }}>Keep order</button>
            <button type="button" className="adm-danger confirm" disabled={busy} onClick={() => update({ action: 'update', id: o.id, to: cancelling, reason }, cancelling === 'cancel' ? `${o.id} cancelled` : `${o.id} marked not collected`)}>
              <X size={16} /> {cancelling === 'cancel' ? 'Cancel order' : 'Not collected'}
            </button>
          </div>
        </div>
      ) : (
        <div className="adm-order-actions">
          {o.status === 'payment_check' && <>
            <button className="button primary glow" disabled={busy} onClick={() => update({ action: 'update', id: o.id, to: 'confirm' }, `${o.id} confirmed – start preparing`)}><CheckCircle2 size={17} /> Payment found</button>
            <button className="button secondary" disabled={busy} onClick={() => update({ action: 'update', id: o.id, to: 'payment_issue' }, `Asked ${o.name} to check the payment`)}>Not found</button>
          </>}
          {o.status === 'awaiting_payment' && (
            <button className="button secondary" disabled={busy} onClick={() => update({ action: 'update', id: o.id, to: 'confirm' }, `${o.id} confirmed`)}><CheckCircle2 size={17} /> Payment received</button>
          )}
          {o.status === 'confirmed' && <>
            <button className="button primary glow" disabled={busy} onClick={() => update({ action: 'update', id: o.id, to: 'ready' }, `${o.id} is ready – customer can see it`)}><PackageCheck size={17} /> Mark ready</button>
            <button className="button secondary" disabled={busy} onClick={() => update({ action: 'update', id: o.id, to: 'picked_up' }, `${o.id} picked up`)}>Picked up</button>
          </>}
          {o.status === 'ready' && <>
            <button className="button primary glow" disabled={busy} onClick={() => update({ action: 'update', id: o.id, to: 'picked_up' }, `${o.id} picked up`)}><Check size={17} /> Picked up{collect > 0 ? ` · got ${money(collect)}` : ''}</button>
            <a className="button whatsapp" href={waMsg(readyMsg)} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> Tell customer</a>
          </>}
          {o.refund === 'due' && (
            <button className="button primary" disabled={busy} onClick={() => update({ action: 'refunded', id: o.id }, `Refund for ${o.id} marked as sent`)}><IndianRupee size={16} /> Mark refund sent</button>
          )}
          {o.canCancel && <button type="button" className="adm-danger" onClick={() => setCancelling('cancel')}><X size={15} /> Cancel</button>}
          {['confirmed', 'ready'].includes(o.status) && <button type="button" className="adm-danger soft" onClick={() => setCancelling('not_collected')}>Not collected</button>}
        </div>
      )}
      {o.status === 'confirmed' && <p className="adm-hint">Placed {formatTime(o.createdAt)}. When packed, tap “Mark ready” – the customer’s order page updates.</p>}
    </article>
  );
}
