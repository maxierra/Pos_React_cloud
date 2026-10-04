"use client";
import { useCallback, useEffect, useState, type MouseEvent } from "react";
import Image from "next/image";
import { LandingHero } from "./Hero";
import { DemoVideo } from "./DemoVideo";
import { TutorialVideos } from "./TutorialVideos";
import { MobileStoreNotice } from "./MobileStoreNotice";
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

const MERCADOLIBRE_URL = "https://www.mercadolibre.com.ar/software-para-comercios/up/MLAU5183643963";
const COMBO_INICIAL_URL = "https://www.mercadolibre.com.ar/combo-punto-de-venta-sistema--impresora-de-ticket-y-lector/up/MLAU5294453977";

function microsoftStoreTrackingUrl(location: "header" | "hero" | "hero_certificate" | "store_band" | "mobile_share", absolute = false) {
  const path = `/api/store/microsoft?location=${location}`;
  return absolute ? `https://tienda360.site${path}` : path;
}

export function ConversionFunnel() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [mobileStoreOpen, setMobileStoreOpen] = useState(false);
  const begin = () => { setWizardOpen(true); trackFunnelEvent("qualification_started"); };
  const closeMobileStore = useCallback(() => setMobileStoreOpen(false), []);
  const openStore = (event: MouseEvent<HTMLAnchorElement>, location: string) => {
    const isSmallScreen = window.matchMedia("(max-width: 820px)").matches;
    trackFunnelEvent("microsoft_store_clicked", { location, device: isSmallScreen ? "mobile" : "desktop" });
    if (isSmallScreen) { event.preventDefault(); setMobileStoreOpen(true); }
  };
  useEffect(() => { trackFunnelEvent("landing_view"); }, []);
  return <div className="t360" id="inicio">
    <MetaPixel trackViewContent={false} />
    <header className="t360-header"><div className="t360-wrap t360-nav">
      <a href="#inicio" className="t360-brand"><Image src="/newlogo.jpeg" alt="" width={38} height={38} /> <span>Tienda360</span></a>
      <nav aria-label="Navegación principal"><a href="#demo">Demostración</a><a href="#funciones">Funciones</a><a href="#preguntas">Preguntas</a></nav>
      <a className="t360-button t360-button-small" href={microsoftStoreTrackingUrl("header")} target="_blank" rel="noopener noreferrer" onClick={(event) => openStore(event, "header")}>Descargar para PC <span aria-hidden>↗</span></a>
    </div></header>
    <main><LandingHero onStoreClick={openStore} storeUrl={microsoftStoreTrackingUrl("hero")} certificateStoreUrl={microsoftStoreTrackingUrl("hero_certificate")} marketplaceUrl={MERCADOLIBRE_URL} />
      <section className="t360-store-band" aria-labelledby="store-title"><div className="t360-wrap t360-store-band-inner"><div className="t360-store-seal" aria-hidden="true"><span className="t360-windows-mark"><i /><i /><i /><i /></span></div><div><p className="t360-kicker">Disponible oficialmente para Windows</p><h2 id="store-title">Instalalo directo desde Microsoft Store</h2><p>Aplicación exclusiva para PC con Windows 10/11.</p></div><a className="t360-store-button t360-store-button-dark" href={microsoftStoreTrackingUrl("store_band")} target="_blank" rel="noopener noreferrer" onClick={(event) => openStore(event, "store_band")} aria-label="Obtener Tienda360 desde Microsoft Store (abre en una pestaña nueva)"><span className="t360-windows-mark" aria-hidden="true"><i /><i /><i /><i /></span><span><small>Obtenelo en</small><b>Microsoft Store</b></span><span className="t360-store-arrow" aria-hidden="true">↗</span></a></div></section>
      <DemoVideo onStart={begin} /><TutorialVideos /><Benefits />
      <section className="t360-section t360-starter-combo" aria-labelledby="starter-combo-title"><div className="t360-wrap t360-starter-combo-grid"><div className="t360-starter-combo-image"><Image src="/combo250.png" alt="Combo inicial Tienda360 con sistema de punto de venta, impresora de tickets y lector de códigos de barras" width={1254} height={1254} sizes="(max-width: 800px) calc(100vw - 40px), 50vw" /></div><div className="t360-starter-combo-copy"><p className="t360-kicker">Todo para comenzar</p><h2 id="starter-combo-title">Combo inicial Tienda360</h2><p className="t360-starter-combo-lead">Una solución ideal para poner en marcha tu punto de venta con los elementos esenciales desde el primer día.</p><ul><li>Sistema de punto de venta Tienda360</li><li>Impresora térmica de tickets</li><li>Lector de códigos de barras</li></ul><div className="t360-starter-shipping"><span aria-hidden="true">✓</span><div><b>Disponible en todo el país</b><small>Compralo online y recibilo mediante Mercado Libre.</small></div></div><a className="t360-button t360-mercadolibre-button t360-starter-combo-button" href={COMBO_INICIAL_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackFunnelEvent("mercadolibre_clicked", { location: "starter_combo", product: "combo_inicial" })} aria-label="Ver el combo inicial Tienda360 en Mercado Libre (abre en una pestaña nueva)"><span className="t360-mercadolibre-logo" aria-hidden="true"><Handshake /></span><span>Ver combo en Mercado Libre</span><span aria-hidden="true">↗</span></a><small className="t360-mercadolibre-note">Compra protegida a través de Mercado Libre</small></div></div></section>
      <BusinessTypes /><Testimonials /><CustomerGallery />
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
    <MobileStoreNotice open={mobileStoreOpen} onClose={closeMobileStore} storeUrl={microsoftStoreTrackingUrl("mobile_share", true)} />
  </div>;
}

