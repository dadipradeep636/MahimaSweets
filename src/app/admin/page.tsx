'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Camera, Check, ChevronDown, ClipboardList, Store, UtensilsCrossed, Eye, EyeOff, ImagePlus, LogOut, Lock, Megaphone, Pencil, Plus, RotateCcw, Search, Sparkles, Star, Trash2, X } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { ProductCard } from '@/components/ProductCard';
import {
  catalog as builtinCatalog, money, defaultPack, defaultPriceScale, packLabel, buildCatalog, pickFavourites, sectionOf, sectionNames,
  sweetCategories, sellDefault, defaultFavourites, type Product, type ProductData, type ProductRecord, type Sell, type ShopState,
} from '@/lib/products';
import { preparePhoto } from '@/lib/photo';
import OrdersPanel from './OrdersPanel';
import ShopDetails from './ShopDetails';
import './admin.css';

type State = ShopState & { admin: boolean; notice?: { text: string; active: boolean } | null; error?: string; savedId?: string };
type Change = (body: object, done: string) => Promise<State | null>;

const NOTICE_MAX = 160;
const builtinById = new Map(builtinCatalog.map(p => [p.id, p]));
/* Scale from a product's stored price to the price shown here (Codex: sweets are shown per 1 kg). */
const scaleOf = (p: Product) => (p.custom ? 1 : defaultPriceScale(builtinById.get(p.id) || p));

async function call(body?: object): Promise<{ ok: boolean; status: number; data: State }> {
  const res = await fetch('/api/admin/', body
    ? { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : { cache: 'no-store', credentials: 'same-origin' });
  let data: State = { admin: false, items: {}, notice: null };
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
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }

  /* Every change goes to the server; the page then shows exactly what the server saved. */
  const change: Change = async (body, done) => {
    const { ok, status, data } = await call(body).catch(() => ({ ok: false, status: 0, data: { admin: true, items: {}, notice: null, error: 'Could not reach the website. Check your internet.' } as State }));
    if (status === 401) { setState({ admin: false, items: {}, notice: null }); setLoginError('You were signed out. Please sign in again.'); return null; }
    if (!ok) { flash(data.error || 'Could not save. Please try again.', true); return null; }
    setState(data);
    flash(done);
    return data;
  };

  async function login(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setLoginError('');
    const { ok, data } = await call({ action: 'login', password }).catch(() => ({ ok: false, status: 0, data: { admin: false, items: {}, notice: null, error: 'Could not reach the website.' } as State }));
    setBusy(false);
    if (!ok) { setLoginError(data.error || 'Could not sign in.'); return; }
    setPassword('');
    setState(data);
  }

  async function logout() {
    await call({ action: 'logout' }).catch(() => {});
    setState({ admin: false, items: {}, notice: null });
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
            <p className="adm-muted">Add and edit items, mark them sold out, change prices and show a notice on the website.</p>
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
        <Dashboard state={state} change={change} flash={flash} onSignedOut={() => { setState({ admin: false, items: {}, notice: null }); setLoginError('You were signed out. Please sign in again.'); }} />
      )}

      {toast && (
        <div className={`adm-toast ${toast.bad ? 'bad' : ''}`} role="status">
          {toast.bad ? <X size={18} /> : <Check size={18} />} {toast.text}
        </div>
      )}
    </div>
  );
}

type View = 'orders' | 'menu' | 'shop';

function Dashboard({ state, change, flash, onSignedOut }: { state: State; change: Change; flash: (t: string, bad?: boolean) => void; onSignedOut: () => void }) {
  const [view, setView] = useState<View>(() => {
    try { const v = sessionStorage.getItem('mahima-admin-view'); if (v === 'menu' || v === 'shop' || v === 'orders') return v; } catch {}
    return 'orders';
  });
  const [pending, setPending] = useState(0);
  const go = (v: View) => { setView(v); try { sessionStorage.setItem('mahima-admin-view', v); } catch {} window.scrollTo({ top: 0, behavior: 'smooth' }); };
  useEffect(() => { document.title = pending ? `(${pending}) Shop controls | Mahima Sweets` : 'Shop controls | Mahima Sweets'; }, [pending]);
  const paymentReady = !!(state.business?.upiId || state.business?.qrImageId);
  const views: [View, string, typeof ClipboardList][] = [['orders', 'Orders', ClipboardList], ['menu', 'Menu', UtensilsCrossed], ['shop', 'Shop details', Store]];
  return (
    <>
      <nav className="adm-views" aria-label="Sections">
        {views.map(([k, label, Icon]) => (
          <button key={k} className={view === k ? 'active' : ''} aria-current={view === k ? 'page' : undefined} onClick={() => go(k)}>
            <Icon size={18} /> {label}
            {k === 'orders' && pending > 0 && <b>{pending}</b>}
            {k === 'shop' && !paymentReady && <b className="warn">!</b>}
          </button>
        ))}
      </nav>
      <div className={view === 'orders' ? 'adm-main' : 'adm-hidden'}>
        <OrdersPanel flash={flash} onCount={setPending} onSignedOut={onSignedOut} />
      </div>
      {view === 'menu' && <Controls state={state} change={change} flash={flash} />}
      {view === 'shop' && <main className="adm-main"><ShopDetails business={state.business} hero={state.hero} change={change} flash={flash} /></main>}
    </>
  );
}

type Editing = { mode: 'new' } | { mode: 'edit'; id: string } | null;

function Controls({ state, change, flash }: { state: State; change: Change; flash: (t: string, bad?: boolean) => void }) {
  const items = state.items || {};
  const all = useMemo(() => buildCatalog(state), [state]);
  const records = useMemo(() => new Map((state.products || []).map(r => [r.id, r])), [state.products]);
  const shown = all.filter(p => !p.hidden);
  const soldOutCount = shown.filter(p => items[p.id]?.soldOut).length;
  const hiddenCount = all.length - shown.length;
  const [confirmReset, setConfirmReset] = useState(false);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Editing>(null);
  useEffect(() => {
    if (!confirmReset) return;
    const t = setTimeout(() => setConfirmReset(false), 4000);
    return () => clearTimeout(t);
  }, [confirmReset]);
  const q = query.trim().toLowerCase();
  const groups: [string, Product[]][] = [
    ['Sweets', all.filter(p => sectionOf(p) === 'sweets')],
    ['Namkeens', all.filter(p => sectionOf(p) === 'namkeens')],
    ['Hot & Crispy', all.filter(p => sectionOf(p) === 'hot')],
    ['Drink & gift box', all.filter(p => ['drink', 'gift'].includes(sectionOf(p)))],
  ];

  return (
    <main className="adm-main">
      <section className="adm-summary">
        <div>
          <h1>Good to see you.</h1>
          <p className="adm-muted">
            {shown.length} items on the website ·{' '}
            {soldOutCount ? <b className="adm-red">{soldOutCount} sold out</b> : <b className="adm-green">everything available</b>}
            {hiddenCount > 0 && <> · {hiddenCount} hidden</>}
          </p>
        </div>
        <div className="adm-summary-actions">
          <button className="button primary glow adm-add" onClick={() => setEditing({ mode: 'new' })}>
            <Plus size={19} /> Add new item
          </button>
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
        </div>
      </section>

      <NoticeEditor notice={(state.notice as { text: string; active: boolean }) || { text: '', active: false }} change={change} />

      <FavouritesEditor all={all} state={state} change={change} />

      <div className="adm-search">
        <Search size={18} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find an item, e.g. ladoo" aria-label="Find an item" />
        {query && <button aria-label="Clear" onClick={() => setQuery('')}><X size={16} /></button>}
      </div>

      {groups.map(([title, list]) => {
        const visibleList = list.filter(p => !q || p.name.toLowerCase().includes(q));
        if (!visibleList.length) return null;
        return (
          <section key={title} className="adm-group">
            <h2>{title}</h2>
            <div className="adm-list">
              {visibleList.map((p, i) => <ItemRow key={p.id} product={p} record={records.get(p.id)} soldOut={!!items[p.id]?.soldOut} priceChanged={items[p.id]?.price != null} change={change} index={i} onEdit={() => setEditing({ mode: 'edit', id: p.id })} />)}
            </div>
          </section>
        );
      })}
      <p className="adm-foot adm-muted">Changes show on the website within a minute. Sweet rates are shown per 1 kg; 500 g is half that rate. Items sold by piece keep their piece prices.</p>

      {editing && (
        <ItemEditor
          key={editing.mode === 'edit' ? editing.id : 'new'}
          product={editing.mode === 'edit' ? all.find(p => p.id === editing.id) : undefined}
          record={editing.mode === 'edit' ? records.get(editing.id) : undefined}
          change={change}
          flash={flash}
          onClose={() => setEditing(null)}
        />
      )}
    </main>
  );
}

function ItemRow({ product: p, record, soldOut, priceChanged, change, index, onEdit }: { product: Product; record?: ProductRecord; soldOut: boolean; priceChanged: boolean; change: Change; index: number; onEdit: () => void }) {
  const scale = scaleOf(p);
  const base = builtinById.get(p.id);
  const originalPrice = Math.round(p.custom ? record?.data.price || p.price : (base?.price || p.price) * scale);
  const livePrice = Math.round(p.price * scale);
  const [draft, setDraft] = useState(String(livePrice));
  const [saving, setSaving] = useState<'' | 'stock' | 'price' | 'hide'>('');
  useEffect(() => setDraft(String(livePrice)), [livePrice]);
  const value = Number(draft);
  const valid = /^\d{1,6}$/.test(draft) && value >= 1 && value <= 100000;
  const dirty = draft !== String(livePrice);
  const edited = !p.custom && !!record && !record.hidden && Object.keys(record.data).length > 0;

  async function savePrice(price: number | null) {
    setSaving('price');
    await change({ action: 'setItem', id: p.id, price, priceBasis: 'defaultPack' }, price === null ? `${p.name} back to ${money(originalPrice)}` : `${p.name} price saved: ${money(price)}`);
    setSaving('');
  }

  return (
    <article className={`adm-item ${soldOut ? 'is-out' : ''} ${p.hidden ? 'is-hidden' : ''}`} style={{ '--i': index } as React.CSSProperties}>
      <button className="adm-thumb" onClick={onEdit} aria-label={`Edit ${p.name}`}>
        <img src={p.image} alt="" />
        <span><Pencil size={13} /></span>
      </button>
      <div className="adm-item-info">
        <button className="adm-name" onClick={onEdit}>
          <h3>{p.name}</h3>
          {p.custom && <span className="adm-chip new">Added</span>}
          {edited && <span className="adm-chip">Edited</span>}
          {p.hidden && <span className="adm-chip off">Hidden</span>}
        </button>
        <form className="adm-price" onSubmit={e => { e.preventDefault(); if (valid && dirty) savePrice(value); }}>
          <span className="adm-rupee">₹</span>
          <input
            inputMode="numeric"
            aria-label={`Price of ${p.name} for ${packLabel(p, defaultPack(p))}`}
            value={draft}
            onChange={e => setDraft(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className={!valid ? 'bad' : ''}
          />
          <span className="adm-per">for {packLabel(p, defaultPack(p))}</span>
          {dirty && valid && <button className="adm-save" disabled={saving === 'price'}>{saving === 'price' ? '…' : 'Save'}</button>}
          {dirty && <button type="button" className="adm-undo" onClick={() => setDraft(String(livePrice))} aria-label="Undo price edit"><X size={15} /></button>}
          {!dirty && priceChanged && (
            <button type="button" className="adm-orig" onClick={() => savePrice(null)} title="Go back to the original price">
              <RotateCcw size={13} /> Original {money(originalPrice)}
            </button>
          )}
        </form>
      </div>
      {p.hidden ? (
        <button
          className="adm-switch adm-unhide"
          disabled={saving === 'hide'}
          onClick={async () => { setSaving('hide'); await change({ action: 'setHidden', id: p.id, hidden: false }, `${p.name} is back on the website`); setSaving(''); }}
        >
          <Eye size={17} /> Show on website
        </button>
      ) : (
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
      )}
    </article>
  );
}

type Form = {
  name: string; subtitle: string; description: string; tag: string; special: boolean; allergens: string; storage: string;
  section: 'sweets' | 'namkeens' | 'hot'; category: string; sell: Sell; price: string; hidden: boolean;
  imageId?: string | null; imageUrl: string;
};

function ItemEditor({ product, record, change, flash, onClose }: { product?: Product; record?: ProductRecord; change: Change; flash: (t: string, bad?: boolean) => void; onClose: () => void }) {
  const isNew = !product;
  const isBuiltin = !!product && !product.custom;
  const base = product ? builtinById.get(product.id) : undefined;
  const section = product ? sectionOf(product) : 'sweets';
  const editableSection = section === 'drink' || section === 'gift' ? null : section;
  const [f, setF] = useState<Form>(() => {
    const d = record?.data || {};
    return {
      name: product?.name || '',
      subtitle: product?.subtitle === 'Fresh from Mahima Sweets.' && product.custom && !d.subtitle ? '' : product?.subtitle || '',
      description: product && (d.description || isBuiltin) ? product.description : '',
      tag: product ? (isBuiltin ? product.special || product.tag : d.tag || '') : '',
      special: !!product?.special,
      allergens: product && (d.allergens || isBuiltin) ? product.allergens : '',
      storage: product && (d.storage || isBuiltin) ? product.storage : '',
      section: (editableSection || 'sweets') as Form['section'],
      category: product && sectionOf(product) === 'sweets' ? product.category : 'Traditional',
      sell: (product?.custom ? d.sell : undefined) || sellDefault((editableSection || 'sweets') as Form['section']),
      price: product ? String(Math.round(product.price * scaleOf(product))) : '',
      hidden: !!product?.hidden,
      imageId: undefined,
      imageUrl: product?.image || '',
    };
  });
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF(x => ({ ...x, [k]: v }));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [more, setMore] = useState(!isNew && isBuiltin);
  const [confirm, setConfirm] = useState<'' | 'delete' | 'reset'>('');
  const fileRef = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    d?.showModal();
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = before; d?.close(); };
  }, []);
  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(''), 4000);
    return () => clearTimeout(t);
  }, [confirm]);

  async function choosePhoto(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const blob = await preparePhoto(file);
      const res = await fetch('/api/admin/image/', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': blob.type }, body: blob });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save the photo.');
      setF(x => ({ ...x, imageId: data.id, imageUrl: data.url }));
    } catch (e) {
      flash(e instanceof Error && e.message !== 'photo' ? e.message : 'Could not read that photo. Please try another one.', true);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  // Price label follows how the item is sold.
  const previewSell = isBuiltin || section === 'drink' || section === 'gift' ? null : f.sell;
  const data: ProductData = {
    name: f.name.trim(), subtitle: f.subtitle.trim(), description: f.description.trim(), tag: f.tag.trim(), special: f.special,
    allergens: f.allergens.trim(), storage: f.storage.trim(), category: f.section === 'sweets' || section === 'sweets' ? f.category : undefined,
    ...(isBuiltin ? {} : { section: f.section, sell: f.sell }),
  };
  const priceNum = Number(f.price);
  const priceValid = /^\d{1,6}$/.test(f.price) && priceNum >= 1 && priceNum <= 100000;

  /* Live preview: exactly the website card, built from what is typed now. */
  const preview: Product | null = useMemo(() => {
    const id = product?.id || 'preview-item';
    const rec: ProductRecord = { id, custom: !isBuiltin, hidden: false, data: { ...data, image: f.imageUrl || undefined, price: isBuiltin ? undefined : priceNum || 1 } };
    const built = buildCatalog({ items: {}, notice: null, products: [rec] }).find(p => p.id === id);
    if (!built) return null;
    const p = isBuiltin && base ? { ...built, price: priceValid ? priceNum / scaleOf(base) : built.price } : built;
    return { ...p, image: f.imageUrl || p.image, name: p.name || 'Item name' };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data), f.imageUrl, f.price]);

  const missing = [!f.imageUrl && 'a photo', f.name.trim().length < 2 && 'the name', !priceValid && 'the price'].filter(Boolean) as string[];
  const packText = (s: Sell) => (s.type === 'large' ? '1 kg' : s.type === 'small' ? '250 g' : `${s.pieces || 1} pieces`);
  const priceFor = isBuiltin && product ? packLabel(product, defaultPack(product)) : section === 'drink' || section === 'gift' ? (product ? packLabel(product, defaultPack(product)) : '') : packText(f.sell);

  async function save() {
    if (missing.length || saving) return;
    setSaving(true);
    const product_ = { ...data, ...(f.imageId !== undefined ? { imageId: f.imageId } : {}) };
    const result = await change(
      { action: 'saveProduct', ...(product ? { id: product.id } : {}), product: product_, price: priceNum, hidden: f.hidden },
      isNew ? `${data.name} is now on the website` : f.hidden ? `${data.name} saved and hidden` : `${data.name} saved`,
    );
    setSaving(false);
    if (result) onClose();
  }

  return (
    <dialog ref={dialog} className="adm-editor" aria-label={isNew ? 'Add new item' : `Edit ${product?.name}`} onCancel={e => { e.preventDefault(); onClose(); }}>
      <div className="adm-editor-inner">
        <header className="adm-editor-head">
          <h2>{isNew ? 'Add new item' : 'Edit item'}</h2>
          <button className="close-button" aria-label="Close" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="adm-editor-grid">
          <div className="adm-editor-form">
            {/* 1. Photo */}
            <div className="adm-field">
              <span className="adm-step">1</span>
              <label className="adm-flabel">Photo</label>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => choosePhoto(e.target.files?.[0])} />
              <button type="button" className={`adm-photo ${f.imageUrl ? 'has' : ''}`} onClick={() => fileRef.current?.click()} disabled={uploading}>
                {f.imageUrl && <img src={f.imageUrl} alt="" />}
                <span className="adm-photo-cta">
                  {uploading ? <span className="adm-spinner small" /> : f.imageUrl ? <Camera size={18} /> : <ImagePlus size={28} />}
                  {uploading ? 'Preparing photo…' : f.imageUrl ? 'Change photo' : 'Take or choose a photo'}
                </span>
              </button>
              <p className="adm-hint">Tip: plain light background, daylight, sweet in the middle. It is cropped square automatically.</p>
              {isBuiltin && (f.imageId || (record?.data.image && f.imageId !== null)) && (
                <button type="button" className="adm-textbtn" onClick={() => setF(x => ({ ...x, imageId: null, imageUrl: base?.image || x.imageUrl }))}>
                  <RotateCcw size={14} /> Use the original photo
                </button>
              )}
            </div>

            {/* 2. Name */}
            <div className="adm-field">
              <span className="adm-step">2</span>
              <label className="adm-flabel" htmlFor="ed-name">Name</label>
              <input id="ed-name" className="adm-input big" value={f.name} maxLength={60} onChange={e => set('name', e.target.value)} placeholder="e.g. Kaju Roll" />
            </div>

            {/* 3. Section */}
            <div className="adm-field">
              <span className="adm-step">3</span>
              <label className="adm-flabel">Where it shows</label>
              {isNew || product?.custom ? (
                <div className="adm-choices three">
                  {(['sweets', 'namkeens', 'hot'] as const).map(s => (
                    <button key={s} type="button" className={f.section === s ? 'active' : ''} onClick={() => setF(x => ({ ...x, section: s, sell: s === x.section ? x.sell : sellDefault(s) }))}>
                      {sectionNames[s]}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="adm-fixed">{sectionNames[section]}</p>
              )}
              {(f.section === 'sweets' && (isNew || product?.custom)) || section === 'sweets' && isBuiltin ? (
                <div className="adm-chips">
                  <span className="adm-hint">Sweet type (for the filter buttons):</span>
                  {sweetCategories.map(c => (
                    <button key={c} type="button" className={f.category === c ? 'active' : ''} onClick={() => set('category', c)}>{c}</button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* 4. How it is sold + price */}
            <div className="adm-field">
              <span className="adm-step">4</span>
              <label className="adm-flabel">How it is sold &amp; price</label>
              {previewSell ? (
                <div className="adm-sell">
                  {([
                    { type: 'large', label: '250 g · 500 g · 1 kg', hint: 'Price for 1 kg' },
                    { type: 'small', label: '100 g · 250 g · 500 g', hint: 'Price for 250 g' },
                    { type: 'pieces', label: 'By pieces', hint: 'Price for one pack' },
                  ] as const).map(o => (
                    <button key={o.type} type="button" className={f.sell.type === o.type ? 'active' : ''} onClick={() => set('sell', o.type === 'pieces' ? { type: 'pieces', pieces: f.sell.pieces || 2 } : { type: o.type })}>
                      <strong>{o.label}</strong>
                      <span>{o.hint}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="adm-fixed">Packs: {product && (product.packs || [defaultPack(product)]).map(s => packLabel(product, s)).join(' · ')}</p>
              )}
              {previewSell?.type === 'pieces' && (
                <div className="adm-pieces">
                  <span>Pieces in one pack</span>
                  <button type="button" aria-label="Fewer pieces" onClick={() => set('sell', { type: 'pieces', pieces: Math.max(1, (f.sell.pieces || 1) - 1) })}>−</button>
                  <b>{f.sell.pieces || 1}</b>
                  <button type="button" aria-label="More pieces" onClick={() => set('sell', { type: 'pieces', pieces: Math.min(50, (f.sell.pieces || 1) + 1) })}>+</button>
                  <span className="adm-hint">Customers can pick {f.sell.pieces || 1} or {(f.sell.pieces || 1) * 2} pieces.</span>
                </div>
              )}
              <div className="adm-price big">
                <span className="adm-rupee">₹</span>
                <input inputMode="numeric" value={f.price} onChange={e => set('price', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="0" aria-label="Price" className={f.price && !priceValid ? 'bad' : ''} />
                <span className="adm-per">for {priceFor}</span>
              </div>
            </div>

            {/* 5. Short line + label */}
            <div className="adm-field">
              <span className="adm-step">5</span>
              <label className="adm-flabel" htmlFor="ed-sub">Short line under the name <em className="adm-opt">optional</em></label>
              <input id="ed-sub" className="adm-input" value={f.subtitle} maxLength={90} onChange={e => set('subtitle', e.target.value)} placeholder="e.g. Rich cashew, rolled by hand." />
              <label className="adm-flabel" htmlFor="ed-tag">Label on the photo <em className="adm-opt">optional</em></label>
              <input id="ed-tag" className="adm-input" value={f.tag} maxLength={30} onChange={e => set('tag', e.target.value)} placeholder={f.section === 'hot' ? 'Fresh & hot' : 'New at Mahima'} />
              <button type="button" role="switch" aria-checked={f.special} className={`adm-mini-switch ${f.special ? 'on' : ''}`} onClick={() => set('special', !f.special)}>
                <span /> Show the label in red (special)
              </button>
            </div>

            {/* More details */}
            <div className="adm-field adm-more">
              <button type="button" className="adm-more-toggle" onClick={() => setMore(v => !v)} aria-expanded={more}>
                More details <em className="adm-opt">optional</em> <ChevronDown size={17} className={more ? 'open' : ''} />
              </button>
              {more && (
                <div className="adm-more-body">
                  <label className="adm-flabel" htmlFor="ed-desc">Full description (shown when customers tap the item)</label>
                  <textarea id="ed-desc" className="adm-input" rows={3} maxLength={500} value={f.description} onChange={e => set('description', e.target.value)} />
                  <label className="adm-flabel" htmlFor="ed-all">Allergens</label>
                  <input id="ed-all" className="adm-input" maxLength={240} value={f.allergens} onChange={e => set('allergens', e.target.value)} placeholder="e.g. Milk, cashews" />
                  <label className="adm-flabel" htmlFor="ed-sto">Storage</label>
                  <input id="ed-sto" className="adm-input" maxLength={240} value={f.storage} onChange={e => set('storage', e.target.value)} placeholder="e.g. Keep in an airtight box, best within 7 days" />
                </div>
              )}
            </div>

            {!isNew && (
              <div className="adm-field">
                <button type="button" role="switch" aria-checked={!f.hidden} className={`adm-mini-switch ${!f.hidden ? 'on' : ''}`} onClick={() => set('hidden', !f.hidden)}>
                  <span /> {f.hidden ? 'Hidden from the website' : 'Showing on the website'}
                </button>
              </div>
            )}
          </div>

          <aside className="adm-preview-col">
            <span className="adm-hint">Preview – exactly how customers will see it</span>
            <div className="adm-card-preview">
              {preview && f.imageUrl ? (
                <ProductCard product={preview} index={0} open={() => {}} add={() => {}} />
              ) : (
                <div className="adm-preview-empty"><ImagePlus size={30} /><span>Your preview appears here once you add a photo.</span></div>
              )}
            </div>
          </aside>
        </div>

        <footer className="adm-editor-foot">
          {missing.length > 0 && <p className="adm-hint">Add {missing.join(', ')} to continue.</p>}
          <div className="adm-editor-actions">
            {product?.custom && (
              <button type="button" className={`adm-danger ${confirm === 'delete' ? 'confirm' : ''}`} onClick={async () => {
                if (confirm !== 'delete') { setConfirm('delete'); return; }
                const ok = await change({ action: 'deleteProduct', id: product.id }, `${product.name} deleted`);
                if (ok) onClose();
              }}>
                <Trash2 size={16} /> {confirm === 'delete' ? 'Tap again to delete' : 'Delete item'}
              </button>
            )}
            {isBuiltin && record && (
              <button type="button" className={`adm-danger soft ${confirm === 'reset' ? 'confirm' : ''}`} onClick={async () => {
                if (confirm !== 'reset') { setConfirm('reset'); return; }
                const ok = await change({ action: 'resetProduct', id: product!.id }, `${base?.name || 'Item'} is back to the original`);
                if (ok) onClose();
              }}>
                <RotateCcw size={16} /> {confirm === 'reset' ? 'Tap again to undo' : 'Undo all my changes'}
              </button>
            )}
            <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="button primary glow" disabled={missing.length > 0 || saving || uploading} onClick={save}>
              {saving ? 'Saving…' : isNew ? <><Check size={18} /> Publish</> : <><Check size={18} /> Save changes</>}
            </button>
          </div>
        </footer>
      </div>
    </dialog>
  );
}

function FavouritesEditor({ all, state, change }: { all: Product[]; state: State; change: Change }) {
  const current = pickFavourites(all, state).map(p => p.id);
  const [picks, setPicks] = useState<string[]>(current);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => setPicks(current), [current.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const options = all.filter(p => !p.hidden);
  const dirty = picks.join() !== current.join();
  const custom = !!state.favourites?.length;
  const slots = ['Big photo', 'Second', 'Third', 'Wide bottom'];

  return (
    <section className="adm-card adm-favs">
      <button className="adm-favs-head" onClick={() => setOpen(v => !v)} aria-expanded={open}>
        <span className="adm-notice-icon"><Star size={18} /></span>
        <div>
          <h2>“Our favourites” showcase</h2>
          <p className="adm-muted">{current.map(id => all.find(p => p.id === id)?.name).join(' · ')}</p>
        </div>
        <ChevronDown size={20} className={open ? 'open' : ''} />
      </button>
      {open && (
        <div className="adm-favs-body">
          <p className="adm-hint">The four big photos near the top of the website. The first one is the largest.</p>
          {slots.map((label, i) => (
            <label key={label} className="adm-fav-slot">
              <span>{i + 1}. {label}</span>
              <select value={picks[i] || ''} onChange={e => setPicks(p => { const next = [...p]; next[i] = e.target.value; return next; })}>
                {options.map(p => (
                  <option key={p.id} value={p.id} disabled={picks.includes(p.id) && picks[i] !== p.id}>{p.name}</option>
                ))}
              </select>
            </label>
          ))}
          <div className="adm-notice-actions">
            {custom ? (
              <button type="button" className="adm-textbtn" onClick={() => change({ action: 'setFavourites', ids: null }, 'Showcase back to the original four')}>
                <RotateCcw size={14} /> Back to original ({defaultFavourites.length})
              </button>
            ) : <span />}
            <button className="button primary" disabled={!dirty || saving || new Set(picks).size !== picks.length} onClick={async () => {
              setSaving(true);
              await change({ action: 'setFavourites', ids: picks }, 'Showcase updated');
              setSaving(false);
            }}>
              {saving ? 'Saving…' : 'Save showcase'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function NoticeEditor({ notice, change }: { notice: { text: string; active: boolean }; change: Change }) {
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
