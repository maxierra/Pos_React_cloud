"use client";

function Video({ id, title }: { id: string; title: string }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#392246] bg-[#120c19] shadow-xl">
      <div className="aspect-video bg-[#21102e]">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title={title}
          loading="lazy"
          className="size-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}

export function LandingIntroVideo() {
  return (
    <section className="landing-intro-video bg-[#08070b] px-5 pb-8 pt-6 text-center text-[#f5f3fa] sm:px-8">
      <div className="mx-auto max-w-2xl">
        <p className="mb-3 font-mono text-xs font-black uppercase tracking-[.18em] text-[#ffda00]">★ Mirá este video importante</p>
        <Video id="w5v83yeDXwU" title="Tienda360: Intro" />
      </div>
    </section>
  );
}

export function LandingLicenseVideo() {
  return (
    <section id="videos-tutoriales" className="landing-license-video bg-[#08070b] px-5 py-16 text-[#f5f3fa] sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[#c083f6]">Videos tutoriales</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Activación de licencia</h2>
        <p className="mt-4 max-w-2xl text-[#b3adbf]">Mirá cómo activar tu licencia para seguir usando Tienda360.</p>
        <div className="mt-8 max-w-3xl"><Video id="7Wb5gd90Ss4" title="Tutorial: Activación de licencia" /></div>
      </div>
    </section>
  );
}
