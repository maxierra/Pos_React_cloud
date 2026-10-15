import { landingConfig } from "@/lib/landing-config";
import { TicketAnimation } from "./ticket-animation";
import { TrackedLink } from "./tracked-link";
import { MercadoLibreMark, MicrosoftStoreMark } from "./store-marks";
import { DemoDownloadLink } from "./demo-download-link";

export function LandingHero() {
  return (
    <section className="lp-hero" id="top">
      <div className="lp-wrap lp-hero-grid">
        <div className="lp-hero-copy">
          <p className="lp-kicker">Punto de venta para comercios argentinos</p>
          <h1>Vendé, facturá y controlá tu stock <em>desde una sola pantalla</em></h1>
          <p className="lp-lead">Tienda360 es el punto de venta para tu comercio. Escaneás, cobrás con QR y emitís la factura ARCA. Lo pagás una sola vez, sin abono mensual.</p>
          <div className="lp-actions">
            <DemoDownloadLink className="lp-button lp-button-microsoft" href={landingConfig.demoUrl("hero")} target="_blank" rel="noopener noreferrer" location="hero"><MicrosoftStoreMark /><span><small>Acceso gratuito</small>Probar la demo</span></DemoDownloadLink>
            <TrackedLink className="lp-button lp-button-mercadolibre" href={landingConfig.purchaseUrl("hero")} target="_blank" rel="noopener noreferrer" event="mercadolibre_clicked" location="hero"><MercadoLibreMark /><span><small>Compra directa en</small>Mercado Libre</span></TrackedLink>
          </div>
          <div className="lp-demo-access"><div><strong>Demo oficial y segura</strong><span>Aplicación certificada por Microsoft · Instalación sencilla</span></div><dl><div><dt>Usuario</dt><dd>{landingConfig.demoUser}</dd></div><div><dt>Contraseña</dt><dd>{landingConfig.demoPassword}</dd></div></dl></div>
          <p className="lp-note"><strong>Para PC con Windows 10 u 11.</strong> La demo es exclusivamente para probar el sistema. Si comprás la licencia, incluimos instalación, capacitación y soporte por WhatsApp de 10 a 18 h.</p>
        </div>
        <TicketAnimation />
      </div>
    </section>
  );
}
