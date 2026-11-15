"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  bootstrapMercadoPagoPos,
  saveMercadoPagoPos,
} from "@/app/app/(main)/settings/mercadopago-pos-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  posExternalId: string | null;
  qrReady: boolean;
  canEdit: boolean;
  qrTemplateDocumentUrl: string | null;
  qrTemplateImageUrl: string | null;
};

function posFormServerKey(posExternalId: string | null, qrReady: boolean) {
  return `${posExternalId ?? ""}\u0000${qrReady ? "1" : "0"}`;
}

export function MercadoPagoPosForm({
  posExternalId,
  qrReady,
  canEdit,
  qrTemplateDocumentUrl,
  qrTemplateImageUrl,
}: Props) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [saving, setSaving] = React.useState(false);
  const [bootstrapping, setBootstrapping] = React.useState(false);
  const [clearToken, setClearToken] = React.useState(false);
  const [documentUrl, setDocumentUrl] = React.useState(qrTemplateDocumentUrl);
  const [imageUrl, setImageUrl] = React.useState(qrTemplateImageUrl);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    const form = formRef.current;
    if (!form) return;

    const posEl = form.querySelector<HTMLInputElement>("#mercadopago_pos_external_id");
    const tokEl = form.querySelector<HTMLInputElement>("#mercadopago_access_token");
    const fd = new FormData();
    fd.set("mercadopago_pos_external_id", posEl?.value.trim() ?? "");
    fd.set("mercadopago_access_token", tokEl?.value.trim() ?? "");
    if (clearToken) {
      fd.set("clear_mercadopago_token", "true");
    }
    setSaving(true);
    try {
      const res = await saveMercadoPagoPos(fd);
      if ("error" in res && res.error) {
        toast.error(String(res.error));
        return;
      }
      toast.success("Guardado");
      setClearToken(false);
      const tokAfter = formRef.current?.querySelector<HTMLInputElement>("#mercadopago_access_token");
      if (tokAfter) tokAfter.value = "";
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const runBootstrap = async () => {
    if (!canEdit) return;
    const form = formRef.current;
    if (!form) return;
    const tokEl = form.querySelector<HTMLInputElement>("#mercadopago_access_token");
    const token = (tokEl?.value ?? "").trim().replace(/[\r\n]+/g, "");
    if (!token) {
      toast.error("Pegá el access token primero");
      return;
    }
    const posEl = form.querySelector<HTMLInputElement>("#mercadopago_pos_external_id");
    const currentPos = (posEl?.value ?? "").trim();
    if (currentPos) {
      const ok = window.confirm(
        "¿Reemplazar el ID de caja actual por uno nuevo en Mercado Pago? La caja vieja sigue en tu cuenta MP."
      );
      if (!ok) return;
    }
    setBootstrapping(true);
    try {
      const fd = new FormData();
      fd.set("mercadopago_access_token", token);
      const res = await bootstrapMercadoPagoPos(fd);
      if ("error" in res && res.error) {
        toast.error(String(res.error));
        return;
      }
      if ("success" in res && res.success && "pos_external_id" in res) {
        if (posEl) posEl.value = String(res.pos_external_id);
        if (tokEl) tokEl.value = "";
        setClearToken(false);
        setDocumentUrl((res as { qr_template_document_url?: string | null }).qr_template_document_url ?? null);
        setImageUrl((res as { qr_template_image_url?: string | null }).qr_template_image_url ?? null);
        toast.success("Caja creada y guardada", { description: res.pos_external_id });
        router.refresh();
      }
    } finally {
      setBootstrapping(false);
    }
  };

  return (
    <form
      ref={formRef}
      key={posFormServerKey(posExternalId, qrReady)}
      className="space-y-4"
      onSubmit={onSubmit}
    >
      <div
        className={cn(
          "rounded-lg border px-3 py-2 text-sm",
          qrReady
            ? "border-emerald-500/35 bg-emerald-500/[0.08] text-emerald-950 dark:text-emerald-100"
            : "border-border bg-muted/40 text-muted-foreground"
        )}
      >
        {qrReady ? "QR activo en el POS." : "Falta token o ID de caja."}
      </div>

      {documentUrl || imageUrl ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.07] p-4">
          <div className="text-sm font-semibold">QR fijo listo para el local</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Imprimilo y dejalo visible en la caja. El importe se actualiza al iniciar cada cobro.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {documentUrl ? (
              <a
                href={documentUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ className: "rounded-xl" })}
              >
                Descargar cartel PDF
              </a>
            ) : null}
            {imageUrl ? (
              <a
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ variant: "outline", className: "rounded-xl" })}
              >
                Abrir imagen del QR
              </a>
            ) : null}
          </div>
        </div>
      ) : qrReady ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/[0.08] p-3 text-xs text-amber-950 dark:text-amber-100">
          Esta caja fue creada con la integración anterior y no tiene cartel guardado. Creá una caja nueva para obtener el QR fijo.
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="mercadopago_access_token">Access token (producción)</Label>
        <Input
          id="mercadopago_access_token"
          name="mercadopago_access_token"
          type="password"
          autoComplete="off"
          disabled={!canEdit}
          placeholder={qrReady ? "Vacío = no cambiar el guardado" : "Pegá APP_USR-…"}
          className="font-mono text-sm"
        />
        {canEdit ? (
          <Button
            type="button"
            disabled={saving || bootstrapping}
            onClick={() => void runBootstrap()}
            className={cn(
              "h-11 w-full rounded-xl text-base font-semibold shadow-md",
              "bg-sky-600 text-white hover:bg-sky-700",
              "dark:bg-sky-600 dark:hover:bg-sky-500",
              "disabled:opacity-60"
            )}
          >
            {bootstrapping ? "Creando en Mercado Pago…" : "Crear sucursal y caja automáticamente"}
          </Button>
        ) : null}
        <p className="text-[11px] leading-snug text-muted-foreground">
          Token en{" "}
          <Link
            className="underline underline-offset-2 hover:text-foreground"
            href="https://www.mercadopago.com.ar/developers/panel/app"
            target="_blank"
            rel="noreferrer"
          >
            Tus integraciones
          </Link>
          . El botón crea tienda + caja en MP y guarda acá (no hace falta tocar el ID abajo).
        </p>
      </div>

      <div className="space-y-2 border-t border-border/60 pt-3">
        <Label htmlFor="mercadopago_pos_external_id" className="text-muted-foreground">
          ID de caja <span className="font-normal">(solo configuración manual)</span>
        </Label>
        <Input
          id="mercadopago_pos_external_id"
          name="mercadopago_pos_external_id"
          defaultValue={posExternalId ?? ""}
          disabled={!canEdit}
          placeholder="Ej. POSABC123"
          className="font-mono text-sm"
        />
        <p className="text-[11px] leading-snug text-muted-foreground">
          Código de texto de la caja en MP, no el número de <code className="rounded bg-muted px-0.5">store_id</code>.{" "}
          <Link
            className="underline underline-offset-2 hover:text-foreground"
            href="https://www.mercadopago.com.ar/developers/es/docs/qr-code/create-store-and-pos"
            target="_blank"
            rel="noreferrer"
          >
            Ayuda
          </Link>
        </p>
      </div>

      <p className="text-[11px] leading-snug text-muted-foreground">
        Cobro automático con QR: en Mercado Pago → Tu integración → Webhooks, URL{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-[10px]">https://tu-dominio/api/webhooks/mercadopago</code> y
        activá el evento Order (Mercado Pago) (no alcanza solo notificaciones de “Pagos”). Usá modo producción y credenciales
        de producción.
      </p>

      {canEdit ? (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={clearToken}
            onChange={(e) => setClearToken(e.target.checked)}
            className="size-4 rounded border-input"
          />
          Borrar token guardado
        </label>
      ) : null}

      {!canEdit ? (
        <p className="text-xs text-muted-foreground">Solo el dueño puede editar.</p>
      ) : (
        <Button type="submit" disabled={saving || bootstrapping} className="rounded-xl">
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      )}
    </form>
  );
}
