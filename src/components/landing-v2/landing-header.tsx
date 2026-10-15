import Image from "next/image";
import { landingConfig, whatsappUrl } from "@/lib/landing-config";
import { TrackedLink } from "./tracked-link";

export function LandingHeader() {
  return (
    <header className="lp-header">
      <div className="lp-wrap lp-nav">
        <a className="lp-brand" href="#top" aria-label="Tienda360, ir al inicio"><Image src="/newlogo.jpeg" alt="" width={38} height={38} /><span>Tienda360</span></a>
        <nav aria-label="Navegación principal"><a href="#como">Cómo funciona</a><a href="#tutoriales">Tutoriales</a><a href="#precio">Precio</a><a href="#nosotros">Nosotros</a><a href="#preguntas">Preguntas</a><a href="#contacto">Contacto</a></nav>
        <TrackedLink className="lp-button lp-button-small" href={whatsappUrl(landingConfig.advisorMessage)} target="_blank" rel="noopener noreferrer" event="whatsapp_clicked" location="header">Hablar con un asesor</TrackedLink>
      </div>
    </header>
  );
}
