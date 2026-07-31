"use client";

import * as React from "react";
import { Scale, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateScaleBarcodeMode } from "@/app/app/(main)/settings/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ScaleBarcodeMode } from "@/lib/scale-barcode";

type Props = {
  defaultMode?: ScaleBarcodeMode;
};

export function ScaleBarcodeSettingsForm({ defaultMode = "weight" }: Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [mode, setMode] = React.useState<ScaleBarcodeMode>(defaultMode);

  React.useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  const handleSubmit = () => {
    const fd = new FormData();
    fd.set("scale_barcode_mode", mode);

    startTransition(async () => {
      const result = await updateScaleBarcodeMode(fd);
      if ("error" in result && result.error) {
        toast.error("No se pudo guardar", { description: result.error });
        return;
      }
      toast.success("Configuracion de balanza actualizada");
      router.refresh();
    });
  };

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-zinc-900">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300">
          <Scale className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Lectura de balanza</h2>
          <p className="text-sm text-muted-foreground">
            Defini como el POS interpreta los codigos de barras de etiquetas pesables.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="scale_barcode_mode" className="flex items-center gap-1.5">
            <Ticket className="size-3.5 text-muted-foreground" />
            Tipo de codigo de balanza
          </Label>
          <select
            id="scale_barcode_mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as ScaleBarcodeMode)}
            className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="weight">Lee peso</option>
            <option value="price">Lee importe</option>
            <option value="both">Ambos (intenta peso e importe)</option>
          </select>
        </div>

        <div className="rounded-lg border border-dashed border-cyan-300/70 bg-cyan-50/70 p-4 text-sm text-cyan-950 dark:border-cyan-900/40 dark:bg-cyan-950/10 dark:text-cyan-100">
          <p className="font-medium">Recomendacion para tu caso</p>
          <p className="mt-1 text-cyan-900/80 dark:text-cyan-100/80">
            Para tickets Kretz como el de <span className="font-semibold">Panceta 42 / 00041</span>, elegi{" "}
            <span className="font-semibold">Lee importe</span>.
          </p>
        </div>

        <div className="rounded-lg border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
          <p>
            `Lee peso`: interpreta los 5 digitos variables como gramos.
          </p>
          <p>
            `Lee importe`: interpreta esos 5 digitos como total del item y calcula el peso con el precio por kilo.
          </p>
          <p>
            `Ambos`: intenta ambos formatos. Usalo solo si el negocio realmente mezcla balanzas distintas.
          </p>
        </div>

        <div className="flex justify-end">
          <Button type="button" disabled={pending} onClick={handleSubmit} className="min-w-32">
            {pending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </div>
  );
}
