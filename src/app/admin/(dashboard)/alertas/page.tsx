import { Bell } from "lucide-react";
import { redirect } from "next/navigation";

import { AdminAlertSettingsForm } from "@/app/admin/(dashboard)/alertas/alert-settings-form";
import { fetchAdminAlertSettings } from "@/app/admin/(dashboard)/alert-actions";

export default async function AdminAlertasPage() {
  const settings = await fetchAdminAlertSettings();
  if (!settings) {
    redirect("/admin/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-orange-600/15 text-orange-600">
          <Bell className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Alertas por correo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configurá a qué dirección enviar avisos y qué eventos querés recibir. Los mails salen con{" "}
            <strong>Resend</strong> (misma API que los reportes): necesitás{" "}
            <code className="rounded bg-muted px-1 text-xs">RESEND_API_KEY</code> en el servidor. Opcionalmente{" "}
            <code className="rounded bg-muted px-1 text-xs">RESEND_FROM</code> con un remitente verificado en Resend.
          </p>
        </div>
      </div>

      <AdminAlertSettingsForm initial={settings} />
    </div>
  );
}
