import { landingConfig, whatsappUrl } from "@/lib/landing-config";
import { Download, KeyRound, MessageCircle, MonitorCheck, PlayCircle, ShieldCheck, UserRound } from "lucide-react";
import { TrackedLink } from "./tracked-link";

export function LandingHero() {
  return (
    <section className="lp-hero" id="top">
      <div className="lp-wrap lp-hero-grid">
        <div className="lp-hero-copy">
          <p className="lp-kicker">Tienda360 para Windows · Licencia definitiva</p>
          <h1>Tu punto de venta completo. <em>Un solo pago.</em></h1>
          <p className="lp-lead">Vendé, controlá stock, cerrá la caja y facturá con ARCA desde una sola pantalla. Descargá la demo, probala en tu comercio y decidí sin apuro.</p>
          <div className="lp-actions">
            <a className="lp-button lp-download-button lp-download-primary" href={landingConfig.demoUrl("hero")}><Download aria-hidden="true" /><span><small>Instalador para Windows</small>Descargar demo gratis</span></a>
            <TrackedLink className="lp-button lp-purchase-button" href={whatsappUrl("Hola, quiero adquirir Tienda360 por $50.000 y coordinar la instalación online.")} target="_blank" rel="noopener noreferrer" event="whatsapp_clicked" location="hero_purchase"><MessageCircle aria-hidden="true" />Quiero adquirirlo</TrackedLink>
          </div>
          <div className="lp-demo-credentials" aria-label="Credenciales para ingresar a la demo">
            <div className="lp-demo-credentials-title"><KeyRound aria-hidden="true" /><span><strong>Datos para ingresar a la demo</strong><small>Guardalos: los vas a necesitar al abrir el sistema</small></span></div>
            <div className="lp-demo-credentials-values"><span><UserRound aria-hidden="true" /><small>Usuario</small><strong>admin</strong></span><span><KeyRound aria-hidden="true" /><small>Contraseña</small><strong>admin123</strong></span></div>
          </div>
          <div className="lp-hero-trust"><span><MonitorCheck />Windows 10 y 11</span><span><ShieldCheck />Descarga oficial</span><span><PlayCircle />3 días de prueba</span></div>
          <p className="lp-note"><strong>Sin tarjeta y sin suscripción.</strong> Si activás la licencia, conservás los productos, ventas y configuraciones cargadas durante la prueba.</p>
        </div>
        <div className="lp-hero-video-shell">
          <div className="lp-video-browser"><span></span><span></span><span></span><b>Conocé Tienda360 en funcionamiento</b></div>
          <div className="lp-hero-video"><iframe src="https://www.youtube-nocookie.com/embed/eBtBLsHQrRc?rel=0" title="Presentación de Tienda360 para Windows" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>
          <p><PlayCircle aria-hidden="true" /> Mirá cómo funciona antes de instalarlo</p>
        </div>
      </div>
    </section>
  );
}
