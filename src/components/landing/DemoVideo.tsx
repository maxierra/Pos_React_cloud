"use client";
import { useState } from "react";
import { trackFunnelEvent } from "@/lib/leads/analytics";

export function DemoVideo({ onStart }: { onStart: () => void }) {
  const [playing, setPlaying] = useState(false);
  const play = () => { setPlaying(true); trackFunnelEvent("video_started", { video: "short_demo" }); };
  return <section className="t360-section t360-demo" id="demo"><div className="t360-wrap"><div className="t360-heading"><p className="t360-kicker">Demostración real</p><h2>Mirá Tienda360 funcionando</h2><p>En menos de un minuto vas a ver cómo podés vender, cobrar y controlar tu comercio.</p></div>
    <div className="t360-video t360-video-short">{playing ? <iframe src="https://www.youtube-nocookie.com/embed/TFCBqtZTGMU?autoplay=1&rel=0" title="Tienda360: demostración rápida" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : <button className="t360-video-cover" style={{ backgroundImage: "url('https://i.ytimg.com/vi/TFCBqtZTGMU/maxresdefault.jpg')" }} onClick={play} aria-label="Reproducir demostración"><span>▶</span><b>Ver video corto</b><small>Mirá cómo funciona Tienda360</small></button>}</div>
    <div className="t360-after-video"><h3>¿Te imaginás usando esto en tu comercio?</h3><button className="t360-button" onClick={onStart}>Quiero implementarlo</button></div>
  </div></section>;
}

