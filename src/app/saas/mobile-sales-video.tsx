"use client";

import { useState } from "react";

const VIDEO_ID = "Kh0aBROV6Hc";

export function MobileSalesVideo() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="saas-video-phone" aria-label="Video: cómo vender desde el celular con Tienda360">
      <div className="saas-video-phone-top" aria-hidden="true"><i /><span /></div>
      <div className="saas-video-screen">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&playsinline=1&rel=0`}
            title="Cómo vender desde el celular con Tienda360"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className="saas-video-cover"
            onClick={() => setPlaying(true)}
            aria-label="Reproducir video: cómo vender desde el celular"
          >
            <span className="saas-video-cover-image" aria-hidden="true" />
            <span className="saas-video-cover-shade" aria-hidden="true" />
            <span className="saas-video-play" aria-hidden="true"><i /></span>
            <span className="saas-video-cover-copy"><small>Video rápido</small><strong>Mirá una venta desde el celular</strong></span>
          </button>
        )}
      </div>
      <span className="saas-video-phone-home" aria-hidden="true" />
    </div>
  );
}
