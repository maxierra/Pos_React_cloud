"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { createMonitoredAction } from "@/lib/action-wrapper";
import { createClient } from "@/lib/supabase/server";

type CheckoutItem = {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
};

async function checkoutSaleImpl(input: {
  payment_method: "cash" | "card" | "transfer" | "mercadopago" | "cuenta_corriente" | "mixed";
  payment_details?: {
    split?: Array<{ method: "cash" | "card" | "transfer" | "mercadopago" | "cuenta_corriente"; amount: number }>;
    cash_received?: number;
  };
  cash_received?: number;
  customer_id?: string | null;
  items: CheckoutItem[];
}) {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;

  if (!businessId) {
    throw new Error("missing_active_business_id");
  }

  if (!input.items || input.items.length === 0) {
    throw new Error("empty_items");
  }

  const items = input.items.map((i) => ({
    product_id: i.product_id,
    name: i.name,
    quantity: i.quantity,
    unit_price: i.unit_price,
  }));

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const cashierUserId = userData.user?.id ?? null;

  const { data, error } = await supabase.rpc("create_sale_with_items", {
    p_business_id: businessId,
    p_items: items,
    p_payment_method: input.payment_method,
    p_payment_details: (input.payment_details as any) ?? null,
    p_customer_id: input.customer_id ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  const saleId = data as string;

  /** Si el trigger en `sales` no está aplicado, esta RPC inserta el evento (idempotente). */
  const { error: ensureErr } = await supabase.rpc("ensure_sale_activity_event", {
    p_sale_id: saleId,
  });
  if (ensureErr) {
    console.warn("[checkoutSale] ensure_sale_activity_event:", ensureErr.message);
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[activity-audit] Aplicá la migración 20260331140000_ensure_sale_activity_event.sql en Supabase (y idealmente el trigger en 20260331120000)."
      );
    }
  }

  if (process.env.NODE_ENV === "development") {
    const { data: auditRows, error: auditErr } = await supabase
      .from("business_activity_events")
      .select("id,kind,created_at")
      .eq("business_id", businessId)
      .eq("entity_id", saleId)
      .eq("kind", "sale")
      .limit(1);

    const hasRow = !auditErr && Array.isArray(auditRows) && auditRows.length > 0;

    console.log("[activity-audit] Venta", {
      saleId,
      businessId,
      cashierUserId,
      payment_method: input.payment_method,
      activityRowOk: hasRow,
    });

    if (auditErr) {
      console.warn("[activity-audit] Lectura business_activity_events:", auditErr.message);
    } else if (!hasRow) {
      console.warn("[activity-audit] Sigue sin fila kind=sale: revisá RLS o que exista la tabla.");
    }
  }

  revalidatePath("/app/sales");
  revalidatePath("/app/products");
  revalidatePath("/app/pos");
  revalidatePath("/app/empleados");

  return { saleId };
}

export const checkoutSale = createMonitoredAction(checkoutSaleImpl, "pos/checkoutSale");
