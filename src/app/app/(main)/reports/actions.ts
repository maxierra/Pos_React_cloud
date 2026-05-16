"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { createMonitoredAction } from "@/lib/action-wrapper";
import { createClient } from "@/lib/supabase/server";

function parseMoney(input: FormDataEntryValue | null) {
  const raw = String(input ?? "").replace(",", ".").trim();
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

async function createFixedExpenseImpl(formData: FormData) {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;
  if (!businessId) throw new Error("missing_active_business_id");

  const name = String(formData.get("name") ?? "").trim();
  const amount = parseMoney(formData.get("amount"));
  const frequency = String(formData.get("frequency") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();

  if (!name) throw new Error("missing_name");
  if (amount <= 0) throw new Error("invalid_amount");
  if (!["daily", "weekly", "monthly"].includes(frequency)) throw new Error("invalid_frequency");

  const supabase = await createClient();
  const { error } = await supabase.from("fixed_expenses").insert({
    business_id: businessId,
    name,
    amount,
    frequency,
    category: category || null,
    active: true,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/app/reports");
}

async function deleteFixedExpenseImpl(formData: FormData) {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;
  if (!businessId) throw new Error("missing_active_business_id");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("missing_id");

  const supabase = await createClient();
  const { error } = await supabase.from("fixed_expenses").delete().eq("id", id).eq("business_id", businessId);
  if (error) throw new Error(error.message);

  revalidatePath("/app/reports");
}

async function updateFixedExpenseImpl(formData: FormData) {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;
  if (!businessId) throw new Error("missing_active_business_id");

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const amount = parseMoney(formData.get("amount"));
  const frequency = String(formData.get("frequency") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();

  if (!id) throw new Error("missing_id");
  if (!name) throw new Error("missing_name");
  if (amount <= 0) throw new Error("invalid_amount");
  if (!["daily", "weekly", "monthly"].includes(frequency)) throw new Error("invalid_frequency");

  const supabase = await createClient();
  const { error } = await supabase
    .from("fixed_expenses")
    .update({
      name,
      amount,
      frequency,
      category: category || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) throw new Error(error.message);
  revalidatePath("/app/reports");
}

export const createFixedExpense = createMonitoredAction(createFixedExpenseImpl, "reports/createFixedExpense");
export const deleteFixedExpense = createMonitoredAction(deleteFixedExpenseImpl, "reports/deleteFixedExpense");
export const updateFixedExpense = createMonitoredAction(updateFixedExpenseImpl, "reports/updateFixedExpense");
