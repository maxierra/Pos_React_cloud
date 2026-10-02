import { trackMetaCustomEvent, trackMetaEvent } from "@/components/analytics/meta-pixel";

export type FunnelEvent = "landing_view" | "hero_cta_click" | "microsoft_store_clicked" | "mercadolibre_clicked" | "video_started" | "video_completed" | "qualification_started" | "qualification_completed" | "qualified_lead" | "schedule_started" | "schedule_completed" | "whatsapp_clicked" | "demo_installed" | "purchase_completed";

export function trackFunnelEvent(name: FunnelEvent, params: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("tienda360:funnel", { detail: { name, params } }));
  window.gtag?.("event", name, params);
  window.fbq?.("trackCustom", name, params);
  if (name === "qualified_lead") trackMetaEvent("Lead", params);
  else if (name === "whatsapp_clicked") trackMetaCustomEvent("ClickWhatsApp", params);
  else if (name === "hero_cta_click") trackMetaCustomEvent("ClickDemo", params);
  else if (name === "microsoft_store_clicked") trackMetaCustomEvent("ClickDescargar", params);
  else if (name === "qualification_started") trackMetaCustomEvent("FormularioIniciado", params);
  else if (name === "qualification_completed") trackMetaCustomEvent("FormularioCompletado", params);
}

declare global { interface Window { gtag?: (...args: unknown[]) => void } }

