'use client';

import { useEffect, useRef, useState } from 'react';
import BadamFeature from '@/components/BadamFeature';
import ThemeToggle from '@/components/ThemeToggle';
import AccountButton from '@/components/AccountButton';
import HeroSweets from '@/components/HeroSweets';
import { shop, whatsappLink, shopDirectionsUrl, shopMapUrl, shopMapEmbedUrl } from '@/lib/shop';
import { ArrowRight, ArrowUpRight, ShoppingBag, Plus, Minus, X, MapPin, Phone, Clock3, Leaf, Gift, Heart, Sparkles, Check, Trash2, Search, Menu, Package, Truck, ChevronDown, CheckCircle2, Eye, Flame, Store } from 'lucide-react';
import { products, namkeens, hotItems, gift, catalog, money, linePrice, defaultPack, packOptions, packLabel, priceFor, type Product, type CartItem } from '@/lib/products';

const categories = ['All sweets', 'Traditional', 'Dry fruit', 'Milk sweets', 'Syrupy'];
const marqueeWords = ['Motichoor Ladoo', 'Kaju Burfi', 'Ghee Mysore Pak', 'Dharwad Peda', 'Gulab Jamun', 'Crispy Jalebi', 'Kesar Rasmalai', 'Badam Halwa', 'Crispy Murukku', 'Punjabi Samosa', 'Badam Geer', 'Poothrekulu'];
const faqs = [
  ['Can I choose different pack sizes?', 'Yes. Sweets come in 250 g, 500 g and 1 kg packs. Namkeens come in 100 g, 250 g and 500 g. Samosas come in packs of 2, 4 or 6 pieces, and pakodi in 100 g, 250 g and 500 g. Badam Geer comes in 250 ml and 500 ml. The celebration box is a fixed 1 kg assortment. Prices shown are samples.'],
  ['Can I mix sweets, namkeens and hot snacks?', 'Absolutely. Add anything you like to one bag. The preview shows store pickup, or local delivery at ₹49 (free from ₹999). Please confirm hot-snack availability and timings with the shop.'],
  ['Can I add a gift message?', 'Yes. Add a celebration box, then write a personal note at checkout. The note appears on your receipt.'],
  ['What about allergies and storage?', 'Open any product to see ingredient and storage notes. Sweets can contain milk, nuts and wheat, and shared preparation may cause cross-contact. Please confirm ingredients and shelf life with the shop.'],
  ['Does online checkout place a real order?', 'Not yet. Online checkout is a preview: no payment is taken and no order is sent to the shop. To order today, call us or message us on WhatsApp.'],
];

/* Festive light string across the top of the hero. Points are calculated once, so markup is identical on server and browser. */
const lightPoints = Array.from({ length: 49 }, (_, i) => {
  const x = i * 25;
  const y = 6 + 34 * Math.sin((Math.PI * (x % 300)) / 300);
  return [x, Math.round(y * 10) / 10] as const;
});
const lightPath = 'M' + Array.from({ length: 121 }, (_, i) => `${i * 10} ${Math.round((6 + 34 * Math.sin((Math.PI * ((i * 10) % 300)) / 300)) * 10) / 10}`).join(' L');

function FestiveLights() {
  return (
    <svg className="festive-lights" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true">
      <path d={lightPath} />
      {lightPoints.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <circle className={`bulb b${i % 3}`} r="4" cy="5" style={{ animationDelay: `${(i % 6) * 0.35}s` }} />
        </g>
      ))}
    </svg>
  );
}

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

function SteamWaves() {
  return (
    <svg className="steam" viewBox="0 0 240 200" aria-hidden="true">
      <path d="M65 185 C20 145 105 125 65 83 C28 42 80 20 63 -10" />
      <path d="M125 195 C80 155 165 130 125 90 C88 48 140 25 123 -5" />
      <path d="M185 185 C140 145 225 125 185 83 C148 42 200 20 183 -10" />
    </svg>
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

type AddFn = (p: Product, size?: number, from?: HTMLElement) => void;

function ProductCard({ product: p, index, open, add, className = '' }: { product: Product; index: number; open: (p: Product) => void; add: AddFn; className?: string }) {
  const [pack, setPack] = useState(defaultPack(p));
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <article className={`card ${p.hot ? 'is-hot' : ''} ${className}`} style={{ '--i': index } as React.CSSProperties}>
      <button className="card-media" onClick={() => open(p)} aria-label={`View ${p.name} details`}>
        <img src={p.image} alt={p.name} loading="lazy" />
        {p.hot && <SteamWaves />}
        <span className={`card-badge ${p.special ? 'is-special' : ''}`}>
          {p.hot && <Flame size={12} />}
          {p.special || p.tag}
        </span>
        <span className="card-peek">
          <Eye size={15} /> Quick look
        </span>
        <span className="card-shine" aria-hidden="true" />
      </button>
      <div className="card-body">
        <button className="card-title" onClick={() => open(p)}>
          <h3>{p.name}</h3>
        </button>
        <p className="card-sub">{p.subtitle}</p>
        {packOptions(p).length > 1 && (
          <div className="pack-chips" role="group" aria-label={`Choose pack for ${p.name}`}>
            {packOptions(p).map(size => (
              <button key={size} className={pack === size ? 'active' : ''} aria-pressed={pack === size} onClick={() => setPack(size)}>
                {packLabel(p, size)}
              </button>
            ))}
          </div>
        )}
        <div className="card-foot">
          <div className="card-price">
            <strong key={pack} className="price-pop">{money(priceFor(p, pack))}</strong>
            <span>{packLabel(p, pack)}</span>
          </div>
          <button
            className={`add-btn ${added ? 'is-added' : ''}`}
            aria-label={`Add ${packLabel(p, pack)} of ${p.name} to bag`}
            onClick={e => {
              add(p, pack, e.currentTarget);
              setAdded(true);
              clearTimeout(timer.current);
              timer.current = setTimeout(() => setAdded(false), 1500);
            }}
          >
            {added ? <Check size={17} /> : <Plus size={17} />}
            <span>{added ? 'Added' : 'Add'}</span>
          </button>
        </div>
      </div>
    </article>
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
  const [fulfilment, setFulfilment] = useState('pickup');
  const [order, setOrder] = useState<{ id: string; total: number; method: string; lines: string[]; subtotal: number; delivery: number } | null>(null);
  const [policy, setPolicy] = useState<string | null>(null);
  const [giftNote, setGiftNote] = useState('');

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('mahima-cart-v1') || '[]');
      if (Array.isArray(raw))
        setCart(raw.filter((i: CartItem) => {
          const p = i && catalog.find(p => p.id === i.id);
          return p && packOptions(p).includes(i.grams) && Number.isInteger(i.quantity) && i.quantity > 0 && i.quantity <= 20;
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

  const count = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((s, i) => s + linePrice(i) * i.quantity, 0);
  const delivery = fulfilment === 'delivery' && subtotal > 0 && subtotal < 999 ? 49 : 0;
  const filtered = (query ? catalog.filter(p => p.id !== 'gift') : products).filter(
    p => (query || category === 'All sweets' || p.category === category) && `${p.name} ${p.subtitle} ${p.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  const add: AddFn = (product, grams = defaultPack(product), from) => {
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
  const katli = catalog.find(p => p.id === 'katli')!;
  const navLinks: [string, string][] = [['#favourites', 'Specials'], ['#collection', 'Sweets'], ['#namkeens', 'Namkeens'], ['#hot-snacks', 'Hot & Crispy'], ['#gifting', 'Gift boxes'], ['#visit', 'Visit us']];

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <div className="scroll-progress" aria-hidden="true" />

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
          <FestiveLights />
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
            <p className="hero-description">Melt-in-your-mouth mithai, can’t-stop crunchy namkeens, and hot snacks that steal the chai-time spotlight.</p>
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
              <li><Truck size={15} /> Local delivery</li>
              <li><Gift size={15} /> Gift boxes</li>
            </ul>
          </div>
          <HeroSweets onPick={el => add(katli, 500, el)} />
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
            {['poothrekulu', 'katli', 'dharwad', 'mysore'].map((id, index) => (
              <ProductCard key={id} className={`spot spot-${index}`} product={catalog.find(p => p.id === id)!} index={index} open={openProduct} add={add} />
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
            <p className="lead">Chai’s best friends. Movie-night essentials. Your “just one handful” favourites.</p>
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
                <Flame size={13} /> THE CHAI-TIME TAKEOVER
              </p>
              <h2>
                Hot bites. <em>Zero small talk.</em>
              </h2>
            </div>
            <p className="lead">That first crunch says it all. Meet the golden duo your chai deserves.</p>
          </div>
          <div className="grid hot-grid reveal-grid">
            {hotItems.map((p, index) => (
              <ProductCard key={p.id} product={p} index={index} open={openProduct} add={add} className="wide" />
            ))}
          </div>
          <p className="fine-print">Hot snacks are made through the day. Call to check what’s fresh right now.</p>
        </section>

        <BadamFeature add={add} open={openProduct} />

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
                <button className="button primary glow" onClick={() => openProduct(gift)}>
                  Make someone’s day <Gift size={18} />
                </button>
              </div>
              <p className="gift-small">
                Ordering for a wedding or a big function? <a href="#visit">Talk to us</a>.
              </p>
            </div>
          </div>
        </section>

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
                Chai plans? <em>Make us the stop.</em>
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
          <span>© {new Date().getFullYear()} Mahima Sweets · Gangavathi, Karnataka</span>
          <div>
            <button onClick={() => setPolicy('Privacy')}>Privacy</button>
            <button onClick={() => setPolicy('Ordering & returns')}>Ordering &amp; returns</button>
            <span>Online checkout is a preview · call or WhatsApp to order</span>
          </div>
        </div>
      </footer>

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

      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)} className="product-modal">
          <div className={`detail-image ${selected.hot ? 'is-hot' : ''}`}>
            <img src={selected.image} alt={selected.name} />
            {selected.hot && <SteamWaves />}
          </div>
          <div className="detail-copy">
            <p className="eyebrow">{selected.special || selected.tag}</p>
            <h2>{selected.name}</h2>
            <p className="detail-desc">{selected.description}</p>
            {packOptions(selected).length > 1 && (
              <>
                <span className="field-label">Choose your pack</span>
                <div className="pack-chips big">
                  {packOptions(selected).map(size => (
                    <button key={size} className={weight === size ? 'active' : ''} onClick={() => setWeight(size)} aria-pressed={weight === size}>
                      {packLabel(selected, size)}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="detail-price">
              <strong key={weight} className="price-pop">{money(priceFor(selected, weight))}</strong>
              <small>{packLabel(selected, weight)}</small>
            </div>
            <button className="button primary full glow" onClick={e => { add(selected, weight, e.currentTarget); setSelected(null); }}>
              Add to bag <Plus size={18} />
            </button>
            <a className="product-whatsapp" href={whatsappLink(`Hi Mahima Sweets! Could you confirm availability and pricing for ${selected.name}, ${packLabel(selected, weight)}?`)} target="_blank" rel="noopener noreferrer">
              <WhatsAppMark size={18} /> Ask about this on WhatsApp <ArrowUpRight size={14} />
            </a>
            <details className="ingredient-details">
              <summary>
                Allergens &amp; storage <ChevronDown size={16} />
              </summary>
              <p><strong>Allergens:</strong> {selected.allergens}</p>
              <p>{selected.storage}</p>
              <small>Please confirm ingredients with the shop.</small>
            </details>
          </div>
        </Modal>
      )}

      {cartOpen && (
        <Modal title={checkout ? 'Checkout' : 'Your shopping bag'} onClose={closeCart} className="cart-modal">
          <div className="cart-heading">
            <p className="eyebrow">{checkout ? 'ALMOST THERE' : 'YOUR BAG'}</p>
            <h2>{checkout ? 'The final sweet step.' : 'Your craving collection.'}</h2>
            <p>{checkout ? 'Review your order. This is a preview: no payment is taken and no order is sent.' : `${count} ${count === 1 ? 'item' : 'items'} ready to sweeten your day.`}</p>
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
                  const p = catalog.find(p => p.id === i.id)!;
                  return (
                    <div className="cart-line" key={`${i.id}-${i.grams}`}>
                      <img src={p.image} alt={p.name} />
                      <div className="line-info">
                        <h3>{p.name}</h3>
                        <p>{packLabel(p, i.grams)} · {money(linePrice(i))}</p>
                        <div className="quantity">
                          <button aria-label={`Decrease ${p.name} quantity`} onClick={() => update(i.id, i.grams, -1)}><Minus size={13} /></button>
                          <span>{i.quantity}</span>
                          <button disabled={i.quantity >= 20} aria-label={`Increase ${p.name} quantity`} onClick={() => update(i.id, i.grams, 1)}><Plus size={13} /></button>
                        </div>
                      </div>
                      <div className="line-end">
                        <strong>{money(linePrice(i) * i.quantity)}</strong>
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
                <p>Delivery is worked out at checkout. Free delivery from ₹999.</p>
                <button className="button primary full glow" onClick={() => setCheckout(true)}>
                  Continue to checkout <ArrowRight size={17} />
                </button>
                <button className="continue-shopping" onClick={closeCart}>Keep browsing</button>
              </div>
            </>
          ) : (
            <form
              className="checkout-form"
              onSubmit={e => {
                e.preventDefault();
                setOrder({
                  id: `MS-DEMO-${Date.now().toString().slice(-6)}`,
                  total: subtotal + delivery,
                  method: fulfilment,
                  subtotal,
                  delivery,
                  lines: cart.map(i => {
                    const p = catalog.find(p => p.id === i.id)!;
                    return `${p.name} — ${packLabel(p, i.grams)} × ${i.quantity}: ${money(linePrice(i) * i.quantity)}`;
                  }),
                });
                closeCart();
                setCart([]);
              }}
            >
              <div className="checkout-disclaimer">
                <Sparkles size={17} />
                <span>Preview only. Use sample details; nothing is sent to the shop.</span>
              </div>
              <div className="fulfilment-options">
                <button type="button" className={fulfilment === 'pickup' ? 'active' : ''} onClick={() => setFulfilment('pickup')}>
                  <Package size={19} />
                  <strong>Store pickup</strong>
                  <span>No delivery fee</span>
                </button>
                <button type="button" className={fulfilment === 'delivery' ? 'active' : ''} onClick={() => setFulfilment('delivery')}>
                  <Truck size={19} />
                  <strong>Local delivery</strong>
                  <span>Gangavathi only</span>
                </button>
              </div>
              <div className="form-grid">
                <label>Your name<input name="name" autoComplete="off" placeholder="Sample Customer" required maxLength={80} /></label>
                <label>Mobile number<input name="phone" type="tel" autoComplete="off" placeholder="0000000000" inputMode="numeric" pattern="[0-9]{10}" title="Enter a 10-digit sample mobile number" required /></label>
              </div>
              {fulfilment === 'delivery' && (
                <label>Delivery address in Gangavathi<textarea name="address" placeholder="Sample street, Gangavathi, Karnataka" required minLength={10} maxLength={300} /></label>
              )}
              <label>
                Gift message <span>(optional)</span>
                <textarea value={giftNote} onChange={e => setGiftNote(e.target.value)} maxLength={200} placeholder="A little sweetness, with lots of love." />
              </label>
              <div className="checkout-totals">
                <div><span>Subtotal ({count} items)</span><b>{money(subtotal)}</b></div>
                <div><span>{fulfilment === 'pickup' ? 'Store pickup' : 'Local delivery'}</span><b>{delivery ? money(delivery) : 'Free'}</b></div>
                {fulfilment === 'delivery' && subtotal < 999 && <small>Free delivery from ₹999</small>}
                <div className="total-row"><span>Total</span><strong>{money(subtotal + delivery)}</strong></div>
              </div>
              <label className="consent">
                <input type="checkbox" required />
                <span>I understand this is a preview and no real order or payment will be processed.</span>
              </label>
              <button className="button primary full glow" type="submit">Complete preview order <ArrowRight size={17} /></button>
              <button type="button" className="continue-shopping" onClick={() => setCheckout(false)}>Back to bag</button>
            </form>
          )}
        </Modal>
      )}

      {order && (
        <Modal title="Order preview complete" onClose={() => setOrder(null)} className="success-modal">
          <div className="success-content">
            <span className="success-icon"><Check size={34} /></span>
            <p className="eyebrow">THAT WAS SWEET</p>
            <h2>
              A little joy, <em>all wrapped up.</em>
            </h2>
            <p>Your preview checkout is complete. No payment was taken and no order was sent. To order for real, call {shop.phone} or message us on WhatsApp.</p>
            <div className="order-receipt">
              <div><span>Reference</span><strong>{order.id}</strong></div>
              <div className="receipt-lines">{order.lines.map((line, index) => <p key={index}>{line}</p>)}</div>
              <div><span>{order.method === 'pickup' ? 'Store pickup' : 'Local delivery'}</span><strong>{money(order.total)}</strong></div>
              {giftNote && <p>Gift note: {giftNote}</p>}
            </div>
            <button
              className="button primary full"
              onClick={() => {
                const content = `MAHIMA SWEETS — PREVIEW RECEIPT\n${order.id}\nLocation: Gangavathi, Karnataka\nFulfilment: ${order.method}\nItems:\n${order.lines.join('\n')}\nSubtotal: ${money(order.subtotal)}\nDelivery: ${money(order.delivery)}\nSample total: ${money(order.total)}\nGift note: ${giftNote || 'None'}\n\nPREVIEW ONLY — NO ORDER PLACED. NO PAYMENT TAKEN.`;
                const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
                const a = document.createElement('a');
                a.href = url;
                a.download = `${order.id}.txt`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
            >
              Download receipt <ArrowDownIcon />
            </button>
            <button className="continue-shopping" onClick={() => { setOrder(null); setGiftNote(''); }}>Back to the sweet life</button>
          </div>
        </Modal>
      )}

      {policy && (
        <Modal title={policy} onClose={() => setPolicy(null)} className="policy-modal">
          <p className="eyebrow">MAHIMA SWEETS</p>
          <h2>{policy}</h2>
          {policy === 'Privacy' ? (
            <>
              <p>This website saves product IDs, pack sizes and quantities in your browser’s local storage so your bag survives a refresh. You can remove them by emptying your bag or clearing this site’s browser data.</p>
              <p>Optional accounts store your mobile number and a protected PIN hash on the server. A secure sign-in cookie lasts up to 30 days. You can delete your account from the Account menu. Sign-in attempts are limited to protect accounts; temporary security counters expire automatically. Mobile numbers are not verified by OTP. Your shopping bag remains saved on this browser.</p>
              <p>Checkout details are used only in this page’s temporary state. They are not sent to Mahima Sweets or saved by this application. Hosting providers may process standard access logs under their own policies.</p>
              <p>Product photos are illustrations. The embedded map loads content from Google Maps, and map and directions links open Google Maps. Google privacy terms apply.</p>
            </>
          ) : (
            <>
              <p>Product images, prices, ingredients, delivery fees and gift assortments on this website are illustrative.</p>
              <p>Online checkout is a preview only. It does not reserve stock, place an order, collect payment or notify the shop. Delivery is shown at ₹49, free from ₹999; pickup is free. To place a real order, please call or message the shop on WhatsApp.</p>
              <p>Please confirm availability, ingredients, delivery areas, cancellation and refunds directly with the shop.</p>
            </>
          )}
        </Modal>
      )}
    </>
  );
}

function ArrowDownIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5" />
    </svg>
  );
}
