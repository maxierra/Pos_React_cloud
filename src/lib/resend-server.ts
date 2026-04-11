/** Remitente para mails transaccionales (alertas admin, bienvenida, reportes). */
export function resendFromAddress(): string {
  const raw = (process.env.RESEND_FROM ?? "").trim();
  if (raw) return raw;
  return "POS <onboarding@resend.dev>";
}

export async function sendTransactionalEmail(to: string, subject: string, text: string): Promise<void> {
  const key = (process.env.RESEND_API_KEY ?? "").trim();
  if (!key) {
    console.warn("[resend] RESEND_API_KEY no configurada; no se envía mail.");
    return;
  }
  const { Resend } = await import("resend");
  const resend = new Resend(key);
  const result = await resend.emails.send({
    from: resendFromAddress(),
    to: [to],
    subject,
    text,
  });
  if (result.error) {
    const err = result.error as { message?: string; name?: string };
    console.error("[resend] No se pudo enviar a", to, "→", err.message ?? result.error);
    const m = String(err.message ?? "");
    if (m.includes("testing emails") || m.includes("verify a domain")) {
      console.warn(
        "[resend] Cuenta en modo prueba: solo podés enviar al mail asociado a Resend. Para otros correos, verificá un dominio en https://resend.com/domains y usá RESEND_FROM con ese dominio."
      );
    }
  }
}
