/**
 * Lista de mails con acceso al panel /app/admin (activación manual de suscripciones).
 * Variable de entorno: PLATFORM_ADMIN_EMAILS (separados por coma o punto y coma).
 * Compatible con Edge (middleware) y Node (server actions).
 */
export function parsePlatformAdminEmails(): string[] {
  let raw = (process.env.PLATFORM_ADMIN_EMAILS ?? "").replace(/^\uFEFF/, "").trim();
  // Por si el .env tiene saltos de línea o espacios raros (Windows / copiar-pegar)
  if (!raw) return [];
  return raw
    .split(/[,;\n\r]+/)
    .map((s) => s.trim().toLowerCase().replace(/\uFEFF/g, ""))
    .filter(Boolean);
}

export function emailIsPlatformAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const allow = parsePlatformAdminEmails();
  return allow.length > 0 && allow.includes(normalized);
}
