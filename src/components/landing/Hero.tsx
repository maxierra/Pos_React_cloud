import Image from "next/image";
import { Handshake } from "lucide-react";
import { trackFunnelEvent } from "@/lib/leads/analytics";

export function LandingHero({ marketplaceUrl }: { marketplaceUrl: string }) {
  return <section className="t360-hero"><div className="t360-wrap t360-hero-grid">
    <div><p className="t360-kicker">Punto de venta para Windows · Argentina</p><h1>Convertí tu PC en un <em>punto de venta completo</em></h1><p className="t360-lead">Vendé más rápido, controlá stock, caja y facturación desde un solo lugar.</p>
      <div className="t360-hero-ctas"><div className="t360-buy-block t360-buy-block-primary"><div><small>Licencia definitiva</small><b>$50.000 · Pago único · Sin abono mensual</b></div><a className="t360-button t360-hero-marketplace" href={marketplaceUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackFunnelEvent("mercadolibre_clicked", { location: "hero" })} aria-label="Comprar Tienda360 en Mercado Libre (abre en una pestaña nueva)"><span className="t360-mercadolibre-logo" aria-hidden="true"><Handshake /></span><span>Comprar en Mercado Libre</span><span aria-hidden="true">↗</span></a></div><p className="t360-purchase-note">Compra protegida · Instalación y configuración incluidas</p></div>
      <ul className="t360-checks"><li>350.000 productos precargados</li><li>Facturación electrónica ARCA</li><li>Cobros con QR</li><li>Control de stock y caja</li><li>Lectores de códigos de barras</li><li>Soporte y actualizaciones</li></ul>
    </div><div className="t360-hero-visual"><Image src="/tienda360-beneficios-desktop.png" alt="Panel de Tienda360 con ventas, stock, caja, ARCA, cobros QR y reportes" width={1536} height={1024} priority sizes="(max-width: 900px) 100vw, 48vw" style={{ width: "100%", height: "auto", objectFit: "contain" }} /><div className="t360-microsoft-certificate"><Image src="/Insignia%20de%20aplicaci%C3%B3n%20Microsoft%20certificada.png" alt="Aplicación certificada por Microsoft" width={1536} height={1024} sizes="(max-width: 600px) 160px, 210px" /></div><span>Listo para usar en tu comercio</span></div>
  </div></section>;
}

