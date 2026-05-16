/**
 * URL pública de la app (callbacks, webhooks, emails).
 * En Render usá NEXT_PUBLIC_APP_URL o dejá que use RENDER_EXTERNAL_URL (inyectada por Render).
 *
 * Mercado Pago exige back_urls / notification_url como URLs absolutas con esquema (https en producción).
 * Si la variable viene sin "https://", se normaliza para no obtener "back_urls invalid. Wrong format".
 */

function stripOuterQuotes(s: string): string {
  const t = s.trim();
  if (t.length >= 2 && ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))) {
    return t.slice(1, -1).trim();
  }
  return t;
}

function trimTrailingSlashes(s: string): string {
  return s.replace(/\/+$/, "");
}

/**
 * Garantiza https:// o http:// (solo host local).
 */
export function normalizeAppOrigin(raw: string): string {
  let u = trimTrailingSlashes(stripOuterQuotes(raw));
  if (!u) return u;

  u = u.replace(/^\/+/, "");

  if (/^https?:\/\//i.test(u)) {
    return u;
  }

  const isProbablyLocal =
    /^(localhost\b|127\.0\.0\.1)/i.test(u) || /^192\.168\.\d+\.\d+/i.test(u) || /^10\.\d+\.\d+\.\d+/.test(u);

  return `${isProbablyLocal ? "http" : "https"}://${u}`;
}

export function getAppBaseUrl(): string {
  const norm = (s: string) => trimTrailingSlashes(stripOuterQuotes(s));

  const ordered = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_BASE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.RENDER_EXTERNAL_URL,
  ];

  for (const raw of ordered) {
    let v = norm(raw ?? "");
    if (v) {
      // Fix para Render: RENDER_EXTERNAL_URL incluye :10000 que es interno
      if (v.includes(':10000')) {
        v = v.replace(':10000', '');
      }
      return normalizeAppOrigin(v);
    }
  }

  const vercel = norm(process.env.VERCEL_URL ?? "");
  if (vercel) return normalizeAppOrigin(`https://${vercel}`);

  return "http://localhost:3000";
}
