import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { adminRequest } from '../src/lib/shop-server.mjs';
import { orderRequest, adminOrderRequest } from '../src/lib/orders-server.mjs';
import { pickupDays, isValidPickup, istDayStart } from '../src/lib/pickup.mjs';

const PASSWORD = 'test-owner-password-1';
const PRICES = { ladoo: 480, jamun: 440 }; // per 1 kg
/* Simple stand-in for the real menu pricing (src/lib/price-cart.ts). */
function priceCart(state, items) {
  const lines = [];
  for (const i of items) {
    if (!(i.id in PRICES)) return { error: 'An item in your bag is no longer on the menu.' };
    if (state.items[i.id]?.soldOut) return { error: `${i.id} is sold out today. Please remove it from your bag.` };
    const unit = Math.round(PRICES[i.id] * i.grams / 1000);
    lines.push({ id: i.id, name: i.id, pack: `${i.grams} g`, grams: i.grams, qty: i.quantity, unit, amount: unit * i.quantity });
  }
  return { lines, total: lines.reduce((s, l) => s + l.amount, 0) };
}

function fixture() {
  const db = new DatabaseSync(':memory:');
  for (const f of ['0000_pink_loa.sql', '0001_owner_controls.sql', '0002_products_and_photos.sql', '0003_pickup_orders.sql']) db.exec(readFileSync(new URL(`../drizzle/${f}`, import.meta.url), 'utf8').replaceAll('--> statement-breakpoint', ''));
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
  const env = { DB, ACCOUNT_PEPPER: 'test-only-pepper-not-used-in-production-123456789', ADMIN_PASSWORD: PASSWORD };
  const req = (url, body, cookie = '', origin = 'https://shop.test', ip = '192.0.2.1') =>
    new Request(url, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: cookie, 'cf-connecting-ip': ip }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const order = (body, ip) => orderRequest(req('https://shop.test/api/order/', body, '', 'https://shop.test', ip), env, priceCart);
  const track = (id, t) => orderRequest(req(`https://shop.test/api/order/?id=${id}&t=${t}`), env, priceCart);
  const admin = (body, cookie) => adminRequest(req('https://shop.test/api/admin/', body, cookie), env, { ids: ['ladoo', 'jamun'], priceScales: {}, sections: {}, prices: {} });
  const orders = (body, cookie) => adminOrderRequest(req('https://shop.test/api/admin/orders/', body, cookie), env);
  return { db, order, track, admin, orders };
}
const cookieOf = r => r.headers.get('set-cookie').split(';')[0];
const now = () => Math.floor(Date.now() / 1000);
const slot = () => pickupDays(now(), 60)[1].slots[0]; // a valid slot tomorrow
const items = [{ id: 'ladoo', grams: 500, quantity: 2 }, { id: 'jamun', grams: 250, quantity: 1 }];
const BUSINESS = { legalName: 'Mahima Sweets', fssai: '', upiId: 'mahima@okaxis', payeeName: 'Mahima Sweets', advancePercent: 25, prepMinutes: 60, grievanceName: 'Owner', grievancePhone: '9440656817', grievanceEmail: 'owner@example.com', email: '' };

test('pickup slots: shop hours, 30-minute steps, getting-ready time, 7 days ahead', () => {
  const t0 = istDayStart(now()) + 10 * 3600 + 5 * 60; // 10:05 AM IST today
  const days = pickupDays(t0, 60);
  const first = days[0].slots[0];
  assert.equal((first - istDayStart(first)) / 60, 11 * 60 + 30); // 11:30 AM (10:05 + 60 min → next half hour)
  assert.ok(days.every(d => d.slots.every(s => { const m = (s - istDayStart(s)) / 60; return m >= 540 && m <= 1260 && m % 30 === 0; })));
  assert.equal(days.length, 8);
  assert.equal(isValidPickup(first, t0, 60), true);
  assert.equal(isValidPickup(first + 60, t0, 60), false); // not on a 30-minute step
  assert.equal(isValidPickup(istDayStart(t0) + 86400 + 22 * 3600, t0, 60), false); // after hours
  assert.equal(isValidPickup(istDayStart(t0) + 86400 + 8 * 3600, t0, 60), false); // before 9 AM
  assert.equal(isValidPickup(istDayStart(t0) + 10 * 3600 + 30 * 60, t0, 60), false); // 10:30 AM today: too soon
  assert.equal(isValidPickup(istDayStart(t0) + 10 * 86400 + 12 * 3600, t0, 60), false); // too far ahead
});

test('order: closed until payment details are set, then priced on the server with 25% advance', async () => {
  const { db, order, admin } = fixture();
  const base = { action: 'create', items, name: 'Ravi', phone: '9876543210', pickupAt: slot(), pay: 'advance', agree: true };
  assert.equal((await order(base)).status, 503); // no UPI / QR yet
  const c = cookieOf(await admin({ action: 'login', password: PASSWORD }));
  assert.equal((await admin({ action: 'setBusiness', business: { ...BUSINESS, fssai: '123' } }, c)).status, 400);
  assert.equal((await admin({ action: 'setBusiness', business: { ...BUSINESS, advancePercent: 10 } }, c)).status, 400);
  assert.equal((await admin({ action: 'setBusiness', business: { ...BUSINESS, upiId: 'not a upi' } }, c)).status, 400);
  assert.equal((await admin({ action: 'setBusiness', business: BUSINESS }, c)).status, 200);

  assert.equal((await order({ ...base, agree: false })).status, 400);
  assert.equal((await order({ ...base, phone: '12345' })).status, 400);
  assert.equal((await order({ ...base, pickupAt: slot() + 60 })).status, 400);
  assert.equal((await order({ ...base, items: [{ id: 'fake', grams: 500, quantity: 1 }] })).status, 409);
  const res = await order({ ...base, total: 1, payNow: 1 }); // browser totals are ignored
  assert.equal(res.status, 200);
  const { order: o, token } = await res.json();
  assert.match(o.id, /^MS\d{6}$/);
  assert.match(token, /^[a-f0-9]{32}$/);
  assert.equal(o.total, 590); // 2 × ₹240 + ₹110
  assert.equal(o.payNow, 148); // 25% rounded up
  assert.equal(o.status, 'awaiting_payment');
  assert.equal(o.phone, '•••••43210');
  assert.notEqual(db.prepare('SELECT token_hash FROM shop_orders').get().token_hash, token);

  const full = await (await order({ ...base, pay: 'full' })).json();
  assert.equal(full.order.payNow, 590);
  db.close();
});

test('customer pays, tracks, and the shop moves the order to picked up', async () => {
  const { db, order, track, admin, orders } = fixture();
  const c = cookieOf(await admin({ action: 'login', password: PASSWORD }));
  await admin({ action: 'setBusiness', business: BUSINESS }, c);
  const { order: o, token } = await (await order({ action: 'create', items, name: 'Ravi', phone: '9876543210', pickupAt: slot(), pay: 'advance', agree: true })).json();

  assert.equal((await track(o.id, 'f'.repeat(32))).status, 404); // wrong link
  assert.equal((await order({ action: 'pay', id: o.id, t: token, ref: '1234' })).status, 400);
  const paid = await (await order({ action: 'pay', id: o.id, t: token, ref: '412345678901' })).json();
  assert.equal(paid.order.status, 'payment_check');
  assert.equal(paid.order.paymentRef, '••••8901');
  assert.equal(paid.order.balance, 442);

  assert.equal((await orders(null, '')).status, 401);
  let list = await (await orders(null, c)).json();
  assert.equal(list.orders[0].phone, '9876543210');
  assert.equal(list.orders[0].paymentRef, '412345678901');

  // Payment not found → customer can send the reference again.
  await orders({ action: 'update', id: o.id, to: 'payment_issue' }, c);
  let t = await (await track(o.id, token)).json();
  assert.equal(t.order.status, 'awaiting_payment');
  assert.match(t.order.shopNote, /could not find your payment/);
  await order({ action: 'pay', id: o.id, t: token, ref: '412345678902' });

  assert.equal((await orders({ action: 'update', id: o.id, to: 'ready' }, c)).status, 409); // must confirm first
  await orders({ action: 'update', id: o.id, to: 'confirm' }, c);
  await orders({ action: 'update', id: o.id, to: 'ready' }, c);
  await orders({ action: 'update', id: o.id, to: 'picked_up' }, c);
  t = await (await track(o.id, token)).json();
  assert.equal(t.order.status, 'picked_up');
  assert.deepEqual(t.order.history.map(h => h.status), ['awaiting_payment', 'payment_check', 'awaiting_payment', 'payment_check', 'confirmed', 'ready', 'picked_up']);
  assert.equal(t.order.canCancel, false);
  db.close();
});

test('cancel within 30 minutes with refund due; not after 30 minutes; shop cancel and not-collected', async () => {
  const { db, order, track, admin, orders } = fixture();
  const c = cookieOf(await admin({ action: 'login', password: PASSWORD }));
  await admin({ action: 'setBusiness', business: BUSINESS }, c);
  const make = async () => (await (await order({ action: 'create', items, name: 'Ravi', phone: '9876543210', pickupAt: slot(), pay: 'advance', agree: true })).json());

  const a = await make();
  await order({ action: 'pay', id: a.order.id, t: a.token, ref: '412345678901' });
  const cancelled = await (await order({ action: 'cancel', id: a.order.id, t: a.token })).json();
  assert.equal(cancelled.order.status, 'cancelled');
  assert.equal(cancelled.order.refund, 'due');
  await orders({ action: 'refunded', id: a.order.id }, c);
  assert.equal((await (await track(a.order.id, a.token)).json()).order.refund, 'done');

  const b = await make();
  db.prepare('UPDATE shop_orders SET created_at=created_at-1900 WHERE id=?').run(b.order.id);
  assert.equal((await order({ action: 'cancel', id: b.order.id, t: b.token })).status, 409);

  const unpaid = await make();
  const u = await (await order({ action: 'cancel', id: unpaid.order.id, t: unpaid.token })).json();
  assert.equal(u.order.refund, null);

  const s = await make();
  await order({ action: 'pay', id: s.order.id, t: s.token, ref: '412345678903' });
  await orders({ action: 'update', id: s.order.id, to: 'cancel', reason: 'Kaju Burfi finished today' }, c);
  const sv = (await (await track(s.order.id, s.token)).json()).order;
  assert.equal(sv.cancelledBy, 'shop');
  assert.equal(sv.cancelReason, 'Kaju Burfi finished today');
  assert.equal(sv.refund, 'due');

  const n = await make();
  await order({ action: 'pay', id: n.order.id, t: n.token, ref: '412345678904' });
  await orders({ action: 'update', id: n.order.id, to: 'confirm' }, c);
  await orders({ action: 'update', id: n.order.id, to: 'not_collected' }, c);
  assert.equal((await (await track(n.order.id, n.token)).json()).order.refund, 'kept');
  db.close();
});

test('unpaid orders lapse after 2 hours; order spam is limited; other sites are blocked', async () => {
  const { db, order, track, admin } = fixture();
  const c = cookieOf(await admin({ action: 'login', password: PASSWORD }));
  await admin({ action: 'setBusiness', business: BUSINESS }, c);
  const base = { action: 'create', items, name: 'Ravi', phone: '9876543210', pickupAt: slot(), pay: 'advance', agree: true };
  const a = await (await order(base)).json();
  db.prepare('UPDATE shop_orders SET updated_at=updated_at-7300 WHERE id=?').run(a.order.id);
  const t = (await (await track(a.order.id, a.token)).json()).order;
  assert.equal(t.status, 'cancelled');
  assert.match(t.cancelReason, /not received/);

  for (let i = 0; i < 4; i++) assert.equal((await order(base)).status, 200);
  assert.equal((await order(base)).status, 429); // 5 per phone per hour (1 above + 4)
  assert.equal((await order({ ...base, phone: '9876500000' }, '192.0.2.50')).status, 200);
  const evil = await orderRequest(new Request('https://shop.test/api/order/', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://evil.test' }, body: JSON.stringify(base) }), { DB: null }, priceCart);
  assert.equal(evil.status, 503);
  db.close();
});
