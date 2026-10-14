import { ConversionLandingGuard } from "@/components/landing/conversion-landing-guard";
import type { Metadata } from "next";

export const metadata: Metadata = {
 title: "Tienda360 — Punto de venta para Windows",
 description: "Convertí tu PC en un punto de venta completo. Comprá una licencia definitiva de Tienda360, sin abono mensual.",
 openGraph: {
  title: "Tienda360 — Punto de venta para tu comercio",
  description: "Ventas, stock, caja, ARCA y cobros QR. Licencia definitiva con instalación y soporte incluidos.",
  images: [{ url: "/newlogo.jpeg", alt: "Tienda360" }],
 },
};

export default function Home() {
 return <ConversionLandingGuard />;
}
