import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import {
  SupplierDetailClient,
  type SupplierDetail,
  type SupplierOrderRow,
} from "@/app/app/(main)/proveedores/[id]/supplier-detail-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function ProveedorDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;

  if (!businessId) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Proveedor</CardTitle>
            <CardDescription>Seleccioná un negocio primero.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link className="text-sm underline" href="/app/setup">
              Ir a configuración
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();

  const { data: sup, error: sErr } = await supabase
    .from("business_suppliers")
    .select("id,name,phone,email,address,tax_id,notes")
    .eq("id", id)
    .eq("business_id", businessId)
    .maybeSingle();

  if (sErr || !sup) notFound();

  const supplier: SupplierDetail = {
    id: sup.id,
    name: sup.name,
    phone: sup.phone,
    email: sup.email,
    address: sup.address,
    tax_id: sup.tax_id,
    notes: sup.notes,
  };

  const { data: ordersRaw } = await supabase
    .from("supplier_orders")
    .select(
      `
      id,
      status,
      order_date,
      expected_date,
      notes,
      received_at,
      invoice_number,
      invoice_total,
      paid_at,
      payment_method,
      payment_notes,
      supplier_order_items (
        id,
        product_id,
        product_name,
        quantity,
        quantity_received,
        unit_cost
      )
    `
    )
    .eq("supplier_id", id)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  const orders: SupplierOrderRow[] = (ordersRaw ?? []).map((o: Record<string, unknown>) => ({
    id: String(o.id),
    status: String(o.status),
    order_date: String(o.order_date),
    expected_date: o.expected_date != null ? String(o.expected_date) : null,
    notes: o.notes != null ? String(o.notes) : null,
    received_at: o.received_at != null ? String(o.received_at) : null,
    invoice_number: o.invoice_number != null ? String(o.invoice_number) : null,
    invoice_total: o.invoice_total != null ? Number(o.invoice_total) : null,
    paid_at: o.paid_at != null ? String(o.paid_at) : null,
    payment_method: o.payment_method != null ? String(o.payment_method) : null,
    payment_notes: o.payment_notes != null ? String(o.payment_notes) : null,
    supplier_order_items: Array.isArray(o.supplier_order_items)
      ? (o.supplier_order_items as Record<string, unknown>[]).map((it) => ({
          id: String(it.id),
          product_id: it.product_id != null ? String(it.product_id) : null,
          product_name: String(it.product_name),
          quantity: Number(it.quantity),
          quantity_received: Number(it.quantity_received),
          unit_cost: it.unit_cost != null ? Number(it.unit_cost) : null,
        }))
      : [],
  }));

  return <SupplierDetailClient supplier={supplier} orders={orders} />;
}
