"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { createMonitoredAction } from "@/lib/action-wrapper";
import { createClient } from "@/lib/supabase/server";

function getActiveBusinessId(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return cookieStore.get("active_business_id")?.value ?? null;
}

function toNumber(input: FormDataEntryValue | null) {
  const raw = String(input ?? "").replace(",", ".").trim();
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function toNullableDate(input: FormDataEntryValue | null) {
  const raw = String(input ?? "").trim();
  if (!raw) return null;
  return raw;
}

async function createProductImpl(formData: FormData) {
  const cookieStore = await cookies();
  const businessId = getActiveBusinessId(cookieStore);
  if (!businessId) {
    throw new Error("missing_active_business_id");
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("missing_name");
  }

  const soldByWeight = String(formData.get("sold_by_weight") ?? "") === "on";

  const supabase = await createClient();
  const { error } = await supabase.from("products").insert({
    business_id: businessId,
    name,
    barcode: String(formData.get("barcode") ?? "").trim() || null,
    scale_code: String(formData.get("scale_code") ?? "").trim() || null,
    category: String(formData.get("category") ?? "").trim() || null,
    cost: toNumber(formData.get("cost")),
    price: toNumber(formData.get("price")),
    expires_at: toNullableDate(formData.get("expires_at")),
    sold_by_weight: soldByWeight,
    stock: soldByWeight ? 0 : Math.trunc(toNumber(formData.get("stock"))),
    stock_decimal: soldByWeight ? toNumber(formData.get("stock_decimal")) : 0,
    low_stock_threshold: soldByWeight ? 0 : Math.trunc(toNumber(formData.get("low_stock_threshold"))),
    low_stock_threshold_decimal: soldByWeight ? toNumber(formData.get("low_stock_threshold_decimal")) : 0,
    active: String(formData.get("active") ?? "") !== "off",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/app/products");
}

async function deleteProductImpl(formData: FormData) {
  const cookieStore = await cookies();
  const businessId = getActiveBusinessId(cookieStore);
  if (!businessId) {
    throw new Error("missing_active_business_id");
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("missing_id");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id).eq("business_id", businessId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/app/products");
}

async function updateProductImpl(formData: FormData) {
  const cookieStore = await cookies();
  const businessId = getActiveBusinessId(cookieStore);
  if (!businessId) {
    throw new Error("missing_active_business_id");
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("missing_id");
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("missing_name");
  }

  const soldByWeight = String(formData.get("sold_by_weight") ?? "") === "on";

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      name,
      barcode: String(formData.get("barcode") ?? "").trim() || null,
      scale_code: String(formData.get("scale_code") ?? "").trim() || null,
      category: String(formData.get("category") ?? "").trim() || null,
      cost: toNumber(formData.get("cost")),
      price: toNumber(formData.get("price")),
      expires_at: toNullableDate(formData.get("expires_at")),
      sold_by_weight: soldByWeight,
      stock: soldByWeight ? 0 : Math.trunc(toNumber(formData.get("stock"))),
      stock_decimal: soldByWeight ? toNumber(formData.get("stock_decimal")) : 0,
      low_stock_threshold: soldByWeight ? 0 : Math.trunc(toNumber(formData.get("low_stock_threshold"))),
      low_stock_threshold_decimal: soldByWeight ? toNumber(formData.get("low_stock_threshold_decimal")) : 0,
      active: String(formData.get("active") ?? "") !== "off",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/app/products");
  revalidatePath(`/app/products/${id}`);
}

export const createProduct = createMonitoredAction(createProductImpl, "products/createProduct");
export const deleteProduct = createMonitoredAction(deleteProductImpl, "products/deleteProduct");
export const updateProduct = createMonitoredAction(updateProductImpl, "products/updateProduct");
