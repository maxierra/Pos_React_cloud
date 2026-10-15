import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-v2/landing-page";

export const metadata: Metadata = {
  title: "Tienda360 — Punto de venta para tu comercio",
  description: "Vendé, facturá con ARCA y controlá stock y caja desde una sola pantalla. Licencia definitiva para Windows, sin abono mensual.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Tienda360 — Punto de venta para tu comercio",
    description: "Punto de venta para Windows con instalación, capacitación y soporte incluidos. Un solo pago, sin abono mensual.",
    url: "/",
    type: "website",
    locale: "es_AR",
    images: [{ url: "/newlogo.jpeg", width: 500, height: 500, alt: "Tienda360, punto de venta para comercios argentinos" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tienda360 — Punto de venta para tu comercio",
    description: "Vendé, facturá y controlá tu stock. Licencia definitiva para Windows.",
    images: ["/newlogo.jpeg"],
  },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Tienda360",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Windows 10, Windows 11",
    description: "Punto de venta para comercios argentinos con ventas, stock, caja y facturación electrónica ARCA.",
    offers: { "@type": "Offer", price: "50000", priceCurrency: "ARS" },
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /><LandingPage /></>;
}
