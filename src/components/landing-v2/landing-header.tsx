import Image from "next/image";
import { Download } from "lucide-react";
import { landingConfig } from "@/lib/landing-config";

export function LandingHeader() {
  return (
    <header className="lp-header">
      <div className="lp-wrap lp-nav">
        <a className="lp-brand" href="#top" aria-label="Tienda360, ir al inicio"><Image src="/newlogo.jpeg" alt="" width={38} height={38} /><span>Tienda360</span></a>
        <nav aria-label="Navegación principal"><a href="#sistema">El sistema</a><a href="#como">Cómo funciona</a><a href="#precio">Pago único</a><a href="#tutoriales">Tutoriales</a><a href="#preguntas">Preguntas</a></nav>
        <a className="lp-button lp-button-small lp-download-button" href={landingConfig.demoUrl("hero")}><Download aria-hidden="true" />Descargar demo</a>
      </div>
    </header>
  );
}
