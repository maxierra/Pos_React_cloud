"use client";

import { useState } from "react";
import { trackFunnelEvent } from "@/lib/leads/analytics";

const TUTORIALS = [
  { id: "mEWPzS6RD70", title: "Login y acceso" },
  { id: "xX_EWjoduZ0", title: "Carga de productos" },
  { id: "_gnGrbQz5Dw", title: "Ventas" },
  { id: "jWTHrNC3TXU", title: "Caja diaria" },
  { id: "hsSXo-roQ5E", title: "Reportes" },
  { id: "J8Cxgc_l-iY", title: "Configuración" },
  { id: "eKf_n6Twk7c", title: "Facturación electrónica" },
  { id: "f8qx4hahRh4", title: "Inventario" },
  { id: "NYDewU_XjI8", title: "Estadísticas" },
  { id: "TyNRPwxu6S0", title: "Etiquetas" },
] as const;

export function TutorialVideos() {
  const [expanded, setExpanded] = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const visibleTutorials = expanded ? TUTORIALS : TUTORIALS.slice(0, 3);

  const play = (id: string, title: string) => {
    setActiveVideo(id);
    trackFunnelEvent("video_started", { video: `tutorial_${id}`, tutorial: title });
  };

  return <section className="t360-section t360-tutorials" aria-labelledby="tutorials-title">
    <div className="t360-wrap">
      <div className="t360-heading">
        <p className="t360-kicker">Aprendé paso a paso</p>
        <h2 id="tutorials-title">Videos tutoriales de Tienda360</h2>
        <p>Guías cortas para configurar el sistema y empezar a trabajar.</p>
      </div>
      <div className="t360-tutorial-grid">
        {visibleTutorials.map((tutorial) => <article className="t360-tutorial-card" key={tutorial.id}>
          {activeVideo === tutorial.id ? <iframe
            src={`https://www.youtube-nocookie.com/embed/${tutorial.id}?autoplay=1&rel=0`}
            title={`Tutorial de Tienda360: ${tutorial.title}`}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          /> : <button
            type="button"
            className="t360-tutorial-cover"
            style={{ backgroundImage: `url('https://i.ytimg.com/vi/${tutorial.id}/hqdefault.jpg')` }}
            onClick={() => play(tutorial.id, tutorial.title)}
            aria-label={`Reproducir tutorial: ${tutorial.title}`}
          ><span aria-hidden="true">▶</span></button>}
          <div><small>Tutorial</small><h3>{tutorial.title}</h3></div>
        </article>)}
      </div>
      <div className="t360-tutorial-more">
        <button className="t360-button t360-button-ghost" type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
          {expanded ? "Ver menos" : `Ver todos los tutoriales (${TUTORIALS.length})`}
          <span aria-hidden="true">{expanded ? "↑" : "↓"}</span>
        </button>
      </div>
    </div>
  </section>;
}
