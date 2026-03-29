"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  bootstrapMercadoPagoPos,
  saveMercadoPagoPos,
} from "@/app/app/(main)/settings/mercadopago-pos-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  posExternalId: string | null;
  qrReady: boolean;
  canEdit: boolean;
};

function posFormServerKey(posExternalId: string | null, qrReady: boolean) {
  return `${posExternalId ?? ""}\u0000${qrReady ? "1" : "0"}`;
}

export function MercadoPagoPosForm({ posExternalId, qrReady, canEdit }: Props) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [saving, setSaving] = React.useState(false);
  const [bootstrapping, setBootstrapping] = React.useState(false);
  const [clearToken, setClearToken] = React.useState(false);

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
        Cobro automático al pagar el QR: en MP configurá notificaciones (IPN) a{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-[10px]">…/api/webhooks/mercadopago</code> (https público).
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
