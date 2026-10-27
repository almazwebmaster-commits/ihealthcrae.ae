"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { addStaffAction, removeStaffAction, updateStaffAction } from "@/app/[locale]/admin/staff/actions";
import { Badge } from "@/components/ui/Badge";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useRouter } from "@/i18n/navigation";
import { adminSections, type AdminSection } from "@/lib/admin-sections";
import { cn } from "@/lib/utils";

type Member = { id: string; name: string; email: string; role: string; permissions: string[]; lastActive: string | null };
type Role = "staff" | "admin";

/** Role + section checkboxes shared by "add" and "edit". */
function AccessFields({ idPrefix, role, setRole, perms, setPerms, roleLocked }: {
  idPrefix: string; role: Role; setRole: (r: Role) => void; perms: AdminSection[]; setPerms: (p: AdminSection[]) => void; roleLocked?: boolean;
}) {
  const t = useTranslations("AdminUI.staff");
  const tNav = useTranslations("AdminUI.nav");
  return (
    <div className="space-y-3">
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold">{t("role")}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(["staff", "admin"] as const).map((r) => (
            <label key={r} className={cn("flex items-start gap-2 rounded-sm border p-3 text-sm", roleLocked ? "opacity-60" : "cursor-pointer", role === r ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600" : "border-line-strong bg-white")}>
              <input type="radio" name={`${idPrefix}-role`} className="mt-0.5 accent-brand-600" checked={role === r} disabled={roleLocked} onChange={() => setRole(r)} />
              <span>
                <span className="block font-semibold">{t(`roles.${r}`)}</span>
                <span className="text-xs text-ink-600">{t(`roleHint.${r}`)}</span>
              </span>
            </label>
          ))}
        </div>
        {roleLocked && <p className="mt-1 text-xs text-ink-500">{t("ownRole")}</p>}
      </fieldset>
      {role === "staff" && (
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">{t("sections")}</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {adminSections.map((s) => (
              <label key={s} className="flex items-center gap-2 rounded-sm border border-line bg-white px-3 py-2 text-sm">
                <input type="checkbox" className="size-4 accent-brand-600" checked={perms.includes(s)} onChange={(e) => setPerms(e.target.checked ? [...perms, s] : perms.filter((x) => x !== s))} />
                {tNav(s)}
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}

function MemberRow({ m, me }: { m: Member; me: string }) {
  const t = useTranslations("AdminUI.staff");
  const tNav = useTranslations("AdminUI.nav");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>(m.role as Role);
  const [perms, setPerms] = useState<AdminSection[]>(m.permissions as AdminSection[]);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const self = m.id === me;
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError(undefined);
      const res = await fn();
      if (!res.ok) return setError(t(`errors.${res.error}`));
      setOpen(false);
      router.refresh();
    });

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {m.name} {self && <span className="text-xs font-normal text-ink-500">({t("you")})</span>}
          </p>
          <p className="text-xs text-ink-500" dir="ltr">{m.email}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {m.role === "admin" ? (
            <Badge tone="brand">{t("allAccess")}</Badge>
          ) : m.permissions.length ? (
            m.permissions.map((p) => <Badge key={p} tone="neutral">{tNav(p)}</Badge>)
          ) : (
            <Badge tone="sale">{t("noAccess")}</Badge>
          )}
        </div>
        <Badge tone={m.role === "admin" ? "brand" : "info"}>{t(`roles.${m.role}`)}</Badge>
        <span className="w-32 text-xs text-ink-500">{m.lastActive ? t("lastActive", { date: m.lastActive }) : t("neverActive")}</span>
        <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="text-sm font-semibold text-brand-700 hover:underline">{open ? t("close") : t("edit")}</button>
      </div>
      {open && (
        <div className="mt-3 space-y-3 rounded-sm bg-surface p-4">
          <AccessFields idPrefix={m.id} role={role} setRole={setRole} perms={perms} setPerms={setPerms} roleLocked={self} />
          {error && <p role="alert" className="text-xs font-semibold text-sale">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" disabled={pending} onClick={() => run(() => updateStaffAction(m.id, { role, permissions: perms }))}>{t("save")}</Button>
            {!self && (
              <Button variant="outline" className="text-sale" disabled={pending} onClick={() => { if (confirm(t("confirmRemove", { name: m.name }))) run(() => removeStaffAction(m.id)); }}>
                {t("remove")}
              </Button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

export function StaffManager({ members, me }: { members: Member[]; me: string }) {
  const t = useTranslations("AdminUI.staff");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [perms, setPerms] = useState<AdminSection[]>(["orders", "customers"]);
  const [error, setError] = useState<string>();
  const [added, setAdded] = useState<string>();
  const [pending, start] = useTransition();

  function add() {
    setError(undefined);
    setAdded(undefined);
    start(async () => {
      const res = await addStaffAction(email, { role, permissions: perms });
      if (!res.ok) return setError(t(`errors.${res.error}`));
      setAdded(t("added", { email }));
      setEmail("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <Box>
        <ul className="divide-y divide-line">
          {members.map((m) => (
            <MemberRow key={`${m.id}-${m.role}-${m.permissions.join()}`} m={m} me={me} />
          ))}
        </ul>
      </Box>

      <Box className="space-y-3 p-4">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <Plus className="size-4" aria-hidden />
          {t("addTitle")}
        </h2>
        <p className="text-xs text-ink-600">{t("addHint")}</p>
        <div className="max-w-md">
          <Label htmlFor="staff-email">{t("email")}</Label>
          <Input id="staff-email" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <AccessFields idPrefix="new" role={role} setRole={setRole} perms={perms} setPerms={setPerms} />
        {error && <p role="alert" className="text-xs font-semibold text-sale">{error}</p>}
        {added && <p role="status" className="text-xs font-semibold text-success">{added}</p>}
        <Button variant="accent" disabled={pending || !email.includes("@")} onClick={add}>{t("add")}</Button>
      </Box>
    </div>
  );
}
