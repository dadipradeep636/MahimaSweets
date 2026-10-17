import { env } from 'cloudflare:workers';
import { adminRequest } from '@/lib/shop-server.mjs';
import { catalog } from '@/lib/products';
export const dynamic = 'force-dynamic';
const ids = catalog.map(p => p.id);
export function GET(request: Request) { return adminRequest(request, env, ids); }
export function POST(request: Request) { return adminRequest(request, env, ids); }
