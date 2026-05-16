import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { fetchSubscriptionWithAutoTrial } from "@/lib/supabase/ensure-subscription-trial";
import { businessHasAppAccess } from "@/lib/subscription";

/** Evita cachear “acceso permitido” cuando vence el trial */
export const dynamic = "force-dynamic";

/**
 * Todas las rutas bajo (main) requieren suscripción válida (trial activo o plan pago).
 * Corre en Node (Server Components), donde la sesión Supabase + RLS coinciden con lo que ves en las páginas.
 * `/app/subscription` y `/app/setup` quedan fuera de este layout.
 */
export default async function MainAppSectionLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;

  if (!businessId) {
    return children;
  }

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!supabaseUrl || !supabaseAnonKey) {
    return children;
  }

  const supabase = await createClient();
  const { row: sub } = await fetchSubscriptionWithAutoTrial(supabase, businessId);

  if (!businessHasAppAccess(sub)) {
    redirect("/app/subscription");
  }

  return children;
}
