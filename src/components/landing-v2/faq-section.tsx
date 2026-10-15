const faqs = [
  ["¿Funciona en el celular?", "Se instala y se usa en una PC con Windows 10 u 11."],
  ["¿Tengo que cargar todos mis productos?", "No. Hay productos precargados y Carga Rápida para completar lo mínimo durante una venta."],
  ["¿Qué incluye la compra?", "Licencia definitiva, instalación y configuración, soporte remoto y actualizaciones."],
  ["¿Incluye ARCA, cobros QR y hardware?", "Incluye facturación electrónica ARCA, cobros QR y compatibilidad con lectores y balanzas. El hardware se vende por separado."],
  ["¿Y si no sé nada de computación?", "No hace falta. Te instalamos y configuramos todo, te capacitamos y tenés soporte por WhatsApp de 10 a 18 h para acompañarte cuando lo necesites."],
  ["¿Para cuántas PC o cajas sirve la licencia?", "Cada licencia de Tienda360 es válida para una sola PC o caja."],
  ["¿Qué pasa si no me convence?", "No pasa nada. Podés descargar y probar gratis la versión demo. Si no te gusta o no se adapta a tu comercio, la desinstalás y listo."],
  ["¿Qué requisitos tiene mi PC?", "Necesitás una PC con Windows 10 u 11 de 64 bits y al menos 4 GB de memoria RAM. Para trabajar con mayor comodidad, recomendamos 8 GB de RAM."],
  ["¿Cómo se instala Tienda360?", "Es muy simple: desde Microsoft Store hacés un clic y la aplicación se descarga e instala automáticamente, sin configuraciones complicadas."],
] as const;

export function FaqSection() {
  return <section className="lp-section" id="preguntas"><div className="lp-wrap lp-faq-grid"><div><p className="lp-kicker">Antes de decidir</p><h2>Preguntas frecuentes</h2><p>Las dudas más comunes sobre Tienda360.</p></div><div>{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></div></section>;
}
