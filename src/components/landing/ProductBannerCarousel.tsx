"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const SLIDES = [
  {
    src: "/banner/Infograf%C3%ADa%20del%20dashboard%20Tienda360.png",
    alt: "Vista general del dashboard de Tienda360",
  },
  {
    src: "/banner/Gu%C3%ADa%20visual%20de%20ventas%20Tienda360.png",
    alt: "Guía visual del módulo de ventas de Tienda360",
  },
  {
    src: "/banner/Gu%C3%ADa%20visual%20del%20inventario%20Tienda360.png",
    alt: "Guía visual del inventario de Tienda360",
  },
  {
    src: "/banner/Gu%C3%ADa%20visual%20del%20m%C3%B3dulo%20Productos%20Tienda360.png",
    alt: "Guía visual del módulo de productos de Tienda360",
  },
  {
    src: "/banner/Panel%20de%20Reportes%20Tienda360%20Annotated.png",
    alt: "Panel de reportes de Tienda360",
  },
] as const;

export function ProductBannerCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pointerStartX = useRef<number | null>(null);

  const goTo = useCallback((index: number) => {
    setActiveIndex((index + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (isPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % SLIDES.length);
    }, 5500);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    pointerStartX.current = event.clientX;
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (pointerStartX.current === null) return;
    const distance = event.clientX - pointerStartX.current;
    pointerStartX.current = null;

    if (Math.abs(distance) < 45) return;
    goTo(activeIndex + (distance < 0 ? 1 : -1));
  }

  return (
    <section className="t360-banner-section" aria-labelledby="product-tour-title">
      <div className="t360-wrap">
        <div className="t360-banner-heading">
          <p className="t360-kicker">Conocé Tienda360</p>
          <h2 id="product-tour-title">Todo tu comercio, en una sola pantalla</h2>
        </div>

        <div
          className="t360-banner-carousel"
          aria-roledescription="carrusel"
          aria-label="Recorrido visual por Tienda360"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
          }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => { pointerStartX.current = null; }}
        >
          <div
            className="t360-banner-track"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {SLIDES.map((slide, index) => (
              <figure
                className="t360-banner-slide"
                key={slide.src}
                aria-hidden={index !== activeIndex}
              >
                <Image
                  src={slide.src}
                  alt={index === activeIndex ? slide.alt : ""}
                  width={1672}
                  height={941}
                  sizes="(max-width: 600px) calc(100vw - 28px), (max-width: 1200px) calc(100vw - 40px), 1160px"
                />
              </figure>
            ))}
          </div>

          <button
            className="t360-banner-arrow t360-banner-arrow-prev"
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            aria-label="Ver imagen anterior"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            className="t360-banner-arrow t360-banner-arrow-next"
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            aria-label="Ver imagen siguiente"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>

        <div className="t360-banner-dots" aria-label="Elegir imagen">
          {SLIDES.map((slide, index) => (
            <button
              type="button"
              key={slide.src}
              className={index === activeIndex ? "active" : ""}
              onClick={() => goTo(index)}
              aria-label={`Ver imagen ${index + 1} de ${SLIDES.length}`}
              aria-current={index === activeIndex ? "true" : undefined}
            />
          ))}
        </div>
        <p className="t360-banner-swipe-hint">Deslizá para ver más</p>
      </div>
    </section>
  );
}
