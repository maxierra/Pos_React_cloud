"use client";

import { useEffect, useRef, useState, type AnchorHTMLAttributes, type ReactNode } from "react";
import { Copy, MessageCircle, MonitorDown, X } from "lucide-react";
import { trackFunnelEvent } from "@/lib/leads/analytics";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  location: "hero" | "final" | "mobile_bar";
  children: ReactNode;
};

const LANDING_URL = "https://tienda360.site";

function isMobileDevice() {
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent)
    || window.matchMedia("(max-width: 700px)").matches;
}

export function DemoDownloadLink({ location, children, onClick, ...props }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const shareText = `Tienda360 se instala en una PC con Windows 10 u 11. Abrí este enlace desde la computadora para descargar la demo gratis: ${LANDING_URL}`;

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  async function copyLink() {
    await navigator.clipboard.writeText(LANDING_URL);
    setCopied(true);
    trackFunnelEvent("microsoft_store_clicked", { location: "mobile_notice", action: "copy_link" });
  }

  return <>
    <a {...props} onClick={(event) => {
      if (isMobileDevice()) {
        event.preventDefault();
        setCopied(false);
        setOpen(true);
        void fetch(`/api/store/microsoft?location=${location}`, { method: "POST", keepalive: true });
        trackFunnelEvent("hero_cta_click", { location, action: "mobile_blocked" });
      } else {
        trackFunnelEvent("hero_cta_click", { location });
      }
      onClick?.(event);
    }}>{children}</a>
    {open ? <div className="lp-demo-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="lp-demo-modal" role="dialog" aria-modal="true" aria-labelledby="demo-mobile-title">
        <button ref={closeButton} className="lp-demo-modal-close" type="button" onClick={() => setOpen(false)} aria-label="Cerrar aviso"><X /></button>
        <span className="lp-demo-modal-icon" aria-hidden="true"><MonitorDown /></span>
        <p className="lp-kicker">Aplicación para computadora</p>
        <h2 id="demo-mobile-title">La demo se instala en una PC con Windows</h2>
        <p>Estás navegando desde un celular. Enviate el enlace o copialo para abrirlo después en tu PC con Windows 10 u 11.</p>
        <div className="lp-demo-modal-actions">
          <a className="lp-button lp-button-whatsapp" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" onClick={() => trackFunnelEvent("whatsapp_clicked", { location: "mobile_demo_share" })}><MessageCircle /> Enviarme el enlace por WhatsApp</a>
          <button className="lp-button lp-button-outline" type="button" onClick={copyLink}><Copy /> {copied ? "Enlace copiado ✓" : "Copiar enlace para la PC"}</button>
        </div>
      </section>
    </div> : null}
  </>;
}
