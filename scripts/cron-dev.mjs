const cronSecret = process.env.CRON_SECRET;
const baseUrl = process.env.CRON_BASE_URL || "http://localhost:3000";

if (!cronSecret) {
  console.error("[cron:dev] Missing CRON_SECRET in environment.");
  process.exit(1);
}

const endpoint = new URL("/api/cron/daily-reports", baseUrl);
endpoint.searchParams.set("key", cronSecret);

async function runCronTrigger() {
  const startedAt = new Date();
  console.log(`[cron:dev] Triggering at ${startedAt.toISOString()}`);

  try {
    const response = await fetch(endpoint, { method: "GET" });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("[cron:dev] Request failed:", response.status, payload);
      return;
    }

    console.log("[cron:dev] Success:", {
      processed: payload.processed ?? 0,
      sent: payload.sent ?? 0,
      failed: payload.failed ?? 0,
    });
  } catch (error) {
    console.error("[cron:dev] Error:", error);
  }
}

console.log(`[cron:dev] Base URL: ${baseUrl}`);
console.log("[cron:dev] Schedule: every 5 minutes");
console.log("[cron:dev] Press Ctrl+C to stop.");

await runCronTrigger();
setInterval(runCronTrigger, 5 * 60 * 1000);
