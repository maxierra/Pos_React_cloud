"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlatformAdminSessionEmail } from "@/lib/platform-admin-session";
import { LEAD_STATUSES } from "@/lib/leads/types";

const schema = z.object({ id: z.string().uuid(), status: z.enum(LEAD_STATUSES) });
export async function updateLeadStatus(formData: FormData) {
  if (!await getPlatformAdminSessionEmail()) throw new Error("No autorizado");
  const parsed = schema.safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) throw new Error("Estado inválido");
  const { error } = await createAdminClient().from("qualified_leads").update({ status: parsed.data.status, updated_at: new Date().toISOString() }).eq("id", parsed.data.id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/leads");
}

