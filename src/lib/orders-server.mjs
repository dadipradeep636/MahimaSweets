/*
 * Pickup orders for Mahima Sweets.
 *   orderRequest:       public. Place an order, send the UPI payment reference, cancel (within 30 minutes), track.
 *   adminOrderRequest:  owner-only. List orders and move them through the steps.
 *
 * Order steps:
 *   awaiting_payment → payment_check (customer sent UPI reference) → confirmed (owner found the payment)
 *   → ready (packed, waiting at the counter) → picked_up (balance paid at the shop)
 *   Any open order can become cancelled. Refund: null | 'due' (payment verified) | 'check' (a UPI reference was sent but not yet verified –
 *   refund only if the money really arrived) | 'done' | 'kept' (not collected, advance kept per policy).
 *
 * Totals are always calculated here from the live menu; the browser's numbers are never trusted.
 */
import { json, bodyJSON, limited, keyed, digest, random, equal, sameOrigin, signedIn, clean, readState, setupMissing, NOT_SET_UP } from './shop-server.mjs';
import { isValidPickup, CANCEL_WINDOW, PAY_WINDOW } from './pickup.mjs';

const OPEN = ['awaiting_payment', 'payment_check', 'confirmed', 'ready'];
const CUSTOMER_CANCELLABLE = ['awaiting_payment', 'payment_check', 'confirmed'];
const MAX_LINES = 30;

function parseData(row) { try { return JSON.parse(row.data); } catch { return {}; } }

/* Unpaid orders lapse after PAY_WINDOW so they do not clutter the shop's list. */
async function expireUnpaid(db, now) {
  // updated_at is when the order (last) started waiting for payment. Orders also lapse once the pickup time has passed.
  const rows = await db.prepare("SELECT id, data, pickup_at FROM shop_orders WHERE status='awaiting_payment' AND (updated_at<? OR pickup_at<?)").bind(now - PAY_WINDOW, now).all();
  for (const r of rows.results || []) {
    const d = parseData(r);
    // If a payment reference was sent earlier (then marked "not found"), money may still have arrived: flag it for checking.
    const sentBefore = (d.history || []).some(h => h.status === 'payment_check');
    d.history = [...(d.history || []), { status: 'cancelled', at: now, by: 'system' }];
    d.cancelReason = r.pickup_at < now ? 'Payment was not received before the pickup time.' : 'Payment was not received within 2 hours.';
    d.cancelledBy = 'system';
    await db.prepare("UPDATE shop_orders SET status='cancelled', refund=?, data=?, updated_at=? WHERE id=? AND status='awaiting_payment'").bind(sentBefore ? 'check' : null, JSON.stringify(d), now, r.id).run();
  }
}

/* What the customer sees. Phone is masked; the full reference is not echoed back. */
function publicView(row, now) {
  const d = parseData(row);
  return {
    id: row.id,
    status: row.status,
    name: row.name,
    phone: `•••••${String(row.phone).slice(-5)}`,
    pickupAt: row.pickup_at,
    lines: d.lines || [],
    total: row.total,
    payNow: row.pay_now,
    payType: d.payType,
    balance: ['picked_up', 'cancelled'].includes(row.status) ? 0 : row.total - (['confirmed', 'ready'].includes(row.status) ? row.pay_now : 0),
    paymentRef: row.payment_ref ? `••••${row.payment_ref.slice(-4)}` : null,
    refund: row.refund,
    note: d.note || '',
    shopNote: d.shopNote || '',
    cancelReason: d.cancelReason || '',
    cancelledBy: d.cancelledBy || '',
    history: d.history || [],
    createdAt: row.created_at,
    cancelUntil: row.created_at + CANCEL_WINDOW,
    canCancel: CUSTOMER_CANCELLABLE.includes(row.status) && now < row.created_at + CANCEL_WINDOW,
    canPay: row.status === 'awaiting_payment',
    payBy: Math.min(row.updated_at + PAY_WINDOW, row.pickup_at),
  };
}

/* What the shop owner sees. */
function adminView(row, now) {
  return { ...publicView(row, now), phone: row.phone, paymentRef: row.payment_ref, canCancel: OPEN.includes(row.status) };
}

async function findWithToken(db, id, token) {
  if (typeof id !== 'string' || !/^MS\d{6}$/.test(id) || typeof token !== 'string' || !/^[a-f0-9]{32}$/.test(token)) return null;
  const row = await db.prepare('SELECT * FROM shop_orders WHERE id=?').bind(id).first();
  if (!row || !equal(row.token_hash, await digest(token))) return null;
  return row;
}

async function move(db, row, status, now, extra = {}) {
  const d = parseData(row);
  d.history = [...(d.history || []), { status, at: now, ...(extra.by ? { by: extra.by } : {}) }];
  if (extra.cancelReason !== undefined) d.cancelReason = extra.cancelReason;
  if (extra.cancelledBy !== undefined) d.cancelledBy = extra.cancelledBy;
  if (extra.shopNote !== undefined) d.shopNote = extra.shopNote;
  const refund = extra.refund !== undefined ? extra.refund : row.refund;
  const ref = extra.paymentRef !== undefined ? extra.paymentRef : row.payment_ref;
  const result = await db.prepare('UPDATE shop_orders SET status=?, refund=?, payment_ref=?, data=?, updated_at=? WHERE id=? AND status=?')
    .bind(status, refund, ref, JSON.stringify(d), now, row.id, row.status).run();
  if (!result.meta.changes) return null; // someone else changed it first
  return db.prepare('SELECT * FROM shop_orders WHERE id=?').bind(row.id).first();
}

/*
 * Public: GET /api/order/?id=…&t=…   POST /api/order/ {action: 'create' | 'pay' | 'cancel'}
 * priceCart(state, items) → { lines, total } | { error }
 */
export async function orderRequest(request, env, priceCart) {
  const now = Math.floor(Date.now() / 1000), db = env.DB, pepper = env.ACCOUNT_PEPPER;
  if (!db || !pepper || pepper.length < 32) return json({ error: 'Online orders are not available right now. Please call or WhatsApp us.' }, 503);
  try {
    if (request.method === 'GET') {
      const url = new URL(request.url);
      await expireUnpaid(db, now);
      const row = await findWithToken(db, url.searchParams.get('id'), url.searchParams.get('t'));
      if (!row) return json({ error: 'We could not find that order.' }, 404);
      return json({ order: publicView(row, now) });
    }
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, { Allow: 'GET, POST' });
    if (!sameOrigin(request)) return json({ error: 'Please order on the shop website.' }, 403);
    let body; try { body = await bodyJSON(request); } catch { return json({ error: 'Please check your order and try again.' }, 400); }
    if (!body || typeof body !== 'object') return json({ error: 'Please check your order and try again.' }, 400);
    const ipKey = await keyed(`order-ip:${request.headers.get('cf-connecting-ip') || 'unknown'}`, pepper);

    if (body.action === 'create') {
      const name = clean(body.name, 60);
      const phone = typeof body.phone === 'string' ? body.phone.replace(/[\s-]/g, '').replace(/^\+91/, '') : '';
      if (name.length < 2) return json({ error: 'Please enter your name.' }, 400);
      if (!/^[6-9]\d{9}$/.test(phone)) return json({ error: 'Please enter a 10-digit mobile number.' }, 400);
      if (body.agree !== true) return json({ error: 'Please accept the order terms.' }, 400);
      if (!['advance', 'full'].includes(body.pay)) return json({ error: 'Please choose how much to pay now.' }, 400);
      if (!Array.isArray(body.items) || !body.items.length || body.items.length > MAX_LINES) return json({ error: 'Your bag is empty.' }, 400);
      const note = clean(body.note, 200);
      const state = await readState(db);
      const business = state.business;
      if (!business.upiId && !business.qrImageId) return json({ error: 'Online payment is opening soon. Please call or WhatsApp us to order.' }, 503);
      if (!isValidPickup(body.pickupAt, now, business.prepMinutes)) return json({ error: 'That pickup time is no longer available. Please choose another time.' }, 400);
      const priced = priceCart(state, body.items);
      if (priced.error) return json({ error: priced.error }, 409);
      const { lines, total } = priced;
      if (total < 1) return json({ error: 'Your bag is empty.' }, 400);
      const payNow = body.pay === 'full' ? total : Math.min(total, Math.ceil((total * business.advancePercent) / 100));
      // Count only orders that are about to be placed, so a customer fixing their bag does not hit the limit.
      if (await limited(db, ipKey, 8, 3600, now) || await limited(db, await keyed(`order-phone:${phone}`, pepper), 5, 3600, now)) {
        return json({ error: 'Too many orders in a short time. Please call us to place more orders.' }, 429, { 'Retry-After': '3600' });
      }
      const token = random(16);
      const data = { lines, note, payType: body.pay, advancePercent: business.advancePercent, history: [{ status: 'awaiting_payment', at: now }] };
      let id = '';
      for (let i = 0; i < 6 && !id; i++) {
        const candidate = `MS${String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0')}`;
        const r = await db.prepare("INSERT OR IGNORE INTO shop_orders (id,token_hash,status,name,phone,pickup_at,total,pay_now,payment_ref,refund,data,created_at,updated_at) VALUES (?,?,'awaiting_payment',?,?,?,?,?,NULL,NULL,?,?,?)")
          .bind(candidate, await digest(token), name, phone, body.pickupAt, total, payNow, JSON.stringify(data), now, now).run();
        if (r.meta.changes) id = candidate;
      }
      if (!id) return json({ error: 'Could not place the order. Please try again.' }, 503);
      const row = await db.prepare('SELECT * FROM shop_orders WHERE id=?').bind(id).first();
      return json({ order: publicView(row, now), token });
    }

    if (body.action === 'pay' || body.action === 'cancel') {
      if (await limited(db, ipKey + 'act', 40, 900, now)) return json({ error: 'Too many tries. Please wait a few minutes.' }, 429);
      await expireUnpaid(db, now);
      const row = await findWithToken(db, body.id, body.t);
      if (!row) return json({ error: 'We could not find that order.' }, 404);

      if (body.action === 'pay') {
        const ref = typeof body.ref === 'string' ? body.ref.replace(/\s/g, '') : '';
        if (!/^\d{12}$/.test(ref)) return json({ error: 'The UPI reference number has 12 digits. You can find it in your UPI app under this payment.' }, 400);
        if (row.status !== 'awaiting_payment') return json({ error: 'This order is not waiting for payment.' }, 409);
        const reused = await db.prepare('SELECT id FROM shop_orders WHERE payment_ref=? AND id<>? LIMIT 1').bind(ref, row.id).first();
        if (reused) return json({ error: 'This UPI reference number is already used for another order. Please check the number in your UPI app.' }, 409);
        const updated = await move(db, row, 'payment_check', now, { paymentRef: ref, shopNote: '' });
        if (!updated) return json({ error: 'Please refresh and try again.' }, 409);
        return json({ order: publicView(updated, now) });
      }

      // Cancel: only within 30 minutes of placing the order, and only before it is packed.
      if (!CUSTOMER_CANCELLABLE.includes(row.status)) return json({ error: 'This order can no longer be cancelled online. Please call the shop.' }, 409);
      if (now >= row.created_at + CANCEL_WINDOW) return json({ error: 'The 30-minute cancellation time is over. Please call the shop.' }, 409);
      const refund = row.status === 'confirmed' ? 'due' : row.status === 'payment_check' ? 'check' : null;
      const updated = await move(db, row, 'cancelled', now, { by: 'customer', cancelledBy: 'customer', cancelReason: 'Cancelled by you.', refund });
      if (!updated) return json({ error: 'Please refresh and try again.' }, 409);
      return json({ order: publicView(updated, now) });
    }
    return json({ error: 'Unknown action.' }, 400);
  } catch {
    // Never log names, phone numbers, payment references or request bodies.
    return json({ error: 'Something went wrong. Please try again, or call us.' }, 503);
  }
}

/* Owner: GET /api/admin/orders/   POST /api/admin/orders/ {action: 'update', id, to, reason?} */
const TRANSITIONS = {
  confirm: { from: ['awaiting_payment', 'payment_check'], to: 'confirmed' },
  payment_issue: { from: ['payment_check'], to: 'awaiting_payment' },
  ready: { from: ['confirmed'], to: 'ready' },
  picked_up: { from: ['confirmed', 'ready'], to: 'picked_up' },
  cancel: { from: OPEN, to: 'cancelled' },
  not_collected: { from: ['confirmed', 'ready'], to: 'cancelled' },
};

export async function adminOrderRequest(request, env) {
  const now = Math.floor(Date.now() / 1000), db = env.DB;
  if (setupMissing(env)) return json({ error: NOT_SET_UP }, 503);
  try {
    if (!(await signedIn(request, db, now))) return json({ error: 'Please sign in again.' }, 401);
    const list = async extra => {
      await expireUnpaid(db, now);
      const rows = await db.prepare('SELECT * FROM shop_orders WHERE created_at>? OR status IN (?,?,?,?) ORDER BY created_at DESC LIMIT 300')
        .bind(now - 30 * 86400, ...OPEN).all();
      return json({ orders: (rows.results || []).map(r => adminView(r, now)), now, ...extra });
    };
    if (request.method === 'GET') return list();
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, { Allow: 'GET, POST' });
    if (!sameOrigin(request)) return json({ error: 'Please use the shop controls page.' }, 403);
    let body; try { body = await bodyJSON(request); } catch { return json({ error: 'Please check and try again.' }, 400); }
    if (!body || typeof body.id !== 'string') return json({ error: 'Unknown order.' }, 400);
    const row = await db.prepare('SELECT * FROM shop_orders WHERE id=?').bind(body.id).first();
    if (!row) return json({ error: 'Unknown order.' }, 404);

    if (body.action === 'refunded') {
      if (row.refund !== 'due' && row.refund !== 'check') return json({ error: 'No refund is due for this order.' }, 409);
      await db.prepare("UPDATE shop_orders SET refund='done', updated_at=? WHERE id=?").bind(now, row.id).run();
      return list();
    }
    if (body.action === 'no_payment') {
      // The owner checked the bank: the money never arrived, so nothing to refund.
      if (row.refund !== 'check') return json({ error: 'Nothing to check for this order.' }, 409);
      const d = parseData(row);
      d.cancelReason = `${d.cancelReason || 'Cancelled.'} No payment was received, so there is nothing to refund.`;
      await db.prepare('UPDATE shop_orders SET refund=NULL, data=?, updated_at=? WHERE id=?').bind(JSON.stringify(d), now, row.id).run();
      return list();
    }
    if (body.action !== 'update') return json({ error: 'Unknown action.' }, 400);
    const t = TRANSITIONS[body.to];
    if (!t) return json({ error: 'Unknown step.' }, 400);
    if (!t.from.includes(row.status)) return json({ error: 'This order has already moved on. Refreshing…' }, 409);
    if (body.to === 'not_collected' && now < row.pickup_at) return json({ error: 'You can mark it “not collected” only after the pickup time.' }, 409);
    const reason = clean(body.reason, 160);
    const extra = { by: 'shop' };
    if (body.to === 'payment_issue') {
      extra.shopNote = reason || 'We could not find your payment. Please check the UPI reference number and send it again, or call us.';
      extra.paymentRef = null;
    }
    if (body.to === 'cancel') {
      extra.cancelledBy = 'shop';
      extra.cancelReason = reason || 'Cancelled by the shop.';
      extra.refund = ['confirmed', 'ready'].includes(row.status) ? 'due' : row.status === 'payment_check' ? 'check' : null;
    }
    if (body.to === 'not_collected') {
      extra.cancelledBy = 'shop';
      extra.cancelReason = reason || 'The order was not collected on the pickup day.';
      extra.refund = 'kept';
    }
    const updated = await move(db, row, t.to, now, extra);
    if (!updated) return json({ error: 'This order has already moved on. Refreshing…' }, 409);
    return list({ updatedId: row.id });
  } catch {
    return json({ error: 'Something went wrong. Please try again.' }, 503);
  }
}
