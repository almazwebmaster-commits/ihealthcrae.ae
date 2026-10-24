import "server-only";
import type { Mail } from "./mail";

type Locale = "en" | "ar";

const copy = {
  verify: {
    en: {
      subject: "Confirm your iHealthcare account",
      title: "Confirm your email",
      body: "Thanks for joining iHealthcare. Please confirm your email address to finish creating your account.",
      cta: "Confirm email",
      note: "This link expires in 24 hours. If you didn't create an account, you can ignore this email.",
    },
    ar: {
      subject: "أكّد حسابك في آي هيلث كير",
      title: "أكّد بريدك الإلكتروني",
      body: "شكراً لانضمامك إلى آي هيلث كير. يرجى تأكيد بريدك الإلكتروني لإكمال إنشاء حسابك.",
      cta: "تأكيد البريد الإلكتروني",
      note: "تنتهي صلاحية هذا الرابط خلال 24 ساعة. إذا لم تنشئ حساباً، يمكنك تجاهل هذه الرسالة.",
    },
  },
  reset: {
    en: {
      subject: "Reset your iHealthcare password",
      title: "Reset your password",
      body: "We received a request to reset your password. Choose a new one using the button below.",
      cta: "Choose a new password",
      note: "This link expires in 1 hour. If you didn't ask to reset your password, you can ignore this email — your password won't change.",
    },
    ar: {
      subject: "إعادة تعيين كلمة المرور في آي هيلث كير",
      title: "إعادة تعيين كلمة المرور",
      body: "تلقينا طلباً لإعادة تعيين كلمة المرور. اختر كلمة مرور جديدة عبر الزر أدناه.",
      cta: "اختيار كلمة مرور جديدة",
      note: "تنتهي صلاحية هذا الرابط خلال ساعة واحدة. إذا لم تطلب إعادة التعيين، يمكنك تجاهل هذه الرسالة ولن تتغير كلمة المرور.",
    },
  },
} as const;

const greeting = { en: (n: string) => `Hello ${n},`, ar: (n: string) => `مرحباً ${n}،` };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Boxy, brand-coloured email with inline styles (email clients ignore stylesheets). */
function layout(locale: Locale, name: string, c: (typeof copy)[keyof typeof copy][Locale], url: string): string {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const font = locale === "ar" ? "Tahoma, Arial, sans-serif" : "Arial, Helvetica, sans-serif";
  return `<!doctype html>
<html lang="${locale}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(c.subject)}</title></head>
<body style="margin:0;background:#f2f4f5;font-family:${font};color:#0e1b2c">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f5;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #dde2e5;border-radius:4px">
<tr><td style="background:#063634;padding:18px 24px;border-radius:4px 4px 0 0" dir="ltr">
<span style="font-size:22px;font-weight:800;color:#ffb400">i</span><span style="font-size:22px;font-weight:800;color:#ffffff">Health</span><span style="font-size:22px;color:#c9e8e5">care</span>
</td></tr>
<tr><td style="padding:28px 24px" dir="${dir}">
<h1 style="margin:0 0 12px;font-size:22px">${esc(c.title)}</h1>
<p style="margin:0 0 8px;font-size:15px">${esc(greeting[locale](name))}</p>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6">${esc(c.body)}</p>
<a href="${esc(url)}" style="display:inline-block;background:#ffb400;color:#0e1b2c;font-weight:700;font-size:15px;text-decoration:none;padding:12px 22px;border:1px solid #e09a00;border-radius:2px">${esc(c.cta)}</a>
<p style="margin:24px 0 0;font-size:12px;color:#64748b;line-height:1.6">${esc(c.note)}</p>
<p style="margin:12px 0 0;font-size:11px;color:#94a3b8;word-break:break-all" dir="ltr">${esc(url)}</p>
</td></tr>
<tr><td style="padding:14px 24px;border-top:1px solid #dde2e5;font-size:11px;color:#94a3b8" dir="ltr">iHealthcare.ae</td></tr>
</table></td></tr></table></body></html>`;
}

function build(kind: keyof typeof copy, locale: string, to: string, name: string, url: string): Mail {
  const l: Locale = locale === "ar" ? "ar" : "en";
  const c = copy[kind][l];
  return {
    to,
    subject: c.subject,
    html: layout(l, name, c, url),
    text: `${greeting[l](name)}\n\n${c.body}\n\n${c.cta}: ${url}\n\n${c.note}`,
  };
}

// ── Order confirmation

type OrderForMail = {
  number: string;
  locale: string;
  email: string;
  fullName: string;
  paymentMethod: string;
  building: string;
  unit: string | null;
  street: string | null;
  area: string;
  emirate: string;
  itemsTotal: unknown;
  discount: unknown;
  deliveryFee: unknown;
  total: unknown;
  vatAmount: unknown;
  items: { nameEn: string; nameAr: string; optionEn: string | null; optionAr: string | null; qty: number; lineTotal: unknown; subWeeks: number | null }[];
};

const orderCopy = {
  en: {
    subject: (n: string) => `Order confirmed — ${n}`,
    title: "Thank you — your order is confirmed",
    intro: (n: string) => `We've received order ${n} and will let you know when it's on its way.`,
    items: "Items", discount: "Savings", delivery: "Delivery", free: "Free", total: "Total", vat: "Includes VAT",
    payment: "Payment", card: "Card (paid)", cod: "Cash on delivery", deliverTo: "Delivering to",
    every: (w: number) => `Subscribe & save · every ${w} weeks`,
  },
  ar: {
    subject: (n: string) => `تم تأكيد الطلب — ${n}`,
    title: "شكراً لك — تم تأكيد طلبك",
    intro: (n: string) => `استلمنا الطلب ${n} وسنُعلمك عند خروجه للتوصيل.`,
    items: "المنتجات", discount: "التوفير", delivery: "التوصيل", free: "مجاني", total: "الإجمالي", vat: "شامل ضريبة القيمة المضافة",
    payment: "الدفع", card: "بطاقة (مدفوع)", cod: "الدفع عند الاستلام", deliverTo: "التوصيل إلى",
    every: (w: number) => `اشترك ووفّر · كل ${w} أسابيع`,
  },
};

export function orderConfirmationMail(order: OrderForMail): Mail {
  const l: Locale = order.locale === "ar" ? "ar" : "en";
  const c = orderCopy[l];
  const dir = l === "ar" ? "rtl" : "ltr";
  const fmt = (n: unknown) =>
    new Intl.NumberFormat(l === "ar" ? "ar-AE-u-nu-latn" : "en-AE", { style: "currency", currency: "AED" }).format(Number(n));
  const row = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:4px 0;font-size:14px;${bold ? "font-weight:700" : "color:#475569"}">${esc(label)}</td><td style="padding:4px 0;font-size:14px;text-align:${l === "ar" ? "left" : "right"};${bold ? "font-weight:700" : ""}">${esc(value)}</td></tr>`;
  const items = order.items
    .map((i) => {
      const name = l === "ar" ? i.nameAr : i.nameEn;
      const option = l === "ar" ? i.optionAr ?? i.optionEn : i.optionEn;
      const extra = [option, i.subWeeks ? c.every(i.subWeeks) : null].filter(Boolean).join(" · ");
      return `<tr><td style="padding:8px 0;border-bottom:1px solid #dde2e5;font-size:14px">${esc(name)}${extra ? `<br><span style="font-size:12px;color:#64748b">${esc(extra)}</span>` : ""}</td><td style="padding:8px 6px;border-bottom:1px solid #dde2e5;font-size:14px;text-align:center">×${i.qty}</td><td style="padding:8px 0;border-bottom:1px solid #dde2e5;font-size:14px;text-align:${l === "ar" ? "left" : "right"};white-space:nowrap">${esc(fmt(i.lineTotal))}</td></tr>`;
    })
    .join("");
  const discount = Number(order.discount);
  const delivery = Number(order.deliveryFee);
  const address = [order.unit, order.building, order.street, order.area].filter(Boolean).join(", ");
  const font = l === "ar" ? "Tahoma, Arial, sans-serif" : "Arial, Helvetica, sans-serif";

  const html = `<!doctype html><html lang="${l}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(c.subject(order.number))}</title></head>
<body style="margin:0;background:#f2f4f5;font-family:${font};color:#0e1b2c">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f5;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border:1px solid #dde2e5;border-radius:4px">
<tr><td style="background:#063634;padding:18px 24px" dir="ltr"><span style="font-size:22px;font-weight:800;color:#ffb400">i</span><span style="font-size:22px;font-weight:800;color:#fff">Health</span><span style="font-size:22px;color:#c9e8e5">care</span></td></tr>
<tr><td style="padding:24px" dir="${dir}">
<h1 style="margin:0 0 8px;font-size:21px">${esc(c.title)}</h1>
<p style="margin:0 0 20px;font-size:14px;line-height:1.6">${esc(greeting[l](order.fullName))} ${esc(c.intro(order.number))}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px">
${row(c.items, fmt(order.itemsTotal))}${discount > 0 ? row(c.discount, `−${fmt(discount)}`) : ""}${row(c.delivery, delivery ? fmt(delivery) : c.free)}${row(c.total, fmt(order.total), true)}${row(c.vat, fmt(order.vatAmount))}
</table>
<p style="margin:20px 0 4px;font-size:13px"><strong>${esc(c.payment)}:</strong> ${esc(order.paymentMethod === "COD" ? c.cod : c.card)}</p>
<p style="margin:0;font-size:13px"><strong>${esc(c.deliverTo)}:</strong> ${esc(address)}</p>
</td></tr>
<tr><td style="padding:14px 24px;border-top:1px solid #dde2e5;font-size:11px;color:#94a3b8" dir="ltr">iHealthcare.ae · ${esc(order.number)}</td></tr>
</table></td></tr></table></body></html>`;

  return {
    to: order.email,
    subject: c.subject(order.number),
    html,
    text: `${c.title}\n${c.intro(order.number)}\n\n${order.items.map((i) => `${l === "ar" ? i.nameAr : i.nameEn} ×${i.qty} — ${fmt(i.lineTotal)}`).join("\n")}\n\n${c.total}: ${fmt(order.total)}`,
  };
}

export const verifyEmailMail = (locale: string, to: string, name: string, url: string) =>
  build("verify", locale, to, name, url);

export const resetPasswordMail = (locale: string, to: string, name: string, url: string) =>
  build("reset", locale, to, name, url);
