"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Check, ChefHat, LayoutGrid, Shirt, Store } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type Props = {
  action: (formData: FormData) => Promise<void>;
  selectedPlan?: string;
};

export function SetupForm({ action, selectedPlan = "" }: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const suggestedSlug = useMemo(() => slugify(name), [name]);
  const slugValue = slugTouched ? slug : suggestedSlug;

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="plan" value={selectedPlan} />
      <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-blue-50 to-violet-50 p-4 text-sm text-slate-600">
        <div className="inline-flex items-center gap-2 font-bold text-violet-700">
          <Store className="size-4" />
          Configuración inicial
        </div>
        <div className="mt-1">Completá el nombre y Tienda360 preparará el espacio de trabajo de tu comercio.</div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="name" className="font-bold text-slate-800">Nombre del negocio <span className="text-rose-500">*</span></Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Kiosco Central"
          className="h-12 rounded-xl border-slate-200 bg-white text-base text-slate-900 shadow-sm focus-visible:border-blue-500"
          required
          autoFocus
        />
      </div>

      <div className="grid gap-2 md:grid-cols-2 md:gap-4">
        <div className="grid gap-2">
        <Label htmlFor="slug" className="font-bold text-slate-800">Slug <span className="font-normal text-slate-400">(opcional)</span></Label>
        <Input
          id="slug"
          name="slug"
          value={slugValue}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          placeholder="mi-negocio"
          className="h-12 rounded-xl border-slate-200 bg-white text-slate-900 shadow-sm"
        />
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          {slugValue ? <Check className="size-3.5 text-emerald-600" /> : null}
          URL sugerida: <span className="font-semibold text-slate-700">{slugValue || "mi-negocio"}</span>
        </div>
      </div>

        <div className="grid gap-2">
        <Label htmlFor="business_type" className="flex items-center gap-1.5 font-bold text-slate-800">
          <LayoutGrid className="size-4 text-blue-600" />
          Tipo de negocio
        </Label>
        <select
          id="business_type"
          name="business_type"
          defaultValue="retail"
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm outline-none focus-visible:border-blue-500 focus-visible:ring-3 focus-visible:ring-blue-500/20"
        >
          <option value="retail">Comercio, lector y pesables</option>
          <option value="fashion">Indumentaria y variantes</option>
          <option value="gastronomy">Gastronomía, mesas y delivery</option>
        </select>
        <div className="flex gap-2 text-[11px] text-slate-500"><Store className="size-3.5" /><Shirt className="size-3.5" /><ChefHat className="size-3.5" /><span>Adaptaremos productos y ventas.</span></div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-xs leading-relaxed text-slate-600">
        La información de tu comercio se guardará de forma independiente y segura.
      </div>

      <CreateBusinessButton />
    </form>
  );
}

function CreateBusinessButton() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 px-4 text-base font-black text-white shadow-[0_16px_34px_-14px_rgba(79,70,229,.8)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70">
      <Store className="size-5" />
      {pending ? "Creando tu comercio…" : "Crear negocio"}
      {!pending ? <ArrowRight className="size-5" /> : null}
    </button>
  );
}
