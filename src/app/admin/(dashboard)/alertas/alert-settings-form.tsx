"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { saveAdminAlertSettings } from "@/app/admin/(dashboard)/alert-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminAlertSettingsRow } from "@/lib/admin-alerts-send";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-orange-600 hover:bg-orange-700">
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      Guardar
    </Button>
  );
}

type Props = {
  initial: AdminAlertSettingsRow;
};

export function AdminAlertSettingsForm({ initial }: Props) {
  const [message, setMessage] = React.useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      action={async (fd) => {
        setMessage(null);
        const res = await saveAdminAlertSettings(fd);
        if (res.ok) {
          setMessage({ ok: true, text: "Guardado." });
        } else {
          setMessage({ ok: false, text: "error" in res ? res.error : "Error" });
        }
      }}
      className="max-w-lg space-y-6"
    >
      <div className="space-y-2">
        <Label htmlFor="admin_alert_email">Correo donde recibir las alertas</Label>
        <Input
          id="admin_alert_email"
          name="admin_alert_email"
          type="email"
          autoComplete="email"
          placeholder="tu-mail@ejemplo.com"
          defaultValue={initial.admin_alert_email ?? ""}
        />
        <p className="text-xs text-muted-foreground">
          Si lo dejás vacío, se usa el <strong>primer correo</strong> de{" "}
          <code className="rounded bg-muted px-1">PLATFORM_ADMIN_EMAILS</code> en el servidor (si existe).
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-[var(--pos-border)] bg-[var(--pos-surface-2)]/40 p-4">
        <input
          type="checkbox"
          id="alert_on_user_signup"
          name="alert_on_user_signup"
          defaultChecked={initial.alert_on_user_signup}
          className="mt-1 size-4 rounded border-input accent-orange-600"
        />
        <div className="space-y-1">
          <Label htmlFor="alert_on_user_signup" className="cursor-pointer font-medium leading-snug">
            Avisarme cuando alguien se registra
          </Label>
          <p className="text-xs text-muted-foreground">
            Se envía cuando crean cuenta (formulario de registro), con el email que ingresaron.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-[var(--pos-border)] bg-[var(--pos-surface-2)]/40 p-4">
        <input
          type="checkbox"
          id="alert_on_subscription_payment"
          name="alert_on_subscription_payment"
          defaultChecked={initial.alert_on_subscription_payment}
          className="mt-1 size-4 rounded border-input accent-orange-600"
        />
        <div className="space-y-1">
          <Label htmlFor="alert_on_subscription_payment" className="cursor-pointer font-medium leading-snug">
            Avisarme cuando pagan la suscripción (Mercado Pago)
          </Label>
          <p className="text-xs text-muted-foreground">
            Cuando Mercado Pago confirma el pago del plan y se activa la suscripción en el sistema.
          </p>
        </div>
      </div>

      {message ? (
        <p className={message.ok ? "text-sm text-emerald-600 dark:text-emerald-400" : "text-sm text-destructive"}>
          {message.text}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
