"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { createMonitoredAction } from "@/lib/action-wrapper";
import { createClient } from "@/lib/supabase/server";

async function voidSaleImpl(formData: FormData) {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;
  if (!businessId) {
    throw new Error("missing_active_business_id");
  }

  const saleId = String(formData.get("sale_id") ?? "").trim();
  if (!saleId) {
    throw new Error("missing_sale_id");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("void_sale", {
    p_business_id: businessId,
    p_sale_id: saleId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { error: voidLogErr } = await supabase.rpc("ensure_sale_void_activity_event", {
    p_sale_id: saleId,
  });
  if (voidLogErr) {
    console.warn("[voidSale] ensure_sale_void_activity_event:", voidLogErr.message);
  }

  revalidatePath("/app/sales");
  revalidatePath(`/app/sales/${saleId}`);
  revalidatePath("/app/products");
  revalidatePath("/app/pos");
  revalidatePath("/app/empleados");
}

export const voidSale = createMonitoredAction(voidSaleImpl, "sales/voidSale");
