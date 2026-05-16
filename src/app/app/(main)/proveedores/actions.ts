"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

async function getBusinessId() {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;
  if (!businessId) throw new Error("missing_active_business_id");
  return businessId;
}

export async function saveSupplier(input: {
  id?: string | null;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  tax_id?: string | null;
  notes?: string | null;
}) {
  const businessId = await getBusinessId();
  const name = input.name.trim();
  if (!name) throw new Error("Indicá el nombre del proveedor");

  const supabase = await createClient();
  const row = {
    name,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    address: input.address?.trim() || null,
    tax_id: input.tax_id?.trim() || null,
    notes: input.notes?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase
      .from("business_suppliers")
      .update(row)
      .eq("id", input.id)
      .eq("business_id", businessId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("business_suppliers").insert({
      business_id: businessId,
      ...row,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/app/proveedores");
}

export async function deleteSupplier(supplierId: string) {
  const businessId = await getBusinessId();
  const supabase = await createClient();

  const { count, error: cErr } = await supabase
    .from("supplier_orders")
    .select("id", { count: "exact", head: true })
    .eq("supplier_id", supplierId)
    .eq("business_id", businessId);
  if (cErr) throw new Error(cErr.message);
  if ((count ?? 0) > 0) {
    throw new Error("No se puede eliminar: el proveedor tiene pedidos registrados.");
  }

  const { error } = await supabase
    .from("business_suppliers")
    .delete()
    .eq("id", supplierId)
    .eq("business_id", businessId);
  if (error) throw new Error(error.message);

  revalidatePath("/app/proveedores");
}

export type OrderLineInput = {
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_cost: number | null;
};

export async function createSupplierOrder(input: {
  supplier_id: string;
  expected_date?: string | null;
  notes?: string | null;
  lines: OrderLineInput[];
}) {
  const businessId = await getBusinessId();
  const lines = input.lines.filter((l) => l.product_name.trim().length > 0 && l.quantity > 0);
  if (lines.length === 0) throw new Error("Agregá al menos un ítem al pedido");

  const supabase = await createClient();

  const { data: order, error: oErr } = await supabase
    .from("supplier_orders")
    .insert({
      business_id: businessId,
      supplier_id: input.supplier_id,
      status: "ordered",
      expected_date: input.expected_date?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .select("id")
    .single();
  if (oErr || !order) throw new Error(oErr?.message ?? "No se pudo crear el pedido");

  const orderId = order.id as string;
  const items = lines.map((l) => ({
    order_id: orderId,
    product_id: l.product_id,
    product_name: l.product_name.trim(),
    quantity: l.quantity,
    quantity_received: 0,
    unit_cost: l.unit_cost != null && Number.isFinite(l.unit_cost) ? l.unit_cost : null,
  }));

  const { error: iErr } = await supabase.from("supplier_order_items").insert(items);
  if (iErr) {
    await supabase.from("supplier_orders").delete().eq("id", orderId);
    throw new Error(iErr.message);
  }

  revalidatePath("/app/proveedores");
  revalidatePath(`/app/proveedores/${input.supplier_id}`);
  return orderId;
}

export async function markOrderReceived(orderId: string) {
  const businessId = await getBusinessId();
  const supabase = await createClient();

  const { data: items, error: iErr } = await supabase
    .from("supplier_order_items")
    .select("id, quantity")
    .eq("order_id", orderId);
  if (iErr) throw new Error(iErr.message);

  for (const it of items ?? []) {
    const q = typeof it.quantity === "number" ? it.quantity : Number(it.quantity);
    const { error } = await supabase
      .from("supplier_order_items")
      .update({ quantity_received: q })
      .eq("id", it.id);
    if (error) throw new Error(error.message);
  }

  const now = new Date().toISOString();
  const { data: ord, error: oErr } = await supabase
    .from("supplier_orders")
    .update({
      status: "received",
      received_at: now,
      updated_at: now,
    })
    .eq("id", orderId)
    .eq("business_id", businessId)
    .select("supplier_id")
    .single();
  if (oErr) throw new Error(oErr.message);

  revalidatePath("/app/proveedores");
  if (ord?.supplier_id) revalidatePath(`/app/proveedores/${ord.supplier_id}`);
}

export async function markOrderPaid(input: {
  order_id: string;
  invoice_number?: string | null;
  invoice_total?: number | null;
  payment_method: string;
  payment_notes?: string | null;
}) {
  const businessId = await getBusinessId();
  const method = input.payment_method.trim();
  if (!method) throw new Error("Indicá cómo pagaste");

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: ord, error } = await supabase
    .from("supplier_orders")
    .update({
      status: "paid",
      paid_at: now,
      invoice_number: input.invoice_number?.trim() || null,
      invoice_total:
        input.invoice_total != null && Number.isFinite(input.invoice_total) ? input.invoice_total : null,
      payment_method: method,
      payment_notes: input.payment_notes?.trim() || null,
      updated_at: now,
    })
    .eq("id", input.order_id)
    .eq("business_id", businessId)
    .select("supplier_id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/app/proveedores");
  if (ord?.supplier_id) revalidatePath(`/app/proveedores/${ord.supplier_id}`);
}

export async function cancelOrder(orderId: string) {
  const businessId = await getBusinessId();
  const supabase = await createClient();
  const { data: ord, error } = await supabase
    .from("supplier_orders")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("business_id", businessId)
    .select("supplier_id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/app/proveedores");
  if (ord?.supplier_id) revalidatePath(`/app/proveedores/${ord.supplier_id}`);
}

export async function searchProductsForOrder(query: string) {
  const businessId = await getBusinessId();
  const safe = query.trim().replace(/[%_,]/g, "").slice(0, 64);
  if (safe.length < 2) return [] as { id: string; name: string; sku: string | null; barcode: string | null }[];

  const supabase = await createClient();
  const p = `%${safe}%`;
  const base = () =>
    supabase.from("products").select("id,name,sku,barcode").eq("business_id", businessId).eq("active", true);

  const [{ data: d1 }, { data: d2 }, { data: d3 }] = await Promise.all([
    base().ilike("name", p).limit(10),
    base().ilike("sku", p).limit(10),
    base().ilike("barcode", p).limit(10),
  ]);

  const map = new Map<string, { id: string; name: string; sku: string | null; barcode: string | null }>();
  for (const row of [...(d1 ?? []), ...(d2 ?? []), ...(d3 ?? [])]) {
    const r = row as { id: string; name: string; sku: string | null; barcode: string | null };
    map.set(r.id, r);
  }
  return Array.from(map.values()).slice(0, 20);
}
