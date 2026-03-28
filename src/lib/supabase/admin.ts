import { createClient } from "@supabase/supabase-js";

/**
 * Solo servidor (webhooks, cron). Usa la service role key — nunca la expongas al cliente.
 */
export function createAdminClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !key) {
    throw new Error("missing_supabase_admin_env");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
