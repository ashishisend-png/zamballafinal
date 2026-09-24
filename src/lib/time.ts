/**
 * Convert a 24h "HH:MM" clock (or a range like "10:00 – 21:00") to a 12-hour
 * clock with AM/PM. Canonical time values in `spa.ts` stay 24h so any
 * comparisons are unaffected; this is applied only where time is shown.
 */
export function to12h(time: string): string {
  return time
    .split(/\s*[–-]\s*/)
    .map((part) => {
      const m = part.match(/^(\d{1,2}):(\d{2})$/);
      if (!m) return part;
      let h = Number(m[1]);
      const suffix = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${h}:${m[2]} ${suffix}`;
    })
    .join(" – ");
}