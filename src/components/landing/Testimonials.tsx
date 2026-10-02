const REVIEWS = [
  {
    name: "Agustina Scoppa",
    text: "Excelente atención, antes y después de la compra. ¡El software es lo mejor que me pasó en mi negocio!",
    href: "https://www.google.com/maps/contrib/103363981779556010323/reviews?hl=es-419",
    highlight: "Lo mejor que me pasó en mi negocio",
  },
  {
    name: "Joel Santillan",
    text: "Muy buena atención y muy responsable el soporte cuando lo necesitás. Siempre disponible y el precio es súper accesible.",
    href: "https://www.google.com/maps/contrib/102846592631551816434/reviews?hl=es-419",
    highlight: "Soporte siempre disponible",
  },
  {
    name: "Omar Delgadillo",
    text: "Excelente programa, sencillo y fácil de usar.",
    href: "https://www.google.com/maps/contrib/110448661533684344552/reviews?hl=es-419",
    highlight: "Sencillo y fácil de usar",
  },
  {
    name: "Leonardo Ossa",
    text: "Buen servicio. Estamos iniciando un shop en una YPF y va muy bien; necesitamos algunas adaptaciones y los cambios se realizaron perfectamente.",
    href: "https://www.google.com/maps/contrib/109168656118045053524/reviews?hl=es-419",
    highlight: "Los cambios se realizaron perfectamente",
  },
] as const;

export function Testimonials() {
  return <section className="t360-section t360-testimonials" aria-labelledby="testimonials-title"><div className="t360-wrap"><div className="t360-heading"><p className="t360-kicker">Opiniones en Google</p><h2 id="testimonials-title">Comerciantes que ya trabajan con Tienda360</h2><p>Experiencias reales sobre el sistema, la atención y el acompañamiento.</p><div className="t360-google-rating" aria-label="Reseñas de cinco estrellas en Google"><span aria-hidden="true">G</span><b>5 estrellas</b><span className="t360-stars" aria-hidden="true">★★★★★</span><small>Reseñas verificables en Google</small></div></div><div className="t360-review-grid">{REVIEWS.map((review) => <article className="t360-review-card" key={review.name}><div className="t360-review-top"><span className="t360-stars" aria-label="5 de 5 estrellas">★★★★★</span><span className="t360-google-g" aria-hidden="true">G</span></div><p className="t360-review-highlight">“{review.highlight}”</p><blockquote>{review.text}</blockquote><a href={review.href} target="_blank" rel="noopener noreferrer" aria-label={`Ver la reseña de ${review.name} en Google`}><span className="t360-review-avatar" aria-hidden="true">{review.name.charAt(0)}</span><span><b>{review.name}</b><small>Reseña en Google ↗</small></span></a></article>)}</div></div></section>;
}
