import { ExternalLink, PlayCircle } from "lucide-react";

const tutorials = [
  {
    title: "Configuración inicial",
    description: "Paso a paso para dejar el sistema listo y empezar a operar.",
    embedUrl: "https://www.youtube.com/embed/Ga6TRIi0uEY",
    videoUrl: "https://youtu.be/Ga6TRIi0uEY",
  },
  {
    title: "Carga de productos",
    description: "Aprendé a crear productos, organizar precios y preparar tu catálogo.",
    embedUrl: "https://www.youtube.com/embed/lE-pNOjEEug",
    videoUrl: "https://youtu.be/lE-pNOjEEug",
  },
  {
    title: "Caja diaria",
    description: "Apertura, control y cierre de caja para ordenar la operatoria del día.",
    embedUrl: "https://www.youtube.com/embed/5wzr0ePrL_g",
    videoUrl: "https://youtu.be/5wzr0ePrL_g",
  },
  {
    title: "Pantalla de ventas",
    description: "Conocé la vista principal para cobrar rápido y trabajar con agilidad.",
    embedUrl: "https://www.youtube.com/embed/_VTaCVwt1CI",
    videoUrl: "https://youtu.be/_VTaCVwt1CI",
  },
];

export function LandingVideoTutorials() {
  return (
    <section
      id="tutoriales"
      className="relative scroll-mt-24 rounded-[2rem] border border-white/80 bg-white/70 px-6 py-8 shadow-[0_24px_64px_-34px_rgba(15,23,42,0.4)] backdrop-blur md:px-8 md:py-10"
      aria-labelledby="tutoriales-heading"
    >
      <div className="mx-auto max-w-5xl">
        <h2
          id="tutoriales-heading"
          className="text-center font-serif text-3xl font-bold tracking-tight text-slate-900 md:text-4xl"
        >
          Mirá cómo funciona Tienda360
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-7 text-slate-600 md:text-base">
          En menos de un minuto podés ver cómo se realiza una venta y cómo el sistema te ayuda a ordenar tu comercio.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {tutorials.map((tutorial) => (
            <article
              key={tutorial.title}
              className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-3 shadow-lg shadow-slate-200/40"
            >
              <div className="relative aspect-video overflow-hidden rounded-[1.25rem] bg-slate-100">
                <iframe
                  src={tutorial.embedUrl}
                  className="absolute inset-0 h-full w-full"
                  title={tutorial.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>

              <div className="px-2 pb-2 pt-4">
                <p className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <PlayCircle className="size-5 text-emerald-700" aria-hidden />
                  {tutorial.title}
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{tutorial.description}</p>
                <a
                  href={tutorial.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 underline underline-offset-4"
                >
                  Ver en YouTube
                  <ExternalLink className="size-4" aria-hidden />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
