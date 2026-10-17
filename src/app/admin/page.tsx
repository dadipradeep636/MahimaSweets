'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Check, Eye, EyeOff, LogOut, Lock, Megaphone, RotateCcw, Search, Sparkles, X } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { products, namkeens, hotItems, badam, gift, money, defaultPack, defaultPriceScale, packLabel, type Product } from '@/lib/products';
import './admin.css';

type Item = { soldOut: boolean; price: number | null };
type State = { admin: boolean; items?: Record<string, Item>; notice?: { text: string; active: boolean }; error?: string };

const groups: [string, Product[]][] = [
  ['Sweets', products],
  ['Namkeens', namkeens],
  ['Hot & Crispy', hotItems],
  ['Drink & gift box', [badam, gift]],
];
const NOTICE_MAX = 160;

async function call(body?: object): Promise<{ ok: boolean; status: number; data: State }> {
  const res = await fetch('/api/admin/', body
    ? { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : { cache: 'no-store', credentials: 'same-origin' });
  let data: State = { admin: false };
  try { data = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, data };
}

export default function AdminPage() {
  const [state, setState] = useState<State | null>(null);
  const [setupError, setSetupError] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [toast, setToast] = useState<{ text: string; bad?: boolean } | null>(null);
  const [query, setQuery] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    call().then(({ ok, data }) => {
      if (!ok && data.error) setSetupError(data.error);
      setState(data);
    }).catch(() => setSetupError('Could not reach the website. Check your internet and refresh.'));
  }, []);

  function flash(text: string, bad = false) {
    setToast({ text, bad });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  /* Every change goes to the server; the page then shows exactly what the server saved. */
  async function change(body: object, done: string) {
    const { ok, status, data } = await call(body);
    if (status === 401) { setState({ admin: false }); setLoginError('You were signed out. Please sign in again.'); return false; }
    if (!ok) { flash(data.error || 'Could not save. Please try again.', true); return false; }
    setState(data);
    flash(done);
    return true;
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setLoginError('');
    const { ok, data } = await call({ action: 'login', password }).catch(() => ({ ok: false, status: 0, data: { admin: false, error: 'Could not reach the website.' } as State }));
    setBusy(false);
    if (!ok) { setLoginError(data.error || 'Could not sign in.'); return; }
    setPassword('');
    setState(data);
  }

  async function logout() {
    await call({ action: 'logout' }).catch(() => {});
    setState({ admin: false });
  }

  if (!state && !setupError) return <div className="adm-loading"><span className="adm-spinner" /></div>;

  return (
    <div className="adm">
      <header className="adm-header">
        <a className="brand" href="/" aria-label="Mahima Sweets website">
          <span className="brand-mark">M<span>✦</span></span>
          <span className="brand-text">
            <span className="brand-name">Mahima</span>
            <span className="brand-sub">Shop controls</span>
          </span>
        </a>
        <div className="adm-header-actions">
          <ThemeToggle />
          <a className="adm-link" href="/" target="_blank" rel="noopener noreferrer">
            View website <ArrowUpRight size={15} />
          </a>
          {state?.admin && (
            <button className="adm-link" onClick={logout}>
              <LogOut size={15} /> Sign out
            </button>
          )}
        </div>
      </header>

      {setupError ? (
        <main className="adm-center">
          <div className="adm-card adm-login">
            <span className="adm-emblem"><Lock size={26} /></span>
            <h1>Shop controls</h1>
            <p className="adm-muted">{setupError}</p>
          </div>
        </main>
      ) : !state?.admin ? (
        <main className="adm-center">
          <form className="adm-card adm-login" onSubmit={login}>
            <span className="adm-emblem"><Lock size={26} /></span>
            <h1>Shop owner sign in</h1>
            <p className="adm-muted">Mark sweets sold out, change prices and show a notice on the website.</p>
            <label className="adm-label" htmlFor="adm-pw">Owner password</label>
            <div className="adm-pw">
              <input id="adm-pw" type={showPw ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required maxLength={200} autoFocus />
              <button type="button" aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {loginError && <p className="adm-error" role="alert">{loginError}</p>}
            <button className="button primary full glow" disabled={busy || !password}>
              {busy ? 'Checking…' : 'Open shop controls'}
            </button>
          </form>
        </main>
      ) : (
        <Controls state={state} change={change} query={query} setQuery={setQuery} />
      )}

      {toast && (
        <div className={`adm-toast ${toast.bad ? 'bad' : ''}`} role="status">
          {toast.bad ? <X size={18} /> : <Check size={18} />} {toast.text}
        </div>
      )}
    </div>
  );
}

function Controls({ state, change, query, setQuery }: { state: State; change: (body: object, done: string) => Promise<boolean>; query: string; setQuery: (q: string) => void }) {
  const items = state.items || {};
  const all = groups.flatMap(([, list]) => list);
  const soldOutCount = all.filter(p => items[p.id]?.soldOut).length;
  const [confirmReset, setConfirmReset] = useState(false);
  useEffect(() => {
    if (!confirmReset) return;
    const t = setTimeout(() => setConfirmReset(false), 4000);
    return () => clearTimeout(t);
  }, [confirmReset]);
  const q = query.trim().toLowerCase();

  return (
    <main className="adm-main">
      <section className="adm-summary">
        <div>
          <h1>Good to see you.</h1>
          <p className="adm-muted">
            {all.length} items on the website ·{' '}
            {soldOutCount ? <b className="adm-red">{soldOutCount} sold out</b> : <b className="adm-green">everything available</b>}
          </p>
        </div>
        <button
          className={`adm-reset ${confirmReset ? 'confirm' : ''}`}
          disabled={!soldOutCount}
          onClick={async () => {
            if (!confirmReset) { setConfirmReset(true); return; }
            setConfirmReset(false);
            await change({ action: 'allAvailable' }, 'Everything is available again');
          }}
        >
          <Sparkles size={17} /> {confirmReset ? 'Tap again to confirm' : 'Mark everything available'}
        </button>
      </section>

      <NoticeEditor notice={state.notice || { text: '', active: false }} change={change} />

      <div className="adm-search">
        <Search size={18} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find an item, e.g. ladoo" aria-label="Find an item" />
        {query && <button aria-label="Clear" onClick={() => setQuery('')}><X size={16} /></button>}
      </div>

      {groups.map(([title, list]) => {
        const shown = list.filter(p => !q || p.name.toLowerCase().includes(q));
        if (!shown.length) return null;
        return (
          <section key={title} className="adm-group">
            <h2>{title}</h2>
            <div className="adm-list">
              {shown.map((p, i) => <ItemRow key={p.id} product={p} item={items[p.id]} change={change} index={i} />)}
            </div>
          </section>
        );
      })}
      <p className="adm-foot adm-muted">Changes show on the website within a minute. Sweet rates are shown per 1 kg; 500 g is half that rate. Items sold by piece keep their piece prices.</p>
    </main>
  );
}

function ItemRow({ product: p, item, change, index }: { product: Product; item?: Item; change: (body: object, done: string) => Promise<boolean>; index: number }) {
  const soldOut = !!item?.soldOut;
  const originalPrice = p.price * defaultPriceScale(p);
  const livePrice = (item?.price ?? p.price) * defaultPriceScale(p);
  const [draft, setDraft] = useState(String(livePrice));
  const [saving, setSaving] = useState<'' | 'stock' | 'price'>('');
  useEffect(() => setDraft(String(livePrice)), [livePrice]);
  const value = Number(draft);
  const valid = /^\d{1,6}$/.test(draft) && value >= 1 && value <= 100000;
  const dirty = draft !== String(livePrice);
  const changed = item?.price != null && item.price !== p.price;

  async function savePrice(price: number | null) {
    setSaving('price');
    await change({ action: 'setItem', id: p.id, price, priceBasis: 'defaultPack' }, price === null ? `${p.name} back to ${money(originalPrice)}` : `${p.name} price saved: ${money(price)}`);
    setSaving('');
  }

  return (
    <article className={`adm-item ${soldOut ? 'is-out' : ''}`} style={{ '--i': index } as React.CSSProperties}>
      <img src={p.image} alt="" />
      <div className="adm-item-info">
        <h3>{p.name}</h3>
        <form
          className="adm-price"
          onSubmit={e => { e.preventDefault(); if (valid && dirty) savePrice(value); }}
        >
          <span className="adm-rupee">₹</span>
          <input
            inputMode="numeric"
            aria-label={`Price of ${p.name} for ${packLabel(p, defaultPack(p))}`}
            value={draft}
            onChange={e => setDraft(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className={!valid ? 'bad' : ''}
          />
          <span className="adm-per">for {packLabel(p, defaultPack(p))}</span>
          {dirty && valid && (
            <button className="adm-save" disabled={saving === 'price'}>{saving === 'price' ? '…' : 'Save'}</button>
          )}
          {dirty && (
            <button type="button" className="adm-undo" onClick={() => setDraft(String(livePrice))} aria-label="Undo price edit"><X size={15} /></button>
          )}
          {!dirty && changed && (
            <button type="button" className="adm-orig" onClick={() => savePrice(null)} title="Go back to the original price">
              <RotateCcw size={13} /> Original {money(originalPrice)}
            </button>
          )}
        </form>
      </div>
      <button
        className={`adm-switch ${soldOut ? 'out' : 'in'}`}
        role="switch"
        aria-checked={!soldOut}
        aria-label={`${p.name}: ${soldOut ? 'sold out' : 'available'}`}
        disabled={saving === 'stock'}
        onClick={async () => {
          setSaving('stock');
          await change({ action: 'setItem', id: p.id, soldOut: !soldOut }, soldOut ? `${p.name} is available again` : `${p.name} marked sold out`);
          setSaving('');
        }}
      >
        <span className="adm-switch-knob" />
        <span className="adm-switch-text">{soldOut ? 'Sold out' : 'Available'}</span>
      </button>
    </article>
  );
}

function NoticeEditor({ notice, change }: { notice: { text: string; active: boolean }; change: (body: object, done: string) => Promise<boolean> }) {
  const [text, setText] = useState(notice.text);
  const [active, setActive] = useState(notice.active);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setText(notice.text); setActive(notice.active); }, [notice.text, notice.active]);
  const clean = text.replace(/\s+/g, ' ').trim();
  const dirty = clean !== notice.text || (active && !!clean) !== notice.active;
  const ideas = useMemo(() => ['Closed tomorrow for Diwali', 'Fresh hot samosas from 4 PM', 'Diwali gift box orders open – call us'], []);

  return (
    <section className="adm-card adm-notice">
      <div className="adm-notice-head">
        <span className="adm-notice-icon"><Megaphone size={18} /></span>
        <div>
          <h2>Notice on the website</h2>
          <p className="adm-muted">A short message shown at the very top of the website.</p>
        </div>
      </div>
      <textarea value={text} maxLength={NOTICE_MAX} onChange={e => setText(e.target.value)} placeholder="For example: Closed tomorrow for Diwali" rows={2} aria-label="Notice text" />
      <div className="adm-notice-meta">
        <div className="adm-ideas">
          {ideas.map(t => <button key={t} type="button" onClick={() => setText(t)}>{t}</button>)}
        </div>
        <span className="adm-muted">{text.length}/{NOTICE_MAX}</span>
      </div>
      {clean && (
        <div className="adm-preview">
          <span className="adm-muted">Preview</span>
          <div className="notice-bar"><span className="notice-icon"><Megaphone size={16} /></span><span>{clean}</span></div>
        </div>
      )}
      <div className="adm-notice-actions">
        <button type="button" role="switch" aria-checked={active} className={`adm-mini-switch ${active ? 'on' : ''}`} onClick={() => setActive(v => !v)} disabled={!clean}>
          <span /> {active && clean ? 'Showing on website' : 'Hidden'}
        </button>
        <button
          className="button primary"
          disabled={!dirty || saving}
          onClick={async () => {
            setSaving(true);
            await change({ action: 'setNotice', text: clean, active: active && !!clean }, active && clean ? 'Notice is now on the website' : 'Notice saved and hidden');
            setSaving(false);
          }}
        >
          {saving ? 'Saving…' : 'Save notice'}
        </button>
      </div>
    </section>
  );
}
