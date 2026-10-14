const FAQS = [
  ["¿Funciona en el celular?", "Tienda360 se instala y utiliza en una PC con Windows 10 u 11."],
  ["¿Tengo que cargar todos mis productos?", "No. Contás con productos precargados y Carga Rápida para completar lo mínimo durante una venta."],
  ["¿Qué incluye la compra?", "Incluye la licencia definitiva, instalación y configuración, soporte remoto y actualizaciones."],
  ["¿Hay que pagar todos los meses?", "No. La licencia se compra una sola vez y no tiene abono mensual."],
  ["¿Incluye ARCA, Mercado Pago y hardware?", "Incluye facturación electrónica ARCA, cobros QR y compatibilidad con lectores y balanzas. El hardware se vende por separado."],
  ["¿Me ayudan a instalarlo?", "Sí. La instalación y configuración están incluidas, y tenés soporte por WhatsApp de 10 a 18 h."],
] as const;
export function LandingFAQ() { return <section className="t360-section" id="preguntas"><div className="t360-wrap t360-faq"><div><p className="t360-kicker">Antes de avanzar</p><h2>Preguntas frecuentes</h2><p>Lo importante para decidir si Tienda360 encaja en tu comercio.</p></div><div>{FAQS.map(([q,a]) => <details key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></div></section> }

