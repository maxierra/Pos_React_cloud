import { createAdminClient } from "@/lib/supabase/admin";

export type SystemHealthData = {
  dbConnection: "up" | "down";
  mpToken: "configured" | "missing";
  latestWebhookAt: string | null;
  daysSinceLastPayment: number | null;
};

export async function getSystemHealth(): Promise<SystemHealthData> {
  let dbConnection: "up" | "down" = "down";
  let latestWebhookAt: string | null = null;
  let daysSinceLastPayment: number | null = null;
  
  const token = (process.env.MERCADOPAGO_ACCESS_TOKEN ?? "").trim();
  const mpToken = token.length > 10 ? "configured" : "missing";

  try {
    const admin = createAdminClient();
    
    // Check DB Connection using a lightweight query against a guaranteed table
    const { error: dbError } = await admin.from("businesses").select("id").limit(1);
    if (!dbError) {
      dbConnection = "up";
    }

    // Attempt to find the last successful MercadoPago webhook (payment)
    const { data: lastPayment } = await admin
      .from("payments")
      .select("created_at")
      .eq("provider", "mercadopago")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastPayment?.created_at) {
      latestWebhookAt = lastPayment.created_at;
      const lastDate = new Date(lastPayment.created_at);
      const now = new Date();
      const diffMs = now.getTime() - lastDate.getTime();
      daysSinceLastPayment = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }
    
  } catch (err) {
    console.error("System health check failed:", err);
  }

  return {
    dbConnection,
    mpToken,
    latestWebhookAt,
    daysSinceLastPayment,
  };
}
