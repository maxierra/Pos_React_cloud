import { Heart } from "lucide-react";

export function LandingAbout() {
  return (
    <section
      id="nosotros"
      className="relative mt-16 scroll-mt-24 md:mt-24"
      aria-labelledby="nosotros-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-fuchsia-500/10 blur-[90px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-cyan-400/10 blur-[80px]"
      />

      <div className="relative mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-10 backdrop-blur-sm md:px-10 md:py-12">
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-400/25 bg-rose-500/10 px-4 py-1.5 text-xs font-medium text-rose-100/95">
            <Heart className="size-3.5 fill-rose-400/30 text-rose-300" aria-hidden />
            Hecho con orgullo en Argentina
          </span>
        </div>

        <h2
          id="nosotros-heading"
          className="text-center font-serif text-2xl font-bold tracking-tight text-white md:text-4xl"
        >
          Somos una empresa joven{" "}
          <span className="bg-gradient-to-r from-cyan-200 via-white to-fuchsia-200 bg-clip-text text-transparent">
            que cree en el comercio de verdad
          </span>
        </h2>

        <div className="mt-8 space-y-5 text-center text-base leading-relaxed text-white/75 md:text-lg md:leading-relaxed">
          <p>
            Nacimos del mismo lugar que muchos de ustedes: del mostrador, del turno largo, de la cuenta que no
            cierra y de ganas de que la tecnología deje de ser un problema y pase a ser un{" "}
            <strong className="font-semibold text-white/95">aliado silencioso</strong>.
          </p>
          <p>
            Somos un equipo de desarrollo joven, con las pilas puestas y la cabeza en el día a día del negocio.
            No vendemos promesas imposibles: construimos herramientas pensadas para{" "}
            <strong className="font-semibold text-white/95">comerciantes argentinos</strong> — kioscos,
            almacenes, ferreterías, negocios familiares y emprendimientos que merecen lo mismo de grande que las
            cadenas, sin complicarse la vida.
          </p>
          <p className="text-white/80">
            Cada mejora que sumamos es un paso hacia que cobrar, controlar stock y mirar los números sea un poco
            más fácil, un poco más rápido y un poco más humano.{" "}
            <span className="italic text-cyan-100/90">Gracias por confiar en un proyecto que también está creciendo.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
