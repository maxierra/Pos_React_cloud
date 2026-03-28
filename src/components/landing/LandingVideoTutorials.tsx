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

        <div className="mt-8 rounded-2xl border border-dashed border-white/20 bg-white/[0.03] px-6 py-14 backdrop-blur-sm md:py-16">
          <PlayCircle
            className="mx-auto size-14 text-white/25 md:size-16"
            strokeWidth={1.25}
            aria-hidden
          />
          <p className="mt-4 text-lg font-medium text-white/80">Próximamente</p>
          <p className="mt-2 text-sm text-white/50">
            Estamos preparando videos cortos: primera venta, stock, informes y más.
          </p>
        </div>
      </div>
    </section>
  );
}
