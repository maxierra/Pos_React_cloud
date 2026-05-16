import { NextResponse } from "next/server";
import { processDailyReports } from "@/lib/daily-report";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const apiKey = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);
  const requestApiKey = searchParams.get("key");

  console.log("[cron] Full URL:", request.url);
  console.log("[cron] Env CRON_SECRET:", apiKey?.substring(0, 4) + "...");
  console.log("[cron] Request key:", requestApiKey?.substring(0, 4) + "...");

  if (!requestApiKey || requestApiKey !== apiKey) {
    return NextResponse.json({ 
      error: "Unauthorized",
      debug: { env: apiKey ? "exists" : "missing", received: requestApiKey ? "exists" : "missing" }
    }, { status: 401 });
  }

  try {
    const { results, debugInfo } = await processDailyReports();
    
    const sent = results.filter((r: any) => r.success).length;
    const failed = results.filter((r: any) => !r.success).length;

    return NextResponse.json({
      success: true,
      processed: results.length,
      sent,
      failed,
      results,
      debugInfo,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}
