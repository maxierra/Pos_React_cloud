import { landingConfig, whatsappUrl } from "@/lib/landing-config";
import { TrackedLink } from "./tracked-link";
import { MessageCircle } from "lucide-react";

export function LandingFooter() {
  return <><footer className="lp-footer"><div className="lp-wrap"><a href="#top"><strong>Tienda360</strong></a><span>Soporte técnico por WhatsApp · Lunes a viernes de 9 a 18 h</span><a href={landingConfig.loginUrl}>Acceder al sistema</a></div></footer><TrackedLink className="lp-whatsapp-float" href={whatsappUrl(landingConfig.advisorMessage)} target="_blank" rel="noopener noreferrer" event="whatsapp_clicked" location="floating" aria-label="Contactar a Tienda360 por WhatsApp al 11 2314-5742"><MessageCircle aria-hidden="true" /><span>WhatsApp · 11 2314-5742</span></TrackedLink></>;
}
