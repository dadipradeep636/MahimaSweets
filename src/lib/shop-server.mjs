/*
 * Owner controls for Mahima Sweets.
 *  - shopRequest:  public, read-only. Which items are sold out, price changes, and the notice banner.
 *  - adminRequest: owner-only. Sign in with the ADMIN_PASSWORD secret, then change stock, prices and the notice.
 * Owner sessions are separate from customer accounts.
 */
const encoder = new TextEncoder();
const COOKIE = '__Host-mahima_admin';
const LIFE = 12 * 3600;
const NOTICE_MAX = 160;
const PRICE_MAX = 100000;
const hex = bytes => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
const random = size => hex(crypto.getRandomValues(new Uint8Array(size)));
const digest = async text => hex(await crypto.subtle.digest('SHA-256', encoder.encode(text)));
async function keyed(value, pepper) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(pepper), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}
function equal(a, b) { if (a.length !== b.length) return false; let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i); return diff === 0; }
function json(body, status = 200, extra = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex', ...extra } });
}
function cookie(token, age = LIFE) { return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`; }
function tokenFrom(request) {
  const tokens = (request.headers.get('cookie') || '').split(';').map(x => x.trim()).filter(x => x.startsWith(COOKIE + '='));
  return tokens.length === 1 ? tokens[0].slice(COOKIE.length + 1) : '';
}
async function bodyJSON(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new Error('body');
  const reader = request.body?.getReader(); if (!reader) throw new Error('body');
  let size = 0; const chunks = [];
  for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 4096) { await reader.cancel(); throw new Error('body'); } chunks.push(value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const c of chunks) { bytes.set(c, offset); offset += c.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
async function limited(db, key, max, seconds, now) {
  const window = Math.floor(now / seconds);
  const row = await db.prepare('INSERT INTO shop_auth_limits (key,attempts,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1 RETURNING attempts').bind(`${key}:${window}`, (window + 1) * seconds).first();
  return row.attempts > max;
}

async function readState(db) {
  const [rows, notice] = await Promise.all([
    db.prepare('SELECT id, sold_out, price FROM shop_items').all(),
    db.prepare("SELECT value FROM shop_settings WHERE key='notice'").first(),
  ]);
  const items = {};
  for (const r of rows.results || []) items[r.id] = { soldOut: !!r.sold_out, price: r.price ?? null };
  let parsed = { text: '', active: false };
  try { if (notice) parsed = { ...parsed, ...JSON.parse(notice.value) }; } catch {}
  return { items, notice: { text: String(parsed.text || '').slice(0, NOTICE_MAX), active: !!parsed.active } };
}

/* Public: GET /api/shop/ */
export async function shopRequest(request, env) {
  if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405, { Allow: 'GET' });
  if (!env.DB) return json({ items: {}, notice: null });
  try {
    const { items, notice } = await readState(env.DB);
    return json({ items, notice: notice.active && notice.text ? { text: notice.text } : null }, 200, { 'Cache-Control': 'public, max-age=0, must-revalidate' });
  } catch {
    // If the tables are not ready yet, the shop simply shows everything as available.
    return json({ items: {}, notice: null });
  }
}

/* Owner: GET/POST /api/admin/ — ids is the list of real product ids the owner may edit. */
export async function adminRequest(request, env, ids) {
  const now = Math.floor(Date.now() / 1000), db = env.DB, pepper = env.ACCOUNT_PEPPER, password = env.ADMIN_PASSWORD;
  if (!db || !pepper || pepper.length < 32 || !password || password.length < 10) return json({ error: 'Shop controls are not set up yet. Add the ADMIN_PASSWORD secret in hosting settings.' }, 503);
  const signedIn = async () => {
    const token = tokenFrom(request);
    if (!/^[a-f0-9]{64}$/.test(token)) return false;
    return !!(await db.prepare('SELECT 1 AS ok FROM shop_admin_sessions WHERE token_hash=? AND expires_at>?').bind(await digest(token), now).first());
  };
  try {
    if (request.method === 'GET') {
      if (!(await signedIn())) return json({ admin: false });
      return json({ admin: true, ...(await readState(db)) });
    }
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, { Allow: 'GET, POST' });
    if (request.headers.get('origin') !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') return json({ error: 'Please use the shop controls page.' }, 403);
    let body; try { body = await bodyJSON(request); } catch { return json({ error: 'Please check and try again.' }, 400); }
    if (!body || typeof body !== 'object') return json({ error: 'Please check and try again.' }, 400);
    const { action } = body;

    if (action === 'login') {
      const ipKey = await keyed(`admin-ip:${request.headers.get('cf-connecting-ip') || 'unknown'}`, pepper);
      if (await limited(db, ipKey, 5, 900, now) || await limited(db, 'admin-all', 30, 3600, now)) return json({ error: 'Too many tries. Please wait 15 minutes and try again.' }, 429, { 'Retry-After': '900' });
      const given = typeof body.password === 'string' ? body.password.slice(0, 200) : '';
      if (!equal(await keyed(`admin:${given}`, pepper), await keyed(`admin:${password}`, pepper))) return json({ error: 'That password is not right.' }, 401);
      const token = random(32);
      await db.batch([
        db.prepare('DELETE FROM shop_admin_sessions WHERE expires_at<?').bind(now),
        db.prepare('DELETE FROM shop_auth_limits WHERE expires_at<?').bind(now),
        db.prepare('INSERT INTO shop_admin_sessions (token_hash,expires_at) VALUES (?,?)').bind(await digest(token), now + LIFE),
      ]);
      return json({ admin: true, ...(await readState(db)) }, 200, { 'Set-Cookie': cookie(token) });
    }
    if (action === 'logout') {
      const token = tokenFrom(request);
      if (token) await db.prepare('DELETE FROM shop_admin_sessions WHERE token_hash=?').bind(await digest(token)).run();
      return json({ admin: false }, 200, { 'Set-Cookie': cookie('', 0) });
    }

    if (!(await signedIn())) return json({ error: 'Please sign in again.' }, 401);

    if (action === 'setItem') {
      const { id } = body;
      if (typeof id !== 'string' || !ids.includes(id)) return json({ error: 'Unknown item.' }, 400);
      const current = await db.prepare('SELECT sold_out, price FROM shop_items WHERE id=?').bind(id).first();
      let soldOut = current ? current.sold_out : 0, price = current ? current.price : null;
      if ('soldOut' in body) { if (typeof body.soldOut !== 'boolean') return json({ error: 'Please check and try again.' }, 400); soldOut = body.soldOut ? 1 : 0; }
      if ('price' in body) {
        if (body.price === null) price = null;
        else if (Number.isInteger(body.price) && body.price >= 1 && body.price <= PRICE_MAX) price = body.price;
        else return json({ error: `Enter a price between ₹1 and ₹${PRICE_MAX}.` }, 400);
      }
      await db.prepare('INSERT INTO shop_items (id,sold_out,price,updated_at) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET sold_out=excluded.sold_out, price=excluded.price, updated_at=excluded.updated_at').bind(id, soldOut, price, now).run();
      return json({ admin: true, ...(await readState(db)) });
    }
    if (action === 'allAvailable') {
      await db.prepare('UPDATE shop_items SET sold_out=0, updated_at=?').bind(now).run();
      return json({ admin: true, ...(await readState(db)) });
    }
    if (action === 'setNotice') {
      const text = typeof body.text === 'string' ? body.text.replace(/\s+/g, ' ').trim() : '';
      if (text.length > NOTICE_MAX) return json({ error: `Keep the notice under ${NOTICE_MAX} letters.` }, 400);
      const active = body.active === true && text.length > 0;
      await db.prepare("INSERT INTO shop_settings (key,value,updated_at) VALUES ('notice',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at").bind(JSON.stringify({ text, active }), now).run();
      return json({ admin: true, ...(await readState(db)) });
    }
    return json({ error: 'Unknown action.' }, 400);
  } catch {
    // Never log passwords, cookies or request bodies.
    return json({ error: 'Something went wrong. Please try again.' }, 503);
  }
}
