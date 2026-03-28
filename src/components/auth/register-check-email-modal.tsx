"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  email: string | null;
};

export function RegisterCheckEmailModal({ open, email }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const onClose = () => {
      router.replace("/auth/register");
    };
    el.addEventListener("close", onClose);
    return () => el.removeEventListener("close", onClose);
  }, [router]);

  function dismiss() {
    dialogRef.current?.close();
  }

  return (
    <dialog
      ref={dialogRef}
      className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/15 bg-[#0b1020]/95 p-0 text-white shadow-[0_0_60px_-12px_rgba(217,70,239,0.45)] backdrop:bg-black/70 open:backdrop:bg-black/70 [&::backdrop]:bg-black/70"
    >
      <div className="border-b border-white/10 p-6 md:p-8">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10">
          <Mail className="size-7 text-cyan-200" aria-hidden />
        </div>
        <h2 className="mt-5 text-center text-xl font-bold tracking-tight md:text-2xl">Revisá tu correo</h2>
        <p className="mt-3 text-center text-sm leading-relaxed text-white/70">
          Te enviamos un enlace para <strong className="text-white">confirmar tu cuenta</strong>. Hasta que no lo
          abras, no vas a poder entrar al panel (así evitamos confusiones con el acceso).
        </p>
        {email ? (
          <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-sm text-cyan-100/90">
            Enviado a <span className="font-semibold text-white">{email}</span>
          </p>
        ) : null}
        <p className="mt-3 text-center text-xs text-white/50">Si no lo ves, revisá spam o promociones.</p>
      </div>
      <div className="flex flex-col gap-3 p-6 md:flex-row md:justify-center md:px-8 md:pb-8">
        <button
          type="button"
          onClick={dismiss}
          className="h-11 rounded-2xl border border-white/20 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Listo, voy al mail
        </button>
        <Link
          href="/auth/login"
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 px-4 text-sm font-bold text-white shadow-[0_0_28px_-8px_rgba(217,70,239,0.5)] transition hover:opacity-95"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    </dialog>
  );
}
