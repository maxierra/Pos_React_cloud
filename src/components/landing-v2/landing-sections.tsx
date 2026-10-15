import { landingConfig, whatsappUrl } from "@/lib/landing-config";
import { SavingsCalculator } from "./savings-calculator";
import { TrackedLink } from "./tracked-link";
import { MercadoLibreMark } from "./store-marks";

const benefits = [
  ["01", "Vendés más rápido", "Escaneás el código de barras y el producto se agrega solo. También podés dejar una venta en espera, seguir atendiendo a otra persona y retomarla más tarde."],
  ["02", "Cargás tus productos como prefieras", "Tenés 350.000 productos precargados y Carga Rápida. Si ya llevás tus productos en Excel, descargás nuestra plantilla, la completás con tus datos y la importás al sistema."],
  ["03", "El stock se ordena solo", "Cada venta descuenta del inventario. Sabés qué reponer antes de quedarte sin nada."],
  ["04", "La caja cierra clara", "Ingresos, egresos y movimientos del día en un mismo lugar, con reportes de ventas y costos."],
  ["05", "Facturás en regla", "Facturación electrónica ARCA integrada y cobros con QR desde el mismo sistema."],
  ["06", "Funciona con tu equipo", "Compatible con lectores de códigos y balanzas habituales. El hardware se compra por separado."],
] as const;

export function BenefitsSection() {
  return <section className="lp-section" id="beneficios"><div className="lp-wrap"><div className="lp-heading"><p className="lp-kicker">Menos vueltas detrás del mostrador</p><h2>Lo que cambia en tu día a día</h2></div><div className="lp-benefit-grid">{benefits.map(([number, title, body]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{body}</p></article>)}</div></div></section>;
}

export function StepsSection() {
  const steps = [["Mirás una demo", "Te mostramos el sistema con ejemplos de tu rubro y resolvemos tus dudas por WhatsApp."], ["Lo instalamos y configuramos", "Dejamos Tienda360 funcionando en tu PC, con tu lector si ya lo tenés."], ["Te capacitamos y vendés", "Te enseñamos a usarlo con tu comercio en marcha y seguimos disponibles si algo se complica."]] as const;
  return <section className="lp-section lp-dark" id="como"><div className="lp-wrap"><div className="lp-heading"><p className="lp-kicker">Simple desde el primer día</p><h2>Cómo lo empezás a usar</h2><p>No tenés que instalar nada por tu cuenta.</p></div><ol className="lp-steps">{steps.map(([title, body], index) => <li key={title}><span>{index + 1}</span><h3>{title}</h3><p>{body}</p></li>)}</ol></div></section>;
}

export function SupportSection() {
  return <section className="lp-section lp-support"><div className="lp-wrap lp-split"><div><p className="lp-kicker">Personas del otro lado</p><h2>¿Nunca usaste un sistema así? Te acompañamos</h2><p className="lp-lead-small">Si no tenés experiencia o te da miedo que sea difícil, es normal. No tenés que aprenderlo solo ni de un día para el otro.</p><TrackedLink className="lp-button lp-button-outline" href={whatsappUrl("Hola, necesito ayuda para empezar con Tienda360.")} target="_blank" rel="noopener noreferrer" event="whatsapp_clicked" location="support">Hablar con soporte</TrackedLink></div><ul className="lp-support-list"><li>Soporte técnico por WhatsApp de lunes a viernes de 9 a 18 h</li><li>Te ayudamos de forma remota si algo no te sale</li><li>Instalamos, configuramos y te capacitamos con tu comercio en marcha</li><li>Empezás con lo mínimo: productos precargados y Carga Rápida</li><li>Videos tutoriales paso a paso para repasar cuando quieras</li></ul></div></section>;
}

export function PricingSection() {
  return <section className="lp-section lp-pricing" id="precio"><div className="lp-wrap lp-price-grid"><div><p className="lp-kicker">Licencia definitiva</p><h2>Un pago, sin sorpresas todos los meses</h2><SavingsCalculator /></div><article className="lp-price-card"><p>Tienda360 para Windows</p><div><strong>$50.000</strong><span>pago único</span></div><ul><li>Licencia definitiva</li><li>Instalación y configuración</li><li>Capacitación para empezar</li><li>Soporte remoto y actualizaciones</li></ul><TrackedLink className="lp-button lp-button-mercadolibre" href={landingConfig.purchaseUrl("price")} target="_blank" rel="noopener noreferrer" event="mercadolibre_clicked" location="price"><MercadoLibreMark /><span><small>Compra directa en</small>Mercado Libre</span></TrackedLink><small>Compra protegida por Mercado Libre.</small></article></div></section>;
}
