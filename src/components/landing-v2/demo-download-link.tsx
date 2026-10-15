"use client";

import { useEffect, useRef, useState, type AnchorHTMLAttributes, type FormEvent, type ReactNode } from "react";
import { Check, Copy, MessageCircle, MonitorDown, X } from "lucide-react";
import { BUSINESS_TYPES, type PcOption, type ReaderOption } from "@/lib/leads/types";
import { readLeadAttribution } from "@/lib/leads/utm";
import { trackFunnelEvent } from "@/lib/leads/analytics";
import { landingConfig } from "@/lib/landing-config";
import { MicrosoftStoreMark } from "./store-marks";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { location: "hero" | "store_band" | "final" | "mobile_bar"; children: ReactNode };
const PC_OPTIONS: readonly [PcOption, string][] = [["windows", "Sí"], ["unsure", "No estoy seguro/a"], ["no_pc", "Todavía no"]];
const READER_OPTIONS: readonly [ReaderOption, string][] = [["yes", "Sí"], ["no", "No"], ["want_one", "Quiero asesoramiento"]];
const LANDING_URL = "https://www.tienda360.site";

function normalizeArgentinePhone(raw: string) {
  let value = raw.replace(/\D/g, "");
  if (value.startsWith("00")) value = value.slice(2);
  if (value.startsWith("54")) value = value.slice(2);
  if (value.startsWith("0")) value = value.slice(1);
  if (value.length === 12 && value.slice(2, 4) === "15") value = value.slice(0, 2) + value.slice(4);
  return value.length === 10 ? `549${value}` : "";
}

function isMobileDevice() {
  const navigatorWithHints = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  return navigatorWithHints.userAgentData?.mobile === true
    || /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent)
    || window.matchMedia("(max-width: 900px)").matches
    || window.matchMedia("(pointer: coarse)").matches;
}

export function DemoDownloadLink({ location, children, onClick, ...props }: Props) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const shareText = `Tienda360 es un programa para PC con Windows 10 u 11. Abrí este enlace desde la computadora para descargar e instalar la demo: ${LANDING_URL}`;

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const whatsapp = normalizeArgentinePhone(String(form.get("whatsapp") ?? ""));
    if (!whatsapp) return setError("Ingresá un WhatsApp argentino válido con código de área.");
    setBusy(true); setError("");
    const response = await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      fullName: String(form.get("fullName") ?? "").trim(), whatsapp, businessType: form.get("businessType"),
      pcStatus: form.get("pcStatus"), readerStatus: form.get("readerStatus"), consent: true, attribution: readLeadAttribution(),
    }) });
    const data = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) return setError(data.error || "No pudimos guardar tus datos. Probá nuevamente.");
    setSent(true);
    trackFunnelEvent("qualification_completed", { location, classification: data.classification });
    if (!isMobileDevice()) window.location.assign(landingConfig.demoUrl(location));
  }

  async function copyLink() { await navigator.clipboard.writeText(LANDING_URL); setCopied(true); }

  return <>
    <a {...props} onClick={(event) => { event.preventDefault(); setOpen(true); setSent(false); setError(""); trackFunnelEvent("qualification_started", { location }); onClick?.(event); }}>{children}</a>
    {open ? <div className="lp-demo-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="lp-demo-modal lp-demo-form-modal" role="dialog" aria-modal="true" aria-labelledby="demo-title">
        <button ref={closeButton} className="lp-demo-modal-close" type="button" onClick={() => setOpen(false)} aria-label="Cerrar"><X /></button>
        {!sent ? <><span className="lp-demo-modal-icon" aria-hidden="true"><MonitorDown /></span><p className="lp-kicker">Demo gratuita</p><h2 id="demo-title">Probá Tienda360</h2><p>Dejanos estos datos para darte acceso y ayudarte si tenés alguna duda.</p>
          <form className="lp-demo-lead-form" onSubmit={submit}>
            <div className="lp-demo-fields"><label>Nombre<input name="fullName" autoComplete="name" required minLength={2} /></label><label>WhatsApp<input name="whatsapp" inputMode="tel" autoComplete="tel" placeholder="Ej. 11 2345 6789" required /></label><label>Tipo de comercio<select name="businessType" defaultValue="" required><option value="" disabled>Elegí una opción</option>{BUSINESS_TYPES.map(type => <option key={type}>{type}</option>)}</select></label></div>
            <fieldset><legend>¿Tenés PC con Windows 10 u 11?</legend><p>Necesita 4 GB de RAM; recomendamos 8 GB.</p><div className="lp-demo-options">{PC_OPTIONS.map(([value, label]) => <label key={value}><input type="radio" name="pcStatus" value={value} required /><span>{label}</span></label>)}</div></fieldset>
            <fieldset><legend>¿Tenés lector de códigos?</legend><div className="lp-demo-options">{READER_OPTIONS.map(([value, label]) => <label key={value}><input type="radio" name="readerStatus" value={value} required /><span>{label}</span></label>)}</div></fieldset>
            {error ? <p className="lp-demo-error" role="alert">{error}</p> : null}<button className="lp-button lp-button-amber" type="submit" disabled={busy}>{busy ? "Preparando acceso…" : "Recibir acceso a la demo"}</button><small>Usaremos tu WhatsApp solamente para ayudarte con Tienda360.</small>
          </form>
        </> : <div className="lp-demo-success"><span className="lp-demo-success-icon"><Check /></span><p className="lp-kicker">Acceso habilitado</p><h2 id="demo-title">¡Ya podés probar Tienda360!</h2><p>Ingresá con usuario <strong>{landingConfig.demoUser}</strong> y contraseña <strong>{landingConfig.demoPassword}</strong>.</p>
          {isMobileDevice() ? <div className="lp-demo-modal-actions"><div className="lp-demo-pc-notice"><MonitorDown /><p><strong>Continuá desde una PC</strong><span>Tienda360 es un programa para Windows 10 u 11 y no se instala en el celular. Enviate el enlace y abrí <b>www.tienda360.site</b> desde tu computadora.</span></p></div><a className="lp-button lp-button-whatsapp" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"><MessageCircle /> Enviarme el enlace por WhatsApp</a><button className="lp-button lp-button-outline" type="button" onClick={copyLink}><Copy /> {copied ? "Enlace copiado ✓" : "Copiar www.tienda360.site"}</button></div> : <a className="lp-button lp-button-microsoft lp-demo-store-link" href={landingConfig.demoUrl(location)} target="_blank" rel="noopener noreferrer"><MicrosoftStoreMark /><span><small>Descargar gratis desde</small>Microsoft Store</span></a>}
        </div>}
      </section>
    </div> : null}
  </>;
}
