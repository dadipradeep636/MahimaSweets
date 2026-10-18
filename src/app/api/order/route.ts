import { env } from 'cloudflare:workers';
import { orderRequest } from '@/lib/orders-server.mjs';
import { priceCart } from '@/lib/price-cart';
export const dynamic = 'force-dynamic';
export function GET(request: Request) { return orderRequest(request, env, priceCart); }
export function POST(request: Request) { return orderRequest(request, env, priceCart); }
