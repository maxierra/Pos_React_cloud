"use client";

import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { CheckCircle2, Download, LoaderCircle, Monitor, PartyPopper, X } from "lucide-react";

import { trackMetaCustomEvent } from "@/components/analytics/meta-pixel";

type Props = {
  source: string;
  className: string;
  ariaLabel: string;
  children: ReactNode;
};

export function LandingDownloadButton({ source, className, ariaLabel, children }: Props) {
  const [open, setOpen] = useState(false);
  const [mobileDevice, setMobileDevice] = useState(false);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [error, setError] = useState("");
  const titleId = useId();
  const descriptionId = useId();

  function openDownloadDialog() {
    setSuccess(false);
    setDownloadUrl("");
    setError("");
    setOpen(true);
    try {
      const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      setMobileDevice(mobileUserAgent || window.innerWidth < 768);
    } catch {
      setMobileDevice(true);
    }
  }

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, pending]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/download/windows", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fullName: form.get("fullName"), phone: form.get("phone"), source, contactConsent: form.get("contactConsent") === "yes" }),
      });
      const payload = (await response.json()) as { downloadUrl?: string; error?: string };
      if (!response.ok || !payload.downloadUrl) throw new Error(payload.error || "No se pudo preparar la descarga.");
      trackMetaCustomEvent("ClickDescargar", { location: source, content_name: "Software POS Tienda360" });
      if (!mobileDevice) {
        const downloadLink = document.createElement("a");
        downloadLink.href = payload.downloadUrl;
        downloadLink.download = "Tienda360.zip";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
      }
      setDownloadUrl(payload.downloadUrl);
      setSuccess(true);
      setPending(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo preparar la descarga.");
      setPending(false);
    }
  }

  return <>
    <button type="button" aria-label={ariaLabel} className={className} onClick={openDownloadDialog}>{children}</button>
    {open ? <div className="fixed inset-0 z-[100] grid place-items-center bg-[#061c14]/75 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl bg-[#f6f4ec] p-6 text-left text-[#0a2a1e] shadow-2xl sm:p-8">
        <button type="button" aria-label="Cerrar formulario de descarga" onClick={() => setOpen(false)} disabled={pending} className="absolute right-4 top-4 grid size-9 place-items-center rounded-full hover:bg-black/5"><X className="size-5" /></button>
        {success ? <div className="py-3 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="size-9" /></span>
          <p className="mt-5 flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#2fa85a]"><PartyPopper className="size-4" /> {mobileDevice ? "¡Datos registrados!" : "¡Descarga iniciada!"}</p>
          <h2 id={titleId} className="mt-3 text-3xl font-black">{mobileDevice ? "Ahora descargalo desde tu PC" : "¡Felicitaciones!"}</h2>
          <p id={descriptionId} className="mt-3 text-sm leading-6 text-[#0a2a1e]/65">{mobileDevice ? "Tienda360 funciona en computadoras con Windows. Entrá a esta misma página desde tu PC, completá nuevamente el formulario y comenzará la descarga." : "Tu prueba gratuita de Tienda360 ya está descargándose. Tenés 3 días para probar todas las funciones con tu comercio real."}</p>
          <p className="mt-4 rounded-xl bg-[#fce7c4] px-4 py-3 text-sm font-bold">{mobileDevice ? "El instalador no se descargó en tu celular porque solo puede utilizarse en Windows." : "¡Mucho éxito en esta nueva etapa de tu negocio!"}</p>
          <div className="mt-6 grid gap-3">
            <a href="https://youtu.be/pLQDqRN0XpE" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#0a2a1e] px-5 py-3 text-sm font-extrabold text-[#f6f4ec] hover:bg-[#0f3a2a]">Ver cómo instalar Tienda360</a>
            {downloadUrl && !mobileDevice ? <a href={downloadUrl} download="Tienda360.zip" className="text-sm font-bold text-[#2fa85a] hover:underline">¿No comenzó? Descargar nuevamente</a> : null}
            <button type="button" onClick={() => setOpen(false)} className="text-sm font-semibold text-[#0a2a1e]/60 hover:text-[#0a2a1e]">Cerrar</button>
          </div>
        </div> : <>
          <span className="grid size-11 place-items-center rounded-xl bg-[#ffb343]"><Download className="size-5" /></span>
          <h2 id={titleId} className="mt-5 text-2xl font-black">Descargá tu prueba gratis</h2>
          <p id={descriptionId} className="mt-2 text-sm leading-6 text-[#0a2a1e]/65">Dejanos tus datos para registrar la descarga y poder ayudarte si necesitás activar la licencia.</p>
          <div className="mt-4 flex gap-3 rounded-xl border-2 border-[#ffb343] bg-[#fff1d6] p-4 md:hidden" role="alert"><Monitor className="mt-0.5 size-6 shrink-0" aria-hidden="true" /><p className="text-sm leading-5"><strong className="text-base">Estás desde un celular</strong><br />Completá el formulario para dejarnos tus datos. Después, entrá desde una <strong>PC con Windows</strong> para descargar e instalar Tienda360.</p></div>
          <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-bold">Nombre completo<input name="fullName" autoComplete="name" required minLength={3} maxLength={120} autoFocus={!mobileDevice} className="mt-2 h-11 w-full rounded-xl border border-[#0a2a1e]/20 bg-white px-3 font-normal outline-none focus:border-[#2fa85a] focus:ring-2 focus:ring-[#2fa85a]/20" placeholder="Ej.: María González" /></label>
          <label className="block text-sm font-bold">Teléfono<input name="phone" type="tel" inputMode="tel" autoComplete="tel" required minLength={8} maxLength={30} className="mt-2 h-11 w-full rounded-xl border border-[#0a2a1e]/20 bg-white px-3 font-normal outline-none focus:border-[#2fa85a] focus:ring-2 focus:ring-[#2fa85a]/20" placeholder="Ej.: 11 2345 6789" /></label>
          <label className="flex items-start gap-2 text-xs leading-5 text-[#0a2a1e]/65"><input name="contactConsent" value="yes" type="checkbox" required className="mt-1 size-4 accent-[#2fa85a]" /><span>Acepto que Tienda360 me contacte únicamente para acompañar mi prueba y activación.</span></label>
          {error ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
          <button type="submit" disabled={pending} className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#0a2a1e] px-5 py-3 text-sm font-extrabold text-[#f6f4ec] hover:bg-[#0f3a2a] disabled:opacity-60">{pending ? <><LoaderCircle className="mr-2 size-4 animate-spin" />{mobileDevice ? "Guardando datos…" : "Preparando descarga…"}</> : <><Download className="mr-2 size-4" />{mobileDevice ? "Guardar mis datos" : "Continuar y descargar"}</>}</button>
          </form>
        </>}
      </section>
    </div> : null}
  </>;
}
