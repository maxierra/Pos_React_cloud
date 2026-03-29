"use client";

import * as React from "react";
import "./etiquetas-print.css";
import { toast } from "sonner";
import { Printer, ScanLine } from "lucide-react";

import { findProductByScan, type ProductLabelRow } from "@/app/app/(main)/etiquetas/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function moneyAr(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);
}

export function barcodeValue(p: ProductLabelRow) {
  const v = (p.barcode ?? "").trim() || (p.sku ?? "").trim();
  if (v.length > 0) return v;
  return p.id.replace(/-/g, "").slice(0, 12);
}

export function EtiquetasClient({ businessName }: { businessName: string }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const printRef = React.useRef<HTMLDivElement>(null);
  const [scan, setScan] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [product, setProduct] = React.useState<ProductLabelRow | null>(null);
  const [copies, setCopies] = React.useState(1);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const lookup = React.useCallback(async () => {
    const q = scan.trim();
    if (!q) {
      toast.error("Ingresá un código o escaneá el producto");
      return;
    }
    setLoading(true);
    try {
      const p = await findProductByScan(q);
      if (!p) {
        setProduct(null);
        toast.error("No encontramos un producto con ese código.");
        return;
      }
      setProduct(p);
      toast.success("Producto encontrado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [scan]);

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        void lookup();
      }
    },
    [lookup]
  );

  const runPrint = React.useCallback(async () => {
    if (!product) return;
    const n = Math.min(200, Math.max(1, Math.floor(copies)));
    const code = barcodeValue(product);
    const JsBarcode = (await import("jsbarcode")).default;

    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    const root = printRef.current;
    if (!root) return;
    const svgs = root.querySelectorAll<SVGSVGElement>("[data-barcode-slot]");
    if (svgs.length === 0) return;

    svgs.forEach((svg) => {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      try {
        JsBarcode(svg, code, {
          format: "CODE128",
          width: 1.15,
          height: 36,
          displayValue: true,
          fontSize: 10,
          margin: 4,
        });
      } catch {
        /* código no compatible con CODE128 */
      }
    });

    const done = () => {
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
  }, [copies, product]);

  const nPrint = product ? Math.min(200, Math.max(1, Math.floor(copies))) : 0;
  const bc = product ? barcodeValue(product) : "";

  return (
    <>
      <div className="etiquetas-ui mx-auto w-full max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Etiquetas de góndola</h1>
          <p className="text-sm text-muted-foreground">
            Escaneá o escribí el código de barras / SKU y generá etiquetas listas para imprimir.
          </p>
        </div>

        <Card className="overflow-hidden border-primary/20">
          <CardHeader className="border-b bg-primary/5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ScanLine className="size-5" />
              Buscar producto
            </CardTitle>
            <CardDescription>
              El lector USB suele escribir el código y pulsar Enter; también podés pegar el código manualmente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="scan">Código de barras o SKU</Label>
                <Input
                  id="scan"
                  ref={inputRef}
                  value={scan}
                  onChange={(e) => setScan(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Escaneá aquí…"
                  autoComplete="off"
                  className="font-mono text-base"
                />
              </div>
              <Button type="button" onClick={() => void lookup()} disabled={loading}>
                {loading ? "Buscando…" : "Buscar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {product ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Vista previa</CardTitle>
                <CardDescription>Así se verá la etiqueta.</CardDescription>
              </CardHeader>
              <CardContent>
                <ShelfLabelPreview businessName={businessName} product={product} code={bc} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Imprimir</CardTitle>
                <CardDescription>Cantidad de etiquetas iguales para la góndola (máx. 200).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="copies">Copias</Label>
                  <Input
                    id="copies"
                    type="number"
                    min={1}
                    max={200}
                    value={copies}
                    onChange={(e) => setCopies(Number(e.target.value) || 1)}
                  />
                </div>
                <Button type="button" className="w-full gap-2 sm:w-auto" onClick={() => void runPrint()}>
                  <Printer className="size-4" />
                  Imprimir etiquetas
                </Button>
                <p className="text-xs text-muted-foreground">
                  Se abre el diálogo de impresión del sistema; podés guardar como PDF. Las etiquetas están optimizadas para papel
                  continuo o hoja A4.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>

      {/* Fuera de pantalla pero en el DOM para que JsBarcode pueda medir; visible al imprimir */}
      {product ? (
        <div
          ref={printRef}
          className="etiquetas-print-area fixed left-[-9999px] top-0 z-[-1] w-[min(100vw,820px)] bg-white p-4"
          aria-hidden
        >
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(82mm, 1fr))" }}
          >
            {Array.from({ length: nPrint }).map((_, i) => (
              <div
                key={i}
                className="flex h-[42mm] w-[82mm] flex-col justify-between border border-neutral-400 bg-white p-3 text-black print:break-inside-avoid"
              >
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-neutral-600">{businessName}</p>
                  <p className="line-clamp-2 text-sm font-bold leading-tight">{product.name}</p>
                </div>
                <p className="text-2xl font-semibold tabular-nums text-neutral-900">{moneyAr(product.price)}</p>
                <svg data-barcode-slot className="mx-auto max-h-[40mm] w-full" />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

function ShelfLabelPreview({
  businessName,
  product,
  code,
}: {
  businessName: string;
  product: ProductLabelRow;
  code: string;
}) {
  const svgRef = React.useRef<SVGSVGElement | null>(null);

  React.useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    let cancelled = false;
    void (async () => {
      const JsBarcode = (await import("jsbarcode")).default;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      if (cancelled) return;
      try {
        JsBarcode(svg, code, {
          format: "CODE128",
          width: 1.15,
          height: 36,
          displayValue: true,
          fontSize: 10,
          margin: 4,
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, product.id]);

  return (
    <div className="mx-auto flex h-[42mm] w-full max-w-[82mm] flex-col justify-between border-2 border-neutral-800 bg-white p-3 text-black shadow-sm">
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-wider text-neutral-600">{businessName}</p>
        <p className="line-clamp-2 text-sm font-bold leading-tight">{product.name}</p>
      </div>
      <p className="text-2xl font-semibold tabular-nums text-neutral-900">{moneyAr(product.price)}</p>
      <svg ref={svgRef} className="mx-auto max-h-[40mm] w-full" />
    </div>
  );
}
