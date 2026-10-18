import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { adminRequest, adminImageRequest, imageRequest, shopRequest, parseBusiness } from '../src/lib/shop-server.mjs';

const PASSWORD = 'test-owner-password-1';
const ids = ['ladoo', 'jamun', 'gift'];
const info = { ids, priceScales: { ladoo: 2, jamun: 2, gift: 1 }, sections: { ladoo: 'sweets', jamun: 'sweets', gift: 'gift' }, prices: { ladoo: 240, jamun: 220, gift: 790 } };
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x24, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20, 1, 2, 3, 4]);
function fixture(extraEnv = {}) {
  const db = new DatabaseSync(':memory:');
  for (const f of ['0000_pink_loa.sql', '0001_owner_controls.sql', '0002_products_and_photos.sql']) db.exec(readFileSync(new URL(`../drizzle/${f}`, import.meta.url), 'utf8').replaceAll('--> statement-breakpoint', ''));
  const DB = {
    prepare(sql) {
      let args = [];
      return {
        bind(...a) { args = a; return this; },
        async first() { return db.prepare(sql).get(...args) || null; },
        async all() { return { results: db.prepare(sql).all(...args) }; },
        async run() { const r = db.prepare(sql).run(...args); return { meta: { changes: Number(r.changes) } }; },
      };
    },
    async batch(list) { db.exec('BEGIN'); try { const out = []; for (const q of list) out.push(await q.run()); db.exec('COMMIT'); return out; } catch (e) { db.exec('ROLLBACK'); throw e; } },
  };
  const env = { DB, ACCOUNT_PEPPER: 'test-only-pepper-not-used-in-production-123456789', ADMIN_PASSWORD: PASSWORD, ...extraEnv };
  async function admin(body, cookie = '', origin = 'https://shop.test', ip = '192.0.2.1') {
    const headers = { 'Content-Type': 'application/json', Origin: origin, 'cf-connecting-ip': ip, Cookie: cookie };
    return adminRequest(new Request('https://shop.test/api/admin/', { method: body ? 'POST' : 'GET', headers, ...(body ? { body: JSON.stringify(body) } : {}) }), env, info);
  }
  async function upload(bytes, cookie = '', origin = 'https://shop.test') {
    return adminImageRequest(new Request('https://shop.test/api/admin/image/', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', Origin: origin, Cookie: cookie }, body: bytes }), env);
  }
  const image = id => imageRequest(new Request(`https://shop.test/api/image/?id=${id}`), env);
  const shop = async () => (await shopRequest(new Request('https://shop.test/api/shop/'), env)).json();
  return { db, admin, shop, upload, image };
}
const cookieOf = r => r.headers.get('set-cookie').split(';')[0];

test('owner signs in, marks sold out, changes price, sets notice; shop sees it', async () => {
  const { db, admin, shop } = fixture();
  assert.deepEqual(await shop(), { items: {}, notice: null, products: [], favourites: null, business: parseBusiness(null), hero: 'classic' });
  assert.deepEqual(await (await admin()).json(), { admin: false });
  const login = await admin({ action: 'login', password: PASSWORD });
  assert.equal(login.status, 200);
  assert.match(login.headers.get('set-cookie'), /__Host-mahima_admin=[a-f0-9]{64}; Path=\/; HttpOnly; Secure; SameSite=Strict/);
  const c = cookieOf(login);
  assert.notEqual(db.prepare('SELECT token_hash FROM shop_admin_sessions').get().token_hash, c.split('=')[1]);

  assert.equal((await admin({ action: 'setItem', id: 'ladoo', soldOut: true }, c)).status, 200);
  assert.equal((await admin({ action: 'setItem', id: 'jamun', price: 250 }, c)).status, 200);
  assert.equal((await admin({ action: 'setNotice', text: '  Closed tomorrow   for Diwali ', active: true }, c)).status, 200);
  assert.deepEqual(await shop(), {
    items: { ladoo: { soldOut: true, price: null }, jamun: { soldOut: false, price: 250 } },
    notice: { text: 'Closed tomorrow for Diwali' },
    products: [],
    favourites: null,
    business: parseBusiness(null),
    hero: 'classic',
  });
  // Changing price keeps sold-out state, and reset brings everything back.
  await admin({ action: 'setItem', id: 'ladoo', price: 260 }, c);
  assert.deepEqual((await shop()).items.ladoo, { soldOut: true, price: 260 });
  await admin({ action: 'allAvailable' }, c);
  assert.equal((await shop()).items.ladoo.soldOut, false);
  await admin({ action: 'setItem', id: 'jamun', price: null }, c);
  assert.equal((await shop()).items.jamun.price, null);
  await admin({ action: 'setNotice', text: 'Closed tomorrow', active: false }, c);
  assert.equal((await shop()).notice, null);

  assert.equal((await admin({ action: 'logout' }, c)).status, 200);
  assert.equal((await admin({ action: 'setItem', id: 'ladoo', soldOut: true }, c)).status, 401);
  db.close();
});

test('wrong password, outsiders, bad input and other sites are rejected', async () => {
  const { db, admin } = fixture();
  assert.equal((await admin({ action: 'login', password: 'wrong-password' })).status, 401);
  assert.equal((await admin({ action: 'setItem', id: 'ladoo', soldOut: true })).status, 401);
  assert.equal((await admin({ action: 'setItem', id: 'ladoo', soldOut: true }, '__Host-mahima_admin=' + 'a'.repeat(64))).status, 401);
  const c = cookieOf(await admin({ action: 'login', password: PASSWORD }));
  assert.equal((await admin({ action: 'setItem', id: 'not-a-sweet', soldOut: true }, c)).status, 400);
  assert.equal((await admin({ action: 'setItem', id: 'ladoo', price: 0 }, c)).status, 400);
  assert.equal((await admin({ action: 'setItem', id: 'ladoo', price: 12.5 }, c)).status, 400);
  assert.equal((await admin({ action: 'setItem', id: 'ladoo', soldOut: 'yes' }, c)).status, 400);
  assert.equal((await admin({ action: 'setNotice', text: 'x'.repeat(161), active: true }, c)).status, 400);
  assert.equal((await admin({ action: 'setItem', id: 'ladoo', soldOut: true }, c, 'https://evil.test')).status, 403);
  db.close();
});

test('too many wrong passwords locks sign-in for that connection', async () => {
  const { db, admin } = fixture();
  for (let i = 0; i < 5; i++) assert.equal((await admin({ action: 'login', password: 'nope-nope-nope' })).status, 401);
  const blocked = await admin({ action: 'login', password: PASSWORD });
  assert.equal(blocked.status, 429);
  assert.ok(blocked.headers.get('Retry-After'));
  assert.equal((await admin({ action: 'login', password: PASSWORD }, '', 'https://shop.test', '192.0.2.9')).status, 200);
  db.close();
});

test('controls stay locked when no owner password is configured', async () => {
  const { db, admin, shop, upload } = fixture({ ADMIN_PASSWORD: '' });
  assert.equal((await admin({ action: 'login', password: '' })).status, 503);
  assert.equal((await upload(WEBP)).status, 503);
  assert.deepEqual(await shop(), { items: {}, notice: null, products: [], favourites: null, business: parseBusiness(null), hero: 'classic' });
  db.close();
});

test('owner adds an item with a photo, edits, hides, features and deletes it', async () => {
  const { db, admin, shop, upload, image } = fixture();
  assert.equal((await upload(WEBP)).status, 401);
  const c = cookieOf(await admin({ action: 'login', password: PASSWORD }));
  assert.equal((await upload(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]), c)).status, 415);
  assert.equal((await upload(WEBP, c, 'https://evil.test')).status, 403);
  const up = await upload(WEBP, c);
  assert.equal(up.status, 200);
  const { id: imageId, url } = await up.json();
  assert.match(imageId, /^[a-f0-9]{24}$/);
  const served = await image(imageId);
  assert.equal(served.headers.get('content-type'), 'image/webp');
  assert.deepEqual(new Uint8Array(await served.arrayBuffer()), WEBP);
  assert.equal((await image('nope')).status, 404);

  const product = { name: 'Kaju Roll', section: 'sweets', category: 'Dry fruit', sell: { type: 'large' }, imageId, subtitle: 'Rolled cashew goodness.' };
  assert.equal((await admin({ action: 'saveProduct', product: { ...product, name: '' }, price: 900 }, c)).status, 400);
  assert.equal((await admin({ action: 'saveProduct', product: { ...product, imageId: undefined }, price: 900 }, c)).status, 400);
  assert.equal((await admin({ action: 'saveProduct', product: { ...product, section: 'shoes' }, price: 900 }, c)).status, 400);
  assert.equal((await admin({ action: 'saveProduct', product: { ...product, category: 'Rocks' }, price: 900 }, c)).status, 400);
  assert.equal((await admin({ action: 'saveProduct', product, price: 0 }, c)).status, 400);
  const created = await (await admin({ action: 'saveProduct', product: { ...product, name: '  Kaju   <b>Roll</b> ' }, price: 900 }, c)).json();
  const id = created.savedId;
  assert.match(id, /^c-kaju-b-roll-b-[a-f0-9]{6}$/);
  let rec = (await shop()).products.find(p => p.id === id);
  assert.equal(rec.custom, true);
  assert.equal(rec.data.name, 'Kaju <b>Roll</b>'); // stored as plain text; the website never renders it as HTML
  assert.equal(rec.data.price, 900);
  assert.equal(rec.data.image, url);

  // Stock switch and price for an added item, then the editor overwrites the price.
  assert.equal((await admin({ action: 'setItem', id, soldOut: true, price: 950, priceBasis: 'defaultPack' }, c)).status, 200);
  assert.deepEqual((await shop()).items[id], { soldOut: true, price: 950 });
  await admin({ action: 'saveProduct', id, product: { ...product, name: 'Kaju Roll', sell: { type: 'pieces', pieces: 4 } }, price: 120 }, c);
  rec = (await shop()).products.find(p => p.id === id);
  assert.deepEqual(rec.data.sell, { type: 'pieces', pieces: 4 });
  assert.equal(rec.data.price, 120);
  assert.equal((await shop()).items[id].price, null);
  assert.equal((await admin({ action: 'saveProduct', id, product: { ...product, sell: { type: 'pieces', pieces: 0 } }, price: 120 }, c)).status, 400);

  await admin({ action: 'setHidden', id, hidden: true }, c);
  assert.equal((await shop()).products.find(p => p.id === id).hidden, true);
  assert.equal((await admin({ action: 'setFavourites', ids: [id, 'ladoo'] }, c)).status, 200);
  assert.deepEqual((await shop()).favourites, [id, 'ladoo']);
  assert.equal((await admin({ action: 'setFavourites', ids: ['ladoo', 'ladoo'] }, c)).status, 400);
  assert.equal((await admin({ action: 'setFavourites', ids: ['a', 'b', 'c', 'd', 'e'] }, c)).status, 400);
  assert.equal((await admin({ action: 'setFavourites', ids: ['made-up'] }, c)).status, 400);

  assert.equal((await admin({ action: 'deleteProduct', id: 'ladoo' }, c)).status, 400);
  assert.equal((await admin({ action: 'deleteProduct', id }, c)).status, 200);
  const after = await shop();
  assert.equal(after.products.length, 0);
  assert.deepEqual(after.favourites, ['ladoo']);
  assert.equal(after.items[id], undefined);
  assert.equal((await image(imageId)).status, 404);
  db.close();
});

test('owner edits a built-in item, changes its photo and price, then undoes everything', async () => {
  const { db, admin, shop, upload } = fixture();
  const c = cookieOf(await admin({ action: 'login', password: PASSWORD }));
  const { id: imageId } = await (await upload(WEBP, c)).json();
  await admin({ action: 'setItem', id: 'ladoo', soldOut: true }, c);
  const edit = { name: 'Boondi Ladoo', subtitle: 'Golden pearls.', tag: 'Diwali pick', special: true, category: 'Syrupy', imageId, section: 'hot' };
  assert.equal((await admin({ action: 'saveProduct', id: 'ladoo', product: { ...edit, category: 'Rocks' }, price: 520 }, c)).status, 400);
  assert.equal((await admin({ action: 'saveProduct', id: 'ladoo', product: edit, price: 520 }, c)).status, 200);
  let s = await shop();
  const rec = s.products.find(p => p.id === 'ladoo');
  assert.equal(rec.custom, false);
  assert.equal(rec.data.name, 'Boondi Ladoo');
  assert.equal(rec.data.section, undefined); // built-in items cannot change section
  assert.equal(rec.data.category, 'Syrupy');
  assert.match(rec.data.image, /^\/api\/image\/\?id=/);
  assert.deepEqual(s.items.ladoo, { soldOut: true, price: 260 }); // ₹520 per kg stored as ₹260 per 500 g
  // Saving the original price clears the override.
  await admin({ action: 'saveProduct', id: 'ladoo', product: edit, price: 480 }, c);
  assert.equal((await shop()).items.ladoo.price, null);
  // Undo all changes: text, photo and price go back; sold-out stays.
  await admin({ action: 'saveProduct', id: 'ladoo', product: edit, price: 520 }, c);
  assert.equal((await admin({ action: 'resetProduct', id: 'ladoo' }, c)).status, 200);
  s = await shop();
  assert.equal(s.products.length, 0);
  assert.deepEqual(s.items.ladoo, { soldOut: true, price: null });
  // Built-in items can be hidden and shown again.
  await admin({ action: 'setHidden', id: 'jamun', hidden: true }, c);
  assert.equal((await shop()).products.find(p => p.id === 'jamun').hidden, true);
  await admin({ action: 'setHidden', id: 'jamun', hidden: false }, c);
  assert.equal((await shop()).products.find(p => p.id === 'jamun').hidden, false);
  assert.equal((await admin({ action: 'resetProduct', id: 'c-made-up' }, c)).status, 400);
  db.close();
});

test('owner switches the homepage animation; only known styles are accepted', async () => {
  const { db, admin, shop } = fixture();
  assert.equal((await shop()).hero, 'classic');
  assert.equal((await admin({ action: 'setHero', hero: 'orbit' })).status, 401);
  const c = cookieOf(await admin({ action: 'login', password: PASSWORD }));
  for (const hero of ['orbit', 'rain', 'diwali', 'classic']) {
    assert.equal((await admin({ action: 'setHero', hero }, c)).status, 200);
    assert.equal((await shop()).hero, hero);
  }
  for (const hero of ['', 'fireworks', null, 7, '<script>']) assert.equal((await admin({ action: 'setHero', hero }, c)).status, 400);
  assert.equal((await shop()).hero, 'classic');
  db.close();
});
