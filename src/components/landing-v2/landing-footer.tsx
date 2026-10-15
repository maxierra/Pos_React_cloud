import { landingConfig, whatsappUrl } from "@/lib/landing-config";
import { TrackedLink } from "./tracked-link";
import { MicrosoftStoreMark } from "./store-marks";
import { DemoDownloadLink } from "./demo-download-link";

export function LandingFooter() {
  return <><footer className="lp-footer"><div className="lp-wrap"><a href="#top"><strong>Tienda360</strong></a><span>Software para comercios argentinos · Soporte por WhatsApp de 10 a 18 h</span><a href={landingConfig.loginUrl}>Acceder al sistema</a></div></footer><TrackedLink className="lp-whatsapp-float" href={whatsappUrl(landingConfig.advisorMessage)} target="_blank" rel="noopener noreferrer" event="whatsapp_clicked" location="floating">WhatsApp</TrackedLink><div className="lp-mobile-bar"><DemoDownloadLink href={landingConfig.demoUrl("mobile_bar")} target="_blank" rel="noopener noreferrer" location="mobile_bar"><MicrosoftStoreMark />Descargar demo gratis</DemoDownloadLink></div></>;
}
