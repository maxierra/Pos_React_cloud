import { cookies } from "next/headers";

import { AppShell } from "@/app/app/app-shell";
import { createClient } from "@/lib/supabase/server";
import { fetchSubscriptionWithAutoTrial } from "@/lib/supabase/ensure-subscription-trial";
import { subscriptionPlanLabel, type SubscriptionRow } from "@/lib/subscription";

type Props = Readonly<{ children: React.ReactNode }>;

export default async function AppLayout({ children }: Props) {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const hasSupabaseEnv = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

  let businessName: string | null = null;
  let userEmail: string | null = cookieStore.get("demo_user_email")?.value ?? null;
  let userAvatar: string | null = null;
  let cashOpen = false;
  let planLabel = "—";
  let trialEndsAt: string | null = null;
  let access: { role: string | null; permissions: Record<string, any> | null } = {
    role: null,
    permissions: null,
  };

  if (hasSupabaseEnv) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    userEmail = userData.user?.email ?? userEmail;

    if (userData.user?.id) {
      const { data: prof } = await supabase.from("profiles").select("avatar").eq("id", userData.user.id).maybeSingle();
      userAvatar = (prof as any)?.avatar ?? null;
    }

    if (businessId) {
      const { error: autoCloseError } = await supabase.rpc("auto_close_stale_cash_registers", {
        p_business_id: businessId,
      });
      if (autoCloseError && process.env.NODE_ENV === "development") {
        console.warn("[app/layout] auto close stale cash registers:", autoCloseError.message);
      }

      if (userData.user?.id) {
        const { data: mem } = await supabase
          .from("memberships")
          .select("role, permissions")
          .eq("business_id", businessId)
          .eq("user_id", userData.user.id)
          .is("deleted_at", null)
          .maybeSingle();

        access = {
          role: (mem as any)?.role ?? null,
          permissions: ((mem as any)?.permissions ?? null) as any,
        };
      }

      const { data: biz } = await supabase.from("businesses").select("name").eq("id", businessId).single();
      businessName = (biz as any)?.name ?? null;

      const { data: cr } = await supabase
        .from("cash_registers")
        .select("closed_at")
        .eq("business_id", businessId)
        .order("opened_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      cashOpen = !!cr && !(cr as any).closed_at;

      const { row, errorMessage: subFetchErr } = await fetchSubscriptionWithAutoTrial(supabase, businessId);
      if (subFetchErr && process.env.NODE_ENV === "development") {
        console.warn("[app/layout] subscription:", subFetchErr);
      }
      planLabel = subscriptionPlanLabel(row);
      if (row?.status === "trialing" && row.current_period_end) {
        trialEndsAt = row.current_period_end;
      }
    }
  }

  return (
    <AppShell
      business={{ id: businessId ?? null, name: businessName }}
      user={{ email: userEmail, avatar: userAvatar }}
      cash={{ open: cashOpen }}
      plan={{ label: planLabel, trialEndsAt }}
      access={access}
    >
      {children}
    </AppShell>
  );
}
