"use client";
import { useEffect } from "react";
import Image from "next/image";
import { LandingHero } from "./Hero";
import { TutorialVideos } from "./TutorialVideos";
import { Benefits } from "./Benefits";
import { BusinessTypes } from "./BusinessTypes";
import { Testimonials } from "./Testimonials";
import { CustomerGallery } from "./CustomerGallery";
import { LandingFAQ } from "./FAQ";
import { trackFunnelEvent } from "@/lib/leads/analytics";
import { MetaPixel } from "@/components/analytics/meta-pixel";
import { ProductBannerCarousel } from "./ProductBannerCarousel";
import "./funnel.css";

const MERCADOLIBRE_URL = "/api/store/mercadolibre?location=hero";

export function ConversionFunnel() {
  useEffect(() => { trackFunnelEvent("landing_view"); }, []);
  return <div className="t360" id="inicio">
    <MetaPixel trackViewContent={false} />
    <header className="t360-header"><div className="t360-wrap t360-nav">
      <a href="#inicio" className="t360-brand"><Image src="/newlogo.jpeg" alt="" width={38} height={38} /> <span>Tienda360</span></a>
      <nav aria-label="Navegación principal"><a href="#funciones">Funciones</a><a href="#tutoriales">Tutoriales</a><a href="#preguntas">Preguntas</a></nav>
    </div></header>
    <main><LandingHero marketplaceUrl={MERCADOLIBRE_URL} />
      <ProductBannerCarousel />
      <section className="t360-section t360-product-loading" id="lector" aria-labelledby="product-loading-title"><div className="t360-wrap"><h2 id="product-loading-title" className="t360-visually-hidden">Dos formas de cargar productos</h2><div className="t360-product-loading-poster"><Image src="/Dos%20formas%20de%20cargar%20productos.png" alt="Dos formas de cargar productos en Tienda360: carga manual sin lector o carga automática escaneando el código de barras" width={1536} height={1024} sizes="(max-width: 1200px) calc(100vw - 40px), 1160px" /></div><div className="t360-product-loading-mobile"><Image src="/version-mobile.png" alt="Dos formas de cargar productos en Tienda360: carga manual sin lector o carga automática escaneando el código de barras" width={1024} height={1536} sizes="calc(100vw - 28px)" /></div></div></section><TutorialVideos /><Benefits />
      <BusinessTypes /><Testimonials /><CustomerGallery />
      <section className="t360-section t360-support-section" id="acompanamiento" aria-label="Acompañamiento real de Tienda360"><div className="t360-wrap"><div className="t360-support-poster"><Image src="/Acompa%C3%B1amiento%20real%20para%20tu%20tienda.png" alt="Acompañamiento real de Tienda360 con instalación guiada, capacitación, continuidad de datos y soporte por WhatsApp" width={1856} height={838} sizes="(max-width: 900px) 100vw, 1160px" /></div><div className="t360-support-mobile"><Image src="/Acompa%C3%B1amiento%20real%20para%20tu%20tienda%20mobile.png" alt="Acompañamiento real de Tienda360 con instalación guiada, capacitación, continuidad de datos y soporte por WhatsApp" width={1106} height={1430} sizes="calc(100vw - 40px)" /></div></div></section>
      <LandingFAQ />
    </main>
    <footer><div className="t360-wrap t360-footer"><span>© 2026 Tienda360</span><span>Software para comercios argentinos</span><a href="/auth/login">Acceder al sistema web</a></div></footer>
  </div>;
}

