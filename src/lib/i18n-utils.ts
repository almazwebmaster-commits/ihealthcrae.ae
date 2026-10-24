/** A string localized in every supported language. */
export type L = { en: string; ar: string };

export function tr(value: L, locale: string) {
  return locale === "ar" ? value.ar : value.en;
}

const priceFormatters = new Map<string, Intl.NumberFormat>();

/** AED with western digits in both languages (the UAE retail convention). */
export function formatPrice(amount: number, locale: string) {
  let f = priceFormatters.get(locale);
  if (!f) {
    f = new Intl.NumberFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
    });
    priceFormatters.set(locale, f);
  }
  return f.format(amount);
}

export function formatNumber(n: number, locale: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE").format(n);
}
