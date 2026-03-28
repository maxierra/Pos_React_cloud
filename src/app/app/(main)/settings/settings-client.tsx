"use client";

import * as React from "react";
import { Users, Store, Mail, Send } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { BusinessInfoForm } from "@/app/app/(main)/settings/business-info-form";
import { UsersManager } from "@/app/app/(main)/settings/users-manager";
import { updateReportDaily, sendDailyReportNow } from "@/app/app/(main)/settings/actions";

type BusinessDefaults = {
  name: string;
  address: string | null;
  phone: string | null;
  cuit: string | null;
  ticket_header: string | null;
  ticket_footer: string | null;
  report_daily_enabled: boolean;
  report_daily_email: string | null;
  report_daily_time: string | null;
};

type Props = {
  defaults?: BusinessDefaults;
};

function ModalShell({ open, title, description, onClose, children }: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-w-3xl max-h-[85vh] flex-col overflow-hidden rounded-2xl border bg-card shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b bg-gradient-to-r from-emerald-600/15 via-cyan-600/10 to-transparent px-5 py-4">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold tracking-tight">{title}</div>
            {description ? <div className="text-xs text-muted-foreground">{description}</div> : null}
          </div>
          <Button type="button" variant="outline" onClick={onClose} className="h-9 bg-background/70">
            Cerrar
          </Button>
        </div>
        <div className="min-h-0 overflow-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function SettingsClient({ defaults }: Props) {
  const [bizOpen, setBizOpen] = React.useState(false);
  const [usersOpen, setUsersOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [sendingNow, setSendingNow] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleReportSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await updateReportDaily(formData);
      if ("error" in result && result.error) {
        setMessage({ type: "error", text: String(result.error) });
      } else {
        setMessage({ type: "success", text: "Configuración guardada" });
        setTimeout(() => setReportOpen(false), 1500);
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error al guardar" });
    } finally {
      setSaving(false);
    }
  };

  const handleSendNow = async () => {
    setSendingNow(true);
    setMessage(null);

    try {
      const result = await sendDailyReportNow();
      if ("error" in result && result.error) {
        setMessage({ type: "error", text: String(result.error) });
      } else {
        setMessage({ type: "success", text: "Reporte enviado exitosamente" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error al enviar" });
    } finally {
      setSendingNow(false);
    }
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          onClick={() => setBizOpen(true)}
          className={cn(
            "text-left",
            "rounded-xl border bg-card shadow-sm transition",
            "hover:border-emerald-500/40 hover:shadow-md"
          )}
        >
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Store className="size-4 text-emerald-600" />
                Datos del negocio
              </CardTitle>
              <CardDescription>Información que sale en el ticket.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground">Editar nombre, CUIT, dirección y mensajes.</div>
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => setUsersOpen(true)}
          className={cn(
            "text-left",
            "rounded-xl border bg-card shadow-sm transition",
            "hover:border-emerald-500/40 hover:shadow-md"
          )}
        >
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Users className="size-4 text-emerald-600" />
                Usuarios
              </CardTitle>
              <CardDescription>Empleados que acceden a este comercio.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground">Crear usuarios y asignar roles.</div>
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className={cn(
            "text-left",
            "rounded-xl border bg-card shadow-sm transition",
            "hover:border-emerald-500/40 hover:shadow-md"
          )}
        >
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Mail className="size-4 text-emerald-600" />
                Reporte diario
              </CardTitle>
              <CardDescription>Recibe un resumen diario por email.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground">
                {defaults?.report_daily_enabled 
                  ? `Activo - ${defaults.report_daily_email || ""}` 
                  : "Configurar envío automático"}
              </div>
            </CardContent>
          </Card>
        </button>
      </div>

      <ModalShell
        open={bizOpen}
        title="Datos del negocio"
        description="Esta información aparecerá en los tickets de venta."
        onClose={() => setBizOpen(false)}
      >
        <BusinessInfoForm defaults={defaults} />
      </ModalShell>

      <ModalShell
        open={usersOpen}
        title="Usuarios"
        description="Creá usuarios para tus empleados y asignales permisos para este comercio."
        onClose={() => setUsersOpen(false)}
      >
        <UsersManager />
      </ModalShell>

      <ModalShell
        open={reportOpen}
        title="Reporte diario por email"
        description="Recibí un resumen de ventas cada día a la mañana."
        onClose={() => setReportOpen(false)}
      >
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              name="enabled"
              value="true"
              defaultChecked={defaults?.report_daily_enabled ?? false}
              className="size-4"
            />
            <Label htmlFor="enabled" className="font-normal">
              Activar reporte diario
            </Label>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email para recibir el reporte</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tucorreo@ejemplo.com"
              defaultValue={defaults?.report_daily_email ?? ""}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="time">Hora de envío</Label>
            <Input
              id="time"
              name="time"
              type="time"
              defaultValue={defaults?.report_daily_time ?? "08:00"}
            />
          </div>

          {message && (
            <div className={cn(
              "rounded-lg px-3 py-2 text-sm",
              message.type === "success" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
            )}>
              {message.text}
            </div>
          )}

          <div className="flex justify-between gap-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={handleSendNow}
              disabled={sendingNow || !defaults?.report_daily_enabled}
              className={defaults?.report_daily_enabled ? "border-emerald-500 text-emerald-600 hover:bg-emerald-50" : ""}
            >
              {sendingNow ? "Enviando..." : "📨 Enviar ahora"}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setReportOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </form>
      </ModalShell>
    </>
  );
}
