import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import {
  DESKTOP_DOWNLOAD_ASSET_KEY,
  DESKTOP_DOWNLOAD_RELEASE_URL,
} from "@/lib/desktop-download";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function getClientIp(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? "";
  return req.headers.get("x-real-ip")?.trim() ?? "";
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const sourceRaw = (url.searchParams.get("source") ?? "landing").trim();
  const source = sourceRaw.slice(0, 80) || "landing";

  try {
    const admin = createAdminClient();
    const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 500);
    const referer = (request.headers.get("referer") ?? "").slice(0, 500);
    const ip = getClientIp(request);
    const ipHash = ip ? sha256Hex(ip) : null;

    await admin.from("download_events").insert({
      asset_key: DESKTOP_DOWNLOAD_ASSET_KEY,
      source,
      user_agent: userAgent || null,
      referer: referer || null,
      ip_hash: ipHash,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[download-track] could not persist download event", error);
    }
  }

  return NextResponse.redirect(DESKTOP_DOWNLOAD_RELEASE_URL, { status: 307 });
}
