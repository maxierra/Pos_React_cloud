"use client";

import * as React from "react";
import { Receipt, X } from "lucide-react";

import { createFixedExpense } from "@/app/app/(main)/reports/actions";

type Props = {
  label: string;
  month: string;
  monthLabel: string;
};

export function ExpenseModalButton({ label, month, monthLabel }: Props) {
  const [open, setOpen] = React.useState(false);
  const [concept, setConcept] = React.useState("Alquiler");
  const [customConcept, setCustomConcept] = React.useState("");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex h-10 w-fit items-center justify-center gap-2 rounded-xl border border-cyan-300/35 bg-cyan-300/15 px-4 text-xs font-extrabold text-cyan-100 transition hover:bg-cyan-300/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
      >
        <Receipt className="size-4" />
        {label}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="expense-modal-title" className="w-full max-w-xl overflow-hidden rounded-3xl border border-cyan-300/25 bg-[#101a2e] text-blue-50 shadow-[0_30px_90px_-30px_rgba(34,211,238,.55)]">
            <div
              className="relative overflow-hidden border-b border-blue-300/15 px-6 py-5"
              style={{ background: "radial-gradient(circle at 90% 0%, rgba(124,58,237,.38), transparent 42%), linear-gradient(135deg,#0b2a55,#17245d)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300/15 text-cyan-200">
                    <Receipt className="size-5" />
                  </span>
                  <div>
                    <h2 id="expense-modal-title" className="text-lg font-black">Cargar gasto fijo</h2>
                    <p className="mt-0.5 text-xs text-blue-200/75">Se aplicará únicamente a {monthLabel}.</p>
                  </div>
                </div>
                <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-blue-100 transition hover:bg-white/15">
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <form action={createFixedExpense} className="grid gap-5 p-6 sm:p-7">
              <input type="hidden" name="month" value={month} />
              <input type="hidden" name="name" value={concept === "Otros" ? customConcept : concept} />

              <label className="grid gap-1.5 text-xs font-bold text-blue-100">
                Concepto
                <select
                  autoFocus
                  value={concept}
                  onChange={(event) => setConcept(event.target.value)}
                  className="h-11 w-full cursor-pointer rounded-xl border border-blue-300/20 px-3 text-sm font-semibold outline-none focus:border-cyan-400"
                  style={{ backgroundColor: "#17243a", color: "#f8fafc", colorScheme: "dark" }}
                >
                  <option>Alquiler</option>
                  <option>Sueldos</option>
                  <option>Internet</option>
                  <option>Luz</option>
                  <option>Gas</option>
                  <option>Agua</option>
                  <option>Teléfono</option>
                  <option>Expensas</option>
                  <option>Impuestos</option>
                  <option>Seguros</option>
                  <option>Mantenimiento</option>
                  <option>Otros</option>
                </select>
              </label>

              {concept === "Otros" ? (
                <label className="grid gap-1.5 text-xs font-bold text-blue-100">
                  Especificar concepto
                  <input
                    value={customConcept}
                    onChange={(event) => setCustomConcept(event.target.value)}
                    placeholder="Escribí el concepto del gasto"
                    required
                    className="h-11 rounded-xl border border-blue-300/20 bg-[#17243a] px-3 text-sm text-white outline-none placeholder:text-blue-200/40 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15"
                  />
                </label>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-bold text-blue-100">
                  Monto
                  <input name="amount" type="number" min="0.01" step="0.01" placeholder="0,00" required className="h-11 rounded-xl border border-blue-300/20 bg-[#17243a] px-3 text-sm font-bold text-white outline-none placeholder:text-blue-200/40 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15" />
                </label>

                <label className="grid gap-1.5 text-xs font-bold text-blue-100">
                  Frecuencia
                  <select
                    name="frequency"
                    defaultValue="monthly"
                    className="h-11 w-full cursor-pointer rounded-xl border border-blue-300/20 px-3 text-sm font-semibold outline-none focus:border-cyan-400"
                    style={{ backgroundColor: "#17243a", color: "#f8fafc", colorScheme: "dark" }}
                  >
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </label>
              </div>

              <label className="grid gap-1.5 text-xs font-bold text-blue-100">
                <span>Categoría <span className="font-normal text-blue-200/50">(opcional)</span></span>
                <input name="category" placeholder="Operativo, administración..." className="h-11 rounded-xl border border-blue-300/20 bg-[#17243a] px-3 text-sm text-white outline-none placeholder:text-blue-200/40 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15" />
              </label>

              <div className="mt-1 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setOpen(false)} className="h-12 w-full rounded-xl border border-blue-300/20 bg-white/5 text-sm font-bold text-blue-100 transition hover:bg-white/10">Cancelar</button>
                <button
                  type="submit"
                  className="h-12 w-full rounded-xl text-sm font-black text-white shadow-[0_12px_30px_-15px_rgba(34,211,238,.8)] transition hover:brightness-110"
                  style={{ background: "linear-gradient(90deg,#06b6d4 0%,#2563eb 52%,#7c3aed 100%)" }}
                >
                  Guardar gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
