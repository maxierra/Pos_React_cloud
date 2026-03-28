"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type LogEntry = {
  endpoint: string;
  method: string;
  durationMs: number;
  statusCode?: number;
  userId?: string;
  businessId?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
};

/** En producción: NEXT_PUBLIC_ENABLE_MONITORING=true. En desarrollo: activo salvo que pongas "false". */
const LOG_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_MONITORING === "true" ||
  (process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_ENABLE_MONITORING !== "false");

async function getClientInfo() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("sb-access-token")?.value;
  
  let businessId: string | undefined;
  const bid = cookieStore.get("active_business_id")?.value;
  if (bid) businessId = bid;

  return { userId, businessId };
}

export async function logPerformance(entry: LogEntry): Promise<void> {
  if (!LOG_ENABLED) return;

  try {
    const supabase = await createClient();
    const { userId, businessId } = await getClientInfo();

    const { error } = await supabase.rpc("log_performance", {
      p_endpoint: entry.endpoint,
      p_method: entry.method,
      p_duration_ms: Math.round(entry.durationMs),
      p_status_code: entry.statusCode ?? 200,
      p_user_id: userId ? (await supabase.auth.getUser()).data.user?.id : null,
      p_business_id: businessId,
      p_user_agent: "Next.js Server",
      p_ip_address: null,
      p_error_message: entry.errorMessage ?? null,
      p_metadata: entry.metadata ?? {},
    });

    if (error) {
      console.error("[monitoring] Failed to log:", error.message);
    }
  } catch (err) {
    console.error("[monitoring] Log error:", err);
  }
}

export async function logServerAction(
  actionName: string,
  startTime: number,
  error?: Error | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  if (!LOG_ENABLED) return;

  const durationMs = Date.now() - startTime;
  const hasError = !!error;

  await logPerformance({
    endpoint: actionName,
    method: "POST",
    durationMs,
    statusCode: hasError ? 500 : 200,
    errorMessage: error?.message,
    metadata: {
      ...metadata,
      type: "server_action",
    },
  });
}

export async function getPerformanceMetrics(params: {
  startTime: Date;
  endTime: Date;
  endpoint?: string;
  businessId?: string;
}) {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("get_performance_metrics", {
    p_start_time: params.startTime.toISOString(),
    p_end_time: params.endTime.toISOString(),
    p_endpoint: params.endpoint ?? null,
    p_business_id: params.businessId ?? null,
  });

  if (error) throw error;
  return data ?? [];
}

export async function getPerformanceTrend(params: {
  startTime: Date;
  endTime: Date;
  intervalMinutes?: number;
}) {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("get_performance_trend", {
    p_start_time: params.startTime.toISOString(),
    p_end_time: params.endTime.toISOString(),
    p_interval_minutes: params.intervalMinutes ?? 5,
  });

  if (error) throw error;
  return data ?? [];
}

export async function getSlowEndpoints(params: {
  startTime: Date;
  endTime: Date;
  thresholdMs?: number;
  limit?: number;
}) {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("get_slow_endpoints", {
    p_start_time: params.startTime.toISOString(),
    p_end_time: params.endTime.toISOString(),
    p_threshold_ms: params.thresholdMs ?? 1000,
    p_limit: params.limit ?? 10,
  });

  if (error) throw error;
  return data ?? [];
}

export async function getRecentErrors(params: {
  startTime: Date;
  endTime: Date;
  limit?: number;
}) {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("get_recent_errors", {
    p_start_time: params.startTime.toISOString(),
    p_end_time: params.endTime.toISOString(),
    p_limit: params.limit ?? 50,
  });

  if (error) throw error;
  return data ?? [];
}