/** UAE is UTC+4 all year (no daylight saving). Admin date/time inputs are entered in UAE time. */
const OFFSET_MS = 4 * 3600_000;

/** Date → value for <input type="datetime-local"> in UAE time ("" for none). */
export const toUaeInput = (d: Date | string | null | undefined) =>
  d ? new Date(new Date(d).getTime() + OFFSET_MS).toISOString().slice(0, 16) : "";

/** <input type="datetime-local"> value in UAE time → Date (null when empty or invalid). */
export function fromUaeInput(v: string | null | undefined) {
  if (!v) return null;
  const d = new Date(`${v.length === 16 ? `${v}:00` : v}+04:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}
