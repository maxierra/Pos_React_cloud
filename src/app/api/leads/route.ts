import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { scoreLead } from "@/lib/leads/scoring";
import { isValidScheduleSlot } from "@/lib/leads/schedule";
import { BUSINESS_TYPES, INTENT_OPTIONS, PC_OPTIONS, READER_OPTIONS } from "@/lib/leads/types";

const requests = new Map<string, { count: number; reset: number }>();
const text = z.string().trim().min(2).max(100);
const nullableUrlText = z.string().trim().max(500).nullable().optional();
const createSchema = z.object({
  fullName: text, whatsapp: z.string().regex(/^549\d{10}$/), locality: text,
  businessType: z.enum(BUSINESS_TYPES), pcStatus: z.enum(PC_OPTIONS), readerStatus: z.enum(READER_OPTIONS), intent: z.enum(INTENT_OPTIONS),
  consent: z.literal(true), attribution: z.object({
    utmSource: z.string().max(200).nullable().optional(), utmMedium: z.string().max(200).nullable().optional(), utmCampaign: z.string().max(200).nullable().optional(),
    utmContent: z.string().max(200).nullable().optional(), utmTerm: z.string().max(200).nullable().optional(), landingUrl: z.string().url().max(500), referrer: nullableUrlText,
  }),
});
const scheduleSchema = z.object({ leadId: z.string().uuid(), scheduledAt: z.string().refine(isValidScheduleSlot, "Turno inválido") });

function limited(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now(); const current = requests.get(key);
  if (!current || current.reset < now) { requests.set(key, { count: 1, reset: now + 60_000 }); return false; }
  current.count += 1; return current.count > 12;
}

export async function GET() {
  const from = new Date().toISOString(); const to = new Date(Date.now() + 21 * 86400000).toISOString();
  const { data, error } = await createAdminClient().from("qualified_leads").select("scheduled_at").gte("scheduled_at", from).lte("scheduled_at", to);
  if (error) return NextResponse.json({ error: "No se pudo consultar la agenda" }, { status: 503 });
  return NextResponse.json({ booked: (data ?? []).map((row) => row.scheduled_at).filter(Boolean) });
}

export async function POST(request: NextRequest) {
  if (limited(request)) return NextResponse.json({ error: "Demasiados intentos. Probá nuevamente en un minuto." }, { status: 429 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisá los datos ingresados." }, { status: 400 });
  const p = parsed.data; const scoring = scoreLead(p);
  const { data, error } = await createAdminClient().from("qualified_leads").insert({
    full_name: p.fullName, whatsapp: p.whatsapp, locality: p.locality, business_type: p.businessType,
    pc_status: p.pcStatus, reader_status: p.readerStatus, intent: p.intent, ...scoring,
    classification: scoring.classification, status: scoring.classification === "ALTA INTENCIÓN" ? "CALIFICADO" : "NUEVO",
    contact_consent_at: new Date().toISOString(), utm_source: p.attribution.utmSource, utm_medium: p.attribution.utmMedium,
    utm_campaign: p.attribution.utmCampaign, utm_content: p.attribution.utmContent, utm_term: p.attribution.utmTerm,
    landing_url: p.attribution.landingUrl, referrer: p.attribution.referrer,
  }).select("id,classification").single();
  if (error) return NextResponse.json({ error: "No pudimos guardar tu solicitud. Intentá nuevamente." }, { status: 503 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (limited(request)) return NextResponse.json({ error: "Demasiados intentos." }, { status: 429 });
  const parsed = scheduleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Elegí un día y horario válido." }, { status: 400 });
  const { error } = await createAdminClient().from("qualified_leads").update({ scheduled_at: parsed.data.scheduledAt, status: "AGENDADO", updated_at: new Date().toISOString() }).eq("id", parsed.data.leadId).is("scheduled_at", null);
  if (error?.code === "23505") return NextResponse.json({ error: "Ese horario acaba de ocuparse. Elegí otro." }, { status: 409 });
  if (error) return NextResponse.json({ error: "No pudimos reservar el turno." }, { status: 503 });
  return NextResponse.json({ ok: true });
}

