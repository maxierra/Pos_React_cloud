import { Mail, MapPin, MessageCircle } from "lucide-react";

const WHATSAPP_DISPLAY = "11 2314-5742";
const WHATSAPP_E164 = "5491123145742";
const EMAIL = "maxi.erramouspe77@gmail.com";
const ADDRESS_LINE = "Superí 2490, Belgrano, CABA";

/** Búsqueda para el embed de Google Maps (sin API key). */
const MAP_EMBED_QUERY =
  "https://maps.google.com/maps?q=" +
  encodeURIComponent("Superí 2490, Belgrano, Ciudad Autónoma de Buenos Aires") +
  "&z=16&ie=UTF8&iwloc=&output=embed";

export function LandingContact() {
  return (
    <section
      id="contacto"
      className="relative mt-16 scroll-mt-24 md:mt-24"
      aria-labelledby="contacto-heading"
    >
      <div className="mb-8 text-center md:mb-10">
        <h2
          id="contacto-heading"
          className="font-serif text-2xl font-bold tracking-tight text-white md:text-4xl"
        >
          Contacto
        </h2>
        <p className="mt-2 text-sm text-white/65 md:text-base">
          Escribinos por WhatsApp, mail o pasá por Belgrano.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-stretch">
        <div className="flex flex-col gap-4">
          <a
            href={`https://wa.me/${WHATSAPP_E164}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5 transition hover:border-emerald-400/40 hover:bg-emerald-500/15"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-200">
              <MessageCircle className="size-6" aria-hidden />
            </span>
            <div className="min-w-0 text-left">
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-200/80">
                WhatsApp
              </div>
              <div className="mt-1 text-lg font-semibold text-white group-hover:text-emerald-100">
                {WHATSAPP_DISPLAY}
              </div>
              <div className="mt-1 text-sm text-white/55">Tocá para abrir el chat</div>
            </div>
          </a>

          <a
            href={`mailto:${EMAIL}`}
            className="group flex items-start gap-4 rounded-2xl border border-sky-500/25 bg-sky-500/10 p-5 transition hover:border-sky-400/40 hover:bg-sky-500/15"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-200">
              <Mail className="size-6" aria-hidden />
            </span>
            <div className="min-w-0 text-left">
              <div className="text-xs font-semibold uppercase tracking-wide text-sky-200/80">Email</div>
              <div className="mt-1 break-all text-base font-semibold text-white group-hover:text-sky-100 md:text-lg">
                {EMAIL}
              </div>
              <div className="mt-1 text-sm text-white/55">Consultas y soporte</div>
            </div>
          </a>

          <div className="flex flex-1 items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/15 text-fuchsia-200">
              <MapPin className="size-6" aria-hidden />
            </span>
            <div className="text-left">
              <div className="text-xs font-semibold uppercase tracking-wide text-fuchsia-200/80">
                Ubicación
              </div>
              <div className="mt-1 text-base font-medium text-white md:text-lg">{ADDRESS_LINE}</div>
              <div className="mt-1 text-sm text-white/55">Argentina</div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-xl shadow-black/30">
          <iframe
            title="Mapa: Superí 2490, Belgrano, CABA"
            src={MAP_EMBED_QUERY}
            className="h-[min(320px,50vw)] w-full min-h-[260px] border-0 lg:h-full lg:min-h-[360px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}
