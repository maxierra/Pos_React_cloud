const FAQS = [
  ["¿Funciona en el celular?", "Tienda360 se instala en una PC con Windows. La landing y el proceso para coordinar una demo funcionan perfectamente desde el celular."],
  ["¿Tengo que cargar todos mis productos?", "No. Contás con productos precargados y Carga Rápida para completar lo mínimo durante una venta."],
  ["¿Qué incluye la prueba?", "El sistema completo durante 3 días: ventas, stock, caja, clientes y reportes, sin tarjeta."],
  ["¿Pierdo lo que cargué?", "No. Al activar la licencia conservás productos, ventas y configuraciones."],
  ["¿Incluye ARCA, Mercado Pago y hardware?", "Incluye facturación electrónica ARCA, cobros QR y compatibilidad con lectores y balanzas. En la demo validamos tu configuración concreta."],
  ["¿Me ayudan a instalarlo?", "Sí. Coordinamos instalación guiada y tenés soporte por WhatsApp de 10 a 18 h."],
] as const;
export function LandingFAQ() { return <section className="t360-section" id="preguntas"><div className="t360-wrap t360-faq"><div><p className="t360-kicker">Antes de avanzar</p><h2>Preguntas frecuentes</h2><p>Lo importante para decidir si Tienda360 encaja en tu comercio.</p></div><div>{FAQS.map(([q,a]) => <details key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></div></section> }

