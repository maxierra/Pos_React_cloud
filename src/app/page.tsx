import { ConversionLanding } from "@/components/landing/conversion-landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
 title: "Tienda360 — Punto de venta para Windows",
 description: "Ventas, stock y caja para tu comercio. Descargá Tienda360 para Windows y probá el sistema completo durante 3 días, sin tarjeta.",
};

export default function Home() {
 return <ConversionLanding />;
}
