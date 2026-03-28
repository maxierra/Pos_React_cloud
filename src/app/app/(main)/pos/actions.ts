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
  payment_method: "cash" | "card" | "transfer" | "mercadopago" | "mixed";
  payment_details?: {
    split?: Array<{ method: "cash" | "card" | "transfer" | "mercadopago"; amount: number }>;
    cash_received?: number;
  };
  cash_received?: number;
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
  const { data, error } = await supabase.rpc("create_sale_with_items", {
    p_business_id: businessId,
    p_items: items,
    p_payment_method: input.payment_method,
    p_payment_details: (input.payment_details as any) ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/app/sales");
  revalidatePath("/app/products");
  revalidatePath("/app/pos");

  return { saleId: data as string };
}

export const checkoutSale = createMonitoredAction(checkoutSaleImpl, "pos/checkoutSale");
