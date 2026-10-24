import { Banknote, ShoppingCart } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { Badge } from "@/components/ui/Badge";
import { Box, BoxHeader } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

const palette = [
  {
    name: "Brand — Pharmacy Teal",
    swatches: [
      ["50", "bg-brand-50"], ["100", "bg-brand-100"], ["200", "bg-brand-200"],
      ["300", "bg-brand-300"], ["400", "bg-brand-400"], ["500", "bg-brand-500"],
      ["600", "bg-brand-600"], ["700", "bg-brand-700"], ["800", "bg-brand-800"],
      ["900", "bg-brand-900"], ["950", "bg-brand-950"],
    ],
  },
  {
    name: "Accent — Saffron Amber",
    swatches: [
      ["50", "bg-accent-50"], ["100", "bg-accent-100"], ["200", "bg-accent-200"],
      ["300", "bg-accent-300"], ["400", "bg-accent-400"], ["500", "bg-accent-500"],
      ["600", "bg-accent-600"], ["700", "bg-accent-700"],
    ],
  },
  {
    name: "Ink & surfaces",
    swatches: [
      ["surface", "bg-surface"], ["line", "bg-line"], ["300", "bg-ink-300"],
      ["400", "bg-ink-400"], ["500", "bg-ink-500"], ["700", "bg-ink-700"],
      ["800", "bg-ink-800"], ["900", "bg-ink-900"],
    ],
  },
  {
    name: "Semantic",
    swatches: [
      ["sale", "bg-sale"], ["success", "bg-success"], ["info", "bg-info"],
    ],
  },
] as const;

export default async function DesignSystemPage({
  params,
}: PageProps<"/[locale]/design-system">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("DS");

  return (
    <div className="container-site space-y-4 py-6">
      <div>
        <h1 className="text-2xl font-extrabold">{t("title")}</h1>
        <p className="mt-1 text-sm text-ink-600">{t("intro")}</p>
      </div>

      <Box>
        <BoxHeader title={t("logo")} />
        <div className="grid gap-3 p-4 md:grid-cols-3">
          <div className="flex items-center justify-center rounded-sm border border-line bg-white p-8">
            <Logo />
          </div>
          <div className="flex items-center justify-center rounded-sm bg-brand-900 p-8">
            <Logo tone="dark" />
          </div>
          <div className="flex items-center justify-center gap-6 rounded-sm bg-surface p-8">
            <LogoMark className="size-16" />
            <span className="inline-flex size-16 items-center justify-center rounded-lg bg-brand-950">
              <LogoMark tone="dark" className="size-10" />
            </span>
          </div>
        </div>
      </Box>

      <Box>
        <BoxHeader title={t("palette")} />
        <div className="space-y-5 p-4">
          {palette.map((group) => (
            <div key={group.name}>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-600">
                {group.name}
              </h3>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-11">
                {group.swatches.map(([label, cls]) => (
                  <div key={label} className="overflow-hidden rounded-sm border border-line">
                    <div className={`h-12 ${cls}`} />
                    <div className="bg-white px-2 py-1 text-[11px] font-semibold text-ink-700">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Box>

      <div className="grid gap-4 lg:grid-cols-2">
        <Box>
          <BoxHeader title={t("type")} />
          <div className="space-y-3 p-4">
            <p className="text-3xl font-extrabold">Heading XL — 30/800</p>
            <p className="text-xl font-bold">Heading L — 20/700</p>
            <p className="text-base">Body — 16/400 · {t("sample")}</p>
            <p className="text-sm text-ink-600">Small — 14/400</p>
            <p dir="rtl" lang="ar" className="font-[family-name:var(--font-arabic)] text-xl font-semibold">
              {t("sampleAr")}
            </p>
          </div>
        </Box>

        <Box>
          <BoxHeader title={t("buttons")} />
          <div className="flex flex-wrap gap-2 p-4">
            <Button variant="primary">Primary</Button>
            <Button variant="accent">
              <ShoppingCart className="size-4" aria-hidden /> Add to cart
            </Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="dark">Dark</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="accent" size="sm">
              <ShoppingCart className="size-3.5" aria-hidden /> Small
            </Button>
            <Button variant="primary" size="lg">Checkout</Button>
            <Button variant="outline" disabled>Disabled</Button>
          </div>
        </Box>

        <Box>
          <BoxHeader title={t("badges")} />
          <div className="flex flex-wrap gap-2 p-4">
            <Badge tone="sale">-25%</Badge>
            <Badge tone="accent">Deal</Badge>
            <Badge tone="brand">Express</Badge>
            <Badge tone="success">In stock</Badge>
            <Badge tone="info">New</Badge>
            <Badge tone="neutral">
              <Banknote className="size-3" aria-hidden /> COD
            </Badge>
          </div>
        </Box>

        <Box>
          <BoxHeader title={t("inputs")} />
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="ds-email">Email</Label>
              <Input id="ds-email" type="email" placeholder="name@example.com" />
            </div>
            <div>
              <Label htmlFor="ds-phone">Phone</Label>
              <Input id="ds-phone" dir="ltr" placeholder="+971 50 000 0000" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="ds-err">Invalid</Label>
              <Input id="ds-err" aria-invalid defaultValue="wrong@" />
            </div>
          </div>
        </Box>
      </div>
    </div>
  );
}
