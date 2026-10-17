import { env } from 'cloudflare:workers';
import { accountRequest } from '@/lib/account-server.mjs';
export const dynamic = 'force-dynamic';
export function GET(request:Request){ return accountRequest(request,env); }
export function POST(request:Request){ return accountRequest(request,env); }
