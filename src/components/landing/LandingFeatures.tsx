import {
  Boxes,
  CreditCard,
  LineChart,
  Mail,
  PackageSearch,
  ScanBarcode,
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Boxes,
    title: "Más de 280.000 productos precargados",
    desc: "Catálogo listo para arrancar: te ahorrás el trabajo pesado de cargar todo a mano y empezás antes.",
    glowTop: "from-lime-400/50 via-emerald-400/35 to-teal-600/25",
    glowBottom: "from-emerald-500/30 to-lime-400/15",
    iconBox:
      "border-lime-400/40 bg-gradient-to-br from-lime-500/30 to-emerald-700/25 text-lime-100 shadow-[0_0_28px_-5px_rgba(163,230,53,0.55)]",
    cardBorder: "border-lime-500/25 hover:border-lime-400/45",
    titleAccent: "group-hover:text-lime-100",
  },
  {
    icon: Mail,
    title: "Reportes y alertas por mail",
    desc: "Envío automático de informes y avisos a tu correo para seguir el negocio sin estar pegado al sistema.",
    glowTop: "from-rose-400/45 via-fuchsia-400/35 to-pink-600/25",
    glowBottom: "from-pink-500/30 to-rose-400/15",
    iconBox:
      "border-rose-400/40 bg-gradient-to-br from-rose-500/35 to-fuchsia-700/25 text-rose-100 shadow-[0_0_28px_-5px_rgba(244,114,182,0.5)]",
    cardBorder: "border-rose-500/25 hover:border-rose-400/45",
    titleAccent: "group-hover:text-rose-50",
  },
  {
    icon: ScanBarcode,
    title: "Código de barras y búsqueda",
    desc: "Agregá productos al vuelo y vendé sin fricción en el mostrador.",
    glowTop: "from-emerald-400/50 via-teal-400/35 to-cyan-600/25",
    glowBottom: "from-teal-500/30 to-emerald-400/15",
    iconBox:
      "border-emerald-400/40 bg-gradient-to-br from-emerald-500/35 to-teal-700/25 text-emerald-100 shadow-[0_0_28px_-5px_rgba(52,211,153,0.5)]",
    cardBorder: "border-emerald-500/25 hover:border-emerald-400/45",
    titleAccent: "group-hover:text-emerald-100",
  },
  {
    icon: PackageSearch,
    title: "Stock que se entiende",
    desc: "Precios, mínimos y estado en una grilla clara para tu equipo.",
    glowTop: "from-violet-400/50 via-purple-400/35 to-fuchsia-600/25",
    glowBottom: "from-fuchsia-500/30 to-violet-400/15",
    iconBox:
      "border-violet-400/40 bg-gradient-to-br from-violet-500/35 to-fuchsia-800/25 text-violet-100 shadow-[0_0_28px_-5px_rgba(167,139,250,0.55)]",
    cardBorder: "border-violet-500/25 hover:border-violet-400/45",
    titleAccent: "group-hover:text-violet-100",
  },
  {
    icon: CreditCard,
    title: "Caja y medios de pago",
    desc: "Efectivo, tarjeta o transferencia con ticket listo para imprimir.",
    glowTop: "from-sky-400/50 via-cyan-400/40 to-blue-600/25",
    glowBottom: "from-cyan-500/30 to-sky-400/15",
    iconBox:
      "border-sky-400/40 bg-gradient-to-br from-sky-500/35 to-cyan-700/25 text-sky-100 shadow-[0_0_28px_-5px_rgba(56,189,248,0.5)]",
    cardBorder: "border-sky-500/25 hover:border-sky-400/45",
    titleAccent: "group-hover:text-sky-100",
  },
  {
    icon: LineChart,
    title: "Ventas e informes",
    desc: "Seguí el día a día y tomá decisiones con números reales.",
    glowTop: "from-amber-400/50 via-orange-400/35 to-amber-700/25",
    glowBottom: "from-orange-500/30 to-amber-400/15",
    iconBox:
      "border-amber-400/40 bg-gradient-to-br from-amber-500/35 to-orange-800/25 text-amber-100 shadow-[0_0_28px_-5px_rgba(251,191,36,0.5)]",
    cardBorder: "border-amber-500/25 hover:border-amber-400/45",
    titleAccent: "group-hover:text-amber-100",
  },
];

export function LandingFeatures() {
  return (
    <section className="relative mt-16 md:mt-20">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
          Todo lo que necesitás para{" "}
          <span className="bg-gradient-to-r from-cyan-200 to-fuchsia-200 bg-clip-text text-transparent">
            vender con tranquilidad
          </span>
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-white/65 md:text-base">
          Herramientas pensadas para comercios que quieren velocidad en la caja y orden en el back office.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(
          ({ icon: Icon, title, desc, glowTop, glowBottom, iconBox, cardBorder, titleAccent }) => (
            <div
              key={title}
              className={cn(
                "group relative overflow-hidden rounded-2xl border bg-white/[0.05] p-5 shadow-lg shadow-black/20 backdrop-blur-sm transition duration-300",
                "hover:bg-white/[0.08] hover:shadow-xl",
                cardBorder
              )}
            >
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute -right-6 -top-10 h-40 w-40 rounded-full bg-gradient-to-br blur-3xl",
                  "opacity-90 transition duration-500 group-hover:scale-110 group-hover:opacity-100",
                  glowTop
                )}
              />
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-gradient-to-tr blur-3xl",
                  "opacity-70 transition duration-500 group-hover:scale-110 group-hover:opacity-90",
                  glowBottom
                )}
              />
              <div
                className={cn(
                  "relative flex size-12 items-center justify-center rounded-xl border backdrop-blur-sm transition group-hover:scale-[1.03]",
                  iconBox
                )}
              >
                <Icon className="size-5" strokeWidth={2} />
              </div>
              <h3
                className={cn(
                  "relative mt-4 text-base font-semibold tracking-tight text-white transition duration-300",
                  titleAccent
                )}
              >
                {title}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-white/70">{desc}</p>
            </div>
          )
        )}
      </div>
    </section>
  );
}
