"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deletePaymentMethod,
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

export function PaymentMethodsManager({ initialRows, canEdit }: Props) {
  const router = useRouter();
  const [rows, setRows] = React.useState<BusinessPaymentMethodRow[]>(initialRows);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

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
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar este medio? Se volverá a crear la fila por defecto al restaurar.")) return;
    setDeletingId(id);
    try {
      const res = await deletePaymentMethod(id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Listo. Se recargó la lista.");
      router.refresh();
    } finally {
      setDeletingId(null);
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
          Estos medios aparecen en el cobro del POS con el nombre y el ícono (o logo URL) que elijas. Los{" "}
          <span className="font-medium text-foreground/80">códigos internos</span> se mantienen para caja e informes.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_1px_0_0_rgba(0,0,0,0.04)_inset] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-gradient-to-r from-muted/80 via-muted/50 to-muted/30 text-left">
                <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-16">
                  Activo
                </th>
                <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Código
                </th>
                <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Nombre en el POS
                </th>
                <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Ícono
                </th>
                <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground min-w-[140px]">
                  Logo URL
                </th>
                <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-24">
                  Orden
                </th>
                {canEdit ? (
                  <th className="px-4 py-3.5 w-14" aria-label="Acciones" />
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
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-10 rounded-xl border-border/80 text-destructive hover:border-destructive/40 hover:bg-destructive/10"
                        disabled={deletingId === r.id}
                        onClick={() => onDelete(r.id)}
                        aria-label="Eliminar"
                      >
                        <Trash2 className="size-4" />
                      </Button>
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
