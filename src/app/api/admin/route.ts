import { env } from 'cloudflare:workers';
import { adminRequest } from '@/lib/shop-server.mjs';
import { catalog, defaultPriceScale, sectionOf } from '@/lib/products';
export const dynamic = 'force-dynamic';
const info = {
  ids: catalog.map(p => p.id),
  priceScales: Object.fromEntries(catalog.map(p => [p.id, defaultPriceScale(p)])),
  sections: Object.fromEntries(catalog.map(p => [p.id, sectionOf(p)])),
  prices: Object.fromEntries(catalog.map(p => [p.id, p.price])),
};
export function GET(request: Request) { return adminRequest(request, env, info); }
export function POST(request: Request) { return adminRequest(request, env, info); }
