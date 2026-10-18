'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import BadamFeature from '@/components/BadamFeature';
import ThemeToggle from '@/components/ThemeToggle';
import AccountButton from '@/components/AccountButton';
import HeroStage from '@/components/hero/HeroStage';
import { ProductCard, SteamWaves, type AddFn } from '@/components/ProductCard';
import Checkout from '@/components/Checkout';
import OrderTracker from '@/components/OrderTracker';
import { readMyOrders, saveMyOrder, type MyOrder, type OrderView } from '@/lib/my-orders';
import { shop, whatsappLink, shopDirectionsUrl, shopMapUrl, shopMapEmbedUrl } from '@/lib/shop';
import { ArrowRight, ArrowUpRight, ShoppingBag, Plus, Minus, X, MapPin, Phone, Clock3, Leaf, Gift, Heart, Sparkles, Check, Trash2, Search, Menu, Package, Truck, ChevronDown, CheckCircle2, Eye, Flame, Store, Megaphone, Ban, Receipt } from 'lucide-react';
import { money, linePrice, defaultPack, packOptions, packLabel, priceFor, buildCatalog, pickFavourites, sectionOf, businessDefaults, type Product, type CartItem, type ShopState } from '@/lib/products';

const categories = ['All sweets', 'Traditional', 'Dry fruit', 'Milk sweets', 'Syrupy'];
const marqueeWords = ['Motichoor Ladoo', 'Kaju Burfi', 'Ghee Mysore Pak', 'Dharwad Peda', 'Gulab Jamun', 'Crispy Jalebi', 'Kesar Rasmalai', 'Badam Halwa', 'Crispy Murukku', 'Punjabi Samosa', 'Badam Geer', 'Poothrekulu'];
const faqs = [
  ['Can I choose different pack sizes?', 'Yes. Sweets come in 250 g, 500 g and 1 kg packs. Namkeens come in 100 g, 250 g and 500 g. Samosas come in packs of 2, 4 or 6 pieces, and pakodi in 100 g, 250 g and 500 g. Badam Geer comes in 250 ml and 500 ml. The celebration box is a fixed 1 kg assortment. Prices shown are samples.'],
  ['How does ordering work?', 'Add items to your bag, choose a pickup time, and pay at least 25% by UPI (or the full amount). Send us the UPI reference number, we confirm your payment, and you pay the rest when you pick up at the shop. Your order page shows every step.'],
  ['Can I mix sweets, namkeens and hot snacks?', 'Absolutely. Add anything you like to one bag. Hot snacks are made through the day, so we may call you if a fresh batch needs a little extra time.'],
  ['Can I add a gift message?', 'Yes. Write a personal note at checkout and we will add it to your order.'],
  ['What about allergies and storage?', 'Open any product to see ingredient and storage notes. Sweets can contain milk, nuts and wheat, and shared preparation may cause cross-contact. Please confirm ingredients and shelf life with the shop.'],
  ['Can I cancel my order?', 'Yes, within 30 minutes of placing it, using the Cancel button on your order page. Any payment is refunded to the same UPI account within 5–7 working days. After 30 minutes, please call the shop.'],
  ['Do you deliver?', 'Home delivery in Gangavathi is coming soon. For now, all online orders are store pickup, opposite Amar Hospitals.'],
];

function Modal({ children, onClose, title, className = '' }: { children: React.ReactNode; onClose: () => void; title: string; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    const previous = document.activeElement as HTMLElement;
    d?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      d?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog ref={ref} aria-label={title} className={`modal ${className}`} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-inner">
        <button className="close-button" aria-label="Close dialog" onClick={onClose}>
          <X size={20} />
        </button>
        {children}
      </div>
    </dialog>
  );
}

function WhatsAppMark({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" aria-hidden="true">
      <path d="M26 15.4a10.3 10.3 0 0 1-15.4 9L5 26l1.6-5.4A10.3 10.3 0 1 1 26 15.4Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="m12 10 2 3-1.3 1.6c1 2 2.1 3.1 4.2 4l1.5-1.3 3 1.8c-.3 2-1.9 2.4-3.1 2.1-5-1.1-8.3-4.7-9.1-8.6-.2-1.1.6-2.5 2.8-2.6Z" fill="currentColor" />
    </svg>
  );
}

function flyToBag(from: HTMLElement | undefined, image: string) {
  const bag = document.querySelector<HTMLElement>('.bag-button');
  if (!bag) return;
  const bump = () => {
    bag.classList.remove('bump');
    void bag.offsetWidth;
    bag.classList.add('bump');
  };
  if (!from || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return bump();
  const a = from.getBoundingClientRect();
  const b = bag.getBoundingClientRect();
  const dot = document.createElement('img');
  dot.src = image;
  dot.alt = '';
  dot.className = 'fly-dot';
  dot.style.left = `${a.left + a.width / 2 - 26}px`;
  dot.style.top = `${a.top + a.height / 2 - 26}px`;
  document.body.appendChild(dot);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const anim = dot.animate(
    [
      { transform: 'translate(0,0) scale(.6)', opacity: 0 },
      { transform: 'translate(0,-30px) scale(1.1)', opacity: 1, offset: 0.18 },
      { transform: `translate(${dx * 0.55}px,${Math.min(dy, 0) - 90}px) scale(.85)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px,${dy}px) scale(.25)`, opacity: 0.6 },
    ],
    { duration: 850, easing: 'cubic-bezier(.45,0,.25,1)' },
  );
  anim.onfinish = () => {
    dot.remove();
    bump();
  };
}

export default function Home() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [weight, setWeight] = useState(500);
  const [category, setCategory] = useState('All sweets');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState('');
  const [tracking, setTracking] = useState<{ id: string; t: string; initial?: OrderView } | null>(null);
  const [myOrder, setMyOrder] = useState<(MyOrder & { status?: string }) | null>(null);
  const [shopState, setShopState] = useState<ShopState | null>(null);

  /* Live stock, prices and notice set by the owner at /admin. Refreshes every minute and when the tab comes back into view. */
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch('/api/shop/', { cache: 'no-store' })
        .then(r => (r.ok ? r.json() : null))
        .then(data => { if (alive && data && typeof data === 'object' && data.items) setShopState(data); })
        .catch(() => {});
    load();
    const timer = setInterval(load, 60000);
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { alive = false; clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, []);
  /* Full menu: built-in items with the owner's edits, plus items added at /admin. Hidden items stay in `catalog` for bag checks only. */
  const catalog = useMemo(() => buildCatalog(shopState), [shopState]);
  const byId = (id: string) => catalog.find(p => p.id === id);
  const visible = catalog.filter(p => !p.hidden);
  const products = visible.filter(p => sectionOf(p) === 'sweets');
  const namkeens = visible.filter(p => sectionOf(p) === 'namkeens');
  const hotItems = visible.filter(p => sectionOf(p) === 'hot');
  const gift = visible.find(p => p.id === 'gift');
  const badam = visible.find(p => p.id === 'badam-geer');
  const favourites = pickFavourites(catalog, shopState);

  /* "Your order" button: the latest order placed from this phone that is still open. */
  useEffect(() => {
    let alive = true;
    const latest = readMyOrders()[0];
    if (!latest) { setMyOrder(null); return; }
    fetch(`/api/order/?id=${latest.id}&t=${latest.t}`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (alive) setMyOrder(d?.order && !['picked_up', 'cancelled'].includes(d.order.status) ? { ...latest, status: d.order.status } : null); })
      .catch(() => {});
    return () => { alive = false; };
  }, [tracking]);
  const unavailable = (p?: Product) => !p || !!p.soldOut || !!p.hidden;

  /* Once the live menu has loaded, drop bag lines for items that were deleted or whose pack size no longer exists. */
  useEffect(() => {
    if (!shopState) return;
    setCart(items => {
      const kept = items.filter(i => { const p = catalog.find(x => x.id === i.id); return p && packOptions(p).includes(i.grams); });
      return kept.length === items.length ? items : kept;
    });
  }, [shopState, catalog]);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('mahima-cart-v1') || '[]');
      if (Array.isArray(raw))
        setCart(raw.filter((i: CartItem) => {
          return i && typeof i.id === 'string' && /^[a-z0-9-]{1,60}$/.test(i.id) && Number.isInteger(i.grams) && i.grams > 0 && Number.isInteger(i.quantity) && i.quantity > 0 && i.quantity <= 20;
        }));
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem('mahima-cart-v1', JSON.stringify(cart));
      } catch {}
    }
  }, [cart, ready]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  /* Scroll effects: reveal sections as they arrive, shrink the header, fill the gold progress line. */
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    document.querySelectorAll('.reveal, .reveal-grid').forEach(el => observer.observe(el));
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - innerHeight;
        document.documentElement.style.setProperty('--scroll', String(max > 0 ? scrollY / max : 0));
        document.documentElement.dataset.scrolled = String(scrollY > 40);
      });
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => {
      observer.disconnect();
      removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileNav ? 'hidden' : '';
  }, [mobileNav]);

  const soldOutInBag = cart.filter(i => unavailable(byId(i.id)));
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((s, i) => s + linePrice(i, catalog) * i.quantity, 0);
  const business = shopState?.business || businessDefaults;
  const filtered = (query ? visible.filter(p => p.id !== 'gift') : products).filter(
    p => (query || category === 'All sweets' || p.category === category) && `${p.name} ${p.subtitle} ${p.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  const add: AddFn = (product, grams = defaultPack(product), from) => {
    if (product.soldOut || product.hidden) {
      setToast(`Sorry, ${product.name} is sold out today`);
      return;
    }
    setCart(items => {
      const exists = items.find(i => i.id === product.id && i.grams === grams);
      if (exists) return items.map(i => (i === exists ? { ...i, quantity: Math.min(20, i.quantity + 1) } : i));
      return [...items, { id: product.id, grams, quantity: 1 }];
    });
    setToast(`${product.name} added to your bag`);
    flyToBag(from, product.image);
  };
  function update(id: string, grams: number, delta: number) {
    setCart(items => items.map(i => (i.id === id && i.grams === grams ? { ...i, quantity: Math.min(20, i.quantity + delta) } : i)).filter(i => i.quantity > 0));
  }
  function openProduct(product: Product) {
    setSelected(product);
    setWeight(defaultPack(product));
  }
  const closeCart = () => {
    setCartOpen(false);
    setCheckout(false);
  };
  const nav = () => setMobileNav(false);
  const current = selected ? byId(selected.id) : null;
  const navLinks: [string, string][] = [['#favourites', 'Specials'], ['#collection', 'Sweets'], ['#namkeens', 'Namkeens'], ['#hot-snacks', 'Hot & Crispy'], ['#gifting', 'Gift boxes'], ['#visit', 'Visit us']];

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <div className="scroll-progress" aria-hidden="true" />

      {shopState?.notice && (
        <div className="notice-bar" role="status">
          <span className="notice-icon"><Megaphone size={16} /></span>
          <span>{shopState.notice.text}</span>
        </div>
      )}
      <div className="announcement">
        <div className="announcement-track">
          {[0, 1].map(k => (
            <div key={k} className="announcement-set" aria-hidden={k === 1}>
              <span><Sparkles size={12} /> Festive gift boxes now available</span>
              <span><MapPin size={12} /> Opposite Amar Hospitals, Gangavathi</span>
              <span><Clock3 size={12} /> Open daily · 8:00 AM – 9:30 PM</span>
              <span><Phone size={12} /> Call &amp; order {shop.phone}</span>
            </div>
          ))}
        </div>
      </div>

      <header className="header">
        <div className="nav-wrap">
          <a className="brand" href="#" aria-label="Mahima Sweets home">
            <span className="brand-mark">M<span>✦</span></span>
            <span className="brand-text">
              <span className="brand-name">Mahima</span>
              <span className="brand-sub">Sweets</span>
            </span>
          </a>
          <nav aria-label="Main navigation" className={mobileNav ? 'nav-links open' : 'nav-links'}>
            {navLinks.map(([href, label], i) => (
              <a key={href} onClick={nav} href={href} style={{ '--i': i } as React.CSSProperties}>
                {label}
                {href === '#hot-snacks' && <span className="nav-hot-dot" />}
              </a>
            ))}
          </nav>
          <div className="nav-actions">
            <ThemeToggle />
            <AccountButton />
            <button
              className="icon-button search-trigger"
              aria-label="Search sweets"
              onClick={() => {
                setSearchOpen(true);
                document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Search size={19} />
            </button>
            <button className="bag-button" aria-label={`Your bag, ${count} items`} onClick={() => setCartOpen(true)}>
              <ShoppingBag size={18} />
              <span>Bag</span>
              <b key={count}>{count}</b>
            </button>
            <button className="icon-button mobile-toggle" aria-label={mobileNav ? 'Close menu' : 'Open menu'} aria-expanded={mobileNav} onClick={() => setMobileNav(!mobileNav)}>
              {mobileNav ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="hero">
          <div className="hero-bokeh" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => (
              <i key={i} style={{ left: `${(i * 41 + 5) % 100}%`, animationDelay: `${(i * 1.3) % 9}s`, animationDuration: `${9 + (i % 4) * 3}s` }} />
            ))}
          </div>
          <div className="hero-copy">
            <p className="eyebrow hero-eyebrow">
              <span className="eyebrow-dot" /> GANGAVATHI’S SWEET STOP
            </p>
            <h1>
              <span className="h1-line">
                <span className="w" style={{ '--w': 0 } as React.CSSProperties}>Sweet</span>{' '}
                <span className="w" style={{ '--w': 1 } as React.CSSProperties}>tooth?</span>
              </span>
              <span className="h1-line">
                <em className="w shimmer" style={{ '--w': 2 } as React.CSSProperties}>We get you.</em>
              </span>
            </h1>
            <p className="hero-description">Melt-in-your-mouth mithai, can’t-stop crunchy namkeens, and hot snacks that steal the spotlight.</p>
            <div className="hero-buttons">
              <a className="button primary glow" href="#collection">
                Shop sweets <ArrowRight size={18} />
              </a>
              <a className="button ghost" href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                <WhatsAppMark size={19} /> Order on WhatsApp
              </a>
            </div>
            <ul className="hero-chips">
              <li><Store size={15} /> Store pickup</li>
              <li><Truck size={15} /> Delivery coming soon</li>
              <li><Gift size={15} /> Gift boxes</li>
            </ul>
          </div>
          <HeroStage style={shopState?.hero} />
          <a className="scroll-cue" href="#favourites" aria-label="Scroll to our specials">
            <span />
          </a>
        </section>

        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[0, 1].map(k => (
              <div key={k} className="marquee-set">
                {marqueeWords.map(w => (
                  <span key={w}>
                    {w} <i>✦</i>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <section id="favourites" className="section-pad specials">
          <div className="section-head center reveal">
            <p className="eyebrow">THE MAHIMA SPECIALS</p>
            <h2>
              Our <em>favourites</em>
            </h2>
            <p className="lead">A little tradition. A little indulgence. Plenty to fall for.</p>
            <span className="ornament" aria-hidden="true"><i /><b>✦</b><i /></span>
          </div>
          <div className="bento reveal-grid">
            {favourites.map((p, index) => (
              <ProductCard key={p.id} className={`spot spot-${index}`} product={p} index={index} open={openProduct} add={add} />
            ))}
          </div>
        </section>

        <section id="collection" className="section-pad collection">
          <div className="section-head split reveal">
            <div>
              <p className="eyebrow">SWEET TOOTH CLUB</p>
              <h2>
                Pick your sweet <em>obsession.</em>
              </h2>
            </div>
            <p className="lead">The classics you came for. The next favourite you didn’t see coming.</p>
          </div>
          <div className="toolbar reveal">
            <div className="tabs" role="group" aria-label="Sweet categories">
              {categories.map(c => (
                <button key={c} className={c === category && !query ? 'active' : ''} onClick={() => { setCategory(c); setQuery(''); }} aria-pressed={c === category && !query}>
                  {c}
                </button>
              ))}
            </div>
            <div className={`search-box ${searchOpen || query ? 'open' : ''}`}>
              <Search size={17} />
              <input
                value={query}
                onFocus={() => setSearchOpen(true)}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search ladoo, murukku, samosa…"
                aria-label="Search all sweets and snacks"
                autoFocus={searchOpen}
                key={String(searchOpen)}
              />
              {query && (
                <button className="icon-button" aria-label="Clear search" onClick={() => setQuery('')}>
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          {query && <p className="result-note">{filtered.length} {filtered.length === 1 ? 'match' : 'matches'} for “{query}”</p>}
          <div className="grid reveal-grid">
            {filtered.map((p, index) => (
              <ProductCard key={p.id} product={p} index={index} open={openProduct} add={add} />
            ))}
          </div>
          {!filtered.length && (
            <div className="empty-results">
              <Search size={28} />
              <h3>That craving’s playing hide-and-seek.</h3>
              <p>Try another name, or browse everything.</p>
              <button className="button secondary" onClick={() => { setQuery(''); setCategory('All sweets'); }}>
                Show all sweets
              </button>
            </div>
          )}
          <p className="fine-print">Photos are illustrative. Prices, availability and ingredients are samples.</p>
        </section>

        <section id="namkeens" className="section-pad namkeens">
          <div className="section-head split reveal">
            <div>
              <p className="eyebrow">THE CRUNCH CHAPTER</p>
              <h2>
                A little salty. <em>A lot of personality.</em>
              </h2>
            </div>
            <p className="lead">Snack-time favourites. Movie-night essentials. Your “just one handful” favourites.</p>
          </div>
          <div className="grid reveal-grid">
            {namkeens.map((p, index) => (
              <ProductCard key={p.id} product={p} index={index} open={openProduct} add={add} />
            ))}
          </div>
        </section>

        <section id="hot-snacks" className="section-pad hot">
          <div className="hot-embers" aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => (
              <i key={i} style={{ left: `${(i * 23 + 4) % 100}%`, animationDelay: `${(i * 0.9) % 7}s` }} />
            ))}
          </div>
          <div className="section-head split reveal">
            <div>
              <p className="eyebrow">
                <Flame size={13} /> THE HOT SNACK TAKEOVER
              </p>
              <h2>
                Hot bites. <em>Zero small talk.</em>
              </h2>
            </div>
            <p className="lead">That first crunch says it all. Meet the golden duo your evenings deserve.</p>
          </div>
          <div className="grid hot-grid reveal-grid">
            {hotItems.map((p, index) => (
              <ProductCard key={p.id} product={p} index={index} open={openProduct} add={add} className="wide" />
            ))}
          </div>
          <p className="fine-print">Hot snacks are made through the day. Call to check what’s fresh right now.</p>
        </section>

        {badam && <BadamFeature badam={badam} add={add} open={openProduct} />}

        {gift && (
        <section id="gifting" className="section-pad gifting">
          <div className="gift-panel reveal">
            <svg className="rangoli" viewBox="0 0 400 400" aria-hidden="true">
              {Array.from({ length: 16 }, (_, i) => (
                <ellipse key={i} cx="200" cy="90" rx="22" ry="70" transform={`rotate(${i * 22.5} 200 200)`} />
              ))}
              {Array.from({ length: 8 }, (_, i) => (
                <circle key={`c${i}`} cx="200" cy="20" r="8" transform={`rotate(${i * 45 + 22.5} 200 200)`} />
              ))}
              <circle cx="200" cy="200" r="40" />
              <circle cx="200" cy="200" r="190" strokeDasharray="3 10" />
            </svg>
            <div className="gift-art" aria-hidden="true">
              <div className="gift-rays" />
              <div className="gift-pop">
                <img className="pop pop-a" src="/images/hero-ladoo-cutout.webp" alt="" />
                <img className="pop pop-b" src="/images/hero-kaju-cutout.webp" alt="" />
                <img className="pop pop-c" src="/images/hero-ladoo-cutout.webp" alt="" />
              </div>
              <div className="gift-box">
                <div className="gift-lid">
                  <span className="bow l" />
                  <span className="bow r" />
                </div>
                <div className="gift-base">
                  <span className="gift-monogram">M<small>✦</small></span>
                  <span className="gift-word">Mahima</span>
                </div>
              </div>
              {Array.from({ length: 10 }, (_, i) => (
                <i key={i} className="confetti" style={{ '--a': `${i * 36}deg`, animationDelay: `${0.7 + (i % 5) * 0.06}s` } as React.CSSProperties} />
              ))}
            </div>
            <div className="gift-copy">
              <p className="eyebrow">WRAPPED IN HAPPINESS</p>
              <h2>
                Box up the <em>“you made my day.”</em>
              </h2>
              <p className="lead">Diwali visit? Big news? A small thank-you? There’s a Mahima box for that.</p>
              <ul className="gift-includes">
                <li><Check size={15} /> Six classic sweets, 1 kg</li>
                <li><Check size={15} /> Your personal gift message</li>
                <li><Check size={15} /> Ready to carry and gift</li>
              </ul>
              <div className="gift-buy">
                <div>
                  <strong>{money(gift.price)}</strong>
                  <span>per celebration box</span>
                </div>
                <button className="button primary glow" disabled={gift.soldOut} onClick={() => openProduct(gift)}>
                  {gift.soldOut ? <>Sold out today <Ban size={18} /></> : <>Make someone’s day <Gift size={18} /></>}
                </button>
              </div>
              <p className="gift-small">
                Ordering for a wedding or a big function? <a href="#visit">Talk to us</a>.
              </p>
            </div>
          </div>
        </section>
        )}

        <section id="story" className="section-pad story">
          <div className="section-head center reveal">
            <p className="eyebrow">OUR KIND OF SWEET</p>
            <h2>
              Good company. <em>Even better things to share.</em>
            </h2>
            <p className="lead">A sweet after lunch. A box carried to a friend’s home. A familiar flavour that feels like a warm welcome. From our home in Gangavathi to your next celebration, there’s always a reason for something sweet.</p>
            <span className="ornament" aria-hidden="true"><i /><b>✦</b><i /></span>
          </div>
          <div className="values reveal-grid">
            {[
              [Heart, 'Made for moments', 'Everyday treats and special occasions, with something for everyone at the table.'],
              [Leaf, 'Tradition at heart', 'The familiar flavours and textures that make Indian sweets so memorable.'],
              [Gift, 'Joy, beautifully wrapped', 'A thoughtful assortment, a personal note, and a reason to make someone smile.'],
            ].map(([Icon, title, text], i) => {
              const I = Icon as typeof Heart;
              return (
                <div className="value" key={title as string} style={{ '--i': i } as React.CSSProperties}>
                  <span className="value-icon"><I size={24} /></span>
                  <h3>{title as string}</h3>
                  <p>{text as string}</p>
                </div>
              );
            })}
          </div>
          <p className="signature reveal">With love, Mahima</p>
        </section>

        <section className="section-pad faq">
          <div className="section-head reveal">
            <p className="eyebrow">QUICK ANSWERS</p>
            <h2>
              Tiny questions. <em>Tasty answers.</em>
            </h2>
          </div>
          <div className="faq-list reveal">
            {faqs.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <span className="faq-icon"><ChevronDown size={18} /></span>
                </summary>
                <div className="faq-answer"><p>{a}</p></div>
              </details>
            ))}
          </div>
        </section>

        <section id="visit" className="section-pad visit">
          <div className="visit-card reveal">
            <div className="visit-copy">
              <p className="eyebrow">COME SAY HELLO</p>
              <h2>
                Craving mithai? <em>Make us the stop.</em>
              </h2>
              <div className="contact-list">
                <div className="contact-row">
                  <span className="contact-icon"><MapPin size={19} /></span>
                  <div>
                    <strong>Mahima Sweets</strong>
                    <span>Opposite Amar Hospitals, Gangavathi, Karnataka – 583227</span>
                  </div>
                </div>
                <div className="contact-row">
                  <span className="contact-icon"><Phone size={19} /></span>
                  <div>
                    <a className="strong-link" href={`tel:${shop.telephone}`}>{shop.phone}</a>
                    <a href={`tel:${shop.secondaryTelephone}`}>Also: {shop.secondaryPhone}</a>
                  </div>
                </div>
                <div className="contact-row">
                  <span className="contact-icon"><Clock3 size={19} /></span>
                  <div>
                    <strong>8:00 AM – 9:30 PM</strong>
                    <span>Open every day</span>
                  </div>
                </div>
              </div>
              <div className="visit-buttons">
                <a className="button primary" href={shopDirectionsUrl} target="_blank" rel="noopener noreferrer">
                  Get directions <ArrowUpRight size={17} />
                </a>
                <a className="button whatsapp" href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                  <WhatsAppMark size={19} /> WhatsApp us
                </a>
              </div>
            </div>
            <div className="map-frame">
              <iframe title="Google Maps: Mahima Sweets shop location" src={shopMapEmbedUrl} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
              <a className="map-open" href={shopMapUrl} target="_blank" rel="noopener noreferrer">
                <MapPin size={15} /> Open in Google Maps <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-word" aria-hidden="true">Mahima</div>
        <div className="footer-grid">
          <div>
            <a className="brand" href="#" aria-label="Mahima Sweets home">
              <span className="brand-mark">M<span>✦</span></span>
              <span className="brand-text">
                <span className="brand-name">Mahima</span>
                <span className="brand-sub">Sweets</span>
              </span>
            </a>
            <p>Sweeten the day. Spice up the break.</p>
          </div>
          <nav aria-label="Footer">
            {navLinks.map(([href, label]) => (
              <a key={href} href={href}>{label}</a>
            ))}
          </nav>
          <div className="footer-contact">
            <a href={`tel:${shop.telephone}`}><Phone size={15} /> {shop.phone}</a>
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer"><WhatsAppMark size={16} /> WhatsApp</a>
            <span><Clock3 size={15} /> 8:00 AM – 9:30 PM</span>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-legal">
            <span>© {new Date().getFullYear()} {business.legalName || 'Mahima Sweets'} · Opposite Amar Hospitals, Gangavathi, Karnataka – 583227</span>
            {business.fssai && <span className="fssai-line"><b>FSSAI</b> Lic. No. {business.fssai}</span>}
          </div>
          <div>
            <a href="/privacy/">Privacy Policy</a>
            <a href="/terms/">Terms</a>
            <a href="/refund-policy/">Refund &amp; Cancellation</a>
            <a href="/privacy/#grievance">Grievance officer</a>
          </div>
        </div>
      </footer>

      {myOrder && !tracking && (
        <button className="order-pill" onClick={() => setTracking({ id: myOrder.id, t: myOrder.t })}>
          <span className="order-pill-dot" />
          <Receipt size={16} />
          <span>Your order {myOrder.id}<small>{({ awaiting_payment: 'Waiting for payment', payment_check: 'Checking payment', confirmed: 'Being prepared', ready: 'Ready for pickup!' } as Record<string, string>)[myOrder.status || ''] || 'Track'}</small></span>
        </button>
      )}
      <a className="whatsapp-float" href={whatsappLink()} target="_blank" rel="noopener noreferrer" aria-label="Chat with Mahima Sweets on WhatsApp">
        <span className="whatsapp-float-label">Let’s talk sweets</span>
        <span className="whatsapp-float-icon"><WhatsAppMark size={26} /></span>
      </a>

      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
          <button onClick={() => { setCartOpen(true); setToast(''); }}>
            View bag <ArrowRight size={14} />
          </button>
        </div>
      )}

      {current && (
        <Modal title={current.name} onClose={() => setSelected(null)} className="product-modal">
          <div className={`detail-image ${current.hot ? 'is-hot' : ''}`}>
            <img src={current.image} alt={current.name} />
            {current.hot && <SteamWaves />}
          </div>
          <div className="detail-copy">
            <p className="eyebrow">{current.special || current.tag}</p>
            <h2>{current.name}</h2>
            <p className="detail-desc">{current.description}</p>
            {packOptions(current).length > 1 && (
              <>
                <span className="field-label">Choose your pack</span>
                <div className="pack-chips big">
                  {packOptions(current).map(size => (
                    <button key={size} className={weight === size ? 'active' : ''} onClick={() => setWeight(size)} aria-pressed={weight === size}>
                      {packLabel(current, size)}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="detail-price">
              <strong key={weight} className="price-pop">{money(priceFor(current, weight))}</strong>
              <small>{packLabel(current, weight)}</small>
            </div>
            <button className="button primary full glow" disabled={unavailable(current)} onClick={e => { add(current, weight, e.currentTarget); setSelected(null); }}>
              {unavailable(current) ? <>Sold out today <Ban size={18} /></> : <>Add to bag <Plus size={18} /></>}
            </button>
            <a className="product-whatsapp" href={whatsappLink(`Hi Mahima Sweets! Could you confirm availability and pricing for ${current.name}, ${packLabel(current, weight)}?`)} target="_blank" rel="noopener noreferrer">
              <WhatsAppMark size={18} /> Ask about this on WhatsApp <ArrowUpRight size={14} />
            </a>
            <details className="ingredient-details">
              <summary>
                Allergens &amp; storage <ChevronDown size={16} />
              </summary>
              <p><strong>Allergens:</strong> {current.allergens}</p>
              <p>{current.storage}</p>
              <small>Please confirm ingredients with the shop.</small>
            </details>
          </div>
        </Modal>
      )}

      {cartOpen && (
        <Modal title={checkout ? 'Checkout' : 'Your shopping bag'} onClose={closeCart} className="cart-modal">
          <div className="cart-heading">
            <p className="eyebrow">{checkout ? 'STORE PICKUP' : 'YOUR BAG'}</p>
            <h2>{checkout ? 'The final sweet step.' : 'Your craving collection.'}</h2>
            <p>{checkout ? 'Choose a pickup time and pay a small advance by UPI.' : `${count} ${count === 1 ? 'item' : 'items'} ready to sweeten your day.`}</p>
          </div>
          {!cart.length ? (
            <div className="empty-cart">
              <span className="empty-cart-icon"><ShoppingBag size={40} strokeWidth={1.3} /></span>
              <h3>A little empty. Full of possibilities.</h3>
              <p>Your favourites are waiting.</p>
              <button className="button primary" onClick={() => { closeCart(); document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' }); }}>
                Explore our sweets <ArrowRight size={17} />
              </button>
            </div>
          ) : !checkout ? (
            <>
              <div className="cart-lines">
                {cart.map(i => {
                  const p = catalog.find(p => p.id === i.id);
                  if (!p) return null;
                  return (
                    <div className={`cart-line ${unavailable(p) ? 'is-soldout' : ''}`} key={`${i.id}-${i.grams}`}>
                      <img src={p.image} alt={p.name} />
                      <div className="line-info">
                        <h3>{p.name}</h3>
                        <p>{packLabel(p, i.grams)} · {money(linePrice(i, catalog))}</p>
                        {unavailable(p) && <span className="line-soldout"><Ban size={13} /> Sold out today – please remove</span>}
                        <div className="quantity">
                          <button aria-label={`Decrease ${p.name} quantity`} onClick={() => update(i.id, i.grams, -1)}><Minus size={13} /></button>
                          <span>{i.quantity}</span>
                          <button disabled={i.quantity >= 20} aria-label={`Increase ${p.name} quantity`} onClick={() => update(i.id, i.grams, 1)}><Plus size={13} /></button>
                        </div>
                      </div>
                      <div className="line-end">
                        <strong>{money(linePrice(i, catalog) * i.quantity)}</strong>
                        <button aria-label={`Remove ${p.name}`} onClick={() => setCart(c => c.filter(x => x !== i))}><Trash2 size={15} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="cart-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <strong>{money(subtotal)}</strong>
                </div>
                <p>Store pickup from our shop. Pay {business.advancePercent}% now by UPI, the rest at pickup. Home delivery coming soon.</p>
                {soldOutInBag.length > 0 && <p className="soldout-warning"><Ban size={15} /> Some items in your bag are sold out today. Remove them to continue.</p>}
                <button className="button primary full glow" disabled={soldOutInBag.length > 0} onClick={() => setCheckout(true)}>
                  Continue to checkout <ArrowRight size={17} />
                </button>
                <button className="continue-shopping" onClick={closeCart}>Keep browsing</button>
              </div>
            </>
          ) : (
            <Checkout
              cart={cart}
              subtotal={subtotal}
              count={count}
              business={business}
              onBack={() => setCheckout(false)}
              onPlaced={(placed, token) => {
                saveMyOrder({ id: placed.id, t: token, at: placed.createdAt });
                setCart([]);
                closeCart();
                setTracking({ id: placed.id, t: token, initial: placed });
              }}
            />
          )}
        </Modal>
      )}

      {tracking && (
        <Modal title={`Order ${tracking.id}`} onClose={() => setTracking(null)} className="order-modal">
          <OrderTracker id={tracking.id} token={tracking.t} initial={tracking.initial} business={business} onClose={() => setTracking(null)} />
        </Modal>
      )}
    </>
  );
}
