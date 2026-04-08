"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CameraOff, CheckCircle2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SCANNER_ELEMENT_ID = "pos-html5-qrcode-region";

export type BarcodeDecodedPayload = boolean | { ok: boolean; addedName?: string };

function parseDecodeResult(r: BarcodeDecodedPayload): { ok: boolean; addedName?: string } {
  if (typeof r === "boolean") return { ok: r };
  return { ok: r.ok, addedName: r.addedName };
}

export type BarcodeScannerProps = {
  open: boolean;
  onClose: () => void;
  /**
   * Resultado del código: `true`/`{ ok: true, addedName }` si se agregó al carrito.
   * En modo continuo, el mismo código no se procesa de nuevo hasta leer otro distinto.
   */
  onDecoded: (code: string) => BarcodeDecodedPayload;
  /** Mantiene la cámara lista para varios productos (móvil). */
  continuous?: boolean;
  /**
   * Tras cada lectura exitosa: pausa la cámara y muestra confirmación para escanear otro o terminar.
   * Tiene efecto si `continuous` es true (flujo móvil).
   */
  steppedAfterSuccess?: boolean;
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

const RAPID_DUPLICATE_MS = 160;

export function BarcodeScanner({
  open,
  onClose,
  onDecoded,
  continuous = false,
  steppedAfterSuccess = false,
  className,
}: BarcodeScannerProps) {
  const html5Ref = React.useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const onDecodedRef = React.useRef(onDecoded);
  const onCloseRef = React.useRef(onClose);
  const continuousRef = React.useRef(continuous);
  const steppedRef = React.useRef(steppedAfterSuccess);
  const lastSuccessCodeRef = React.useRef<string | null>(null);
  const rapidRef = React.useRef<{ code: string; t: number }>({ code: "", t: 0 });
  const [error, setError] = React.useState<string | null>(null);
  const [starting, setStarting] = React.useState(false);
  const [phase, setPhase] = React.useState<"scanning" | "confirm">("scanning");
  const [confirmName, setConfirmName] = React.useState("");

  React.useEffect(() => {
    onDecodedRef.current = onDecoded;
    onCloseRef.current = onClose;
    continuousRef.current = continuous;
    steppedRef.current = steppedAfterSuccess;
  }, [onDecoded, onClose, continuous, steppedAfterSuccess]);

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
      setPhase("scanning");
      setConfirmName("");
      lastSuccessCodeRef.current = null;
      rapidRef.current = { code: "", t: 0 };
      return;
    }

    setPhase("scanning");
    setConfirmName("");
    lastSuccessCodeRef.current = null;
    rapidRef.current = { code: "", t: 0 };
  }, [open, stopScanner]);

  React.useEffect(() => {
    if (!open || phase !== "scanning") {
      if (!open) void stopScanner();
      return;
    }

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

            const parsed = parseDecodeResult(onDecodedRef.current(code));
            const success = parsed.ok;

            if (continuousRef.current && success) {
              lastSuccessCodeRef.current = code;
            }

            if (!success) {
              return;
            }

            feedbackScanSuccess();
            playScanBeep();

            const label = parsed.addedName?.trim() || "Producto";

            const useStepped = continuousRef.current && steppedRef.current;
            if (useStepped) {
              void (async () => {
                await stopScanner();
                setConfirmName(label);
                setPhase("confirm");
              })();
              return;
            }

            if (continuousRef.current) {
              return;
            }

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
  }, [open, phase, stopScanner]);

  const handleClose = React.useCallback(() => {
    void stopScanner();
    onClose();
  }, [onClose, stopScanner]);

  const handleScanAnother = React.useCallback(() => {
    setPhase("scanning");
  }, []);

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
              <div className="text-sm font-semibold">
                {phase === "confirm" ? "Listo" : "Escanear código"}
              </div>
              <div className="text-xs text-white/70">
                {phase === "confirm"
                  ? "Podés seguir sumando o cerrar el lector"
                  : continuous
                    ? "Una lectura a la vez. Más unidades del mismo producto: botón + en el carrito."
                    : "Apuntá al código de barras"}
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="shrink-0 rounded-full bg-white/15 text-white hover:bg-white/25"
              onClick={handleClose}
              aria-label="Cerrar escáner"
            >
              <X className="size-5" />
            </Button>
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center p-4">
            {phase === "confirm" ? (
              <motion.div
                className="flex w-full max-w-md flex-col items-center gap-5 px-2 text-center text-white"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex size-20 items-center justify-center rounded-full bg-emerald-500/25 text-emerald-300">
                  <CheckCircle2 className="size-11" strokeWidth={1.75} />
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-emerald-400/90">
                    Agregado a la compra
                  </div>
                  <div className="mt-2 text-balance text-lg font-semibold leading-snug">{confirmName}</div>
                </div>
                <p className="text-balance text-sm text-white/75">
                  ¿Querés seguir agregando productos a esta compra?
                </p>
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button
                    type="button"
                    className="h-12 w-full rounded-xl bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-700 sm:min-w-[11rem]"
                    onClick={handleScanAnother}
                  >
                    Escanear otro
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-12 w-full rounded-xl border border-white/20 bg-white/10 text-base font-medium text-white hover:bg-white/20 sm:min-w-[11rem]"
                    onClick={handleClose}
                  >
                    Listo, cerrar
                  </Button>
                </div>
                <p className="text-balance text-xs text-white/50">
                  Para repetir el mismo producto, usá el botón + en el carrito.
                </p>
              </motion.div>
            ) : starting ? (
              <div className="text-sm text-white/80">Iniciando cámara…</div>
            ) : null}

            {phase === "scanning" && error ? (
              <div className="flex max-w-sm flex-col items-center gap-4 text-center">
                <CameraOff className="size-12 text-rose-300" />
                <p className="text-sm text-white/90">{error}</p>
                <Button type="button" variant="secondary" onClick={() => onClose()}>
                  Cerrar
                </Button>
              </div>
            ) : null}

            {phase === "scanning" && !error ? (
              <div
                id={SCANNER_ELEMENT_ID}
                className="w-full max-w-lg overflow-hidden rounded-2xl bg-black [&_video]:max-h-[min(50vh,420px)] [&_video]:w-full [&_video]:object-cover"
              />
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
