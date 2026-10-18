import { buildCatalog, packLabel, packOptions, priceFor, type ShopState } from '@/lib/products';

export type OrderLine = { id: string; name: string; pack: string; grams: number; qty: number; unit: number; amount: number };

/* Server-side pricing from the live menu. The browser's prices are never used. */
export function priceCart(state: ShopState, items: unknown): { lines: OrderLine[]; total: number } | { error: string } {
  if (!Array.isArray(items)) return { error: 'Your bag is empty.' };
  const menu = buildCatalog(state);
  const merged = new Map<string, OrderLine>();
  for (const raw of items) {
    const i = raw as { id?: unknown; grams?: unknown; quantity?: unknown };
    const p = typeof i?.id === 'string' ? menu.find(x => x.id === i.id) : undefined;
    if (!p) return { error: 'An item in your bag is no longer on the menu. Please remove it and try again.' };
    if (p.hidden || p.soldOut) return { error: `${p.name} is sold out today. Please remove it from your bag.` };
    const grams = Number(i.grams), qty = Number(i.quantity);
    if (!packOptions(p).includes(grams)) return { error: `Please choose the pack size for ${p.name} again.` };
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) return { error: `Please check the quantity for ${p.name}.` };
    const key = `${p.id}:${grams}`;
    const unit = priceFor(p, grams);
    const prev = merged.get(key);
    const total = Math.min(20, (prev?.qty || 0) + qty);
    merged.set(key, { id: p.id, name: p.name, pack: packLabel(p, grams), grams, qty: total, unit, amount: unit * total });
  }
  const lines = [...merged.values()];
  return { lines, total: lines.reduce((s, l) => s + l.amount, 0) };
}
