/*
 * Owner controls for Mahima Sweets.
 *  - shopRequest:        public, read-only. Sold-out flags, price changes, product edits, added items, favourites, notice.
 *  - imageRequest:       public. Serves product photos uploaded by the owner.
 *  - adminRequest:       owner-only JSON actions (sign in with the ADMIN_PASSWORD secret).
 *  - adminImageRequest:  owner-only photo upload (already cropped and resized in the browser).
 * Owner sessions are separate from customer accounts.
 */
const encoder = new TextEncoder();
const COOKIE = '__Host-mahima_admin';
const LIFE = 12 * 3600;
const NOTICE_MAX = 160;
const PRICE_MAX = 100000;
const IMAGE_MAX = 1_500_000;
const CUSTOM_MAX = 120;
const SWEET_CATEGORIES = ['Traditional', 'Dry fruit', 'Milk sweets', 'Syrupy'];
const SECTIONS = { sweets: null, namkeens: 'Namkeens', hot: 'Hot & Crispy' };
const SELL_TYPES = ['large', 'small', 'pieces'];

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
async function readBody(request, max) {
  const reader = request.body?.getReader(); if (!reader) throw new Error('body');
  let size = 0; const chunks = [];
  for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > max) { await reader.cancel(); throw new Error('body'); } chunks.push(value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const c of chunks) { bytes.set(c, offset); offset += c.length; }
  return bytes;
}
async function bodyJSON(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new Error('body');
  return JSON.parse(new TextDecoder().decode(await readBody(request, 8192)));
}
async function limited(db, key, max, seconds, now) {
  const window = Math.floor(now / seconds);
  const row = await db.prepare('INSERT INTO shop_auth_limits (key,attempts,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1 RETURNING attempts').bind(`${key}:${window}`, (window + 1) * seconds).first();
  return row.attempts > max;
}
async function signedIn(request, db, now) {
  const token = tokenFrom(request);
  if (!/^[a-f0-9]{64}$/.test(token)) return false;
  return !!(await db.prepare('SELECT 1 AS ok FROM shop_admin_sessions WHERE token_hash=? AND expires_at>?').bind(await digest(token), now).first());
}
function sameOrigin(request) {
  return request.headers.get('origin') === new URL(request.url).origin && request.headers.get('sec-fetch-site') !== 'cross-site';
}
function toBase64(bytes) { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); }
function fromBase64(text) { const s = atob(text); const out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out; }
function sniff(bytes) {
  if (bytes.length > 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'image/webp';
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  return null;
}
/* Plain text only: trims, removes control characters, collapses spaces, caps length. */
const clean = (value, max) => (typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '');
const imageUrl = id => `/api/image/?id=${id}`;

async function readState(db) {
  const [rows, notice, products, favourites] = await Promise.all([
    db.prepare('SELECT id, sold_out, price FROM shop_items').all(),
    db.prepare("SELECT value FROM shop_settings WHERE key='notice'").first(),
    db.prepare('SELECT id, custom, hidden, data, image_id FROM shop_products ORDER BY created_at, id').all(),
    db.prepare("SELECT value FROM shop_settings WHERE key='favourites'").first(),
  ]);
  const items = {};
  for (const r of rows.results || []) items[r.id] = { soldOut: !!r.sold_out, price: r.price ?? null };
  let parsed = { text: '', active: false };
  try { if (notice) parsed = { ...parsed, ...JSON.parse(notice.value) }; } catch {}
  const list = [];
  for (const r of products.results || []) {
    let data = {};
    try { data = JSON.parse(r.data); } catch {}
    list.push({ id: r.id, custom: !!r.custom, hidden: !!r.hidden, data: { ...data, ...(r.image_id ? { image: imageUrl(r.image_id) } : {}) } });
  }
  let favs = null;
  try { if (favourites) favs = JSON.parse(favourites.value); } catch {}
  return { items, notice: { text: String(parsed.text || '').slice(0, NOTICE_MAX), active: !!parsed.active }, products: list, favourites: Array.isArray(favs) ? favs : null };
}

/* Public: GET /api/shop/ */
export async function shopRequest(request, env) {
  const empty = { items: {}, notice: null, products: [], favourites: null };
  if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405, { Allow: 'GET' });
  if (!env.DB) return json(empty);
  try {
    const { items, notice, products, favourites } = await readState(env.DB);
    return json({ items, notice: notice.active && notice.text ? { text: notice.text } : null, products, favourites }, 200, { 'Cache-Control': 'public, max-age=0, must-revalidate' });
  } catch {
    // If the tables are not ready yet, the shop simply shows the built-in menu, all available.
    return json(empty);
  }
}

/* Public: GET /api/image/?id=… */
export async function imageRequest(request, env) {
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!/^[a-f0-9]{24}$/.test(id) || !env.DB) return new Response('Not found', { status: 404 });
  try {
    const row = await env.DB.prepare('SELECT mime, data FROM shop_images WHERE id=?').bind(id).first();
    if (!row) return new Response('Not found', { status: 404 });
    return new Response(fromBase64(row.data), { headers: { 'Content-Type': row.mime, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'" } });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}

function setupMissing(env) {
  const pepper = env.ACCOUNT_PEPPER, password = env.ADMIN_PASSWORD;
  return !env.DB || !pepper || pepper.length < 32 || !password || password.length < 10;
}
const NOT_SET_UP = 'Shop controls are not set up yet. Add the ADMIN_PASSWORD secret in hosting settings.';

/* Owner: POST /api/admin/image/ with the photo as the request body. */
export async function adminImageRequest(request, env) {
  const now = Math.floor(Date.now() / 1000), db = env.DB;
  if (setupMissing(env)) return json({ error: NOT_SET_UP }, 503);
  try {
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, { Allow: 'POST' });
    if (!sameOrigin(request)) return json({ error: 'Please use the shop controls page.' }, 403);
    if (!(await signedIn(request, db, now))) return json({ error: 'Please sign in again.' }, 401);
    if (await limited(db, 'admin-upload', 120, 3600, now)) return json({ error: 'Too many photos this hour. Please try later.' }, 429);
    let bytes; try { bytes = await readBody(request, IMAGE_MAX); } catch { return json({ error: 'That photo is too big. Please try another one.' }, 413); }
    const mime = sniff(bytes);
    if (!mime) return json({ error: 'Please choose a photo (JPG, PNG or WebP).' }, 415);
    const id = random(12);
    await db.batch([
      // Tidy up photos that were uploaded but never used in a saved item.
      db.prepare('DELETE FROM shop_images WHERE created_at<? AND id NOT IN (SELECT image_id FROM shop_products WHERE image_id IS NOT NULL)').bind(now - 86400),
      db.prepare('INSERT INTO shop_images (id,mime,data,created_at) VALUES (?,?,?,?)').bind(id, mime, toBase64(bytes), now),
    ]);
    return json({ id, url: imageUrl(id) });
  } catch {
    return json({ error: 'Could not save the photo. Please try again.' }, 503);
  }
}

/*
 * Owner: GET/POST /api/admin/
 * info = { ids: built-in product ids, priceScales: {id: scale from stored price to the price shown in admin},
 *          sections: {id: 'sweets'|'namkeens'|'hot'|'drink'|'gift'}, prices: {id: built-in price} }
 * (A plain array of ids is also accepted, for older callers and tests.)
 */
export async function adminRequest(request, env, info = {}, legacyScales) {
  if (Array.isArray(info)) info = { ids: info, priceScales: legacyScales || {} };
  const builtinIds = info.ids || [], priceScales = info.priceScales || {}, sections = info.sections || {}, basePrices = info.prices || {};
  const now = Math.floor(Date.now() / 1000), db = env.DB, pepper = env.ACCOUNT_PEPPER, password = env.ADMIN_PASSWORD;
  if (setupMissing(env)) return json({ error: NOT_SET_UP }, 503);
  const state = async extra => json({ admin: true, ...(await readState(db)), ...extra });
  const customRow = id => db.prepare('SELECT id, data, image_id, hidden FROM shop_products WHERE id=? AND custom=1').bind(id).first();
  const known = async id => typeof id === 'string' && (builtinIds.includes(id) || !!(await customRow(id)));
  const imageExists = async id => typeof id === 'string' && /^[a-f0-9]{24}$/.test(id) && !!(await db.prepare('SELECT 1 AS ok FROM shop_images WHERE id=?').bind(id).first());
  try {
    if (request.method === 'GET') {
      if (!(await signedIn(request, db, now))) return json({ admin: false });
      return state();
    }
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, { Allow: 'GET, POST' });
    if (!sameOrigin(request)) return json({ error: 'Please use the shop controls page.' }, 403);
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

    if (!(await signedIn(request, db, now))) return json({ error: 'Please sign in again.' }, 401);

    if (action === 'setItem') {
      const { id } = body;
      if (!(await known(id))) return json({ error: 'Unknown item.' }, 400);
      const current = await db.prepare('SELECT sold_out, price FROM shop_items WHERE id=?').bind(id).first();
      let soldOut = current ? current.sold_out : 0, price = current ? current.price : null;
      if ('soldOut' in body) { if (typeof body.soldOut !== 'boolean') return json({ error: 'Please check and try again.' }, 400); soldOut = body.soldOut ? 1 : 0; }
      if ('price' in body) {
        if ('priceBasis' in body && body.priceBasis !== 'defaultPack') return json({ error: 'Unknown price unit.' }, 400);
        if (body.price === null) price = null;
        else if (Number.isInteger(body.price) && body.price >= 1 && body.price <= PRICE_MAX) price = body.price / (body.priceBasis === 'defaultPack' ? priceScales[id] || 1 : 1);
        else return json({ error: `Enter a price between ₹1 and ₹${PRICE_MAX}.` }, 400);
      }
      await db.prepare('INSERT INTO shop_items (id,sold_out,price,updated_at) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET sold_out=excluded.sold_out, price=excluded.price, updated_at=excluded.updated_at').bind(id, soldOut, price, now).run();
      return state();
    }
    if (action === 'allAvailable') {
      await db.prepare('UPDATE shop_items SET sold_out=0, updated_at=?').bind(now).run();
      return state();
    }
    if (action === 'setNotice') {
      const text = typeof body.text === 'string' ? body.text.replace(/\s+/g, ' ').trim() : '';
      if (text.length > NOTICE_MAX) return json({ error: `Keep the notice under ${NOTICE_MAX} letters.` }, 400);
      const active = body.active === true && text.length > 0;
      await db.prepare("INSERT INTO shop_settings (key,value,updated_at) VALUES ('notice',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at").bind(JSON.stringify({ text, active }), now).run();
      return state();
    }

    /* Add a new item (no id) or edit any item (built-in or added). */
    if (action === 'saveProduct') {
      const f = body.product && typeof body.product === 'object' ? body.product : null;
      if (!f) return json({ error: 'Please check and try again.' }, 400);
      const id = body.id;
      const isBuiltin = typeof id === 'string' && builtinIds.includes(id);
      const existing = typeof id === 'string' && !isBuiltin ? await customRow(id) : null;
      if (id !== undefined && !isBuiltin && !existing) return json({ error: 'Unknown item.' }, 400);

      const name = clean(f.name, 60);
      if (name.length < 2) return json({ error: 'Please type the item name.' }, 400);
      const data = {
        name,
        subtitle: clean(f.subtitle, 90),
        description: clean(f.description, 500),
        tag: clean(f.tag, 30),
        special: f.special === true,
        allergens: clean(f.allergens, 240),
        storage: clean(f.storage, 240),
      };
      const section = isBuiltin ? sections[id] : f.section;
      if (!isBuiltin && !(section in SECTIONS)) return json({ error: 'Please choose a section.' }, 400);
      if (section === 'sweets') {
        if (!SWEET_CATEGORIES.includes(f.category)) return json({ error: 'Please choose the sweet type.' }, 400);
        data.category = f.category;
      }

      let imageId = existing ? existing.image_id : null;
      if (f.imageId !== undefined && f.imageId !== null && f.imageId !== '') {
        if (!(await imageExists(f.imageId))) return json({ error: 'Please add the photo again.' }, 400);
        imageId = f.imageId;
      }
      if (isBuiltin && f.imageId === null) imageId = null; // back to the original photo
      if (isBuiltin && f.imageId === undefined) {
        const row = await db.prepare('SELECT image_id FROM shop_products WHERE id=?').bind(id).first();
        imageId = row?.image_id ?? null;
      }

      const hidden = body.hidden === true ? 1 : 0;
      const priceOk = p => Number.isInteger(p) && p >= 1 && p <= PRICE_MAX;
      if (isBuiltin) {
        // Price for built-in items lives in shop_items, on the stored basis (Codex's per-kg display scale).
        if (body.price !== undefined) {
          if (body.price !== null && !priceOk(body.price)) return json({ error: `Enter a price between ₹1 and ₹${PRICE_MAX}.` }, 400);
          let stored = body.price === null ? null : body.price / (priceScales[id] || 1);
          if (stored !== null && basePrices[id] !== undefined && stored === basePrices[id]) stored = null;
          const cur = await db.prepare('SELECT sold_out FROM shop_items WHERE id=?').bind(id).first();
          await db.prepare('INSERT INTO shop_items (id,sold_out,price,updated_at) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET price=excluded.price, updated_at=excluded.updated_at').bind(id, cur ? cur.sold_out : 0, stored, now).run();
        }
        await db.prepare('INSERT INTO shop_products (id,custom,hidden,data,image_id,created_at,updated_at) VALUES (?,0,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET hidden=excluded.hidden, data=excluded.data, image_id=excluded.image_id, updated_at=excluded.updated_at')
          .bind(id, hidden, JSON.stringify(data), imageId, now, now).run();
        return state({ savedId: id });
      }

      // Added items: section, how it is sold, price and photo are all required.
      const sell = f.sell && typeof f.sell === 'object' ? f.sell : null;
      if (!sell || !SELL_TYPES.includes(sell.type)) return json({ error: 'Please choose how it is sold.' }, 400);
      data.sell = { type: sell.type };
      if (sell.type === 'pieces') {
        if (!Number.isInteger(sell.pieces) || sell.pieces < 1 || sell.pieces > 50) return json({ error: 'Pieces per pack must be between 1 and 50.' }, 400);
        data.sell.pieces = sell.pieces;
      }
      data.section = section;
      if (section !== 'sweets') data.category = SECTIONS[section];
      if (!priceOk(body.price)) return json({ error: `Enter a price between ₹1 and ₹${PRICE_MAX}.` }, 400);
      data.price = body.price;
      if (!imageId) return json({ error: 'Please add a photo.' }, 400);

      if (existing) {
        await db.batch([
          db.prepare('UPDATE shop_products SET hidden=?, data=?, image_id=?, updated_at=? WHERE id=?').bind(hidden, JSON.stringify(data), imageId, now, id),
          db.prepare('UPDATE shop_items SET price=NULL, updated_at=? WHERE id=?').bind(now, id),
        ]);
        return state({ savedId: id });
      }
      const count = await db.prepare('SELECT COUNT(*) AS n FROM shop_products WHERE custom=1').first();
      if ((count?.n || 0) >= CUSTOM_MAX) return json({ error: `You can add up to ${CUSTOM_MAX} items.` }, 400);
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'item';
      const newId = `c-${slug}-${random(3)}`;
      await db.prepare('INSERT INTO shop_products (id,custom,hidden,data,image_id,created_at,updated_at) VALUES (?,1,?,?,?,?,?)').bind(newId, hidden, JSON.stringify(data), imageId, now, now).run();
      return state({ savedId: newId });
    }

    if (action === 'setHidden') {
      const { id } = body;
      if (typeof body.hidden !== 'boolean' || !(await known(id))) return json({ error: 'Unknown item.' }, 400);
      const row = await db.prepare('SELECT id FROM shop_products WHERE id=?').bind(id).first();
      if (row) await db.prepare('UPDATE shop_products SET hidden=?, updated_at=? WHERE id=?').bind(body.hidden ? 1 : 0, now, id).run();
      else await db.prepare('INSERT INTO shop_products (id,custom,hidden,data,image_id,created_at,updated_at) VALUES (?,0,?,?,NULL,?,?)').bind(id, body.hidden ? 1 : 0, '{}', now, now).run();
      return state();
    }

    /* Undo all changes to a built-in item (keeps its sold-out switch as it is). */
    if (action === 'resetProduct') {
      const { id } = body;
      if (typeof id !== 'string' || !builtinIds.includes(id)) return json({ error: 'Unknown item.' }, 400);
      await db.batch([
        db.prepare('DELETE FROM shop_products WHERE id=?').bind(id),
        db.prepare('UPDATE shop_items SET price=NULL, updated_at=? WHERE id=?').bind(now, id),
      ]);
      return state();
    }

    /* Delete an added item for good. Built-in items can only be hidden. */
    if (action === 'deleteProduct') {
      const row = typeof body.id === 'string' ? await customRow(body.id) : null;
      if (!row) return json({ error: 'Only items you added can be deleted. Hide built-in items instead.' }, 400);
      const ops = [db.prepare('DELETE FROM shop_products WHERE id=?').bind(row.id), db.prepare('DELETE FROM shop_items WHERE id=?').bind(row.id)];
      if (row.image_id) ops.push(db.prepare('DELETE FROM shop_images WHERE id=?').bind(row.image_id));
      const fav = await db.prepare("SELECT value FROM shop_settings WHERE key='favourites'").first();
      let favs = []; try { favs = fav ? JSON.parse(fav.value) : []; } catch {}
      if (Array.isArray(favs) && favs.includes(row.id)) ops.push(db.prepare("UPDATE shop_settings SET value=?, updated_at=? WHERE key='favourites'").bind(JSON.stringify(favs.filter(x => x !== row.id)), now));
      await db.batch(ops);
      return state();
    }

    /* Choose the four items shown in "Our favourites" (null = use the original four). */
    if (action === 'setFavourites') {
      if (body.ids === null) {
        await db.prepare("DELETE FROM shop_settings WHERE key='favourites'").run();
        return state();
      }
      const list = body.ids;
      if (!Array.isArray(list) || list.length < 1 || list.length > 4 || new Set(list).size !== list.length) return json({ error: 'Choose up to four different items.' }, 400);
      for (const id of list) if (!(await known(id))) return json({ error: 'Unknown item.' }, 400);
      await db.prepare("INSERT INTO shop_settings (key,value,updated_at) VALUES ('favourites',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at").bind(JSON.stringify(list), now).run();
      return state();
    }

    return json({ error: 'Unknown action.' }, 400);
  } catch {
    // Never log passwords, cookies or request bodies.
    return json({ error: 'Something went wrong. Please try again.' }, 503);
  }
}
