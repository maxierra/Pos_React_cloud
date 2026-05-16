/**
 * Convierte fechas que vienen de Postgres (timestamptz) o del cliente Supabase a ms UTC.
 *
 * Si el string no trae zona (`Z` u offset), lo tratamos como **UTC** — así coincide con cómo
 * Postgres guarda el instante. Sin esto, `new Date("2026-03-24 12:00:00")` en el navegador
 * puede interpretarse como hora **local** (ej. Argentina) y desfasar ~3 h respecto al servidor.
 */
export function parseDbTimestamptzMs(input: string | null | undefined): number | null {
  if (input == null) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  if (/z$/i.test(raw)) {
    const t = Date.parse(raw);
    return Number.isFinite(t) ? t : null;
  }

  const m = raw.match(/^(.+?)([+-]\d{2}(?::?\d{2})?)$/);
  if (m) {
    let body = m[1].trim().replace(" ", "T");
    let zone = m[2];
    if (/^[+-]\d{2}$/.test(zone)) {
      zone = `${zone}:00`;
    }
    const t = Date.parse(`${body}${zone}`);
    if (Number.isFinite(t)) return t;
  }

  const asIso = raw.replace(" ", "T");
  const t = Date.parse(`${asIso}Z`);
  return Number.isFinite(t) ? t : null;
}

export function parseDbTimestamptzToDate(input: string | null | undefined): Date | null {
  const ms = parseDbTimestamptzMs(input);
  return ms == null ? null : new Date(ms);
}
