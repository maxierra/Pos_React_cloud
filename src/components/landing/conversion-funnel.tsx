"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { LandingHero } from "./Hero";
import { DemoVideo } from "./DemoVideo";
import { TutorialVideos } from "./TutorialVideos";
import { Benefits } from "./Benefits";
import { BusinessTypes } from "./BusinessTypes";
import { Testimonials } from "./Testimonials";
import { CustomerGallery } from "./CustomerGallery";
import { QualificationWizard } from "./QualificationWizard";
import { LandingFAQ } from "./FAQ";
import { trackFunnelEvent } from "@/lib/leads/analytics";
import { MetaPixel } from "@/components/analytics/meta-pixel";
import { Handshake } from "lucide-react";
import "./funnel.css";

const MICROSOFT_STORE_URL = "https://apps.microsoft.com/detail/9PLJGFFQ6K8R?hl=es-ar&gl=AR";
const MERCADOLIBRE_URL = "https://www.mercadolibre.com.ar/software-para-comercios/up/MLAU5183643963";

function microsoftStoreCampaignUrl(location: "header" | "hero" | "store_band") {
  return `${MICROSOFT_STORE_URL}&cid=tienda360_landing_${location}`;
}

export function ConversionFunnel() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const begin = () => { setWizardOpen(true); trackFunnelEvent("qualification_started"); };
  const openStore = (location: string) => trackFunnelEvent("microsoft_store_clicked", { location });
  useEffect(() => { trackFunnelEvent("landing_view"); }, []);
  return <div className="t360" id="inicio">
    <MetaPixel trackViewContent={false} />
    <header className="t360-header"><div className="t360-wrap t360-nav">
      <a href="#inicio" className="t360-brand"><Image src="/newlogo.jpeg" alt="" width={38} height={38} /> <span>Tienda360</span></a>
      <nav aria-label="Navegación principal"><a href="#demo">Demostración</a><a href="#funciones">Funciones</a><a href="#preguntas">Preguntas</a></nav>
      <a className="t360-button t360-button-small" href={microsoftStoreCampaignUrl("header")} target="_blank" rel="noopener noreferrer" onClick={() => openStore("header")}>Descargar app <span aria-hidden>↗</span></a>
    </div></header>
    <main><LandingHero onStoreClick={openStore} storeUrl={microsoftStoreCampaignUrl("hero")} marketplaceUrl={MERCADOLIBRE_URL} />
      <section className="t360-store-band" aria-labelledby="store-title"><div className="t360-wrap t360-store-band-inner"><div className="t360-store-seal" aria-hidden="true"><span className="t360-windows-mark"><i /><i /><i /><i /></span></div><div><p className="t360-kicker">Disponible oficialmente para Windows</p><h2 id="store-title">Instalalo directo desde Microsoft Store</h2><p>Un clic, instalación simple y actualizaciones centralizadas en tu PC.</p></div><a className="t360-store-button t360-store-button-dark" href={microsoftStoreCampaignUrl("store_band")} target="_blank" rel="noopener noreferrer" onClick={() => openStore("store_band")} aria-label="Obtener Tienda360 desde Microsoft Store (abre en una pestaña nueva)"><span className="t360-windows-mark" aria-hidden="true"><i /><i /><i /><i /></span><span><small>Obtenelo en</small><b>Microsoft Store</b></span><span className="t360-store-arrow" aria-hidden="true">↗</span></a></div></section>
      <DemoVideo onStart={begin} /><TutorialVideos /><Benefits /><BusinessTypes /><Testimonials /><CustomerGallery />
      <section className="t360-section t360-conversion" id="implementar"><div className="t360-wrap t360-conversion-inner">
        <p className="t360-kicker">El próximo paso</p><h2>¿Querés implementarlo en tu comercio?</h2><p>Respondé unas preguntas rápidas y coordinamos una demostración e instalación guiada.</p>
        <button className="t360-button t360-button-light" onClick={begin}>Comenzar <span aria-hidden>→</span></button><small>Son 5 pasos. No necesitás descargar nada.</small>
      </div></section>
      <section className="t360-section t360-support-section" id="acompanamiento" aria-label="Acompañamiento real de Tienda360"><div className="t360-wrap"><div className="t360-support-poster"><Image src="/Acompa%C3%B1amiento%20real%20para%20tu%20tienda.png" alt="Acompañamiento real de Tienda360 con instalación guiada, capacitación, continuidad de datos y soporte por WhatsApp" width={1856} height={838} sizes="(max-width: 900px) 100vw, 1160px" /></div><div className="t360-support-mobile"><Image src="/Acompa%C3%B1amiento%20real%20para%20tu%20tienda%20mobile.png" alt="Acompañamiento real de Tienda360 con instalación guiada, capacitación, continuidad de datos y soporte por WhatsApp" width={1106} height={1430} sizes="calc(100vw - 40px)" /></div></div></section>
      <LandingFAQ />
      <section className="t360-section t360-price"><div className="t360-wrap t360-price-grid"><div><p className="t360-kicker">Después de probarlo</p><h2>Una licencia definitiva. Sin abono mensual.</h2><p>Probalo durante 3 días. Si te sirve, activás y continuás con toda la información que cargaste.</p></div><article><span>LICENCIA DEFINITIVA</span><strong>$50.000 <small>ARS</small></strong><p>Un solo pago · Soporte y actualizaciones</p><div className="t360-purchase-actions"><a className="t360-button t360-mercadolibre-button" href={MERCADOLIBRE_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackFunnelEvent("mercadolibre_clicked", { location: "pricing" })} aria-label="Comprar ahora en Mercado Libre (abre en una pestaña nueva)"><span className="t360-mercadolibre-logo" aria-hidden="true"><Handshake /></span><span>Comprar ahora</span><span aria-hidden="true">↗</span></a><button className="t360-button t360-button-ghost" onClick={begin}>Coordinar una demostración</button></div><small className="t360-mercadolibre-note">Compra protegida a través de Mercado Libre</small></article></div></section>
    </main>
    <footer><div className="t360-wrap t360-footer"><span>© 2026 Tienda360</span><span>Software para comercios argentinos</span><a href="/auth/login">Acceder al sistema web</a></div></footer>
    <QualificationWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
  </div>;
}

