"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function PrintButton({ label }: { label: string }) {
  return (
    <Button variant="primary" onClick={() => window.print()}>
      <Printer className="size-4" aria-hidden />
      {label}
    </Button>
  );
}
