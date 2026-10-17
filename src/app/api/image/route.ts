import { env } from 'cloudflare:workers';
import { imageRequest } from '@/lib/shop-server.mjs';
export const dynamic = 'force-dynamic';
export function GET(request: Request) { return imageRequest(request, env); }
