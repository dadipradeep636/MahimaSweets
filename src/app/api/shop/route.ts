import { env } from 'cloudflare:workers';
import { shopRequest } from '@/lib/shop-server.mjs';
export const dynamic = 'force-dynamic';
export function GET(request: Request) { return shopRequest(request, env); }
