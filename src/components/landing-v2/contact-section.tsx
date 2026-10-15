import { ContactForm } from "./contact-form";
import { TrackedLink } from "./tracked-link";
import { landingConfig } from "@/lib/landing-config";
import { MercadoLibreMark, MicrosoftStoreMark } from "./store-marks";
import { DemoDownloadLink } from "./demo-download-link";

export function ContactSection() {
  return <><section className="lp-section lp-contact" id="contacto"><div className="lp-wrap lp-contact-grid"><div><p className="lp-kicker">Hablemos de tu comercio</p><h2>Contanos de tu comercio y te respondemos</h2><p>Escribinos y te ayudamos a ver si Tienda360 es lo que necesitás. Atendemos de 10 a 18 h.</p></div><ContactForm /></div></section><section className="lp-final"><div className="lp-wrap"><p className="lp-kicker">Probalo sin compromiso</p><h2>Descargá la demo oficial</h2><p>La instalación desde Microsoft Store es simple y segura. Ingresá con usuario <strong>{landingConfig.demoUser}</strong> y contraseña <strong>{landingConfig.demoPassword}</strong>.</p><div className="lp-actions"><DemoDownloadLink className="lp-button lp-button-microsoft" href={landingConfig.demoUrl("final")} target="_blank" rel="noopener noreferrer" location="final"><MicrosoftStoreMark /><span><small>Descargar gratis desde</small>Microsoft Store</span></DemoDownloadLink><TrackedLink className="lp-button lp-button-mercadolibre" href={landingConfig.purchaseUrl("final")} target="_blank" rel="noopener noreferrer" event="mercadolibre_clicked" location="final"><MercadoLibreMark /><span><small>Compra directa en</small>Mercado Libre</span></TrackedLink></div></div></section></>;
}
