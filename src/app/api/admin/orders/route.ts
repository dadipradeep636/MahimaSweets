import { env } from 'cloudflare:workers';
import { adminOrderRequest } from '@/lib/orders-server.mjs';
export const dynamic = 'force-dynamic';
export function GET(request: Request) { return adminOrderRequest(request, env); }
export function POST(request: Request) { return adminOrderRequest(request, env); }
