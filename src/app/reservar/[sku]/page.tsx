import Link from "next/link";
import { notFound } from "next/navigation";

import { ReservaForm } from "@/app/reservar/[sku]/reserva-form";
import { getStoreProductBySku } from "@/lib/store-products";

type Props = {
  params: Promise<{ sku: string }>;
};

const ALLOWED = new Set(["combo_essential", "combo_initial", "combo_commerce", "combo_advanced"]);

export default async function ReservarComboPage({ params }: Props) {
  const { sku } = await params;
  if (!ALLOWED.has(sku)) notFound();

  const product = await getStoreProductBySku(sku);
  if (!product) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/90 via-zinc-50 to-emerald-50/70">
      <header className="border-b border-amber-100/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-sm font-semibold text-slate-900">
            ← Volver al inicio
          </Link>
          <Link href="/auth/login" className="text-sm font-medium text-amber-800 hover:underline">
            Ingresar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Coordiná tu instalación</h1>
        <p className="mt-2 text-sm text-slate-600">
          Para CABA y AMBA: completá tus datos y te contactamos para coordinar entrega, instalación, capacitación y pago.
        </p>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <ReservaForm comboSku={product.sku} comboTitle={product.name} price={product.price_ars} />
        </div>
      </main>
    </div>
  );
}
