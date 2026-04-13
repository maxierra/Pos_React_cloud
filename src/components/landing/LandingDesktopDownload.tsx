import { AlertTriangle, Download, KeyRound, PlayCircle, ShieldAlert } from "lucide-react";

const DOWNLOAD_URL =
  "https://github.com/maxierra/sistema-punto-venta-demo/releases/download/v1.0.0/POS_Flet_7dias.zip";
const LOOM_URL = "https://www.loom.com/share/de56ee8fc0bc4724a80ec739ae89da2e";

export function LandingDesktopDownload() {
  return (
    <section id="descarga" className="mt-16 scroll-mt-24 md:mt-24" aria-labelledby="descarga-heading">
      <div className="rounded-3xl border border-white/15 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-cyan-500/[0.08] p-6 shadow-2xl shadow-black/20 backdrop-blur-sm md:p-8">
        <div className="mb-6 text-center md:mb-8">
          <h2 id="descarga-heading" className="font-serif text-2xl font-bold tracking-tight text-white md:text-4xl">
            Punto de venta de pago único
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-white/75 md:text-base">
            Licencia de por vida por <strong className="text-white">$100.000</strong> (pago único, sin
            mensualidades). Probalo gratis por 7 días y, si te gusta, te pasamos la clave de activación.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-100">
              <Download className="size-3.5" />
              Descarga directa
            </div>
            <p className="text-sm text-white/80">
              Descargá el sistema desde GitHub Releases y empezá a probarlo en minutos.
            </p>
            <a
              href={DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 transition hover:opacity-90"
            >
              <Download className="size-4" />
              Descargar para Windows (.zip)
            </a>
          </div>

          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-300/35 bg-amber-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-100">
              <AlertTriangle className="size-3.5" />
              Compatibilidad
            </div>
            <p className="text-sm text-white/85">
              Este instalable es <strong className="text-amber-100">solo compatible con Windows</strong>.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-white/65">
              Si Windows muestra una advertencia, tocá <strong>"Más información"</strong> y luego
              <strong> "Ejecutar de todos modos"</strong>.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/15 bg-black/20 p-4">
            <h3 className="text-sm font-semibold text-white">¿Cómo usarlo?</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-white/75">
              <li>Descargás el sistema.</li>
              <li>Descomprimís el archivo .zip.</li>
              <li>Ejecutás: punto_de_venta.exe.</li>
            </ol>
          </div>

          <div className="rounded-2xl border border-white/15 bg-black/20 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <KeyRound className="size-4 text-cyan-300" />
              Acceso inicial
            </h3>
            <div className="mt-2 space-y-1 text-sm text-white/80">
              <p>
                Usuario: <strong className="text-white">admin</strong>
              </p>
              <p>
                Clave: <strong className="text-white">admin123</strong>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-black/20 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <PlayCircle className="size-4 text-fuchsia-300" />
              Mirá cómo funciona
            </h3>
            <a
              href={LOOM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-cyan-200 underline-offset-4 transition hover:text-cyan-100 hover:underline"
            >
              Ver video tutorial (Loom)
            </a>
            <p className="mt-2 text-xs text-white/60">Demo real del flujo de uso del sistema.</p>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-2 rounded-xl border border-fuchsia-400/25 bg-fuchsia-500/10 p-3 text-xs text-fuchsia-100/90">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          <p>
            Hola 👋 Gracias por tu interés en nuestro sistema de punto de venta. Si querés la licencia de por vida,
            escribinos y coordinamos la activación luego de la prueba.
          </p>
        </div>
      </div>
    </section>
  );
}
