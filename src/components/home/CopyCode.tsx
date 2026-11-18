"use client";

import { Check, Copy } from "lucide-react";
import { useRef, useState } from "react";

/** Coupon code chip that copies the code when tapped. */
export function CopyCode({ code, labels }: { code: string; labels: { copy: string; copied: string } }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(code).catch(() => {});
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 1600);
      }}
      aria-label={`${copied ? labels.copied : labels.copy}: ${code}`}
      className="inline-flex h-10 items-center gap-2 rounded-lg border-2 border-dashed border-current bg-white/60 px-3 font-mono text-sm font-bold tracking-wide hover:bg-white"
      dir="ltr"
    >
      {code}
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
    </button>
  );
}
