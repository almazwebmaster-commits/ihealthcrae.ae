"use client";

import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export function PasswordInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  const t = useTranslations("Auth");
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} dir="ltr" className={cn("pe-11", className)} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t("hidePassword") : t("showPassword")}
        aria-pressed={visible}
        className="absolute inset-y-0 end-0 inline-flex w-11 items-center justify-center text-ink-500 hover:text-ink-900"
      >
        {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  );
}
