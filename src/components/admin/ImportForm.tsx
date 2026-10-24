"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { importProductsAction } from "@/app/[locale]/admin/products/actions";
import { FormMessage } from "@/components/auth/AuthCard";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Input";
import type { ImportResult } from "@/server/admin/products";

/** Two-step import: "Check file" validates without writing, "Import now" applies. */
export function ImportForm() {
  const t = useTranslations("AdminUI.importer");
  const [result, action, pending] = useActionState<ImportResult | null, FormData>(importProductsAction, null);

  return (
    <Box className="space-y-4 p-5">
      {/* The pressed button's name/value ("mode") is part of the submitted form data. */}
      <form action={action} className="space-y-4">
        <div>
          <Label htmlFor="csv">{t("file")}</Label>
          <input id="csv" name="file" type="file" accept=".csv,text/csv" required className="block w-full text-sm file:me-3 file:rounded-sm file:border file:border-line-strong file:bg-surface file:px-3 file:py-2 file:text-sm file:font-semibold" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" name="mode" value="check" variant="outline" disabled={pending}>
            {t("check")}
          </Button>
          <Button type="submit" name="mode" value="apply" variant="accent" disabled={pending}>
            {t("apply")}
          </Button>
        </div>
      </form>

      {result && (
        <div className="space-y-2">
          <FormMessage tone={result.errors.length ? "error" : "success"}>
            {result.applied ? `${t("done")} ` : ""}
            {t("summary", { created: result.created, updated: result.updated, errors: result.errors.length })}
          </FormMessage>
          {!result.applied && <p className="text-xs text-ink-600">{t("preview")}</p>}
          {result.errors.length > 0 && (
            <ul className="max-h-64 space-y-1 overflow-y-auto rounded-sm border border-line bg-surface p-3 text-xs text-sale">
              {result.errors.map((e, i) => (
                <li key={i}>{t("rowError", { row: e.row, message: e.message })}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Box>
  );
}
