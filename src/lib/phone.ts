/**
 * Normalises a UAE phone number to E.164 (+9715XXXXXXXX / +971XXXXXXXX).
 * Accepts 050 123 4567, +971 50 123 4567, 00971501234567, 04 123 4567, Arabic-Indic digits.
 * Returns null if it isn't a valid UAE mobile or landline number.
 */
export function normalizeUaePhone(input: string): string | null {
  const digits = input
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[\s\-().]/g, "");
  const m = digits.match(/^(?:\+971|00971|971|0)?(5\d{8}|[2-9]\d{7})$/);
  return m ? `+971${m[1]}` : null;
}

/** +971501234567 → 050 123 4567 (display format). */
export function formatUaePhone(e164: string) {
  const local = e164.replace(/^\+971/, "0");
  return local.length === 10
    ? `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
    : `${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
}
