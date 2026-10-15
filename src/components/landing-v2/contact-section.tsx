import { ContactForm } from "./contact-form";
import { TrackedLink } from "./tracked-link";
import { landingConfig } from "@/lib/landing-config";
import { MercadoLibreMark } from "./store-marks";

export function ContactSection() {
  return <><section className="lp-section lp-contact" id="contacto"><div className="lp-wrap lp-contact-grid"><div><p className="lp-kicker">Hablemos de tu comercio</p><h2>Contanos de tu comercio y te respondemos</h2><p>Escribinos y te ayudamos a ver si Tienda360 es lo que necesitás. El soporte técnico atiende de lunes a viernes de 9 a 18 h.</p></div><ContactForm /></div></section><section className="lp-final"><div className="lp-wrap"><p className="lp-kicker">Licencia definitiva</p><h2>¿Ya probaste Tienda360?</h2><p>Comprá la licencia de pago único, con instalación, capacitación y soporte incluidos.</p><div className="lp-actions"><TrackedLink className="lp-button lp-button-mercadolibre" href={landingConfig.purchaseUrl("final")} target="_blank" rel="noopener noreferrer" event="mercadolibre_clicked" location="final"><MercadoLibreMark /><span><small>Compra directa en</small>Mercado Libre</span></TrackedLink></div></div></section></>;
}
