import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const MICROSOFT_STORE_URL = "https://apps.microsoft.com/detail/9PLJGFFQ6K8R?hl=es-ar&gl=AR";
const LOCATIONS = new Set(["header", "hero", "hero_certificate", "store_band", "mobile_share"]);

function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "";
  return request.headers.get("x-real-ip")?.trim() ?? "";
}

export async function GET(request: NextRequest) {
  const requestedLocation = request.nextUrl.searchParams.get("location") ?? "hero";
  const location = LOCATIONS.has(requestedLocation) ? requestedLocation : "hero";
  const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 500);
  const referer = (request.headers.get("referer") ?? "").slice(0, 500);
  const device = /android|iphone|ipad|ipod|mobile/i.test(userAgent) ? "mobile" : "desktop";
  const ip = getClientIp(request);

  try {
    const { error } = await createAdminClient().from("microsoft_store_click_events").insert({
      location,
      device,
      user_agent: userAgent || null,
      referer: referer || null,
      ip_hash: ip ? sha256Hex(ip) : null,
    });
    if (error) throw error;
  } catch (error) {
    console.warn("[microsoft-store-click] could not persist click", error);
  }

  return NextResponse.redirect(`${MICROSOFT_STORE_URL}&cid=tienda360_landing_${location}`, { status: 307 });
}
