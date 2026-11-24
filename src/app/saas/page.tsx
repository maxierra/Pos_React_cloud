import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  Boxes,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Cloud,
  Crown,
  Gift,
  Headphones,
  MonitorSmartphone,
  ReceiptText,
  Rocket,
  ScanBarcode,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";

import { getAllPlansConfig } from "@/app/app/subscription/actions";
import { MobileSalesVideo } from "./mobile-sales-video";
import "./saas.css";
import "./saas-mobile-showcase.css";
import "./saas-desktop-showcase.css";
import "./saas-smart-load.css";
import "./saas-reviews.css";
import "./saas-benefit-poster.css";

export const metadata: Metadata = {
  title: "Tienda360 Online — Vendé y controlá tu negocio desde cualquier lugar",
  description:
    "Sistema de punto de venta online para comercios argentinos. Ventas, stock, caja, clientes y reportes desde cualquier dispositivo. Probalo gratis.",
  alternates: { canonical: "/saas" },
  openGraph: {
    title: "Tienda360 Online — Tu negocio, siempre bajo control",
    description: "Probá gratis el sistema online de ventas, stock y caja para comercios.",
    url: "/saas",
    type: "website",
    locale: "es_AR",
    images: [
      {
        url: "/banner/Tienda360_ Tu Comercio Bajo Control.png",
        width: 1536,
        height: 1024,
        alt: "Panel online de Tienda360",
      },
    ],
  },
};

const features = [
  {
    icon: ScanBarcode,
    title: "Vendé sin frenar la fila",
    text: "Buscá o escaneá productos, combiná medios de pago y dejá ventas en espera.",
  },
  {
    icon: Boxes,
    title: "Stock que se actualiza solo",
    text: "Cada venta descuenta existencias y te ayuda a detectar qué necesitás reponer.",
  },
  {
    icon: CircleDollarSign,
    title: "Caja clara, todos los días",
    text: "Controlá ingresos, egresos, medios de pago y cierres sin planillas paralelas.",
  },
  {
    icon: ReceiptText,
    title: "Facturación ARCA integrada",
    text: "Emití comprobantes electrónicos desde el mismo flujo en el que registrás la venta.",
  },
  {
    icon: Users,
    title: "Clientes y cuentas corrientes",
    text: "Guardá el historial de cada cliente y seguí saldos, pagos y movimientos.",
  },
  {
    icon: BarChart3,
    title: "Números que podés entender",
    text: "Consultá ventas, costos y productos destacados para decidir con información real.",
  },
] as const;

const mobileScreens = [
  {
    src: "/images/saas-mobile/punto-de-venta.png",
    eyebrow: "Punto de venta",
    title: "Cobrá desde el mostrador",
    text: "Armá la venta, elegí el medio de pago y controlá el total desde el celular.",
  },
  {
    src: "/images/saas-mobile/gestion.png",
    eyebrow: "Gestión completa",
    title: "Todo el negocio en tu mano",
    text: "Entrá a inventario, clientes, proveedores, facturación y reportes sin volver a la computadora.",
  },
  {
    src: "/images/saas-mobile/reportes.png",
    eyebrow: "Resultados",
    title: "Mirá cómo viene el día",
    text: "Consultá ventas, costos y ganancias para decidir estés donde estés.",
  },
] as const;

const faqs = [
  [
    "¿Tengo que instalar un programa?",
    "No. Tienda360 Online funciona desde el navegador en computadora, tablet o celular.",
  ],
  [
    "¿Qué pasa cuando termina la prueba?",
    "Elegís el plan que más te conviene para seguir usando el sistema. No se realiza ningún cobro automático durante la prueba.",
  ],
  [
    "¿Puedo usar lector de códigos de barras?",
    "Sí. Podés trabajar con lectores de códigos y también buscar o cargar productos manualmente.",
  ],
  [
    "¿Sirve para más de una persona?",
    "Sí. Podés sumar usuarios y organizar el trabajo de tu equipo dentro del mismo negocio.",
  ],
  [
    "¿Me ayudan a empezar?",
    "Sí. Contás con acompañamiento y soporte para configurar el comercio y resolver dudas.",
  ],
] as const;

const googleReviews = [
  {
    name: "Marcos Andrés Segura",
    time: "Reseña reciente",
    quote: "Es un sistema muy completo, fácil e intuitivo. Permite controlar ventas, ingresos, gastos y stock, y sus reportes ayudan a tomar mejores decisiones. También destaco la excelente atención y el soporte de Maxi.",
    featured: true,
  },
  {
    name: "Jessica López",
    time: "Reseña reciente",
    quote: "Excelente atención y acompañamiento. Tienda360 es muy completa, de gran utilidad y fácil de manejar.",
  },
  {
    name: "Gonzalo Tavela",
    time: "Hace 1 semana",
    quote: "Excelente experiencia con la instalación. Maxi fue muy predispuesto, amable y claro en cada paso. El sistema funciona de diez.",
  },
  {
    name: "José Vega",
    time: "Hace 2 semanas",
    quote: "Se merece un aplauso el sistema y, sobre todo, la predisposición para resolver cualquier inconveniente y adaptarlo a nuestros requerimientos.",
  },
  {
    name: "Lorena Altamirano",
    time: "Hace 3 semanas",
    quote: "Muy recomendable. El sistema tiene todo lo que necesita un negocio y ante cada duda recibí respuesta en el momento.",
  },
  {
    name: "Gabriela Dobler",
    time: "Hace 3 semanas",
    quote: "Excelente asistencia para aprender a manejar el sistema. Es fácil de usar. Gracias, Tienda360.",
  },
] as const;

function money(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function SaasLandingPage() {
  const plans = await getAllPlansConfig();
  const trialDays = Number.parseInt(process.env.SAAS_TRIAL_DAYS ?? process.env.NEXT_PUBLIC_TRIAL_DAYS ?? "7", 10) || 7;
  const checkoutHref = (plan: "monthly" | "semester" | "annual") =>
    `/auth/register?from=saas&plan=${plan}`;

  return (
    <div className="saas-page">
      <header className="saas-header">
        <div className="saas-wrap saas-nav">
          <Link className="saas-brand" href="/saas" aria-label="Tienda360 Online, inicio">
            <span className="saas-brand-mark"><Store aria-hidden="true" /></span>
            <span>Tienda360 <b>Online</b></span>
          </Link>
          <nav aria-label="Navegación principal">
            <a href="#funciones">Funciones</a>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#precio">Planes</a>
            <a href="#preguntas">Preguntas</a>
          </nav>
          <div className="saas-nav-actions">
            <Link className="saas-login" href="/auth/login?from=saas">Ingresar</Link>
            <Link className="saas-button saas-button-small" href="/auth/register?from=saas">Crear cuenta</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="saas-hero-v2">
          <div className="saas-hero-v2-orb" aria-hidden="true" />
          <div className="saas-wrap saas-hero-v2-main">
            <div className="saas-hero-v2-copy">
              <p className="saas-hero-v2-eyebrow"><span /> Sistema online para comercios argentinos</p>
              <h1>Vendé tranquilo.<br /><em>Tu negocio<br />se ordena solo.</em></h1>
              <p className="saas-hero-v2-lead">Registrá ventas, controlá el stock y mirá cómo viene tu negocio desde cualquier dispositivo. Todo en un solo lugar, sin instalaciones ni planillas.</p>
              <Link className="saas-hero-offer" href="/auth/register?from=saas">
                <Gift aria-hidden="true" /><span>Probá Tienda360<br /><strong>GRATIS</strong> por <b>{trialDays} DÍAS</b></span><ChevronRight aria-hidden="true" />
              </Link>
              <ul className="saas-hero-v2-trust"><li><Check /> Sin tarjeta</li><li><Check /> Acceso completo</li><li><Check /> Activación inmediata</li></ul>
            </div>
            <div className="saas-hero-device" aria-label="Panel de Tienda360 Online en una notebook">
              <div className="saas-hero-laptop"><div className="saas-hero-laptop-screen"><Image src="/images/saas-desktop/punto-de-venta.png" alt="Panel de Tienda360 Online" fill priority sizes="(max-width: 900px) 92vw, 52vw" /></div><div className="saas-hero-laptop-base" /></div>
              <div className="saas-hero-calendar" aria-hidden="true"><i /><i /><strong>{trialDays}</strong><span>DÍAS</span><b>GRATIS</b></div>
            </div>
          </div>
          <div className="saas-wrap saas-hero-v2-benefits" aria-label="Beneficios principales">
            <span><Cloud aria-hidden="true" /><i><strong>100% online</strong><small>Usalo desde donde estés</small></i></span>
            <span><MonitorSmartphone aria-hidden="true" /><i><strong>PC, tablet y celular</strong><small>Accedé en todos tus dispositivos</small></i></span>
            <span><ShieldCheck aria-hidden="true" /><i><strong>Información protegida</strong><small>Tus datos siempre seguros</small></i></span>
            <span><Headphones aria-hidden="true" /><i><strong>Acompañamiento real</strong><small>Soporte de lunes a viernes</small></i></span>
          </div>
        </section>

        <section className="saas-section saas-desktop-showcase" id="escritorio">
          <div className="saas-desktop-orb saas-desktop-orb-one" aria-hidden="true" />
          <div className="saas-desktop-orb saas-desktop-orb-two" aria-hidden="true" />
          <div className="saas-wrap">
            <div className="saas-section-heading saas-desktop-heading">
              <p className="saas-eyebrow saas-eyebrow-light"><span /> Potencia para el mostrador</p>
              <h2>Una pantalla pensada para vender de verdad.</h2>
              <p>Productos, carrito, stock y medios de pago visibles al mismo tiempo. Menos pasos para vos y menos espera para tus clientes.</p>
            </div>
            <div className="saas-desktop-composition">
              <div className="saas-monitor">
                <div className="saas-monitor-camera" aria-hidden="true" />
                <div className="saas-monitor-screen">
                  <Image
                    src="/images/saas-desktop/punto-de-venta.png"
                    alt="Pantalla completa del punto de venta Tienda360 Online"
                    fill
                    sizes="(max-width: 900px) 96vw, 1120px"
                  />
                </div>
                <div className="saas-monitor-chin"><span>Tienda360</span></div>
                <div className="saas-monitor-stand" aria-hidden="true"><i /></div>
              </div>
              <div className="saas-checkout-preview">
                <div className="saas-checkout-label"><ReceiptText aria-hidden="true" /><span><small>Último paso</small><strong>Confirmá y cobrá</strong></span></div>
                <div className="saas-checkout-image">
                  <Image
                    src="/images/saas-desktop/confirmar-cobro.png"
                    alt="Confirmación de cobro y vista previa del ticket"
                    fill
                    sizes="(max-width: 700px) 52vw, 310px"
                  />
                </div>
              </div>
              <div className="saas-desktop-badge saas-desktop-badge-fast"><ScanBarcode aria-hidden="true" /><span><small>Venta ágil</small><strong>Todo en una pantalla</strong></span></div>
              <div className="saas-desktop-badge saas-desktop-badge-arca"><ShieldCheck aria-hidden="true" /><span><small>Facturación</small><strong>ARCA integrada</strong></span></div>
            </div>
            <div className="saas-desktop-points">
              <span><Check aria-hidden="true" /> Atajos de teclado</span>
              <span><Check aria-hidden="true" /> Lector de códigos</span>
              <span><Check aria-hidden="true" /> Cobros combinados</span>
              <span><Check aria-hidden="true" /> Ticket y factura</span>
            </div>
          </div>
        </section>

        <section className="saas-section saas-benefit-poster" id="funciones">
          <div className="saas-wrap">
            <div className="saas-benefit-poster-scroll">
              <div className="saas-benefit-poster-frame">
                <Image
                  src="/images/saas-benefits/todo-conectado.png"
                  alt="Menos tareas sueltas, más control del negocio: ventas, stock, caja, facturación ARCA, clientes y reportes conectados en Tienda360"
                  fill
                  sizes="(max-width: 700px) 760px, (max-width: 1200px) 94vw, 1180px"
                />
              </div>
            </div>
            <div className="saas-benefit-accessible">
              <h2>Menos tareas sueltas. Más control del negocio.</h2>
              <p>Cada venta actualiza la información que necesitás para seguir trabajando, en tiempo real.</p>
              {features.map(({ title, text }) => (
                <article key={title}>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="saas-section saas-smart-load" id="carga-inteligente">
          <div className="saas-wrap saas-smart-load-grid">
            <div className="saas-smart-copy">
              <p className="saas-eyebrow saas-eyebrow-light"><span /> Carga inteligente</p>
              <h2>Escaneá el código.<br />Tienda360 hace el resto.</h2>
              <p className="saas-smart-lead">El sistema busca el producto en una base con más de <strong>350.000 productos precargados</strong> y completa la información para que no empieces desde cero.</p>
              <div className="saas-smart-number"><strong>+350.000</strong><span>productos listos<br />para encontrar</span></div>
              <ul className="saas-smart-list">
                <li><Check aria-hidden="true" /><span><strong>Nombre y categoría</strong><small>Reconoce el producto usando su código de barras.</small></span></li>
                <li><Check aria-hidden="true" /><span><strong>Precio sugerido</strong><small>Te da una referencia para revisar y continuar.</small></span></li>
                <li><Check aria-hidden="true" /><span><strong>Foto del producto</strong><small>Completá tu catálogo con una imagen clara.</small></span></li>
              </ul>
              <Link className="saas-button saas-button-light" href="/auth/register?from=saas">Probar la carga inteligente</Link>
            </div>

            <div className="saas-smart-stage">
              <div className="saas-smart-window">
                <div className="saas-smart-window-top"><i /><i /><i /><span>Nuevo producto · Tienda360 Online</span></div>
                <div className="saas-smart-screenshot">
                  <Image
                    src="/images/saas-smart-load/carga-inteligente.png"
                    alt="Tienda360 encuentra automáticamente un producto por su código de barras"
                    fill
                    sizes="(max-width: 900px) 94vw, 690px"
                  />
                  <div className="saas-smart-product-photo" aria-label="Foto sugerida del producto encontrado">
                    <Image
                      src="/images/saas-smart-load/nescafe-dolca-170g.png"
                      alt="Paquete de café Nescafé Dolca Suave de 170 gramos"
                      fill
                      sizes="150px"
                    />
                  </div>
                </div>
              </div>
              <div className="saas-smart-scan-line" aria-hidden="true" />
              <div className="saas-smart-found"><span><Check aria-hidden="true" /></span><div><small>Código reconocido</small><strong>¡Producto encontrado!</strong></div></div>
              <div className="saas-smart-barcode"><ScanBarcode aria-hidden="true" /><span><small>Base inteligente</small><strong>8445291082137</strong></span></div>
            </div>
          </div>
        </section>

        <section className="saas-section saas-mobile-showcase" id="celular">
          <div className="saas-wrap">
            <div className="saas-section-heading saas-mobile-heading">
              <p className="saas-eyebrow"><span /> También en tu celular</p>
              <h2>Tu negocio va con vos.</h2>
              <p>Vendé, administrá y consultá resultados desde una experiencia diseñada para pantallas móviles.</p>
            </div>
            <div className="saas-phone-grid">
              {mobileScreens.map((screen, index) => (
                <article className={index === 1 ? "saas-phone-card saas-phone-card-featured" : "saas-phone-card"} key={screen.src}>
                  <div className="saas-phone-copy">
                    <small>{screen.eyebrow}</small>
                    <h3>{screen.title}</h3>
                    <p>{screen.text}</p>
                  </div>
                  <div className="saas-phone" aria-label={`${screen.title} en Tienda360 Online`}>
                    <div className="saas-phone-speaker" aria-hidden="true"><i /><span /></div>
                    <div className="saas-phone-screen">
                      <Image
                        src={screen.src}
                        alt={`${screen.title} en la versión móvil de Tienda360 Online`}
                        fill
                        sizes="(max-width: 700px) 74vw, 300px"
                      />
                    </div>
                    <span className="saas-phone-home" aria-hidden="true" />
                  </div>
                </article>
              ))}
            </div>
            <div className="saas-mobile-video-band">
              <div className="saas-mobile-video-copy">
                <p className="saas-eyebrow"><span /> Miralo en acción</p>
                <h3>Una venta completa, desde el celular.</h3>
                <p>En este video corto vas a ver cómo buscar productos, armar el carrito y cobrar sin depender de una computadora.</p>
                <ul>
                  <li><Check aria-hidden="true" /> Buscá o escaneá el producto</li>
                  <li><Check aria-hidden="true" /> Elegí el medio de pago</li>
                  <li><Check aria-hidden="true" /> Registrá la venta al instante</li>
                </ul>
                <a className="saas-video-youtube-link" href="https://youtube.com/shorts/Kh0aBROV6Hc?feature=share" target="_blank" rel="noopener noreferrer">También podés verlo en YouTube</a>
              </div>
              <MobileSalesVideo />
            </div>
            <div className="saas-mobile-cta">
              <p><MonitorSmartphone aria-hidden="true" /> Usalo desde el dispositivo que ya tenés.</p>
              <Link className="saas-button saas-button-primary" href="/auth/register?from=saas">Probarlo en mi celular</Link>
            </div>
          </div>
        </section>

        <section className="saas-section saas-story" id="como-funciona">
          <div className="saas-wrap saas-story-grid">
            <div className="saas-story-image">
              <Image
                src="/banner/Tienda360_ Pantalla de ventas integral.png"
                alt="Pantalla de punto de venta de Tienda360 Online"
                fill
                sizes="(max-width: 900px) 94vw, 52vw"
              />
            </div>
            <div className="saas-story-copy">
              <p className="saas-eyebrow"><span /> Empezá sin complicarte</p>
              <h2>De crear tu cuenta a registrar tu primera venta.</h2>
              <ol>
                <li><b>1</b><span><strong>Creá tu cuenta</strong><small>Solo necesitás un email y una contraseña.</small></span></li>
                <li><b>2</b><span><strong>Configurá tu comercio</strong><small>Te guiamos para dejar listo lo esencial.</small></span></li>
                <li><b>3</b><span><strong>Vendé y seguí creciendo</strong><small>Probá todas las funciones durante {trialDays} días.</small></span></li>
              </ol>
              <Link className="saas-button saas-button-dark" href="/auth/register?from=saas">Empezar ahora</Link>
            </div>
          </div>
        </section>

        <section className="saas-section saas-plans" id="precio">
          <div className="saas-wrap">
            <div className="saas-plans-hero">
              <div className="saas-plans-copy"><p className="saas-plans-label">Planes Tienda360</p><h2>Elegí el plan ideal<br />para <em>tu comercio</em></h2><p>Probá todas las funciones sin costo, y luego continuá con el plan que mejor se adapte a tu negocio.</p></div>
              <div className="saas-plans-visual" aria-hidden="true"><div className="saas-plans-monitor"><Image src="/images/saas-desktop/punto-de-venta.png" alt="" fill sizes="480px" /></div><div className="saas-plans-stand" /><div className="saas-plans-plant"><i /><i /><i /><b /></div></div>
            </div>
            <div className="saas-plans-benefits"><span><Rocket /> Activación inmediata</span><span><Cloud /> Todas las funciones</span><span><ShieldCheck /> Seguro y confiable</span><span><Headphones /> Soporte en español</span></div>
            <div className="saas-plans-grid">
              <article className="saas-plan-card saas-plan-free"><div className="saas-plan-top"><span><Rocket /></span><b>Prueba gratis</b></div><h3>Plan Gratis</h3><p>Probá Tienda360 sin compromiso.</p><div className="saas-plan-trial"><CalendarDays /><strong>{trialDays} días</strong><small>con todas las funciones</small></div><ul><li><Check /> Ventas y caja</li><li><Check /> Productos y stock</li><li><Check /> Facturación ARCA</li><li><Check /> Reportes y estadísticas</li><li><Check /> Soporte durante la prueba</li></ul><Link href="/auth/register?from=saas">▶&nbsp; Probar gratis por {trialDays} días</Link></article>
              <article className="saas-plan-card"><div className="saas-plan-top"><span><CalendarDays /></span></div><h3>Plan Mensual</h3><p>Ideal para comenzar, sin permanencia.</p><div className="saas-plan-price"><strong>{money(plans.monthly.amount)}</strong><small>/ mes</small></div><ul><li><Check /> Todas las funciones</li><li><Check /> Actualizaciones incluidas</li><li><Check /> Soporte técnico</li><li><Check /> Sin contrato</li></ul><a href={checkoutHref("monthly")}>Elegir Plan Mensual</a></article>
              <article className="saas-plan-card saas-plan-featured"><div className="saas-plan-top"><span><Crown /></span><b>Más elegido</b></div><h3>Plan Semestral</h3><p>Ahorrá y pagá menos por mes.</p><div className="saas-plan-price"><strong>{money(plans.semester.amount)}</strong><small>/ 6 meses</small></div><div className="saas-plan-equivalent">Equivale a {money(plans.semester.amount / 6)} por mes</div><ul><li><Check /> Todas las funciones</li><li><Check /> Actualizaciones incluidas</li><li><Check /> Soporte prioritario</li><li><Check /> Mayor ahorro</li></ul><a href={checkoutHref("semester")}>Elegir Plan Semestral</a></article>
              <article className="saas-plan-card saas-plan-annual"><div className="saas-plan-top"><span><ShieldCheck /></span></div><h3>Plan Anual</h3><p>El mejor valor del año.</p><div className="saas-plan-price"><strong>{money(plans.annual.amount)}</strong><small>/ año</small></div><div className="saas-plan-equivalent">Equivale a {money(plans.annual.amount / 12)} por mes</div><ul><li><Check /> Todas las funciones</li><li><Check /> Actualizaciones incluidas</li><li><Check /> Soporte prioritario</li><li><Check /> Máximo ahorro</li></ul><a href={checkoutHref("annual")}>Elegir Plan Anual</a></article>
            </div>
            <div className="saas-plans-footer"><span><Rocket /><b>Todas las funciones</b><small>desde el primer día</small></span><span><Cloud /><b>Actualizaciones constantes</b><small>sin costo adicional</small></span><span><Headphones /><b>Soporte técnico</b><small>acompañamiento real</small></span><span><ShieldCheck /><b>Tus datos seguros</b><small>con respaldo en la nube</small></span></div>
          </div>
        </section>

        <section className="saas-section saas-reviews" id="opiniones">
          <div className="saas-wrap">
            <div className="saas-reviews-heading">
              <div>
                <p className="saas-eyebrow"><span /> Opiniones reales en Google</p>
                <h2>Comerciantes que ya trabajan con <em>Tienda360.</em></h2>
                <p className="saas-reviews-lead">Conocé la experiencia de quienes ya gestionan su negocio con nuestro sistema.</p>
              </div>
              <div className="saas-google-score" aria-label="Reseñas de cinco estrellas en Google">
                <span className="saas-google-g">G</span>
                <span><strong>5 estrellas</strong><small>Experiencias compartidas en Google</small></span>
                <b aria-label="5 estrellas">★★★★★</b>
              </div>
            </div>
            <div className="saas-review-grid">
              {googleReviews.map((review) => (
                <blockquote className={"featured" in review && review.featured ? "saas-review-card saas-review-featured" : "saas-review-card"} key={review.name}>
                  <div className="saas-review-top">
                    <span className="saas-review-avatar" aria-hidden="true">{review.name.charAt(0)}</span>
                    <span><strong>{review.name}</strong><small>{review.time}</small></span>
                    <b aria-label="5 estrellas">★★★★★</b>
                  </div>
                  <p>“{review.quote}”</p>
                  <footer><span className="saas-google-mini">G</span> Opinión de Google · 5 estrellas</footer>
                </blockquote>
              ))}
              <div className="saas-review-cta">
                <span><MonitorSmartphone aria-hidden="true" /></span>
                <p>Sumate a los comercios<br />que ya confían en <em>Tienda360</em></p>
                <Link href="/auth/register?from=saas" aria-label="Crear una cuenta gratis en Tienda360"><ChevronRight aria-hidden="true" /></Link>
              </div>
            </div>
            <p className="saas-review-note">Reseñas resumidas para facilitar la lectura, conservando el sentido de las opiniones originales.</p>
          </div>
        </section>

        <section className="saas-section saas-faq" id="preguntas">
          <div className="saas-wrap saas-faq-grid">
            <div>
              <p className="saas-eyebrow"><span /> Antes de empezar</p>
              <h2>Preguntas frecuentes</h2>
              <p>Si te queda alguna duda, podés crear tu cuenta y pedir ayuda durante la configuración.</p>
            </div>
            <div>
              {faqs.map(([question, answer], index) => (
                <details key={question} open={index === 0}>
                  <summary>{question}<span>+</span></summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="saas-final">
          <div className="saas-wrap">
            <span className="saas-final-icon"><Store aria-hidden="true" /></span>
            <h2>Tu próxima venta puede empezar acá.</h2>
            <p>Creá tu comercio en Tienda360 Online y probalo durante {trialDays} días.</p>
            <Link className="saas-button saas-button-light" href="/auth/register?from=saas">Crear mi cuenta gratis</Link>
          </div>
        </section>
      </main>

      <footer className="saas-footer">
        <div className="saas-wrap">
          <span><strong>Tienda360</strong> Online</span>
          <span>© 2026 · Sistema de gestión para comercios argentinos</span>
          <Link href="/auth/login?from=saas">Ya tengo una cuenta</Link>
        </div>
      </footer>
    </div>
  );
}
