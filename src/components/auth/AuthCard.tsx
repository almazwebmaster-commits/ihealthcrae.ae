import { CircleAlert, CircleCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Box } from "@/components/ui/Box";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Centered, boxy card used by every sign-in / registration screen. */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="container-site flex justify-center py-8 sm:py-12">
      <div className="w-full max-w-md space-y-3">
        <Box className="p-6 sm:p-8">
          <Link href="/" className="mb-6 inline-block" aria-label="iHealthcare.ae">
            <Logo className="h-8" />
          </Link>
          <h1 className="text-2xl font-extrabold text-ink-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-600">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </Box>
        {footer && <Box className="p-4 text-center text-sm text-ink-700">{footer}</Box>}
      </div>
    </div>
  );
}

export function FormMessage({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  const Icon = tone === "error" ? CircleAlert : CircleCheck;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-sm border px-3 py-2.5 text-sm",
        tone === "error" ? "border-sale/30 bg-sale-50 text-sale" : "border-success/30 bg-success-50 text-success",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
