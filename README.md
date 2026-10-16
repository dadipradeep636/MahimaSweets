# Mahima Sweets

A responsive Next.js storefront for Mahima Sweets, Gangavathi, Karnataka. Ivory, saffron and plum visual design, custom generated mithai imagery, an interactive Three.js platter, animated gift packaging, product details, weight selection, a persistent browser cart and demo checkout.

## Run on Windows

Install Node.js LTS, Git and VS Code, then open PowerShell in this folder:

```powershell
npm.cmd install
npm.cmd run dev
```

Open the local URL printed in PowerShell (usually http://localhost:3000). Press Ctrl+C to stop. You do not need administrator access or an execution-policy change.

The checked-in pnpm lockfile records the versions used to build the preview. For a reproducible installation, use pnpm 10.28.2 and `pnpm install --frozen-lockfile` instead of npm.

```powershell
npm.cmd run typecheck
npm.cmd run build
```

The build produces an `out` folder suitable for static hosting. `next start` is not used with static export. Use `npm.cmd run dev` locally, or serve `out` with any static web server.

## Spline

The initial version has a working native Three.js scene, so it does not depend on a placeholder or unrelated Spline model. To use your own Spline scene:

1. Create a sweet-shop scene at https://spline.design/.
2. Export it for React/Next.js and copy its `scene.splinecode` URL.
3. Copy `.env.example` to `.env.local`, set `NEXT_PUBLIC_SPLINE_SCENE_URL` to that public URL, and restart/rebuild.

The included `SplineDisplay.tsx` uses the official React Spline package and replaces the interactive platter automatically when configured. Spline hosting/export availability is subject to your Spline plan. A custom Spline scene was not authored or published for this preview.

## Editing

- Products, sample prices, descriptions, allergens: `src/lib/products.ts`.
- Main sections, demo checkout, sample contact details: `src/app/page.tsx`.
- Responsive styling and animation: `src/app/globals.css`.
- Procedural 3D platter: `src/components/SweetScene.tsx`.
- Custom imagery: `public/images/`.

## Shopping behaviour

- Six sweets with 250 g, 500 g and 1 kg selections.
- One fixed 1 kg assorted celebration box.
- Category filters and search, product details and sample allergen/storage notes.
- Cart quantities up to 20 per product/pack combination, removal, browser-local persistence.
- Store pickup or sample local delivery: ₹49 below ₹999, free from ₹999.
- Required name, ten-digit sample phone, delivery address when selected, and demo acknowledgement.
- Optional gift message, confirmation and downloadable itemised demo receipt.
- No backend orders, payment processing, inventory management, customer accounts or admin panel.

## Before public commercial launch

Replace sample prices, zero-filled contact number and opening hours. Add the actual street address, verified product/ingredient/allergen information, shelf lives, food-business disclosures, delivery terms, tax handling, refund/cancellation policy and privacy policy. Connect inventory, a backend order system and a payment provider with verified server-side totals. Do not use this browser-only checkout for real paid orders.

This preview deliberately labels sample data and does not claim certifications, years in business, customer reviews or guarantees that were not supplied. Checkout personal details are not transmitted or persisted by this application. Cart product IDs, pack sizes and quantities are saved in localStorage. Fonts load from Google Fonts; maps open Google Maps; a configured Spline scene loads from Spline. Hosting providers may retain standard access logs.

## Assets

Generated with the built-in image-generation tool, then copied into this project. They illustrate the assortment and are not photographs of actual shop stock. See `ASSET-PROMPTS.md` for the prompt set. The gift box, location illustration and 3D platter are code-native assets.

## Verification

Production static build and TypeScript checks passed. Browser checks covered 250 g pricing, quantity totals, persistence across refresh, sample delivery fees and demo confirmation. The mobile layout was visually inspected at a narrow viewport. Spline integration requires a real published scene URL and has not been tested with a custom shop scene.
