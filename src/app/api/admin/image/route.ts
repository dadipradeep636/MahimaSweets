import { env } from 'cloudflare:workers';
import { adminImageRequest } from '@/lib/shop-server.mjs';
export const dynamic = 'force-dynamic';
export function POST(request: Request) { return adminImageRequest(request, env); }
