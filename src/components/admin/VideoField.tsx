"use client";

import { Film, Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { playerVideo } from "@/lib/cloudinary-video";

/** Video from a web address: imported into Cloudinary by the server, then previewed here. */
export function VideoField({
  area,
  value,
  onChange,
  hint,
}: {
  area: "homepage" | "products";
  value: string | null;
  onChange: (src: string | null) => void;
  hint: string;
}) {
  const t = useTranslations("AdminUI.video");
  const id = useId();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function importVideo() {
    setBusy(true);
    setError(undefined);
    const res = await fetch("/api/admin/uploads/video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, area }),
    }).catch(() => null);
    setBusy(false);
    const data = (await res?.json().catch(() => null)) as { video?: { src: string }; error?: string } | null;
    if (!res?.ok || !data?.video) {
      const e = data?.error;
      return setError(t(e === "url" ? "errors.url" : e === "storage" ? "errors.storage" : "errors.import"));
    }
    onChange(data.video.src);
    setUrl("");
  }

  const preview = value ? playerVideo(value) : null;
  return (
    <div className="space-y-2">
      <p className="text-xs text-ink-500">{hint}</p>
      {preview && (
        <div className="flex flex-wrap items-end gap-3">
          <video src={preview.video} poster={preview.poster} controls preload="none" playsInline className="aspect-video w-72 rounded-lg bg-ink-900" />
          <Button variant="ghost" size="sm" className="text-sale" onClick={() => onChange(null)}>
            <Trash2 className="size-4" aria-hidden />
            {t("remove")}
          </Button>
        </div>
      )}
      <div>
        <Label htmlFor={id}>{value ? t("replaceLabel") : t("label")}</Label>
        <div className="flex flex-wrap gap-2">
          <Input id={id} dir="ltr" type="url" inputMode="url" placeholder="https://…/video.mp4" value={url} onChange={(e) => setUrl(e.target.value)} className="min-w-64 flex-1" />
          <Button variant="outline" disabled={busy || !url.trim()} onClick={importVideo}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Film className="size-4" aria-hidden />}
            {busy ? t("importing") : t("import")}
          </Button>
        </div>
        {busy && <p className="mt-1 text-xs text-ink-500">{t("importingHint")}</p>}
        {error && <p role="alert" className="mt-1 text-xs font-semibold text-sale">{error}</p>}
      </div>
    </div>
  );
}
