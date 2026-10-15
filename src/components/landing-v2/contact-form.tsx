"use client";

import { type FormEvent } from "react";
import { landingConfig, whatsappUrl } from "@/lib/landing-config";
import { trackFunnelEvent } from "@/lib/leads/analytics";
import { trackMetaEvent } from "@/components/analytics/meta-pixel";

export function ContactForm() {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const business = String(data.get("business") ?? "").trim();
    const question = String(data.get("question") ?? "").trim();
    const message = [`Hola, soy ${name}. Tengo un/a ${business} y quiero conocer Tienda360.`, question && `Mi consulta: ${question}`].filter(Boolean).join("\n");
    trackFunnelEvent("qualification_completed", { location: "contact_form" });
    trackMetaEvent("Lead", { content_name: "Consulta landing", content_category: business });
    window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
  }

  return (
    <form className="lp-contact-form" onSubmit={submit} onFocus={() => trackFunnelEvent("qualification_started", { location: "contact_form" })}>
      <label>Tu nombre<input name="name" autoComplete="name" required /></label>
      <label>Tu rubro<input name="business" placeholder="Kiosco, almacén, ferretería…" required /></label>
      <label>¿Qué querés saber? <span>(opcional)</span><textarea name="question" rows={4} /></label>
      <button className="lp-button lp-button-amber" type="submit">Escribir por WhatsApp ↗</button>
      <p>Tu consulta se abre en WhatsApp al número de Tienda360 ({landingConfig.whatsappNumber}).</p>
    </form>
  );
}
