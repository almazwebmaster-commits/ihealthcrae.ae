"use client";

import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useEffect, useState, useTransition } from "react";
import { deleteAddress, saveAddress, setDefaultAddress, type AddressFormState } from "@/app/[locale]/(store)/account/addresses/actions";
import { Badge } from "@/components/ui/Badge";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { emirateName, emirates } from "@/lib/emirates";
import { formatUaePhone } from "@/lib/phone";

export type AddressView = {
  id: number;
  label: string | null;
  fullName: string;
  phone: string;
  emirate: string;
  area: string;
  street: string | null;
  building: string;
  unit: string | null;
  landmark: string | null;
  isDefault: boolean;
};

function AddressForm({ address, onDone }: { address?: AddressView; onDone: () => void }) {
  const t = useTranslations("AccountArea");
  const tAuth = useTranslations("Auth");
  const locale = useLocale();
  const [state, action, pending] = useActionState<AddressFormState, FormData>(saveAddress, {});

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  const err = (name: string) => {
    const e = state.fieldErrors?.[name];
    return e ? <p className="mt-1 text-xs font-semibold text-sale">{e === "invalidPhone" ? tAuth("errors.invalidPhone") : t("required")}</p> : null;
  };
  const field = (name: keyof AddressView, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <Label htmlFor={`a-${name}`}>{label}</Label>
      <Input
        id={`a-${name}`}
        name={name}
        defaultValue={(address?.[name] as string | null) ?? ""}
        aria-invalid={!!state.fieldErrors?.[name]}
        {...props}
      />
      {err(name)}
    </div>
  );

  return (
    <Box className="p-5">
      <h2 className="mb-4 text-lg font-bold">{address ? t("editAddress") : t("addAddress")}</h2>
      <form action={action} className="grid gap-4 sm:grid-cols-2">
        {address && <input type="hidden" name="id" value={address.id} />}
        {field("fullName", t("fullName"), { autoComplete: "name", required: true })}
        {field("phone", t("phone"), {
          type: "tel",
          inputMode: "tel",
          dir: "ltr",
          placeholder: "050 123 4567",
          autoComplete: "tel",
          required: true,
          defaultValue: address ? formatUaePhone(address.phone) : "",
        })}
        <div>
          <Label htmlFor="a-emirate">{t("emirate")}</Label>
          <select
            id="a-emirate"
            name="emirate"
            required
            defaultValue={address?.emirate ?? ""}
            aria-invalid={!!state.fieldErrors?.emirate}
            className="h-10 w-full rounded-sm border border-line-strong bg-white px-3 text-sm focus:border-brand-500 focus:outline-none aria-invalid:border-sale"
          >
            <option value="" disabled>
              {t("chooseEmirate")}
            </option>
            {emirates.map((e) => (
              <option key={e.slug} value={e.slug}>
                {locale === "ar" ? e.name.ar : e.name.en}
              </option>
            ))}
          </select>
          {err("emirate")}
        </div>
        {field("area", t("area"), { required: true })}
        {field("building", t("building"), { required: true })}
        {field("unit", t("unit"))}
        {field("street", t("street"))}
        {field("landmark", t("landmark"))}
        {field("label", t("label"), { placeholder: t("labelPlaceholder") })}
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-800">
          <input type="checkbox" name="isDefault" defaultChecked={address?.isDefault} className="size-4 accent-brand-600" />
          {t("makeDefault")}
        </label>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" variant="primary" disabled={pending}>
            {t("saveAddress")}
          </Button>
          <Button variant="outline" onClick={onDone}>
            {t("cancel")}
          </Button>
        </div>
      </form>
    </Box>
  );
}

export function AddressBook({ addresses }: { addresses: AddressView[] }) {
  const t = useTranslations("AccountArea");
  const locale = useLocale();
  const [editing, setEditing] = useState<AddressView | "new" | null>(null);
  const [pending, startTransition] = useTransition();
  const close = () => setEditing(null);

  return (
    <div className="space-y-4">
      <Box className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <h1 className="text-xl font-extrabold">{t("addressesTitle")}</h1>
        {editing === null && (
          <Button variant="accent" onClick={() => setEditing("new")}>
            <Plus className="size-4" aria-hidden />
            {t("addAddress")}
          </Button>
        )}
      </Box>

      {editing !== null && (
        <AddressForm key={editing === "new" ? "new" : editing.id} address={editing === "new" ? undefined : editing} onDone={close} />
      )}

      {addresses.length === 0 && editing === null ? (
        <Box className="flex flex-col items-center px-6 py-12 text-center">
          <MapPin className="size-10 text-ink-300" aria-hidden />
          <p className="mt-3 text-sm text-ink-600">{t("noAddresses")}</p>
        </Box>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id}>
              <Box className={a.isDefault ? "border-brand-300 p-4 ring-1 ring-brand-300" : "p-4"}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold">
                    {a.label || a.fullName}
                    {a.label && <span className="ms-1 font-normal text-ink-600">· {a.fullName}</span>}
                  </p>
                  {a.isDefault && <Badge tone="brand">{t("default")}</Badge>}
                </div>
                <address className="mt-2 text-sm not-italic leading-6 text-ink-700">
                  {[a.unit, a.building, a.street].filter(Boolean).join(", ")}
                  <br />
                  {a.area}, {emirateName(a.emirate, locale)}
                  {a.landmark && (
                    <>
                      <br />
                      <span className="text-ink-500">{a.landmark}</span>
                    </>
                  )}
                  <br />
                  <bdi dir="ltr">{formatUaePhone(a.phone)}</bdi>
                </address>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                  <Button size="sm" variant="outline" onClick={() => setEditing(a)}>
                    <Pencil className="size-3.5" aria-hidden />
                    {t("edit")}
                  </Button>
                  {!a.isDefault && (
                    <Button size="sm" variant="ghost" disabled={pending} onClick={() => startTransition(() => setDefaultAddress(a.id))}>
                      <Star className="size-3.5" aria-hidden />
                      {t("setDefault")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    className="text-sale"
                    onClick={() => {
                      if (confirm(t("confirmDelete"))) startTransition(() => deleteAddress(a.id));
                    }}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    {t("delete")}
                  </Button>
                </div>
              </Box>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
