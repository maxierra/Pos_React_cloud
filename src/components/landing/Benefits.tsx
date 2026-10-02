import Image from "next/image";
import { BarChart3, Boxes, Calculator, CreditCard, PackageSearch, QrCode, ScanBarcode, Zap } from "lucide-react";
const ITEMS = [
  [Zap, "Ventas rápidas", "Escaneá el código y agregá el producto automáticamente."], [PackageSearch, "350.000 productos", "Una base precargada para empezar más rápido."],
  [Boxes, "Stock", "El inventario se actualiza con tus ventas."], [Calculator, "Caja diaria", "Controlá ingresos, egresos y movimientos."],
  [CreditCard, "ARCA", "Facturación electrónica integrada."], [QrCode, "Cobros con QR", "Cobros digitales desde el sistema."],
  [BarChart3, "Reportes", "Consultá ventas, costos y resultados."], [ScanBarcode, "Lectores y balanzas", "Compatible con dispositivos habituales del comercio."],
] as const;
export function Benefits() { return <section className="t360-section t360-benefits-section" id="funciones" aria-labelledby="benefits-title"><div className="t360-wrap"><div className="t360-benefits-poster"><Image src="/Tienda360_%20M%C3%A1s%20control,%20menos%20tareas.png" alt="Tienda360 reúne ventas, productos, stock, caja, ARCA, cobros QR, reportes y dispositivos para tener más control con menos tareas" width={1536} height={1024} sizes="(max-width: 900px) 100vw, 1160px" /></div><div className="t360-visually-hidden"><p>Lo esencial, conectado</p><h2 id="benefits-title">Menos tareas sueltas. Más control.</h2><p>Las herramientas que usás todos los días, sin convertir tu comercio en una oficina.</p><div>{ITEMS.map(([Icon,title,copy]) => <article key={title}><Icon aria-hidden /><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div></div></div></section> }

