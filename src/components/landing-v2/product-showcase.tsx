import Image from "next/image";

const screens = [
  {
    src: "/banner/Tienda360_ Tu Comercio Bajo Control.png",
    title: "Todo tu comercio en un solo lugar",
    description: "Ventas, stock, facturación y reportes en una aplicación segura para Windows.",
  },
  {
    src: "/banner/Tienda360_ Pantalla de ventas integral.png",
    title: "Ventas rápidas",
    description: "Escaneá productos, elegí el medio de pago y emití el comprobante desde una sola pantalla.",
  },
  {
    src: "/banner/Tienda360_ Productos bajo control.png",
    title: "Productos bajo control",
    description: "Cargá, editá e importá tus productos con precios, categorías, fotos y stock.",
  },
  {
    src: "/banner/Panel de Inventario Tienda360.png",
    title: "Stock en orden",
    description: "Revisá existencias, productos por reponer y alertas importantes en tiempo real.",
  },
  {
    src: "/banner/Panel de Reportes Tienda360.png",
    title: "Reportes claros",
    description: "Conocé tus ventas, costos y ganancias para tomar mejores decisiones.",
  },
  {
    src: "/banner/Dashboard Tienda360_ Tu Comercio en Control.png",
    title: "Tu negocio de un vistazo",
    description: "Consultá los indicadores más importantes y el estado de tu caja desde el panel principal.",
  },
] as const;

export function ProductShowcase() {
  return (
    <section className="lp-section lp-showcase" id="sistema">
      <div className="lp-wrap">
        <div className="lp-heading lp-center">
          <p className="lp-kicker">Conocé el sistema por dentro</p>
          <h2>Mirá cómo funciona Tienda360</h2>
          <p>Todo lo que necesitás para vender y ordenar tu comercio, en pantallas simples y claras.</p>
        </div>
        <div className="lp-showcase-grid">
          {screens.map((screen) => (
            <article className="lp-showcase-card" key={screen.src}>
              <div className="lp-showcase-image">
                <Image
                  src={screen.src}
                  alt={`${screen.title} en Tienda360`}
                  fill
                  sizes="(max-width: 700px) calc(100vw - 28px), (max-width: 980px) calc(50vw - 30px), 560px"
                />
              </div>
              <div className="lp-showcase-copy">
                <h3>{screen.title}</h3>
                <p>{screen.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
