import { ContactForm } from "./contact-form";
import { TrackedLink } from "./tracked-link";
import { landingConfig, whatsappUrl } from "@/lib/landing-config";
import { Download, MessageCircle } from "lucide-react";

export function ContactSection() {
  return <><section className="lp-section lp-contact" id="contacto"><div className="lp-wrap lp-contact-grid"><div><p className="lp-kicker">Hablemos de tu comercio</p><h2>Contanos de tu comercio y te respondemos</h2><p>Escribinos y te ayudamos a ver si Tienda360 es lo que necesitás. El soporte técnico atiende de lunes a viernes de 9 a 18 h.</p></div><ContactForm /></div></section><section className="lp-final"><div className="lp-wrap"><p className="lp-kicker">Elegí cómo empezar</p><h2>Probalo gratis o coordiná la instalación</h2><p>Descargá la demo por 3 días. Si ya decidiste adquirirlo, escribinos y coordinamos todo de manera online.</p><div className="lp-actions"><a className="lp-button lp-download-button lp-download-primary" href={landingConfig.demoUrl("final")}><Download aria-hidden="true" /><span><small>Instalador para Windows</small>Descargar demo gratis</span></a><TrackedLink className="lp-button lp-button-whatsapp" href={whatsappUrl("Hola, quiero adquirir Tienda360 por $50.000 y coordinar la instalación online.")} target="_blank" rel="noopener noreferrer" event="whatsapp_clicked" location="final_purchase"><MessageCircle aria-hidden="true" />Coordinar por WhatsApp</TrackedLink></div></div></section></>;
}
