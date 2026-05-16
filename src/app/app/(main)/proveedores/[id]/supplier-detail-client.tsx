"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Banknote,
  Eye,
  Loader2,
  PackageCheck,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import {
  cancelOrder,
  createSupplierOrder,
  markOrderPaid,
  markOrderReceived,
  searchProductsForOrder,
  type OrderLineInput,
} from "@/app/app/(main)/proveedores/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type SupplierDetail = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_id: string | null;
  notes: string | null;
};

export type OrderItemRow = {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  quantity_received: number;
  unit_cost: number | null;
};

export type SupplierOrderRow = {
  id: string;
  status: string;
  order_date: string;
  expected_date: string | null;
  notes: string | null;
  received_at: string | null;
  invoice_number: string | null;
  invoice_total: number | null;
  paid_at: string | null;
  payment_method: string | null;
  payment_notes: string | null;
  supplier_order_items: OrderItemRow[];
};

function moneyAr(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = iso.includes("T") ? new Date(iso) : new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

function statusLabel(s: string) {
  if (s === "ordered") return "Pedido";
  if (s === "received") return "Recibido";
  if (s === "paid") return "Pagado";
  if (s === "cancelled") return "Anulado";
  return s;
}

function statusClass(s: string) {
  if (s === "ordered") return "bg-amber-500/15 text-amber-800 dark:text-amber-200";
  if (s === "received") return "bg-sky-500/15 text-sky-800 dark:text-sky-200";
  if (s === "paid") return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200";
  if (s === "cancelled") return "bg-muted text-muted-foreground";
  return "bg-muted";
}

type LineDraft = { key: string; product_id: string | null; product_name: string; quantity: string; unit_cost: string };

export function SupplierDetailClient({
  supplier,
  orders,
}: {
  supplier: SupplierDetail;
  orders: SupplierOrderRow[];
}) {
  const router = useRouter();

  const [newOpen, setNewOpen] = React.useState(false);
  const [viewOrder, setViewOrder] = React.useState<SupplierOrderRow | null>(null);
  const [payOrder, setPayOrder] = React.useState<SupplierOrderRow | null>(null);
  const [pending, startTransition] = React.useTransition();

  const [expectedDate, setExpectedDate] = React.useState("");
  const [orderNotes, setOrderNotes] = React.useState("");
  const [lines, setLines] = React.useState<LineDraft[]>(() => [
    { key: crypto.randomUUID(), product_id: null, product_name: "", quantity: "1", unit_cost: "" },
  ]);

  const [payInvoiceNum, setPayInvoiceNum] = React.useState("");
  const [payInvoiceTotal, setPayInvoiceTotal] = React.useState("");
  const [payMethod, setPayMethod] = React.useState("transferencia");
  const [payNotes, setPayNotes] = React.useState("");

  const addLine = React.useCallback(() => {
    setLines((prev) => [...prev, { key: crypto.randomUUID(), product_id: null, product_name: "", quantity: "1", unit_cost: "" }]);
  }, []);

  const removeLine = React.useCallback((key: string) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)));
  }, []);

  const openNew = React.useCallback(() => {
    setExpectedDate("");
    setOrderNotes("");
    setLines([{ key: crypto.randomUUID(), product_id: null, product_name: "", quantity: "1", unit_cost: "" }]);
    setNewOpen(true);
  }, []);

  const submitOrder = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const parsed: OrderLineInput[] = lines
        .map((l) => {
          const q = Number(l.quantity.replace(",", "."));
          const costRaw = l.unit_cost.replace(",", ".").replace(/[^0-9.-]/g, "");
          const uc = costRaw ? Number(costRaw) : null;
          return {
            product_id: l.product_id,
            product_name: l.product_name.trim(),
            quantity: Number.isFinite(q) && q > 0 ? q : 0,
            unit_cost: uc != null && Number.isFinite(uc) && uc >= 0 ? uc : null,
          };
        })
        .filter((l) => l.product_name.length > 0 && l.quantity > 0);

      startTransition(() => {
        void (async () => {
          try {
            await createSupplierOrder({
              supplier_id: supplier.id,
              expected_date: expectedDate || null,
              notes: orderNotes || null,
              lines: parsed,
            });
            toast.success("Pedido creado");
            setNewOpen(false);
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error");
          }
        })();
      });
    },
    [expectedDate, lines, orderNotes, router, supplier.id]
  );

  const onMarkReceived = React.useCallback(
    (orderId: string) => {
      if (!confirm("¿Marcar este pedido como recibido? Se considerará la cantidad pedida como recibida.")) return;
      startTransition(() => {
        void (async () => {
          try {
            await markOrderReceived(orderId);
            toast.success("Pedido marcado como recibido");
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error");
          }
        })();
      });
    },
    [router]
  );

  const submitPay = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!payOrder) return;
      const invRaw = payInvoiceTotal.replace(",", ".").replace(/[^0-9.-]/g, "");
      const inv = invRaw ? Number(invRaw) : null;
      startTransition(() => {
        void (async () => {
          try {
            await markOrderPaid({
              order_id: payOrder.id,
              invoice_number: payInvoiceNum || null,
              invoice_total: inv != null && Number.isFinite(inv) ? inv : null,
              payment_method: payMethod,
              payment_notes: payNotes || null,
            });
            toast.success("Pago registrado");
            setPayOrder(null);
            setPayInvoiceNum("");
            setPayInvoiceTotal("");
            setPayNotes("");
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error");
          }
        })();
      });
    },
    [payInvoiceNum, payInvoiceTotal, payMethod, payNotes, payOrder, router]
  );

  const onCancel = React.useCallback(
    (orderId: string) => {
      if (!confirm("¿Anular este pedido?")) return;
      startTransition(() => {
        void (async () => {
          try {
            await cancelOrder(orderId);
            toast.success("Pedido anulado");
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error");
          }
        })();
      });
    },
    [router]
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/app/proveedores"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Volver a proveedores
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">{supplier.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {[supplier.phone, supplier.email].filter(Boolean).join(" · ") || "Sin contacto"}
          {supplier.tax_id ? ` · CUIT: ${supplier.tax_id}` : null}
        </p>
        {supplier.address ? <p className="text-sm text-muted-foreground">{supplier.address}</p> : null}
        {supplier.notes ? <p className="mt-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">{supplier.notes}</p> : null}
      </div>

      <div className="mb-6 flex justify-end">
        <Button type="button" onClick={openNew} className="gap-2">
          <Plus className="size-4" />
          Nuevo pedido
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos</CardTitle>
          <CardDescription>Seguimiento: pedido → recibido → pagado.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Entrega prevista</th>
                <th className="px-4 py-3 font-medium">Factura</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No hay pedidos. Creá el primero con el botón de arriba.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="border-b last:border-0">
                    <td className="px-4 py-3 tabular-nums">{fmtDate(o.order_date)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusClass(o.status))}>
                        {statusLabel(o.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(o.expected_date)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {o.invoice_number || o.invoice_total != null ? (
                        <span>
                          {o.invoice_number ?? "—"} {o.invoice_total != null ? `· ${moneyAr(o.invoice_total)}` : ""}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setViewOrder(o)}>
                          <Eye className="size-3.5" />
                          Ver
                        </Button>
                        {o.status === "ordered" ? (
                          <>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="gap-1"
                              disabled={pending}
                              onClick={() => onMarkReceived(o.id)}
                            >
                              <PackageCheck className="size-3.5" />
                              Recibido
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-rose-600"
                              disabled={pending}
                              onClick={() => onCancel(o.id)}
                            >
                              Anular
                            </Button>
                          </>
                        ) : null}
                        {o.status === "received" ? (
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            className="gap-1"
                            disabled={pending}
                            onClick={() => {
                              setPayOrder(o);
                              setPayInvoiceNum(o.invoice_number ?? "");
                              setPayInvoiceTotal(o.invoice_total != null ? String(o.invoice_total) : "");
                              setPayMethod("transferencia");
                              setPayNotes("");
                            }}
                          >
                            <Banknote className="size-3.5" />
                            Pago
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {newOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setNewOpen(false);
          }}
        >
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border bg-card p-6 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold">Nuevo pedido</h2>
              <Button type="button" variant="ghost" size="icon" onClick={() => setNewOpen(false)} aria-label="Cerrar">
                <X className="size-4" />
              </Button>
            </div>
            <form className="mt-4 grid gap-4" onSubmit={submitOrder}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="exp">Entrega prevista (opcional)</Label>
                  <Input id="exp" type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor="on">Notas del pedido</Label>
                  <Input id="on" value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} placeholder="Opcional" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm font-medium">Ítems</div>
                {lines.map((line, idx) => (
                  <OrderLineEditor
                    key={line.key}
                    line={line}
                    index={idx}
                    onChange={(next) => setLines((prev) => prev.map((l) => (l.key === line.key ? next : l)))}
                    onRemove={() => removeLine(line.key)}
                  />
                ))}
                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addLine}>
                  <Plus className="size-3.5" />
                  Agregar línea
                </Button>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setNewOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Guardando…" : "Crear pedido"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {viewOrder ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setViewOrder(null);
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-card p-6 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">Pedido</h2>
                <p className="text-xs text-muted-foreground">
                  {fmtDate(viewOrder.order_date)} · {statusLabel(viewOrder.status)}
                </p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setViewOrder(null)} aria-label="Cerrar">
                <X className="size-4" />
              </Button>
            </div>
            {viewOrder.notes ? <p className="mt-2 text-sm text-muted-foreground">{viewOrder.notes}</p> : null}
            <ul className="mt-4 grid gap-2 rounded-lg border p-3 text-sm">
              {(viewOrder.supplier_order_items ?? []).map((it) => (
                <li key={it.id} className="flex justify-between gap-2">
                  <span className="min-w-0 truncate">{it.product_name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    ×{it.quantity}
                    {it.unit_cost != null ? ` · ${moneyAr(it.unit_cost)}` : ""}
                  </span>
                </li>
              ))}
            </ul>
            {viewOrder.received_at ? (
              <p className="mt-3 text-xs text-muted-foreground">Recibido: {fmtDate(viewOrder.received_at)}</p>
            ) : null}
            {viewOrder.paid_at ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Pagado: {fmtDate(viewOrder.paid_at)} {viewOrder.payment_method ? `· ${viewOrder.payment_method}` : ""}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {payOrder ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPayOrder(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Registrar pago</h2>
            <p className="mt-1 text-xs text-muted-foreground">Factura del proveedor y cómo pagaste.</p>
            <form className="mt-4 grid gap-3" onSubmit={submitPay}>
              <div className="grid gap-1.5">
                <Label htmlFor="invn">Nº factura</Label>
                <Input id="invn" value={payInvoiceNum} onChange={(e) => setPayInvoiceNum(e.target.value)} placeholder="Opcional" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="invt">Importe factura</Label>
                <Input id="invt" value={payInvoiceTotal} onChange={(e) => setPayInvoiceTotal(e.target.value)} placeholder="0,00" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pm">Forma de pago</Label>
                <select
                  id="pm"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="cheque">Cheque</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pn">Notas</Label>
                <Input id="pn" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Opcional" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setPayOrder(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Guardando…" : "Confirmar pago"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OrderLineEditor({
  line,
  index,
  onChange,
  onRemove,
}: {
  line: LineDraft;
  index: number;
  onChange: (next: LineDraft) => void;
  onRemove: () => void;
}) {
  const [search, setSearch] = React.useState("");
  const [hits, setHits] = React.useState<{ id: string; name: string; sku: string | null; barcode: string | null }[]>([]);
  const [loading, setLoading] = React.useState(false);
  const t = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (t.current) clearTimeout(t.current);
    if (search.trim().length < 2) {
      setHits([]);
      return;
    }
    setLoading(true);
    t.current = setTimeout(() => {
      void searchProductsForOrder(search)
        .then(setHits)
        .catch(() => setHits([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => {
      if (t.current) clearTimeout(t.current);
    };
  }, [search]);

  const pick = (p: { id: string; name: string }) => {
    onChange({ ...line, product_id: p.id, product_name: p.name });
    setSearch("");
    setHits([]);
  };

  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Línea {index + 1}</span>
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={onRemove} aria-label="Quitar línea">
          <Trash2 className="size-4" />
        </Button>
      </div>
      <div className="relative mb-2">
        <Label className="text-xs">Buscar producto</Label>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nombre, SKU o código de barras…"
          className="mt-1"
        />
        {loading ? (
          <div className="absolute right-2 top-8">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : null}
        {hits.length > 0 ? (
          <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md border bg-popover p-1 text-sm shadow-md">
            {hits.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  className="w-full rounded px-2 py-1.5 text-left hover:bg-muted"
                  onClick={() => pick(h)}
                >
                  {h.name}
                  <span className="ml-1 text-xs text-muted-foreground">{h.sku ?? h.barcode ?? ""}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Label className="text-xs">Descripción</Label>
          <Input
            className="mt-1"
            value={line.product_name}
            onChange={(e) => onChange({ ...line, product_name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label className="text-xs">Cantidad</Label>
          <Input type="text" inputMode="decimal" className="mt-1" value={line.quantity} onChange={(e) => onChange({ ...line, quantity: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Costo unit. (opc.)</Label>
          <Input type="text" inputMode="decimal" className="mt-1" value={line.unit_cost} onChange={(e) => onChange({ ...line, unit_cost: e.target.value })} />
        </div>
      </div>
    </div>
  );
}
