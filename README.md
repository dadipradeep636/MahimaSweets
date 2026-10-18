# Mahima Sweets

A responsive Next.js storefront for Mahima Sweets, Gangavathi, Karnataka. "Royal festive" design (deep maroon and gold by default, with a warm ivory light theme), custom generated mithai imagery, an animated hero platter, an opening gift-box animation, product details, weight selection, a persistent browser cart and demo checkout.

## Run on Windows

Install Node.js LTS, Git and VS Code, then open PowerShell in this folder:

```powershell
npm.cmd install
npm.cmd run dev
```

Open the local URL printed in PowerShell (usually http://localhost:5173). Press Ctrl+C to stop. You do not need administrator access or an execution-policy change.

The checked-in pnpm lockfile records the versions used to build the preview. For a reproducible installation, use pnpm 10.28.2 and `pnpm install --frozen-lockfile` instead of npm.

```powershell
npm.cmd run typecheck
npm.cmd run build
```

The app now builds with the Sites Vinext starter integration to `dist/client` and `dist/server`. It runs on a Cloudflare Worker with D1 for optional accounts; static-only hosting cannot provide account sign-in. Use `npm.cmd run dev` or `npm.cmd start` for local previews.

## Editing

- Products, sample prices, descriptions, allergens: `src/lib/products.ts`.
- Main sections, demo checkout, sample contact details: `src/app/page.tsx`.
- Responsive styling and animation: `src/app/globals.css`.
- Hero platter animation: `src/components/HeroSweets.tsx`.
- Badam Geer section: `src/components/BadamFeature.tsx`.
- Custom imagery: `public/images/`.

## Shopping behaviour

- Nine sweets with 250 g, 500 g and 1 kg selections; four namkeens and two hot snacks with product-specific packs.
- One fixed 1 kg assorted celebration box.
- Category filters and search, product details and sample allergen/storage notes.
- Cart quantities up to 20 per product/pack combination, removal, browser-local persistence.
- Store pickup or sample local delivery: ₹49 below ₹999, free from ₹999.
- Required name, ten-digit sample phone, delivery address when selected, and demo acknowledgement.
- Optional gift message, confirmation and downloadable itemised demo receipt.
- No backend orders, payment processing, inventory management or admin panel. Optional customer accounts are backed by D1.

## Before public commercial launch

Replace sample prices. Shop contact details, location and opening hours have been supplied by the owner. Add the actual street address, verified product/ingredient/allergen information, shelf lives, food-business disclosures, delivery terms, tax handling, refund/cancellation policy and privacy policy. Connect inventory, a backend order system and a payment provider with verified server-side totals. Do not use this browser-only checkout for real paid orders.

This preview deliberately labels sample data and does not claim certifications, years in business, customer reviews or guarantees that were not supplied. Checkout personal details are not transmitted or persisted by this application. Cart product IDs, pack sizes and quantities are saved in localStorage. Fonts load from Google Fonts; maps open Google Maps; Hosting providers may retain standard access logs.

## Assets

Generated with the built-in image-generation tool, then copied into this project. They illustrate the assortment and are not photographs of actual shop stock. See `ASSET-PROMPTS.md` for the prompt set. The gift box, location illustration and 3D platter are code-native assets.

## Verification

Production static build and TypeScript checks passed. Browser checks covered 250 g pricing, quantity totals, persistence across refresh, sample delivery fees and demo confirmation. The mobile layout was visually inspected at a narrow viewport. Spline integration requires a real published scene URL and has not been tested with a custom shop scene.

## Expanded menu and visual polish
The storefront now has nine sweets, a dedicated Namkeens collection (Murukku, Masala Mixture, Aloo Bhujia, Roasted Cornflour Ground Nuts), and Hot & Crispy samosa/pakodi cards with animated steam. All are included in search, product details, the saved cart and demo receipt. Samosas use 2/4/6-piece packs; namkeens and pakodi use 100/250/500 g. The low-detail procedural platter was replaced by a detailed generated food image with CSS perspective, tilting and layered motion; it is not a 360-degree geometric food model. The optional Spline integration remains available. Reduced-motion preferences disable motion. Image prompts are recorded in ASSET-PROMPTS-EXPANSION.md.



Image delivery: WebP copies are served from public/images; original generated PNG assets are retained in artwork-originals. The optimized image set is approximately 4.4 MB instead of 39 MB. The layered preview is image-based perspective animation, not a 360-degree geometric food model.


## Favourites and WhatsApp
Eleven sweets include Bellam Dryfruit Poothrekulu (6/12 pieces) and Dharwad Peda. Our Favourites uses direct pack selectors and accurate pack-based pricing. WhatsApp links open a prefilled, unsent message to the owner-supplied +91 99237 09094. All menu prices remain illustrative. No invented ratings, bestseller or preservative claims are used.

## Badam Geer feature
A full-width animated drink showcase follows samosa/pakodi, with a generated transparent glass photograph, CSS perspective, hover tilt, floating almonds, orbit accents and steam. Pause and reduced-motion support are included. It is layered image-based motion, not a 360-degree glass mesh. The 250/500 ml servings integrate with product details, search, cart, receipt and WhatsApp; rates are samples.

## Colour themes
Header light/dark switch remembers the choice in localStorage (mahima-theme), follows system preference until chosen, and applies before initial paint. Both themes cover the menu, Badam feature, dialogs and cart; food imagery retains its natural colours.

Readability: larger header navigation and product typography; solid full-width Add to cart actions use contrasting colours in both themes. Tablet navigation collapses before desktop links crowd the header.

## Opening hero redesign
Removed all floating copy labels and the stamp from the hero visual. New transparent platter and separate ladoo/kaju assets animate at different depths, with pointer/keyboard tilt, an animated shadow, pause/reset controls, off-screen pause and reduced-motion support. These are detailed raster layers composed in CSS 3D perspective, not a 360-degree mesh or Spline scene. Main image loads eagerly; the three assets are WebP.


## Optional mobile/PIN accounts
The shop is public and never requires an account for browsing, the cart or demo checkout. The header account button supports optional Indian mobile number + four-digit PIN setup and later sign-in on any device. No OTP or ChatGPT sign-in is used. A number is an unverified identifier; this feature must not be used as proof of phone ownership, for payment authority or to reveal sensitive records.

D1 schema is in `db/schema.ts`; generated, schema-only Drizzle migrations live in `drizzle/` and are copied by the Sites build plugin. Set `ACCOUNT_PEPPER` to a cryptographically random server secret (at least 32 characters) through Sites environment settings. Never put the production value in source. Do not rotate it without a deliberate PIN migration/recovery plan: existing PIN hashes depend on it. Local previews use an ignored `.dev.vars` file; built Wrangler previews read it beside their configuration, and it must never be included in a deployment archive.

PINs use a per-account salt, HMAC with the server pepper and PBKDF2-SHA256 (100,000 iterations). The app stores only hashed session tokens and uses Secure, HttpOnly, SameSite=Lax, host-only 30-day cookies. POST requests require a matching Origin. Atomic D1 limits cap attempts per number and IP, with daily caps as well. Users can delete their account with their current PIN; deletion revokes all sessions. Forgotten-PIN recovery is not implemented. Browser carts do not sync between devices.

Run `pnpm db:generate` after schema edits. Build once, then apply the new SQL locally using the starter Wrangler D1 command with `--local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/<new-file>.sql`. Sites applies hosted migrations during deployment. `pnpm test:auth` tests guest sessions, cross-device sign-in, hashing/cookies, logout, invalid input, CSRF, throttling, expiry and account deletion.

## Royal festive redesign (Oct 2026)

- Dark maroon-and-gold theme is now the default; the toggle switches to a warm ivory light theme and remembers the choice.
- Hero: festive light string, rising glow particles, word-by-word headline with gold shimmer, floating platter with pointer parallax, rotating mandala, sparkles, and a quick-add "Kaju Burfi" card.
- Scrolling marquee of sweet names; sections and product cards fade up as they come into view; gold scroll progress line; header shrinks on scroll.
- "Our favourites" is a large bento layout. Product cards are smaller (4 per row on desktop, 2 on phones) with image zoom, shine sweep, quick-look label, price pop on pack change, and an Add button that flies the product into the bag.
- Hot snacks get steam and rising embers; Badam Geer gets bubbles, orbits and floating almonds; the gift box lid opens with sweets and confetti popping out when it scrolls into view.
- Bag opens as a side drawer. Cart, checkout preview, receipts, accounts, WhatsApp links, search and filters work as before.
- The unused `/motion-preview/` concept page and the old `SweetScene`/`SplineDisplay` components were removed. The Spline packages remain in package.json but are no longer used.
- Everything respects the "reduce motion" accessibility setting.

## Shop controls (/admin)

The owner page at `/admin` lets the shop owner, from a phone:

- switch any item between **Available** and **Sold out** (the website greys it out, shows "Sold out today" and disables Add; anyone with it already in their bag is asked to remove it before checkout),
- **change prices** (the price is for the default pack shown next to it; weight-based sweet rates are shown and edited per 1 kg, with 500 g at half that rate; piece-based items retain their piece pricing; "Original ₹…" restores the built-in price),
- show a **notice banner** at the top of the website (up to 160 characters, on/off),
- **Mark everything available** in one go (tap twice to confirm).

Customers see changes within a minute (or immediately on refresh).

**Setup (one time):** add a hosting secret named `ADMIN_PASSWORD` (at least 10 characters) alongside the existing `ACCOUNT_PEPPER`, then redeploy. Without it the controls stay locked. The new database tables come from `drizzle/0001_owner_controls.sql` and are applied with the existing migrations.

**Security:** owner sign-in is separate from customer accounts; the session cookie is HttpOnly, Secure and SameSite=Strict and lasts 12 hours; 5 wrong passwords from one connection lock sign-in for 15 minutes (30 per hour overall); every change is checked on the server against the real product list; the page is hidden from search engines.

Code: `src/app/admin/`, `src/lib/shop-server.mjs`, `src/app/api/shop/`, `src/app/api/admin/`. Tests: `npm test`.

For local testing, put `ACCOUNT_PEPPER` and `ADMIN_PASSWORD` test values in `.dev.vars` (git-ignored) and apply migrations to the local database.

### Adding and editing items (/admin)

- **Add new item**: photo (cropped square and resized in the browser), name, where it shows (Sweets / Namkeens / Hot & Crispy, plus sweet type for the filters), how it is sold (250 g · 500 g · 1 kg priced per 1 kg; 100 g · 250 g · 500 g priced per 250 g; or by pieces with 1×/2× packs), price. Optional: short line, label on the photo (red "special" style), description, allergens, storage. A live preview uses the real website card component (`src/components/ProductCard.tsx`).
- **Edit any item**, including the built-in 19: text, photo, label, sweet type and price. Built-in items keep their section and pack sizes; "Undo all my changes" restores the original. Added items can be fully changed or deleted.
- **Hide** any item without deleting it; hidden items disappear from the menu, search and showcase, and block checkout if already in a bag.
- **"Our favourites" showcase**: pick the four items; deleted or hidden picks fall back to the originals.

Data: `shop_products` (edits and added items) and `shop_images` (photos as base64, served from `/api/image/?id=…` with long caching) from `drizzle/0002_products_and_photos.sql`. Upload endpoint `/api/admin/image/` accepts JPEG/PNG/WebP up to 1.5 MB (checked by file signature); unused uploads are removed after a day. The website builds its menu with `buildCatalog()` in `src/lib/products.ts`.

## Pickup orders, UPI advance and policies (Oct 2026)

Online checkout now places **real store-pickup orders** (home delivery is shown as "Coming soon").

**Customer journey:** bag → choose pickup day/time (30-minute slots, 9:00 AM – 9:00 PM IST, at least the "getting-ready time" from now, up to 7 days ahead) → name + mobile → pay the minimum advance (default 25%) or the full amount → place order → payment page with the shop's UPI QR, a "Pay with a UPI app" button (`upi://pay` link with the exact amount) and the UPI ID → customer enters the 12-digit UPI reference → live order page (`/order/?id=…&t=…`) showing every step, auto-refreshing. Customers can cancel within **30 minutes** (refund due if they had paid). Unpaid orders lapse after 2 hours. A "Your order" button on the website brings them back to the latest open order (saved in the browser).

**Shop owner (/admin → Orders):** new orders appear automatically with a chime. Steps: *Payment found* (or *Not found*, which asks the customer to recheck) → *Mark ready* (+ "Tell customer" WhatsApp) → *Picked up · got ₹balance*. Also *Cancel* (with a reason the customer sees; refund marked due if paid), *Not collected* (advance kept per policy) and *Mark refund sent*.

**Shop details (/admin → Shop details):** UPI ID, QR photo, name in UPI app, minimum advance (25–100%), getting-ready time, business name, owner, **FSSAI number (leave empty until available; once set it appears in the footer, Terms and receipts)**, customer email and **Grievance Officer** (name, mobile, email). Online orders stay closed (customers are asked to call/WhatsApp) until a UPI ID or QR is added.

**Policies:** `/privacy/` (DPDP Act 2023 / Rules 2025), `/terms/` and `/refund-policy/` (cancel within 30 min; damaged or wrong items reported within 2 hours with a photo → replace or refund; refunds to the same UPI in 5–7 working days; uncollected orders keep the advance). They read the live shop details. Have a CA or lawyer review before relying on them.

**Code:** `src/lib/orders-server.mjs` (order rules; totals are always recalculated on the server via `src/lib/price-cart.ts`), `src/lib/pickup.mjs` (slot rules shared by browser and server), `src/components/Checkout.tsx`, `src/components/OrderTracker.tsx`, `src/app/admin/OrdersPanel.tsx`, `src/app/admin/ShopDetails.tsx`, `src/components/LegalPage.tsx`. Table `shop_orders` from `drizzle/0003_pickup_orders.sql`. Tests: `tests/orders.test.mjs`.

Note: UPI payments go straight to the shop's account, so the shop confirms each payment by matching the amount and UPI reference in its bank/UPI business app. Automatic confirmation would need a payment gateway (e.g. Razorpay, Cashfree), which can be added later.

## Homepage animation (owner can switch)

`/admin → Shop details → Homepage animation` picks what greets customers at the top of the homepage:

- **Zero Gravity** (3D) – real cut-out photos of our sweets (`public/images/float/`) levitate above a glowing ring, dissolve into thousands of sugar pearls coloured from the photo, swirl weightlessly and gather into the next sweet (ladoo, poothrekulu, rasmalai, jalebi, coconut burfi, Dharwad peda). Pearls part around the mouse; a tap scatters them.
- **Golden Orbit** (true 3D) – a festive thali in the centre with sweets orbiting it; tilts with the mouse.
- **Sweet Rain** (true 3D) – sweets tumble in slow motion and settle on a brass plate, with falling silver varq.
- **Diwali Glow** (2.5D) – the real platter photo on a rangoli, flickering diyas, marigold petals, steam.
- **Classic** – the original floating platter.

The 3D sweets are modelled in code with three.js (`src/components/hero/`), loaded only when a 3D style is chosen.
Scenes pause when off-screen or in a background tab, use lighter models on phones, show a still frame for
"reduce motion" users, and fall back to Classic if the device has no WebGL. `/?hero=zerog|orbit|rain|diwali|classic`
previews a style without saving it. The choice is stored in `shop_settings` (key `hero`) – no new migration.
