"use client";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createQuickSaleCategory,
  deleteQuickSaleCategory,
  updateQuickSaleCategory,
} from "@/app/app/(main)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type QuickSaleCategoryRow = {
  id: string;
  business_id: string;
  name: string;
  active: boolean;
  sort_order: number;
};

type Props = {
  initialRows: QuickSaleCategoryRow[];
  canEdit: boolean;
};

type DraftState = {
  name: string;
  sortOrder: string;
  active: boolean;
};

const EMPTY_DRAFT: DraftState = {
  name: "",
  sortOrder: "0",
  active: true,
};

function normalizeRows(rows: QuickSaleCategoryRow[]) {
  return [...rows].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "es"));
}

export function QuickSaleCategoriesManager({ initialRows, canEdit }: Props) {
  const [rows, setRows] = React.useState(() => normalizeRows(initialRows));
  const [creating, setCreating] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<DraftState>(EMPTY_DRAFT);
  const [pending, startTransition] = React.useTransition();

  const resetDraft = React.useCallback(() => {
    setDraft(EMPTY_DRAFT);
    setCreating(false);
    setEditingId(null);
  }, []);

  const startEdit = React.useCallback((row: QuickSaleCategoryRow) => {
    setCreating(false);
    setEditingId(row.id);
    setDraft({
      name: row.name,
      sortOrder: String(row.sort_order),
      active: row.active,
    });
  }, []);

  const onCreate = React.useCallback(() => {
    setEditingId(null);
    setCreating(true);
    setDraft({
      name: "",
      sortOrder: String(rows.length),
      active: true,
    });
  }, [rows.length]);

  const saveDraft = React.useCallback(() => {
    if (!canEdit) return;

    const fd = new FormData();
    fd.set("name", draft.name);
    fd.set("sort_order", draft.sortOrder);
    fd.set("active", draft.active ? "true" : "false");
    if (editingId) fd.set("id", editingId);

    startTransition(() => {
      (async () => {
        const result = editingId
          ? await updateQuickSaleCategory(fd)
          : await createQuickSaleCategory(fd);

        if ("error" in result && result.error) {
          toast.error("No se pudo guardar", { description: result.error });
          return;
        }

        if ("row" in result && result.row) {
          const nextRow = result.row as QuickSaleCategoryRow;
          setRows((prev) => normalizeRows([...prev.filter((row) => row.id !== nextRow.id), nextRow]));
          toast.success(editingId ? "Rubro actualizado" : "Rubro creado");
          resetDraft();
        }
      })();
    });
  }, [canEdit, draft.active, draft.name, draft.sortOrder, editingId, resetDraft]);

  const removeRow = React.useCallback(
    (row: QuickSaleCategoryRow) => {
      if (!canEdit) return;
      if (!window.confirm(`¿Eliminar "${row.name}"?`)) return;

      const fd = new FormData();
      fd.set("id", row.id);

      startTransition(() => {
        (async () => {
          const result = await deleteQuickSaleCategory(fd);
          if ("error" in result && result.error) {
            toast.error("No se pudo eliminar", { description: result.error });
            return;
          }
          setRows((prev) => prev.filter((item) => item.id !== row.id));
          toast.success("Rubro eliminado");
          if (editingId === row.id) {
            resetDraft();
          }
        })();
      });
    },
    [canEdit, editingId, resetDraft]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold tracking-tight">Rubros rápidos del POS</div>
          <p className="text-xs text-muted-foreground">
            Se usan para ventas manuales por importe, por ejemplo verdulería o fiambrería.
          </p>
        </div>
        {canEdit ? (
          <Button type="button" className="gap-2 rounded-xl" onClick={onCreate} disabled={pending}>
            <Plus className="size-4" />
            Nuevo rubro
          </Button>
        ) : null}
      </div>

      {creating || editingId ? (
        <div className="rounded-2xl border bg-card p-4">
          <div className="grid gap-4 md:grid-cols-[1.6fr_0.6fr_auto]">
            <div className="space-y-1.5">
              <Label htmlFor="quick-sale-name">Nombre</Label>
              <Input
                id="quick-sale-name"
                value={draft.name}
                onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Verduleria"
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quick-sale-sort">Orden</Label>
              <Input
                id="quick-sale-sort"
                type="number"
                min={0}
                step={1}
                value={draft.sortOrder}
                onChange={(e) => setDraft((prev) => ({ ...prev, sortOrder: e.target.value }))}
                disabled={pending}
              />
            </div>
            <label className="flex items-end gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => setDraft((prev) => ({ ...prev, active: e.target.checked }))}
                disabled={pending}
              />
              Activo
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="button" onClick={saveDraft} disabled={pending || !draft.name.trim()}>
              {pending ? "Guardando..." : "Guardar"}
            </Button>
            <Button type="button" variant="outline" onClick={resetDraft} disabled={pending}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr className="border-b">
              <th className="px-4 py-3 text-left font-medium">Rubro</th>
              <th className="px-4 py-3 text-left font-medium">Orden</th>
              <th className="px-4 py-3 text-left font-medium">Estado</th>
              <th className="px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No hay rubros rápidos configurados.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.sort_order}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex rounded-full border px-2 py-1 text-[11px] font-medium " +
                        (row.active
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-border bg-muted text-muted-foreground")
                      }
                    >
                      {row.active ? "Activo" : "Oculto"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => startEdit(row)}
                        disabled={!canEdit || pending}
                      >
                        <Pencil className="size-3.5" />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeRow(row)}
                        disabled={!canEdit || pending}
                        aria-label={`Eliminar ${row.name}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
