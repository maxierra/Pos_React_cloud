"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { emailIsPlatformAdmin } from "@/lib/platform-admin";
import { DESKTOP_DOWNLOAD_ASSET_KEY } from "@/lib/desktop-download";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  id: z.string().uuid(),
  activationState: z.enum(["requested", "not_requested"]),
  adminNote: z.string().trim().max(500),
});

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !emailIsPlatformAdmin(user.email)) throw new Error("No autorizado");
}

export async function updateDownloadLead(formData: FormData) {
  await requireAdmin();

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    activationState: formData.get("activationState"),
    adminNote: formData.get("adminNote"),
  });
  if (!parsed.success) throw new Error("Datos de seguimiento inválidos");

  const requested = parsed.data.activationState === "requested";
  const { error } = await createAdminClient().from("download_events").update({
    activation_requested: requested,
    activation_requested_at: requested ? new Date().toISOString() : null,
    admin_note: parsed.data.adminNote || null,
  }).eq("id", parsed.data.id);
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
