import Image from "next/image";

const reviews = [
  ["Excelente atención, antes y después de la compra. El software es lo mejor que me pasó en mi negocio.", "Agustina Scoppa"],
  ["Muy responsable el soporte cuando lo necesitás. Siempre disponible y el precio es súper accesible.", "Joel Santillan"],
  ["Excelente programa, sencillo y fácil de usar.", "Omar Delgadillo"],
  ["Excelente programa, cubrió mis expectativas, ventas facturación control de stock me ayudó mucho en el comercio, Excelente atención pos venta, lo recomiendo.", "Kiosco Sweet"],
  ["Buen servicio, estamos iniciando un shop en una YPF y va muy bien, tuvimos que realizar algunas adaptaciones pero los cambios se realizaron perfectamente.", "Leonardo Ossa"],
  ["Excelente servicio! Calidad humana y profesional!", "Natalia Porto"],
  ["Excelente atención!", "Mariana Tocco"],
  ["Excelente atención, siempre a disposición.", "Yesica Ferra"],
] as const;

const photos = [
  ["/clientes/WhatsApp%20Image%202026-09-15%20at%2012.20.354.jpeg", "Capacitación de Tienda360 junto al equipo de un comercio"],
  ["/clientes/WhatsApp%20Image%202026-09-15%20at%2012.20.32.jpeg", "Punto de venta Tienda360 instalado en un comercio de cercanía"],
  ["/clientes/WhatsApp%20Image%202026-09-16%20at%2012.11.25.jpeg", "Configuración de Tienda360 con lector de códigos"],
  ["/clientes/WhatsApp%20Image%202026-09-16%20at%2012.11.24.jpeg", "Instalación de Tienda360 en una ferretería"],
] as const;

export function SocialProof() {
  return <><section className="lp-section lp-reviews"><div className="lp-wrap"><div className="lp-heading lp-center"><p className="lp-kicker">Reseñas de Google</p><h2>Lo dicen comerciantes que ya lo usan</h2><p>Experiencias reales de comercios que trabajan con Tienda360.</p></div><div className="lp-review-grid" aria-label="Reseñas de clientes">{reviews.map(([quote, name]) => <blockquote key={name}><div aria-label="5 estrellas">★★★★★</div><p>“{quote}”</p><footer><strong>{name}</strong><span>Reseña en Google · 5 estrellas</span></footer></blockquote>)}</div><p className="lp-review-hint">Deslizá para ver más reseñas →</p></div></section><section className="lp-section" id="nosotros"><div className="lp-wrap lp-about-grid"><div><p className="lp-kicker">Sobre nosotros</p><h2>Somos un equipo que te acompaña, no solo un software</h2><p>Tienda360 es un punto de venta hecho para comercios argentinos. Vamos a tu comercio, instalamos el sistema y te enseñamos a usarlo mientras trabajás.</p><p className="lp-placeholder">[Completar: quiénes son, desde cuándo trabajan, en qué ciudad y a cuántos comercios ya acompañaron.]</p><ul className="lp-check-list"><li>Instalación y configuración en tu lugar de trabajo</li><li>Capacitación incluida con tu equipo</li><li>Adaptaciones según tu rubro</li><li>Soporte técnico por WhatsApp de lunes a viernes de 9 a 18 h</li></ul></div><div className="lp-photo-grid">{photos.map(([src, alt], index) => <figure key={src} className={index === 0 ? "lp-photo-featured" : ""}><Image src={src} alt={alt} fill sizes={index === 0 ? "(max-width: 800px) 100vw, 32vw" : "(max-width: 800px) 50vw, 16vw"} /></figure>)}</div></div></section></>;
}
