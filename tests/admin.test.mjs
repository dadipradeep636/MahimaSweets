import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { adminRequest, shopRequest } from '../src/lib/shop-server.mjs';

const PASSWORD = 'test-owner-password-1';
const ids = ['ladoo', 'jamun', 'gift'];
function fixture(extraEnv = {}) {
  const db = new DatabaseSync(':memory:');
  for (const f of ['0000_pink_loa.sql', '0001_owner_controls.sql']) db.exec(readFileSync(new URL(`../drizzle/${f}`, import.meta.url), 'utf8').replaceAll('--> statement-breakpoint', ''));
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
    return adminRequest(new Request('https://shop.test/api/admin/', { method: body ? 'POST' : 'GET', headers, ...(body ? { body: JSON.stringify(body) } : {}) }), env, ids);
  }
  const shop = async () => (await shopRequest(new Request('https://shop.test/api/shop/'), env)).json();
  return { db, admin, shop };
}
const cookieOf = r => r.headers.get('set-cookie').split(';')[0];

test('owner signs in, marks sold out, changes price, sets notice; shop sees it', async () => {
  const { db, admin, shop } = fixture();
  assert.deepEqual(await shop(), { items: {}, notice: null });
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
  const { db, admin, shop } = fixture({ ADMIN_PASSWORD: '' });
  assert.equal((await admin({ action: 'login', password: '' })).status, 503);
  assert.deepEqual(await shop(), { items: {}, notice: null });
  db.close();
});
