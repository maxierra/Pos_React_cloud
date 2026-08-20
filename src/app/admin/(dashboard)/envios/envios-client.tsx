"use client";

import * as React from "react";
import { toast } from "sonner";
import { Package, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { StoreShipmentRow } from "@/app/admin/(dashboard)/envios/actions";
import { adminMarkOrderDelivered, adminMarkOrderShipped } from "@/app/admin/(dashboard)/envios/actions";

const STATUS_LABELS: Record<string, string> = {
  pending_shipment: "Pendiente",
  shipped: "Despachado",
  delivered: "Entregado",
};

const PAYMENT_LABELS: Record<string, string> = {
  pending_payment: "Esperando pago",
  paid: "Pagado",
  canceled: "Cancelado",
  refunded: "Reembolsado",
};

function orderNumber(id: string) {
  return `PED-${id.slice(0, 8).toUpperCase()}`;
}

function money(amount: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(amount);
}

type Props = {
  rows: StoreShipmentRow[];
};

export function EnviosClient({ rows }: Props) {
  const [pending, startTransition] = React.useTransition();
  const [filter, setFilter] = React.useState<"payment" | "pending" | "shipped" | "all">("all");
  const [draft, setDraft] = React.useState<Record<string, { tracking: string; carrier: string }>>({});

  const filtered =
    filter === "all"
      ? rows
      : filter === "payment"
        ? rows.filter((r) => r.status === "pending_payment")
        : filter === "pending"
        ? rows.filter((r) => r.status === "paid" && r.fulfillment_status === "pending_shipment")
        : rows.filter((r) => r.fulfillment_status === "shipped" || r.fulfillment_status === "delivered");

  const ship = (orderId: string) => {
    const d = draft[orderId];
    if (!d?.tracking?.trim()) {
      toast.error("Ingresá el número de seguimiento");
      return;
    }
    startTransition(async () => {
      const res = await adminMarkOrderShipped({
        orderId,
        trackingNumber: d.tracking,
        trackingCarrier: d.carrier?.trim() || "Correo Argentino",
      });
      if ("error" in res) toast.error(res.error);
      else toast.success("Marcado como despachado — email enviado al cliente");
    });
  };

  const deliver = (orderId: string) => {
    startTransition(async () => {
      const res = await adminMarkOrderDelivered(orderId);
      if ("error" in res) toast.error(res.error);
      else toast.success("Marcado como entregado");
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950"><p className="text-xs font-semibold uppercase tracking-wide opacity-70">Esperando pago</p><p className="mt-1 text-3xl font-black">{rows.filter((r) => r.status === "pending_payment").length}</p></div>
        <div className="rounded-xl border border-sky-300 bg-sky-50 p-4 text-sky-950"><p className="text-xs font-semibold uppercase tracking-wide opacity-70">Pagados por despachar</p><p className="mt-1 text-3xl font-black">{rows.filter((r) => r.status === "paid" && r.fulfillment_status === "pending_shipment").length}</p></div>
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950"><p className="text-xs font-semibold uppercase tracking-wide opacity-70">Despachados / entregados</p><p className="mt-1 text-3xl font-black">{rows.filter((r) => r.fulfillment_status === "shipped" || r.fulfillment_status === "delivered").length}</p></div>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["all", "payment", "pending", "shipped"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold",
              filter === f ? "border-slate-900 bg-slate-900 text-white" : "border-border"
            )}
          >
            {f === "payment" ? "Esperando pago" : f === "pending" ? "Por despachar" : f === "shipped" ? "Despachados" : "Todos"}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Nº de pedido</th>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Producto</th>
              <th className="px-3 py-2">Envío</th>
              <th className="px-3 py-2">Pago</th>
              <th className="px-3 py-2">Envío</th>
              <th className="px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-12 text-center text-muted-foreground">
                  No hay pedidos en esta vista.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-b border-border/50 align-top">
                  <td className="px-3 py-3"><div className="font-mono font-black text-sky-700">{orderNumber(r.id)}</div><div className="mt-1 text-[10px] text-muted-foreground" title={r.id}>{r.id}</div></td>
                  <td className="px-3 py-3 text-xs">{new Date(r.created_at).toLocaleDateString("es-AR")}</td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{r.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{r.email}</div>
                    <div className="text-xs">{r.phone}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div>{r.product_name}</div>
                    <div className="text-xs text-muted-foreground">{r.business_name}</div>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {r.shipping_address}
                    <br />
                    {r.shipping_city}, {r.shipping_province} {r.shipping_postal_code ?? ""}
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", r.status === "paid" ? "bg-emerald-100 text-emerald-800" : r.status === "pending_payment" ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground")}>{PAYMENT_LABELS[r.status] ?? r.status}</span>
                    <div className="mt-2 text-xs font-bold">{money(r.amount_ars)}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      {STATUS_LABELS[r.fulfillment_status] ?? r.fulfillment_status}
                    </span>
                    {r.tracking_number ? (
                      <div className="mt-1 text-xs font-mono">{r.tracking_number}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">
                    {r.status !== "paid" ? (
                      <span className="inline-flex rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">Esperando acreditación</span>
                    ) : r.fulfillment_status === "pending_shipment" ? (
                      <div className="flex min-w-[220px] flex-col gap-2">
                        <Input
                          placeholder="Nº Correo Argentino"
                          value={draft[r.id]?.tracking ?? ""}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              [r.id]: { tracking: e.target.value, carrier: d[r.id]?.carrier ?? "" },
                            }))
                          }
                        />
                        <Input
                          placeholder="Correo Argentino"
                          value={draft[r.id]?.carrier ?? ""}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              [r.id]: {
                                tracking: d[r.id]?.tracking ?? "",
                                carrier: e.target.value,
                              },
                            }))
                          }
                        />
                        <Button type="button" size="sm" disabled={pending} onClick={() => ship(r.id)}>
                          <Truck className="mr-1 size-3.5" />
                          Despachar
                        </Button>
                      </div>
                    ) : r.fulfillment_status === "shipped" ? (
                      <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => deliver(r.id)}>
                        <Package className="mr-1 size-3.5" />
                        Entregado
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
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
