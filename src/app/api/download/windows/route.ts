import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  DESKTOP_DOWNLOAD_ASSET_KEY,
  DESKTOP_DEMO_DOWNLOAD_URL,
} from "@/lib/desktop-download";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const downloadLeadSchema = z.object({
  fullName: z.string().trim().min(3).max(120),
  phone: z.string().trim().min(8).max(30),
  source: z.string().trim().max(80).optional(),
  contactConsent: z.literal(true),
});

function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function getClientIp(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? "";
  return req.headers.get("x-real-ip")?.trim() ?? "";
}

export async function POST(request: NextRequest) {
  const parsed = downloadLeadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ingresá tu nombre completo y un teléfono válido." }, { status: 400 });
  }

  const phone = parsed.data.phone.replace(/[^\d+]/g, "");
  if (phone.replace(/\D/g, "").length < 8) {
    return NextResponse.json({ error: "Ingresá un teléfono válido, incluyendo el código de área." }, { status: 400 });
  }

  const source = parsed.data.source || "landing";

  let downloadEventId: string | null = null;
  try {
    const admin = createAdminClient();
    const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 500);
    const referer = (request.headers.get("referer") ?? "").slice(0, 500);
    const ip = getClientIp(request);
    const ipHash = ip ? sha256Hex(ip) : null;

    const { data, error } = await admin.from("download_events").insert({
      asset_key: DESKTOP_DOWNLOAD_ASSET_KEY,
      source,
      full_name: parsed.data.fullName,
      phone,
      contact_consent_at: new Date().toISOString(),
      user_agent: userAgent || null,
      referer: referer || null,
      ip_hash: ipHash,
    }).select("id").single();
    if (error) throw error;
    downloadEventId = (data as { id?: string } | null)?.id ?? null;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[download-track] could not persist download event", error);
    }
    return NextResponse.json({ error: "No pudimos registrar la descarga. Intentá nuevamente en unos minutos." }, { status: 503 });
  }

  const response = NextResponse.json({ downloadUrl: DESKTOP_DEMO_DOWNLOAD_URL });
  if (downloadEventId) {
    response.cookies.set("tienda360_download", downloadEventId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }
  return response;
}

export async function GET() {
  return NextResponse.redirect(DESKTOP_DEMO_DOWNLOAD_URL, { status: 307 });
}
