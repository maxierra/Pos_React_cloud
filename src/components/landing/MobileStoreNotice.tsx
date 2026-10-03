"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageCircle, MonitorDown, X } from "lucide-react";
import { trackFunnelEvent } from "@/lib/leads/analytics";

const LANDING_URL = "https://tienda360.site";

export function MobileStoreNotice({ open, onClose, storeUrl }: { open: boolean; onClose: () => void; storeUrl: string }) {
  const [copied, setCopied] = useState(false);
  const shareText = `Tienda360 se instala en una PC con Windows. Abrí este enlace desde la computadora: ${LANDING_URL}\n\nMicrosoft Store: ${storeUrl}`;
  const close = useCallback(() => { setCopied(false); onClose(); }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, close]);

  if (!open) return null;

  const copyLink = async () => {
    await navigator.clipboard.writeText(LANDING_URL);
    setCopied(true);
    trackFunnelEvent("microsoft_store_clicked", { location: "mobile_notice", action: "copy_link" });
  };

  return <div className="t360-mobile-store-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section className="t360-mobile-store-dialog" role="dialog" aria-modal="true" aria-labelledby="mobile-store-title">
      <button className="t360-mobile-store-close" type="button" onClick={close} aria-label="Cerrar aviso"><X /></button>
      <div className="t360-mobile-store-icon" aria-hidden="true"><MonitorDown /></div>
      <p className="t360-kicker">Aplicación para computadora</p>
      <h2 id="mobile-store-title">Tienda360 se instala en una PC con Windows</h2>
      <p>Estás navegando desde un celular. Para descargar la aplicación, abrí <b>tienda360.site</b> desde tu computadora con Windows 10 u 11.</p>
      <div className="t360-mobile-store-actions">
        <a className="t360-button t360-whatsapp-share" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" onClick={() => trackFunnelEvent("microsoft_store_clicked", { location: "mobile_notice", action: "share_whatsapp" })}><MessageCircle /> Enviarme el enlace por WhatsApp</a>
        <button className="t360-button t360-button-ghost" type="button" onClick={copyLink}>{copied ? "✓ Enlace copiado" : "Copiar enlace para abrir en la PC"}</button>
        <button className="t360-mobile-store-understood" type="button" onClick={close}>Entendido</button>
      </div>
    </section>
  </div>;
}
