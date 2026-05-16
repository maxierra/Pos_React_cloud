import type { SupabaseClient } from "@supabase/supabase-js";

import type { SubscriptionRow } from "@/lib/subscription";

const SUB_SELECT = "status, current_period_start, current_period_end, plan_id";

/** El RPC aún no está aplicado en Supabase (migración pendiente). No mostrar error rojo al usuario. */
function isPlatformSettingsMissingInMessage(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("platform_settings") && (m.includes("does not exist") || m.includes("no existe"));
}

function isMissingEnsureRpcError(err: { message?: string; code?: string } | null | undefined): boolean {
  if (!err) return false;
  const m = (err.message ?? "").toLowerCase();
  if (!m.includes("ensure_subscription_trial_for_business")) return false;
  return (
    m.includes("could not find") ||
    m.includes("schema cache") ||
    m.includes("does not exist") ||
    err.code === "PGRST202"
  );
}

/**
 * Lee subscriptions; si no hay fila, llama al RPC ensure_subscription_trial_for_business (Supabase).
 * Cubre negocios creados a mano en la DB sin subscriptions.
 */
export async function fetchSubscriptionWithAutoTrial(
  supabase: SupabaseClient,
  businessId: string
): Promise<{ row: SubscriptionRow | null; errorMessage: string | null }> {
  let { data, error } = await supabase
    .from("subscriptions")
    .select(SUB_SELECT)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    return { row: null, errorMessage: error.message };
  }

  if (!data) {
    const { error: ensureErr } = await supabase.rpc("ensure_subscription_trial_for_business", {
      p_business_id: businessId,
    });
    if (ensureErr) {
      if (isPlatformSettingsMissingInMessage(ensureErr.message ?? "")) {
        console.warn(
          "[fetchSubscriptionWithAutoTrial] Falta la tabla platform_settings. Ejecutá en Supabase → SQL Editor: supabase/migrations/20250327120000_platform_settings_bootstrap.sql"
        );
        return { row: null, errorMessage: null };
      }
      if (isMissingEnsureRpcError(ensureErr)) {
        console.warn(
          "[fetchSubscriptionWithAutoTrial] Aplicá en Supabase → SQL Editor: supabase/migrations/20250326140000_ensure_subscription_trial.sql"
        );
        return { row: null, errorMessage: null };
      }
      if (process.env.NODE_ENV === "development") {
        console.warn("[fetchSubscriptionWithAutoTrial] RPC:", ensureErr.message);
      }
      return { row: null, errorMessage: ensureErr.message };
    }
    const again = await supabase
      .from("subscriptions")
      .select(SUB_SELECT)
      .eq("business_id", businessId)
      .maybeSingle();
    if (again.error) {
      return { row: null, errorMessage: again.error.message };
    }
    data = again.data;
  }

  return { row: data as SubscriptionRow | null, errorMessage: null };
}
