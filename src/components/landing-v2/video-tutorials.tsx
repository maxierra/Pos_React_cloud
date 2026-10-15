"use client";

import { useState } from "react";
import { tutorials } from "@/lib/landing-config";
import { trackFunnelEvent } from "@/lib/leads/analytics";

export function VideoTutorials() {
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const visible = expanded ? tutorials : tutorials.slice(0, 3);

  return (
    <>
      <div className="lp-video-grid">
        {visible.map((video, index) => (
          <article className="lp-video-card" key={video.id}>
            <div className="lp-video-frame">
              {playing === video.id ? (
                <iframe src={`https://www.youtube-nocookie.com/embed/${video.id}?rel=0`} title={`Tutorial: ${video.title}`} allow="encrypted-media; picture-in-picture" allowFullScreen />
              ) : (
                <button type="button" onClick={() => { setPlaying(video.id); trackFunnelEvent("video_started", { video: video.id, tutorial: video.title }); }} aria-label={`Reproducir tutorial: ${video.title}`} style={{ backgroundImage: `url(https://i.ytimg.com/vi/${video.id}/hqdefault.jpg)` }}>
                  <span aria-hidden="true">▶</span>
                </button>
              )}
            </div>
            <div className="lp-video-copy"><small>Tutorial {String(index + 1).padStart(2, "0")}</small><h3>{video.title}</h3><p>{video.description}</p></div>
          </article>
        ))}
      </div>
      <div className="lp-center"><button className="lp-button lp-button-outline" type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>{expanded ? "Ver menos tutoriales ↑" : "Ver los 10 tutoriales ↓"}</button></div>
    </>
  );
}
