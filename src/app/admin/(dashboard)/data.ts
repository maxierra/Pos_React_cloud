import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { emailIsPlatformAdmin } from "@/lib/platform-admin";
import { parseDbTimestamptzMs } from "@/lib/parse-db-timestamp";
import { DESKTOP_DOWNLOAD_ASSET_KEY } from "@/lib/desktop-download";
import { businessHasAppAccess, type SubscriptionRow } from "@/lib/subscription";

export type AdminLastPayment = {
  provider: string;
  status: string;
  amount: number;
  currency: string;
  created_at: string;
};

export type AdminSubscriptionListItem = {
  subscriptionId: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  planId: string;
  status: string;
  provider: string;
  currentPeriodEnd: string | null;
  /** ms UTC; misma lógica que el middleware para comparar “ya venció” */
  currentPeriodEndMs: number | null;
  updatedAt: string;
  hasAppAccess: boolean;
  /** Cómo se interpreta el cobro para el operador */
  billingSummary:
    | "mp_automatico"
    | "manual_admin"
    | "solo_prueba"
    | "sin_pagos_registrados"
    | "suspendido_admin";
  lastPayment: AdminLastPayment | null;
};

function billingSummaryFromRow(
  sub: SubscriptionRow & { provider: string },
  last: AdminLastPayment | null
): AdminSubscriptionListItem["billingSummary"] {
  if (sub.provider === "admin_suspended") return "suspendido_admin";
  if (sub.status === "trialing") return "solo_prueba";
  if (last?.status === "approved" && last.provider === "manual_transfer") return "manual_admin";
  if (last?.status === "approved" && last.provider === "mercadopago") return "mp_automatico";
  if (sub.provider === "manual_transfer") return "manual_admin";
  if (sub.provider === "mercadopago" && sub.status === "active") return "mp_automatico";
  return "sin_pagos_registrados";
}

export type LoadAdminSubscriptionsResult =
  | { ok: false; error: "forbidden" | "config"; message?: string }
  | { ok: true; rows: AdminSubscriptionListItem[] };

export type AdminDownloadStats = {
  total: number;
  last7d: number;
  last24h: number;
  lastEventAt: string | null;
};

export type LoadAdminDownloadStatsResult =
  | { ok: false; error: "forbidden" | "config"; message?: string }
  | { ok: true; stats: AdminDownloadStats };

/**
 * Solo llamar desde Server Components después de comprobar admin en UI,
 * o confiar en la verificación interna (duplicada).
 */
export async function loadAdminSubscriptionList(): Promise<LoadAdminSubscriptionsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !emailIsPlatformAdmin(user.email)) {
    return { ok: false, error: "forbidden" };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, error: "config", message: "Falta SUPABASE_SERVICE_ROLE_KEY." };
  }

  const { data: subRows, error: subErr } = await admin
    .from("subscriptions")
    .select(
      "id, business_id, plan_id, status, current_period_start, current_period_end, provider, updated_at, businesses(name, slug)"
    )
    .order("updated_at", { ascending: false })
    .limit(300);

  if (subErr) {
    return { ok: false, error: "config", message: subErr.message };
  }

  const { data: payRows, error: payErr } = await admin
    .from("payments")
    .select("business_id, provider, status, amount, currency, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (payErr && process.env.NODE_ENV === "development") {
    console.warn("[loadAdminSubscriptionList] payments", payErr.message);
  }

  const lastByBusiness = new Map<string, AdminLastPayment>();
  for (const p of payRows ?? []) {
    const bid = (p as { business_id: string }).business_id;
    if (!bid || lastByBusiness.has(bid)) continue;
    const row = p as {
      business_id: string;
      provider: string;
      status: string;
      amount: number | string;
      currency: string;
      created_at: string;
    };
    lastByBusiness.set(bid, {
      provider: row.provider,
      status: row.status,
      amount: typeof row.amount === "number" ? row.amount : Number.parseFloat(String(row.amount)),
      currency: row.currency,
      created_at: row.created_at,
    });
  }

  const rows: AdminSubscriptionListItem[] = (subRows ?? []).map((raw) => {
    const r = raw as {
      id: string;
      business_id: string;
      plan_id: string;
      status: SubscriptionRow["status"];
      current_period_end: string | null;
      provider: string;
      updated_at: string;
      businesses: { name: string; slug: string } | { name: string; slug: string }[] | null;
    };

    const biz = Array.isArray(r.businesses) ? r.businesses[0] : r.businesses;
    const subRow: SubscriptionRow = {
      status: r.status,
      current_period_start: null,
      current_period_end: r.current_period_end,
      plan_id: r.plan_id,
    };
    const last = lastByBusiness.get(r.business_id) ?? null;

    return {
      subscriptionId: r.id,
      businessId: r.business_id,
      businessName: biz?.name ?? "—",
      businessSlug: biz?.slug ?? "—",
      planId: r.plan_id,
      status: r.status,
      provider: r.provider,
      currentPeriodEnd: r.current_period_end,
      currentPeriodEndMs: parseDbTimestamptzMs(r.current_period_end),
      updatedAt: r.updated_at,
      hasAppAccess: businessHasAppAccess(subRow),
      billingSummary: billingSummaryFromRow({ ...subRow, provider: r.provider }, last),
      lastPayment: last,
    };
  });

  return { ok: true, rows };
}

/**
 * Métricas de descargas del instalador desktop (landing -> redirect API).
 */
export async function loadAdminDownloadStats(): Promise<LoadAdminDownloadStatsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !emailIsPlatformAdmin(user.email)) {
    return { ok: false, error: "forbidden" };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, error: "config", message: "Falta SUPABASE_SERVICE_ROLE_KEY." };
  }

  const now = Date.now();
  const since24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [totalRes, dayRes, weekRes, lastRes] = await Promise.all([
    admin
      .from("download_events")
      .select("id", { count: "exact", head: true })
      .eq("asset_key", DESKTOP_DOWNLOAD_ASSET_KEY),
    admin
      .from("download_events")
      .select("id", { count: "exact", head: true })
      .eq("asset_key", DESKTOP_DOWNLOAD_ASSET_KEY)
      .gte("created_at", since24h),
    admin
      .from("download_events")
      .select("id", { count: "exact", head: true })
      .eq("asset_key", DESKTOP_DOWNLOAD_ASSET_KEY)
      .gte("created_at", since7d),
    admin
      .from("download_events")
      .select("created_at")
      .eq("asset_key", DESKTOP_DOWNLOAD_ASSET_KEY)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const firstError = totalRes.error ?? dayRes.error ?? weekRes.error ?? lastRes.error;
  if (firstError) {
    return { ok: false, error: "config", message: firstError.message };
  }

  return {
    ok: true,
    stats: {
      total: totalRes.count ?? 0,
      last24h: dayRes.count ?? 0,
      last7d: weekRes.count ?? 0,
      lastEventAt: (lastRes.data as { created_at: string } | null)?.created_at ?? null,
    },
  };
}
