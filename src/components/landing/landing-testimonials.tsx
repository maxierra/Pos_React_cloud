import { MapPin, MessageSquareQuote, Store } from "lucide-react";

import { landingTestimonials } from "@/data/landing-testimonials";

export function LandingTestimonials() {
  return (
    <section className="bg-[#e9eddf] py-20 lg:py-24" aria-labelledby="experiencias-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[.22em] text-emerald-700">
            Experiencias de uso
          </p>
          <h2
            id="experiencias-title"
            className="mt-4 text-3xl font-extrabold tracking-[-.035em] sm:text-5xl"
          >
            Experiencias con Tienda360
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Ejemplos del tipo de experiencia que buscamos reflejar con clientes que utilizan el sistema en su comercio.
          </p>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            Contenido provisorio de muestra para maquetación.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {landingTestimonials.map((testimonial) => (
            <article
              key={testimonial.id}
              className="flex h-full flex-col rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <MessageSquareQuote className="size-7 text-emerald-700" aria-hidden />
              <blockquote className="mt-5 flex-1 text-sm leading-7 text-slate-700">
                “{testimonial.quote}”
              </blockquote>
              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="flex items-center gap-2 font-extrabold text-slate-950">
                  <Store className="size-4 text-emerald-700" aria-hidden />
                  {testimonial.business}
                </p>
                <p className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-500">
                  <MapPin className="size-3.5" aria-hidden />
                  {testimonial.location}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
