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
            Configurá alertas para vos (admin) y el <strong>código de bienvenida</strong> para entrega manual al cliente.
            El mail de confirmación de cuenta lo sigue enviando Supabase Auth.
          </p>
        </div>
      </div>

      <AdminAlertSettingsForm initial={settings} />
    </div>
  );
}
