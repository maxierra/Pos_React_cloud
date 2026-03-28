/**
 * URL pública de la app (callbacks, webhooks, emails).
 * En Render usá NEXT_PUBLIC_APP_URL o dejá que use RENDER_EXTERNAL_URL (inyectada por Render).
 */
export function getAppBaseUrl(): string {
  const norm = (s: string) => s.trim().replace(/\/+$/, "");

  const ordered = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_BASE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.RENDER_EXTERNAL_URL,
  ];

  for (const raw of ordered) {
    const v = norm(raw ?? "");
    if (v) return v;
  }

  const vercel = norm(process.env.VERCEL_URL ?? "");
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}
