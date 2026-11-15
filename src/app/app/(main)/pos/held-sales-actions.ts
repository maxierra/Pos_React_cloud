"use server";

import { cookies } from "next/headers";

import type { CartItem } from "@/app/app/(main)/pos/hooks/use-cart";
import { createMonitoredAction } from "@/lib/action-wrapper";
import { createClient } from "@/lib/supabase/server";

export type HeldSaleRow = {
  id: string;
  label: string;
  items: CartItem[];
  total_snapshot: number;
  payment_method: string | null;
  created_at: string;
};

async function activeBusinessId() {
  const cookieStore = await cookies();
  return cookieStore.get("active_business_id")?.value ?? null;
}
function cleanItems(items: CartItem[]): CartItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      line_id: String(item.line_id ?? "").slice(0, 180),
      product_id: item.product_id ? String(item.product_id) : null,
      name: String(item.name ?? "Producto").slice(0, 180),
      sold_by_weight: Boolean(item.sold_by_weight),
      unit_price: Number(item.unit_price),
      quantity: Number(item.quantity),
      quick_sale_category_id: item.quick_sale_category_id ? String(item.quick_sale_category_id) : null,
    }))
    .filter(
      (item) =>
        item.line_id.length > 0 &&
        Number.isFinite(item.unit_price) &&
        item.unit_price >= 0 &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0
    );
}

async function listHeldSalesImpl(): Promise<{ rows: HeldSaleRow[] } | { error: string }> {
  const businessId = await activeBusinessId();
  if (!businessId) return { error: "No hay negocio activo" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("held_sales")
    .select("id,label,items,total_snapshot,payment_method,created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error) return { error: error.message };
  return {
    rows: (data ?? []).map((row) => ({
      id: String(row.id),
      label: String(row.label),
      items: cleanItems(row.items as CartItem[]),
      total_snapshot: Number(row.total_snapshot) || 0,
      payment_method: row.payment_method ? String(row.payment_method) : null,
      created_at: String(row.created_at),
    })),
  };
}

async function holdSaleImpl(input: {
  items: CartItem[];
  total: number;
  paymentMethod?: string | null;
}): Promise<{ success: true; id: string } | { error: string }> {
  const businessId = await activeBusinessId();
  if (!businessId) return { error: "No hay negocio activo" };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "No autorizado" };
  const items = cleanItems(input.items);
  if (items.length === 0) return { error: "El carrito está vacío" };

  const { count } = await supabase
    .from("held_sales")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId);
  const label = `Espera #${(count ?? 0) + 1}`;
  const { data, error } = await supabase
    .from("held_sales")
    .insert({
      business_id: businessId,
      cashier_user_id: auth.user.id,
      label,
      items,
      total_snapshot: Math.max(0, Number(input.total) || 0),
      payment_method: input.paymentMethod?.trim() || null,
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "No se pudo poner la venta en espera" };
  return { success: true, id: String(data.id) };
}

async function takeHeldSaleImpl(id: string): Promise<{ sale: HeldSaleRow } | { error: string }> {
  const businessId = await activeBusinessId();
  if (!businessId) return { error: "No hay negocio activo" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("held_sales")
    .delete()
    .eq("id", String(id))
    .eq("business_id", businessId)
    .select("id,label,items,total_snapshot,payment_method,created_at")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "La venta en espera ya no existe" };
  return {
    sale: {
      id: String(data.id),
      label: String(data.label),
      items: cleanItems(data.items as CartItem[]),
      total_snapshot: Number(data.total_snapshot) || 0,
      payment_method: data.payment_method ? String(data.payment_method) : null,
      created_at: String(data.created_at),
    },
  };
}

async function deleteHeldSaleImpl(id: string): Promise<{ success: true } | { error: string }> {
  const businessId = await activeBusinessId();
  if (!businessId) return { error: "No hay negocio activo" };
  const supabase = await createClient();
  const { error } = await supabase.from("held_sales").delete().eq("id", String(id)).eq("business_id", businessId);
  if (error) return { error: error.message };
  return { success: true };
}

export const listHeldSales = createMonitoredAction(listHeldSalesImpl, "pos/listHeldSales");
export const holdSale = createMonitoredAction(holdSaleImpl, "pos/holdSale");
export const takeHeldSale = createMonitoredAction(takeHeldSaleImpl, "pos/takeHeldSale");
export const deleteHeldSale = createMonitoredAction(deleteHeldSaleImpl, "pos/deleteHeldSale");
