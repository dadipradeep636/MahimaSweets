/* Orders placed from this browser, so customers can find their tracking page again. Stored only on this device. */
export type MyOrder = { id: string; t: string; at: number };
const KEY = 'mahima-orders-v1';

export function readMyOrders(): MyOrder[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    const cutoff = Date.now() / 1000 - 14 * 86400;
    return raw.filter(o => o && /^MS\d{6}$/.test(o.id) && /^[a-f0-9]{32}$/.test(o.t) && o.at > cutoff).slice(0, 10);
  } catch {
    return [];
  }
}
export function saveMyOrder(o: MyOrder) {
  try {
    localStorage.setItem(KEY, JSON.stringify([o, ...readMyOrders().filter(x => x.id !== o.id)].slice(0, 10)));
  } catch {}
}
export const trackUrl = (o: { id: string; t: string }) => `/order/?id=${o.id}&t=${o.t}`;

export type OrderView = {
  id: string; status: 'awaiting_payment' | 'payment_check' | 'confirmed' | 'ready' | 'picked_up' | 'cancelled';
  name: string; phone: string; pickupAt: number;
  lines: { id: string; name: string; pack: string; grams: number; qty: number; unit: number; amount: number }[];
  total: number; payNow: number; payType: 'advance' | 'full'; balance: number; paymentRef: string | null;
  refund: null | 'due' | 'done' | 'kept'; note: string; shopNote: string; cancelReason: string; cancelledBy: string;
  history: { status: string; at: number; by?: string }[];
  createdAt: number; cancelUntil: number; canCancel: boolean; canPay: boolean;
};
