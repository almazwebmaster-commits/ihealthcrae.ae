/** Store WhatsApp number (international digits, e.g. 9715XXXXXXXX). Unset → WhatsApp links are hidden. */
const NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");

/** wa.me chat link with an optional prefilled message, or null when no number is configured. */
export function whatsappUrl(message?: string) {
  if (!NUMBER) return null;
  return `https://wa.me/${NUMBER}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
