"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deletePaymentMethod,
  createPaymentMethod,
  ensurePaymentMethods,
  savePaymentMethods,
  type PaymentMethodPayload,
} from "@/app/app/(main)/settings/payment-methods-actions";
import { PaymentMethodGlyph } from "@/app/app/(main)/pos/components/payment-method-glyph";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PAYMENT_METHOD_ICON_OPTIONS, type BusinessPaymentMethodRow } from "@/lib/business-payment-methods";

type Props = {
  initialRows: BusinessPaymentMethodRow[];
  canEdit: boolean;
  onSaved?: () => void;
};

function toPayload(rows: BusinessPaymentMethodRow[]): PaymentMethodPayload[] {
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    icon_key: r.icon_key,
    icon_url: r.icon_url ?? "",
    is_active: r.is_active,
    sort_order: r.sort_order,
  }));
}

export function PaymentMethodsManager({ initialRows, canEdit, onSaved }: Props) {
  const router = useRouter();
  const [rows, setRows] = React.useState<BusinessPaymentMethodRow[]>(initialRows);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [newLabel, setNewLabel] = React.useState("");
  const [newIcon, setNewIcon] = React.useState("wallet");
  const [creating, setCreating] = React.useState(false);

  const updateRow = (id: string, patch: Partial<BusinessPaymentMethodRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const res = await savePaymentMethods(toPayload(rows));
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Medios de pago guardados");
      router.refresh();
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    const row = rows.find((item) => item.id === id);
    const isDefault = ["cash", "card", "transfer", "mercadopago", "cuenta_corriente"].includes(row?.method_code ?? "");
    if (!confirm(isDefault ? "¿Eliminar este medio? Los medios predeterminados se pueden restaurar luego." : "¿Eliminar este medio de pago?")) return;
    setDeletingId(id);
    try {
      const res = await deletePaymentMethod(id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Listo. Se recargó la lista.");
      setRows((current) => current.filter((item) => item.id !== id));
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  const onCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newLabel.trim()) {
      toast.error("Ingresá un nombre para el medio de pago");
      return;
    }
    setCreating(true);
    try {
      const res = await createPaymentMethod({ label: newLabel, icon_key: newIcon });
      if (res.error || !res.row) {
        toast.error(res.error ?? "No se pudo crear el medio de pago");
        return;
      }
      setRows((current) => [...current, res.row!]);
      setNewLabel("");
      setNewIcon("wallet");
      toast.success("Medio de pago agregado");
      router.refresh();
    } finally {
      setCreating(false);
    }
  };

  const onRestoreMissing = async () => {
    setSaving(true);
    try {
      const res = await ensurePaymentMethods();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Listo. Actualizá la página para ver los cambios.");
      window.location.reload();
    } finally {
      setSaving(false);
    }
  };

  const sorted = [...rows].sort((a, b) => a.sort_order - b.sort_order || a.method_code.localeCompare(b.method_code));

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-violet-500/15 bg-violet-500/[0.06] px-4 py-3 dark:bg-violet-500/10">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Editá directamente cualquier campo de la tabla y luego presioná <span className="font-medium text-foreground/80">Guardar cambios</span>.
          Estos medios aparecen en el cobro del POS con el nombre y el ícono (o logo URL) que elijas. Los{" "}
          <span className="font-medium text-foreground/80">códigos internos</span> se mantienen para caja e informes.
        </p>
      </div>

      {canEdit ? (
        <form onSubmit={onCreate} className="rounded-2xl border border-dashed border-violet-500/30 bg-violet-500/[0.035] p-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-foreground">Agregar medio de pago</h3>
            <p className="text-xs text-muted-foreground">Escribí el nombre que verá el cajero en el POS.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={newLabel}
              onChange={(event) => setNewLabel(event.target.value)}
              placeholder="Ej.: Cuenta DNI, MODO, Vale..."
              maxLength={60}
              disabled={creating}
              className="h-11 flex-1 rounded-xl bg-background"
              aria-label="Nombre del nuevo medio de pago"
            />
            <select
              value={newIcon}
              onChange={(event) => setNewIcon(event.target.value)}
              disabled={creating}
              className="h-11 rounded-xl border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/25"
              aria-label="Ícono del nuevo medio de pago"
            >
              {PAYMENT_METHOD_ICON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <Button type="submit" disabled={creating || !newLabel.trim()} className="h-11 rounded-xl bg-violet-600 px-5 text-white hover:bg-violet-700">
              <Plus className="mr-2 size-4" />
              {creating ? "Agregando…" : "Agregar"}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_1px_0_0_rgba(0,0,0,0.04)_inset] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] table-fixed text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-gradient-to-r from-muted/80 via-muted/50 to-muted/30 text-left">
                <th className="w-[72px] px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Activo
                </th>
                <th className="w-[130px] px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Código
                </th>
                <th className="w-[210px] px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Nombre en el POS
                </th>
                <th className="w-[250px] px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Ícono
                </th>
                <th className="w-[210px] px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Logo URL
                </th>
                <th className="w-[96px] px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Orden
                </th>
                {canEdit ? (
                  <th className="w-[84px] px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Acciones
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {sorted.map((r, i) => (
                <tr
                  key={r.id}
                  className={cn(
                    "transition-colors",
                    i % 2 === 0 ? "bg-background" : "bg-muted/[0.35]",
                    "hover:bg-violet-500/[0.04] dark:hover:bg-violet-500/[0.07]"
                  )}
                >
                  <td className="px-4 py-3 align-middle">
                    <input
                      type="checkbox"
                      checked={r.is_active}
                      disabled={!canEdit}
                      onChange={(e) => updateRow(r.id, { is_active: e.target.checked })}
                      className={cn(
                        "size-[1.125rem] rounded-md border-2 border-border transition",
                        "text-violet-600 focus:ring-2 focus:ring-violet-500/30 focus:ring-offset-0",
                        "disabled:opacity-50"
                      )}
                      aria-label={`Activo ${r.method_code}`}
                    />
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <span className="inline-flex rounded-lg border border-border/60 bg-muted/50 px-2 py-1 font-mono text-[11px] font-medium text-muted-foreground">
                      {r.method_code}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <Input
                      value={r.label}
                      disabled={!canEdit}
                      onChange={(e) => updateRow(r.id, { label: e.target.value })}
                      className="h-10 rounded-lg border-border/80 bg-background shadow-sm"
                    />
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30">
                        <PaymentMethodGlyph iconKey={r.icon_key} iconUrl={r.icon_url} className="size-4" />
                      </span>
                      <select
                        value={r.icon_key}
                        disabled={!canEdit}
                        onChange={(e) => updateRow(r.id, { icon_key: e.target.value })}
                        className="h-10 max-w-[170px] rounded-lg border border-input bg-background px-2.5 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/25"
                      >
                        {PAYMENT_METHOD_ICON_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <Input
                      value={r.icon_url ?? ""}
                      disabled={!canEdit}
                      placeholder="https://…"
                      onChange={(e) => updateRow(r.id, { icon_url: e.target.value || null })}
                      className="h-10 rounded-lg border-border/80 bg-background font-mono text-xs shadow-sm"
                    />
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <Input
                      type="number"
                      value={r.sort_order}
                      disabled={!canEdit}
                      onChange={(e) => updateRow(r.id, { sort_order: Number(e.target.value) || 0 })}
                      className="h-10 w-[4.5rem] rounded-lg border-border/80 bg-background text-center shadow-sm"
                    />
                  </td>
                  {canEdit ? (
                    <td className="px-4 py-3 align-middle">
                      <div className="flex justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-10 rounded-xl border-border/80 text-destructive hover:border-destructive/40 hover:bg-destructive/10"
                          disabled={deletingId === r.id}
                          onClick={() => onDelete(r.id)}
                          aria-label={`Eliminar ${r.label}`}
                          title="Eliminar"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {canEdit ? (
        <div className="flex flex-wrap items-center gap-3 border-t border-border/50 pt-2">
          <Button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="h-11 rounded-xl bg-gradient-to-b from-violet-600 to-violet-700 px-6 font-semibold text-white shadow-md shadow-violet-500/25 hover:from-violet-500 hover:to-violet-600 dark:shadow-violet-900/40"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onRestoreMissing}
            disabled={saving}
            className="h-11 rounded-xl border-border/80 bg-background shadow-sm"
          >
            Restaurar faltantes
          </Button>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          Solo el dueño del negocio puede editar esta tabla.
        </p>
      )}
    </div>
  );
}
