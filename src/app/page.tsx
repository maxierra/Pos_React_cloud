import Link from "next/link";

const WHATSAPP_E164 = "5491123145742";
const SUPPORT_EMAIL = "soporte@tienda360.site";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ missingSupabase?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const whatsappMessage = encodeURIComponent(
    "Hola, quiero probar Tienda360. Les dejo mi mail para que me envien un usuario de acceso."
  );
  const whatsappHref = `https://wa.me/${WHATSAPP_E164}?text=${whatsappMessage}`;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8f6f1_0%,#f1eee6_42%,#ece7db_100%)] text-slate-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-300/10 blur-3xl" />
      </div>

      {sp.missingSupabase ? (
        <div className="relative z-10 border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950">
          Falta configurar Supabase en <code className="rounded bg-white px-1">.env.local</code>.
        </div>
      ) : null}

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-16 sm:px-10">
        <div className="w-full space-y-12">
          <div className="grid w-full gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
            <div className="inline-flex items-center rounded-full border border-emerald-700/15 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800 shadow-sm backdrop-blur">
              Sitio en mantenimiento
            </div>

            <h1 className="mt-6 max-w-3xl font-serif text-5xl leading-[0.95] tracking-tight text-slate-950 sm:text-6xl">
              Estamos reestructurando la web de Tienda360
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
              Durante estos días la landing pública va a estar en mantenimiento. El sistema sigue
              <span className="font-semibold text-slate-900"> funcionando normalmente para cuentas activas</span>.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-[0_18px_40px_-22px_rgba(15,23,42,0.35)] backdrop-blur">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Cuentas activas
                </div>
                <p className="mt-2 text-base leading-7 text-slate-700">
                  Si ya sos cliente, podés seguir entrando al sistema como siempre.
                </p>
                <Link
                  href="/auth/login"
                  className="mt-4 inline-flex items-center rounded-full border border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white"
                >
                  Ingresar al sistema
                </Link>
              </div>

              <div className="rounded-3xl border border-emerald-900/10 bg-emerald-950 p-5 text-white shadow-[0_22px_44px_-24px_rgba(6,78,59,0.65)]">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
                  Prueba del sistema
                </div>
                <p className="mt-2 text-base leading-7 text-emerald-50/90">
                  Si querés probar Tienda360, podés solicitar una prueba gratis de 7 días por WhatsApp. Dejanos un mail y te enviamos un usuario de acceso.
                </p>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#20bd5a]"
                >
                  Solicitar acceso por WhatsApp
                </a>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-slate-800 underline underline-offset-4">
                {SUPPORT_EMAIL}
              </a>
              <span className="text-slate-400">|</span>
              <span>Jueves 30 de julio de 2026</span>
            </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-white/35 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-7 shadow-[0_30px_70px_-30px_rgba(15,23,42,0.45)] backdrop-blur">
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Aviso temporal
                    </div>
                    <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                      Reestructuración en curso
                    </div>
                  </div>
                  <div className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                    Activo
                  </div>
                </div>

                <div className="space-y-4 pt-6 text-sm leading-7 text-slate-700">
                  <p>
                    Estamos trabajando en una nueva versión de la landing para presentar mejor el producto, los planes y el flujo de alta.
                  </p>
                  <p>
                    Mientras tanto, el POS, el acceso de clientes existentes y el soporte continúan funcionando con normalidad.
                  </p>
                </div>

                <div className="mt-6 rounded-3xl bg-slate-950 p-5 text-slate-100">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Si querés probar
                  </div>
                  <ol className="mt-3 space-y-3 text-sm leading-6">
                    <li>1. Escribinos por WhatsApp.</li>
                    <li>2. Dejanos un mail de contacto.</li>
                    <li>3. Te enviamos un usuario para ingresar.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[2rem] border border-white/70 bg-white/80 p-7 shadow-[0_24px_64px_-34px_rgba(15,23,42,0.4)] backdrop-blur">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">
                Próximas mejoras
              </div>
              <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-slate-950">
                Lo nuevo que estamos terminando de incorporar
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-700">
                Mientras terminamos la nueva web, también estamos cerrando nuevas funciones para sumar al sistema en estos días.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-emerald-200/80 bg-emerald-50/70 p-5">
                  <div className="text-sm font-semibold text-emerald-900">Facturación ARCA</div>
                  <p className="mt-2 text-sm leading-6 text-emerald-950/80">
                    Estamos trabajando en la incorporación de Factura C, configuración paso a paso, certificado y punto de venta.
                  </p>
                </div>
                <div className="rounded-3xl border border-cyan-200/80 bg-cyan-50/70 p-5">
                  <div className="text-sm font-semibold text-cyan-950">Integración con balanzas</div>
                  <p className="mt-2 text-sm leading-6 text-cyan-950/80">
                    Estamos sumando lectura de códigos de balanza por peso o por importe, incluyendo formatos tipo Kretz.
                  </p>
                </div>
                <div className="rounded-3xl border border-violet-200/80 bg-violet-50/70 p-5">
                  <div className="text-sm font-semibold text-violet-950">Video tutoriales</div>
                  <p className="mt-2 text-sm leading-6 text-violet-950/80">
                    Vamos a ampliar la biblioteca de tutoriales para onboarding, caja, stock y configuración paso a paso.
                  </p>
                </div>
                <div className="rounded-3xl border border-amber-200/80 bg-amber-50/70 p-5">
                  <div className="text-sm font-semibold text-amber-950">Reestructuración de la landing</div>
                  <p className="mt-2 text-sm leading-6 text-amber-950/80">
                    También estamos rearmando la web pública para presentar mejor planes, funciones y acceso de prueba.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/80 p-7 shadow-[0_24px_64px_-34px_rgba(15,23,42,0.4)] backdrop-blur">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Disponible hoy
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  "Punto de venta con lector y tickets",
                  "Stock por unidad y por kilo",
                  "Clientes y cuenta corriente",
                  "Proveedores",
                  "Usuarios y permisos por empleado",
                  "Etiquetas y códigos internos",
                  "Ventas, historial y anulaciones",
                  "Caja y movimientos",
                  "Mesas y delivery para gastronomía",
                  "Reportes e informes diarios",
                  "Rubros rápidos por importe",
                  "Cobro con Mercado Pago QR",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm font-medium text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-950 px-5 py-5 text-slate-100">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Soporte actual
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-200/90">
                  Mientras completamos estas mejoras, el sistema operativo actual, el acceso de clientes activos y el soporte por WhatsApp y mail siguen funcionando normalmente.
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
