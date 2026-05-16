"use server";

import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";

async function getBusinessId() {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;
  if (!businessId) throw new Error("missing_active_business_id");
  return businessId;
}

export type ProductLabelRow = {
  id: string;
  name: string;
  price: number;
  barcode: string | null;
  sku: string | null;
};

export async function findProductByScan(code: string): Promise<ProductLabelRow | null> {
  const businessId = await getBusinessId();
  const raw = code.trim();
  if (!raw) return null;

  const supabase = await createClient();
  const base = () =>
    supabase.from("products").select("id,name,price,barcode,sku").eq("business_id", businessId).eq("active", true);

  let { data } = await base().eq("barcode", raw).maybeSingle();
  if (data) return data as ProductLabelRow;

  ({ data } = await base().eq("sku", raw).maybeSingle());
  if (data) return data as ProductLabelRow;

  const safe = raw.replace(/[%_,]/g, "").slice(0, 64);
  if (safe.length < 2) return null;
  const p = `%${safe}%`;
  const { data: b1 } = await base().ilike("barcode", p).limit(1).maybeSingle();
  if (b1) return b1 as ProductLabelRow;
  const { data: b2 } = await base().ilike("sku", p).limit(1).maybeSingle();
  return (b2 as ProductLabelRow | null) ?? null;
}
