"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CameraOff, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SCANNER_ELEMENT_ID = "pos-html5-qrcode-region";

export type BarcodeScannerProps = {
  open: boolean;
  onClose: () => void;
  /**
   * Código leído (limpio). Devolvé `true` si el producto se agregó al carrito;
   * en modo continuo, el mismo código no vuelve a dispararse hasta que se escanee **otro** código distinto
   * (para sumar más del mismo producto usá el botón + en el carrito).
   */
  onDecoded: (code: string) => boolean;
  /**
   * Si es true, la cámara sigue activa tras cada lectura (ideal para armar el carrito escaneando).
   */
  continuous?: boolean;
  className?: string;
};

/** Feedback opcional: vibración corta (móviles compatibles). */
export function feedbackScanSuccess() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(40);
    } catch {
      /* ignore */
    }
  }
}

/** Reservado para sonido (beep) si más adelante se agrega un asset. */
export function playScanBeep() {
  // Ej.: new Audio("/beep.mp3").play().catch(() => {});
}

/** Antirruido: el lector puede disparar el mismo frame varias veces en pocos ms. */
const RAPID_DUPLICATE_MS = 160;

export function BarcodeScanner({ open, onClose, onDecoded, continuous = false, className }: BarcodeScannerProps) {
  const html5Ref = React.useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const onDecodedRef = React.useRef(onDecoded);
  const onCloseRef = React.useRef(onClose);
  const continuousRef = React.useRef(continuous);
  /** Tras un agregado exitoso en modo continuo: mismo código se ignora hasta que se lea otro distinto. */
  const lastSuccessCodeRef = React.useRef<string | null>(null);
  const rapidRef = React.useRef<{ code: string; t: number }>({ code: "", t: 0 });
  const [error, setError] = React.useState<string | null>(null);
  const [starting, setStarting] = React.useState(false);

  React.useEffect(() => {
    onDecodedRef.current = onDecoded;
    onCloseRef.current = onClose;
    continuousRef.current = continuous;
  }, [onDecoded, onClose, continuous]);

  const stopScanner = React.useCallback(async () => {
    const instance = html5Ref.current;
    html5Ref.current = null;
    if (!instance) return;
    try {
      await instance.stop();
    } catch {
      /* ya detenido o error */
    }
    try {
      instance.clear();
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    if (!open) {
      void stopScanner();
      setError(null);
      setStarting(false);
      lastSuccessCodeRef.current = null;
      rapidRef.current = { code: "", t: 0 };
      return;
    }

    lastSuccessCodeRef.current = null;
    rapidRef.current = { code: "", t: 0 };

    let cancelled = false;

    void (async () => {
      setError(null);
      setStarting(true);
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");

        if (cancelled) return;

        await stopScanner();

        const container = document.getElementById(SCANNER_ELEMENT_ID);
        if (!container) {
          setError("No se pudo iniciar el visor.");
          setStarting(false);
          return;
        }

        const html5 = new Html5Qrcode(SCANNER_ELEMENT_ID, {
          verbose: false,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.ITF,
          ],
        });
        html5Ref.current = html5;

        await html5.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const w = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.85);
              const h = Math.floor(w * 0.45);
              return { width: w, height: h };
            },
          },
          (decodedText) => {
            const code = decodedText.trim();
            if (!code) return;

            if (continuousRef.current && code === lastSuccessCodeRef.current) {
              return;
            }

            const now = Date.now();
            const rapid = rapidRef.current;
            if (code === rapid.code && now - rapid.t < RAPID_DUPLICATE_MS) return;
            rapidRef.current = { code, t: now };

            const success = onDecodedRef.current(code);

            if (continuousRef.current && success) {
              lastSuccessCodeRef.current = code;
            }

            if (!success) {
              return;
            }

            feedbackScanSuccess();
            playScanBeep();

            if (continuousRef.current) return;

            void (async () => {
              await stopScanner();
              onCloseRef.current();
            })();
          },
          () => {
            /* frames sin lectura: silencioso */
          },
        );

        if (cancelled) {
          await stopScanner();
          return;
        }
        setStarting(false);
      } catch (e) {
        if (!cancelled) {
          const msg =
            e instanceof Error
              ? e.message
              : "No se pudo usar la cámara. Revisá permisos o probá en HTTPS.";
          setError(msg);
          setStarting(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [open, stopScanner]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={cn("fixed inset-0 z-[100] flex flex-col bg-black/80 backdrop-blur-sm", className)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3 text-white">
            <div>
              <div className="text-sm font-semibold">Escanear código</div>
              <div className="text-xs text-white/70">
                {continuous
                  ? "Un código = una unidad. Más del mismo: botón + en el carrito. Luego escaneá otro producto."
                  : "Apuntá al código de barras"}
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="shrink-0 rounded-full bg-white/15 text-white hover:bg-white/25"
              onClick={() => {
                void stopScanner();
                onClose();
              }}
              aria-label="Cerrar escáner"
            >
              <X className="size-5" />
            </Button>
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center p-4">
            {starting ? (
              <div className="text-sm text-white/80">Iniciando cámara…</div>
            ) : null}

            {error ? (
              <div className="flex max-w-sm flex-col items-center gap-4 text-center">
                <CameraOff className="size-12 text-rose-300" />
                <p className="text-sm text-white/90">{error}</p>
                <Button type="button" variant="secondary" onClick={() => onClose()}>
                  Cerrar
                </Button>
              </div>
            ) : (
              <div
                id={SCANNER_ELEMENT_ID}
                className="w-full max-w-lg overflow-hidden rounded-2xl bg-black [&_video]:max-h-[min(50vh,420px)] [&_video]:w-full [&_video]:object-cover"
              />
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
