/**
 * Integración con RawBT (app Android) vía deep link.
 *
 * RawBT registra el esquema personalizado `rawbt://`. Al asignar
 * `window.location.href = "rawbt://print?text=..."`, el sistema intenta
 * abrir la app con el texto ya cargado para enviarlo a la impresora térmica
 * Bluetooth configurada en RawBT. No pasa por el diálogo de impresión de Chrome.
 *
 * Documentación / esquema usado por la comunidad ESC/POS:
 * - Texto: rawbt://print?text=<URI-encoded>
 * - Binario pre-armado en base64 (útil para ESC/POS): rawbt://print?base64=<URI-encoded>
 *
 * @see https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter (RawBT)
 *
 * No mostramos alert si RawBT “no está instalado”: en Chrome Android la pestaña suele
 * seguir `visible` y sin `blur` al abrir la app, y cualquier heurística dispara falsos positivos.
 */

/** UA “mobile” amplio (layout / UX); RawBT solo aplica en Android. */
export function isMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** RawBT solo está disponible en Android. */
export function isAndroidUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

/**
 * Envía texto plano a RawBT (solo Android). En otros entornos solo registra en consola.
 */
export function printTicket(ticket: string): void {
  if (typeof window === "undefined") return;

  if (!isAndroidUserAgent()) {
    if (typeof console !== "undefined") {
      console.log("[RawBT] omitido (no Android). Ticket:\n", ticket);
    }
    return;
  }

  const encoded = encodeURIComponent(ticket);
  window.location.href = `rawbt://print?text=${encoded}`;
}

/**
 * Envía payload ya codificado en base64 (p. ej. bytes ESC/POS concatenados y luego btoa).
 * El valor se pasa URI-encoded en la query.
 */
export function printTicketBase64(base64: string): void {
  if (typeof window === "undefined") return;

  if (!isAndroidUserAgent()) {
    if (typeof console !== "undefined") {
      console.log("[RawBT] omitido (no Android). Base64 length:", base64.length);
    }
    return;
  }

  const encoded = encodeURIComponent(base64);
  window.location.href = `rawbt://print?base64=${encoded}`;
}
