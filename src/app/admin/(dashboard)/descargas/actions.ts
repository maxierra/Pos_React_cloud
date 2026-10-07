"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { DESKTOP_DOWNLOAD_ASSET_KEY } from "@/lib/desktop-download";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlatformAdminSessionEmail } from "@/lib/platform-admin-session";

const updateSchema = z.object({
  id: z.string().uuid(),
  activationState: z.enum(["requested", "not_requested"]),
  adminNote: z.string().trim().max(500),
  activationCode: z.string().trim().max(120).optional().default(""),
  markPaid: z.enum(["yes", "no"]).optional().default("no"),
});

const followupSchema = z.object({ id: z.string().uuid(), kind: z.enum(["contacted", "paid", "reminder"]) });
const storeSaleSchema = z.object({
  saleDate: z.iso.date(),
  quantity: z.coerce.number().int().min(1).max(1000),
  unitAmount: z.coerce.number().min(0).max(9999999999),
  note: z.string().trim().max(300).optional().default(""),
});

async function requireAdmin() {
  const email = await getPlatformAdminSessionEmail();
  if (!email) throw new Error("No autorizado");
}

export async function updateDownloadLead(formData: FormData) {
  await requireAdmin();

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    activationState: formData.get("activationState"),
    adminNote: formData.get("adminNote"),
    activationCode: formData.get("activationCode") ?? "",
    markPaid: formData.get("markPaid") ?? "no",
  });
  if (!parsed.success) throw new Error("Datos de seguimiento inválidos");

  const requested = parsed.data.activationState === "requested";
  const values: Record<string, string | boolean | null> = {
    activation_requested: requested,
    activation_requested_at: requested ? new Date().toISOString() : null,
    admin_note: parsed.data.adminNote || null,
    activation_code: parsed.data.activationCode || null,
  };
  if (parsed.data.markPaid === "yes") values.activation_paid_at = new Date().toISOString();
  const { error } = await createAdminClient().from("download_events").update(values).eq("id", parsed.data.id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/descargas");
}

export async function updateDownloadFollowup(formData: FormData) {
  await requireAdmin();
  const parsed = followupSchema.safeParse({ id: formData.get("id"), kind: formData.get("kind") });
  if (!parsed.success) throw new Error("Seguimiento inválido");
  const now = new Date().toISOString();
  const values = parsed.data.kind === "contacted" ? { contacted_at: now, contact_channel: "whatsapp" } : parsed.data.kind === "paid" ? { activation_paid_at: now } : { reminder_sent_at: now };
  const { error } = await createAdminClient().from("download_events").update(values).eq("id", parsed.data.id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/descargas");
}

export async function deleteDownloadLead(formData: FormData) {
  await requireAdmin();
  const parsed = z.string().uuid().safeParse(formData.get("id"));
  if (!parsed.success) throw new Error("Descarga inválida");
  const { error } = await createAdminClient().from("download_events").delete().eq("id", parsed.data);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/descargas");
}

export async function clearAllDownloadLeads() {
  await requireAdmin();
  const { error } = await createAdminClient().from("download_events").delete().eq("asset_key", DESKTOP_DOWNLOAD_ASSET_KEY);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/descargas");
  revalidatePath("/admin");
}

export async function createMicrosoftStoreSale(formData: FormData) {
  await requireAdmin();
  const parsed = storeSaleSchema.safeParse({ saleDate: formData.get("saleDate"), quantity: formData.get("quantity"), unitAmount: formData.get("unitAmount"), note: formData.get("note") ?? "" });
  if (!parsed.success) throw new Error("Revisá la fecha, la cantidad y el importe de la venta");
  const { error } = await createAdminClient().from("microsoft_store_sales").insert({ sale_date: parsed.data.saleDate, quantity: parsed.data.quantity, total_amount: parsed.data.unitAmount, note: parsed.data.note || null });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/descargas");
}

export async function deleteMicrosoftStoreSale(formData: FormData) {
  await requireAdmin();
  const parsed = z.string().uuid().safeParse(formData.get("id"));
  if (!parsed.success) throw new Error("Venta inválida");
  const { error } = await createAdminClient().from("microsoft_store_sales").delete().eq("id", parsed.data);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/descargas");
}
