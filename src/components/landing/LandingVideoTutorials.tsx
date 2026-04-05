import { PlayCircle } from "lucide-react";

export function LandingVideoTutorials() {
  return (
    <section
      id="tutoriales"
      className="relative mt-16 scroll-mt-24 md:mt-20"
      aria-labelledby="tutoriales-heading"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2
          id="tutoriales-heading"
          className="font-serif text-2xl font-bold tracking-tight text-white md:text-3xl"
        >
          Video tutoriales
        </h2>
        <p className="mt-2 text-sm text-white/60 md:text-base">
          Guías paso a paso para sacarle el máximo al sistema.
        </p>

        <div className="mt-8 rounded-2xl border border-white/20 bg-white/[0.03] p-2 backdrop-blur-sm">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black/50">
            <iframe
              src="https://www.loom.com/embed/c119a013531a4928a9ee3dcd98f3fce9"
              className="absolute inset-0 w-full h-full rounded-xl"
              title="Video tutorial - Punto de Venta"
              allowFullScreen
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          </div>
          <div className="mt-4 text-center">
            <p className="text-lg font-medium text-white/80">Tutorial completo del sistema</p>
            <p className="mt-2 text-sm text-white/50">
              Aprendé a hacer tu primera venta, gestionar stock y generar informes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
