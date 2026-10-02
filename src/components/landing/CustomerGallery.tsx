import Image from "next/image";

const PHOTOS = [
  { src: "/clientes/WhatsApp%20Image%202026-09-15%20at%2012.20.354.jpeg", alt: "Capacitación de Tienda360 junto al equipo de un comercio", label: "Capacitación en el comercio", featured: true },
  { src: "/clientes/WhatsApp%20Image%202026-09-15%20at%2012.20.32.jpeg", alt: "Puesto de venta instalado en un comercio de cercanía", label: "Punto de venta funcionando" },
  { src: "/clientes/WhatsApp%20Image%202026-09-16%20at%2012.11.25.jpeg", alt: "Configuración de Tienda360 con lector de códigos", label: "Instalación y configuración" },
  { src: "/clientes/WhatsApp%20Image%202026-09-11%20at%2011.26.37.jpeg", alt: "Comercio de cercanía que utiliza Tienda360", label: "Comercios reales" },
  { src: "/clientes/WhatsApp%20Image%202026-09-15%20at%2012.20.34.jpeg", alt: "Interior de un comercio donde funciona Tienda360", label: "Adaptado a cada rubro" },
  { src: "/clientes/WhatsApp%20Image%202026-09-16%20at%2012.11.24.jpeg", alt: "Ferretería incorporada a Tienda360", label: "Más rubros, el mismo control" },
  { src: "/clientes/WhatsApp%20Image%202026-09-15%20at%2011.09.44.jpeg", alt: "Kiosco de cercanía que trabaja con Tienda360", label: "Kioscos y comercios de cercanía" },
  { src: "/clientes/WhatsApp%20Image%202026-09-15%20at%2012.20.33.jpeg", alt: "Autoservicio y panadería que trabaja con Tienda360", label: "Autoservicios y panaderías" },
  { src: "/clientes/WhatsApp%20Image%2020256-09-15%20at%2012.20.33.jpeg", alt: "Capacitación de Tienda360 durante la atención en un comercio", label: "Capacitación con el comercio en marcha" },
] as const;

export function CustomerGallery() {
  return <section className="t360-section t360-customer-gallery" aria-labelledby="customer-gallery-title"><div className="t360-wrap"><div className="t360-heading t360-heading-left"><p className="t360-kicker">Tienda360 en acción</p><h2 id="customer-gallery-title">Instalaciones en comercios reales</h2><p>No son imágenes de catálogo: son negocios que ya están trabajando con el sistema y recibiendo acompañamiento.</p></div><div className="t360-customer-grid">{PHOTOS.map((photo) => { const featured = "featured" in photo && photo.featured; return <figure className={featured ? "t360-customer-photo featured" : "t360-customer-photo"} key={photo.src}><Image src={photo.src} alt={photo.alt} fill sizes={featured ? "(max-width: 700px) 100vw, 50vw" : "(max-width: 700px) 100vw, 25vw"} /><figcaption><span aria-hidden="true">✓</span>{photo.label}</figcaption></figure>; })}</div><div className="t360-gallery-proof"><b>Instalación guiada</b><span>Configuración en el lugar de trabajo</span><b>Capacitación incluida</b><span>Acompañamiento para empezar a vender</span></div></div></section>;
}
