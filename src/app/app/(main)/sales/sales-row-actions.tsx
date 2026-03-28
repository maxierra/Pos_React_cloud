"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AnimatePresence, motion } from "framer-motion";

import { voidSale } from "@/app/app/(main)/sales/actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";

type Props = {
  saleId: string;
  canVoid: boolean;
};

type SaleItemRow = {
  id: string;
  name: string;
  quantity: number;
};

type SaleRow = {
  id: string;
  created_at: string;
  total: number;
  status: string;
};

function formatArDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}

function moneyAr(value: number) {
  if (!Number.isFinite(value)) return String(value);
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);
}

export function SalesRowActions({ saleId, canVoid }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const [loadingDetails, setLoadingDetails] = React.useState(false);
  const [detailsError, setDetailsError] = React.useState<string | null>(null);
  const [sale, setSale] = React.useState<SaleRow | null>(null);
  const [items, setItems] = React.useState<SaleItemRow[]>([]);

  const canConfirm = canVoid && !loadingDetails && !detailsError;

  React.useEffect(() => {
    if (!open) return;
    if (!canVoid) return;

    let cancelled = false;
    setLoadingDetails(true);
    setDetailsError(null);

    const supabase = createClient();

    (async () => {
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .select("id,created_at,total,status")
        .eq("id", saleId)
        .single();

      const { data: itemsData, error: itemsError } = await supabase
        .from("sale_items")
        .select("id,name,quantity")
        .eq("sale_id", saleId)
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (saleError || itemsError) {
        setDetailsError(saleError?.message ?? itemsError?.message ?? "No se pudo cargar el detalle.");
        setSale(null);
        setItems([]);
        setLoadingDetails(false);
        return;
      }

      setSale({
        id: String((saleData as any).id),
        created_at: String((saleData as any).created_at),
        total: Number((saleData as any).total) || 0,
        status: String((saleData as any).status),
      });
      setItems(
        ((itemsData ?? []) as any[]).map((x) => ({
          id: String(x.id),
          name: String(x.name),
          quantity: Number(x.quantity) || 0,
        }))
      );
      setLoadingDetails(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, saleId, canVoid]);

  const onConfirmVoid = React.useCallback(() => {
    if (!canVoid) return;

    startTransition(() => {
      (async () => {
        try {
          const fd = new FormData();
          fd.set("sale_id", saleId);
          await voidSale(fd);
          setOpen(false);
          toast.success("Venta anulada", {
            description: `Ticket #${saleId.slice(0, 8)}`,
          });
          router.refresh();
        } catch (error) {
          const msg = error instanceof Error ? error.message : "No se pudo anular la venta.";
          const human =
            msg === "sale_not_paid"
              ? "La venta ya no está en estado pagada."
              : msg === "sale_not_found"
                ? "No se encontró la venta."
                : msg;
          toast.error("No se pudo anular", { description: human });
        }
      })();
    });
  }, [canVoid, router, saleId]);

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/app/sales/${saleId}`}
        className="inline-flex h-9 items-center rounded-xl border border-[var(--pos-border)] bg-[var(--pos-surface)] px-3 text-xs text-foreground hover:bg-[var(--pos-surface-2)]"
      >
        Ver
      </Link>

      <Button type="button" variant="outline" size="sm" disabled={!canVoid} onClick={() => setOpen(true)}>
        Anular
      </Button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl border border-[var(--pos-border)] bg-card shadow-xl"
              initial={{ y: 16, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 16, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18 }}
            >
              <div className="border-b border-[var(--pos-border)] px-5 py-4">
                <div className="text-sm font-semibold tracking-tight">Anular venta</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Se restaurará el stock de los productos vendidos. Esta acción queda registrada.
                </div>
              </div>

              <div className="p-5">
                <div className="grid gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm">
                      Venta: <span className="font-medium">#{saleId.slice(0, 8)}</span>
                      {sale ? (
                        <div className="mt-1 text-xs text-muted-foreground">{formatArDateTime(sale.created_at)}</div>
                      ) : null}
                    </div>
                    {sale ? (
                      <div className="text-right">
                        <div className="text-[11px] text-muted-foreground">Total</div>
                        <div className="font-numeric text-sm font-semibold">{moneyAr(sale.total)}</div>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-xl border border-[var(--pos-border)] bg-[var(--pos-surface)] p-3">
                    <div className="text-xs font-medium text-muted-foreground">Se restaurará stock de:</div>
                    {loadingDetails ? (
                      <div className="mt-2 text-sm text-muted-foreground">Cargando productos…</div>
                    ) : detailsError ? (
                      <div className="mt-2 text-sm text-destructive">{detailsError}</div>
                    ) : items.length === 0 ? (
                      <div className="mt-2 text-sm text-muted-foreground">No hay ítems para restaurar.</div>
                    ) : (
                      <div className="mt-2 grid gap-2">
                        {items.slice(0, 8).map((it) => (
                          <div key={it.id} className="flex items-center justify-between gap-3 text-sm">
                            <div className="min-w-0 truncate">{it.name}</div>
                            <div className="font-numeric text-muted-foreground">{it.quantity}</div>
                          </div>
                        ))}
                        {items.length > 8 ? (
                          <div className="text-xs text-muted-foreground">+ {items.length - 8} ítems más…</div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={onConfirmVoid} disabled={pending || !canConfirm}>
                    {pending ? "Anulando..." : "Confirmar"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
