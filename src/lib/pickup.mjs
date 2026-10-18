/*
 * Pickup time rules, shared by the website (to show choices) and the server (to check them).
 * Shop hours are 8:00 AM – 9:30 PM India time. Pickup slots run every 30 minutes from 9:00 AM to 9:00 PM.
 */
export const IST_OFFSET = 330 * 60; // seconds
export const FIRST_SLOT = 9 * 60; // minutes after midnight
export const LAST_SLOT = 21 * 60;
export const SLOT_STEP = 30;
export const DAYS_AHEAD = 7;
export const CANCEL_WINDOW = 30 * 60; // seconds
export const PAY_WINDOW = 2 * 3600; // unpaid orders lapse after this

/** Midnight (India time) of the day containing `t`, as epoch seconds. */
export function istDayStart(t) {
  return Math.floor((t + IST_OFFSET) / 86400) * 86400 - IST_OFFSET;
}

/** All valid pickup slots from `now`, grouped by day: [{ day, slots: [epochSeconds] }]. */
export function pickupDays(now, prepMinutes = 60) {
  const earliest = now + prepMinutes * 60;
  const out = [];
  for (let d = 0; d <= DAYS_AHEAD; d++) {
    const day = istDayStart(now) + d * 86400;
    const slots = [];
    for (let m = FIRST_SLOT; m <= LAST_SLOT; m += SLOT_STEP) {
      const t = day + m * 60;
      if (t >= earliest) slots.push(t);
    }
    if (slots.length) out.push({ day, slots });
  }
  return out;
}

/** True when `t` is one of the offered pickup slots. A few minutes of grace covers slow phones. */
export function isValidPickup(t, now, prepMinutes = 60) {
  if (!Number.isInteger(t)) return false;
  const minutes = Math.round((t - istDayStart(t)) / 60);
  if ((t - istDayStart(t)) % (SLOT_STEP * 60) !== 0) return false;
  if (minutes < FIRST_SLOT || minutes > LAST_SLOT) return false;
  if (t < now + prepMinutes * 60 - 10 * 60) return false;
  if (t > istDayStart(now) + (DAYS_AHEAD + 1) * 86400) return false;
  return true;
}

const IST = { timeZone: 'Asia/Kolkata' };
export function formatDay(t, now = Math.floor(Date.now() / 1000)) {
  const diff = Math.round((istDayStart(t) - istDayStart(now)) / 86400);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return new Date(t * 1000).toLocaleDateString('en-IN', { ...IST, weekday: 'short', day: 'numeric', month: 'short' });
}
export function formatTime(t) {
  return new Date(t * 1000).toLocaleTimeString('en-IN', { ...IST, hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
}
export function formatWhen(t, now) {
  return `${formatDay(t, now)}, ${formatTime(t)}`;
}
