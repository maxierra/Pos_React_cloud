import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const MICROSOFT_STORE_URL = "https://apps.microsoft.com/detail/9PLJGFFQ6K8R?hl=es-ar&gl=AR";
const LOCATIONS = new Set(["header", "hero", "hero_certificate", "store_band", "mobile_share"]);
const ARGENTINA_REGIONS: Record<string, string> = {
  A: "Salta", B: "Buenos Aires", C: "Ciudad Autónoma de Buenos Aires", D: "San Luis",
  E: "Entre Ríos", F: "La Rioja", G: "Santiago del Estero", H: "Chaco",
  J: "San Juan", K: "Catamarca", L: "La Pampa", M: "Mendoza", N: "Misiones",
  P: "Formosa", Q: "Neuquén", R: "Río Negro", S: "Santa Fe", T: "Tucumán",
  U: "Chubut", V: "Tierra del Fuego", W: "Corrientes", X: "Córdoba",
  Y: "Jujuy", Z: "Santa Cruz",
};

function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "";
  return request.headers.get("x-real-ip")?.trim() ?? "";
}

function cleanGeoHeader(value: string | null, maxLength: number) {
  if (!value) return null;
  try {
    return decodeURIComponent(value).trim().slice(0, maxLength) || null;
  } catch {
    return value.trim().slice(0, maxLength) || null;
  }
}

function getApproximateGeography(request: NextRequest) {
  const countryCode = cleanGeoHeader(
    request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry"),
    2,
  )?.toUpperCase() ?? null;
  const rawRegion = cleanGeoHeader(
    request.headers.get("x-vercel-ip-country-region")
      ?? request.headers.get("cf-region-code")
      ?? request.headers.get("cf-region"),
    100,
  );
  const regionCode = rawRegion?.replace(/^AR-/i, "").toUpperCase() ?? null;
  const region = countryCode === "AR" && regionCode
    ? (ARGENTINA_REGIONS[regionCode] ?? rawRegion)
    : rawRegion;
  const city = cleanGeoHeader(
    request.headers.get("x-vercel-ip-city") ?? request.headers.get("cf-ipcity"),
    120,
  );

  return { countryCode, region, city };
}

export async function GET(request: NextRequest) {
  const requestedLocation = request.nextUrl.searchParams.get("location") ?? "hero";
  const location = LOCATIONS.has(requestedLocation) ? requestedLocation : "hero";
  const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 500);
  const referer = (request.headers.get("referer") ?? "").slice(0, 500);
  const device = /android|iphone|ipad|ipod|mobile/i.test(userAgent) ? "mobile" : "desktop";
  const ip = getClientIp(request);
  const geography = getApproximateGeography(request);

  try {
    const { error } = await createAdminClient().from("microsoft_store_click_events").insert({
      location,
      device,
      user_agent: userAgent || null,
      referer: referer || null,
      ip_hash: ip ? sha256Hex(ip) : null,
      country_code: geography.countryCode,
      region: geography.region,
      city: geography.city,
    });
    if (error) throw error;
  } catch (error) {
    console.warn("[microsoft-store-click] could not persist click", error);
  }

  return NextResponse.redirect(`${MICROSOFT_STORE_URL}&cid=tienda360_landing_${location}`, { status: 307 });
}
