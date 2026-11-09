"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Hash, Package, ScanLine } from "lucide-react";
import { toast } from "sonner";

import { BarcodeScanner } from "@/components/BarcodeScanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateInternalEan13, INTERNAL_PRODUCT_DEFAULTS } from "@/lib/internal-barcode";
import { normalizeScaleCode } from "@/lib/scale-barcode";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/browser";

const STEPS = 5;

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function parseNumberLoose(input: string) {
  const raw = String(input ?? "").replace(",", ".").trim();
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function formatNumberLoose(n: number) {
  if (!Number.isFinite(n)) return "0";
  return String(n);
}

type PreloadRow = {
  ean: string;
  name: string;
  brand: string | null;
  price_real: number | null;
  price_offer: number | null;
  cat1: string | null;
  cat2: string | null;
  cat3: string | null;
};

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  canEditPrice?: boolean;
  canEditStock?: boolean;
  onDuplicateBarcode?: (barcode: string) => boolean;
};

export function ProductCreateMobileWizard({
  action,
  canEditPrice = true,
  canEditStock = true,
  onDuplicateBarcode,
}: Props) {
  const [step, setStep] = React.useState(1);
  const [scannerOpen, setScannerOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const [barcodeInput, setBarcodeInput] = React.useState("");
  const [nameInput, setNameInput] = React.useState("");
  const [categoryInput, setCategoryInput] = React.useState("");
  const [soldByWeight, setSoldByWeight] = React.useState(false);
  const [scaleCodeInput, setScaleCodeInput] = React.useState("");
  const [expiresAtInput, setExpiresAtInput] = React.useState("");
  const [activeProduct, setActiveProduct] = React.useState(true);

  const [costInput, setCostInput] = React.useState("0");
  const [marginInput, setMarginInput] = React.useState("0");
  const [priceInput, setPriceInput] = React.useState("0");
  const [lastEdited, setLastEdited] = React.useState<"margin" | "price">("margin");

  const [stockInput, setStockInput] = React.useState("100");
  const [lowStockThresholdInput, setLowStockThresholdInput] = React.useState("50");
  const [stockDecimalInput, setStockDecimalInput] = React.useState("100");
  const [lowStockThresholdDecimalInput, setLowStockThresholdDecimalInput] = React.useState("50");

  const rejectDuplicateBarcode = React.useCallback(
    (raw: string) => {
      if (!onDuplicateBarcode?.(raw)) return false;
      setBarcodeInput("");
      return true;
    },
    [onDuplicateBarcode]
  );

  const [preloadLoading, setPreloadLoading] = React.useState(false);
  const [preload, setPreload] = React.useState<PreloadRow | null>(null);
  const lastAutoFilledEanRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    lastAutoFilledEanRef.current = null;
  }, [barcodeInput]);

  const preloadRepresentativeCategory = React.useMemo(() => {
    if (!preload) return null;
    return preload.cat3 || preload.cat2 || preload.cat1 || null;
  }, [preload]);

  const preloadSuggestedPrice = React.useMemo(() => {
    if (!preload) return null;
    const offer = preload.price_offer ?? null;
    const real = preload.price_real ?? null;
    if (offer && offer > 0) return offer;
    if (real && real > 0) return real;
    return null;
  }, [preload]);

  const preloadCategoryPath = React.useMemo(() => {
    if (!preload) return null;
    const parts = [preload.cat1, preload.cat2, preload.cat3].filter(Boolean);
    return parts.length ? parts.join(" > ") : null;
  }, [preload]);

  React.useEffect(() => {
    const ean = barcodeInput.replace(/\s+/g, "").trim();
    if (!ean) {
      setPreload(null);
      return;
    }

    const t = window.setTimeout(() => {
      void (async () => {
        try {
          setPreloadLoading(true);
          const supabase = createClient();
          const tryLoad = async (select: string) => {
            return await supabase.from("preload_products").select(select).eq("ean", ean).limit(1).maybeSingle();
          };
          const first = await tryLoad("ean,producto,brand,precioReal,precioOferta,cat1,cat2,cat3");
          const second =
            first.error && !first.data
              ? await tryLoad("ean,producto,brand,precioreal,preciooferta,cat1,cat2,cat3")
              : { data: null, error: null };
          const third =
            first.error && second.error && !second.data
              ? await tryLoad("ean,producto,brand,precio_real,precio_oferta,cat1,cat2,cat3")
              : { data: null, error: null };
          const fourth =
            first.error && second.error && third.error && !third.data
              ? await tryLoad("ean,name,brand,price_real,price_offer,cat1,cat2,cat3")
              : { data: null, error: null };
          const data = (first.data ?? second.data ?? third.data ?? fourth.data) as Record<string, unknown> | null;
          const error = first.error && second.error && third.error && fourth.error ? fourth.error : null;

          if (error || !data) {
            setPreload(null);
            setPreloadLoading(false);
            return;
          }

          const name = data.name ?? data.producto ?? "";
          const priceReal = data.price_real ?? data.precio_real ?? data.precioreal ?? data.precioReal;
          const priceOffer = data.price_offer ?? data.precio_oferta ?? data.preciooferta ?? data.precioOferta;

          setPreload({
            ean: String(data.ean),
            name: String(name ?? ""),
            brand: data.brand ? String(data.brand) : null,
            price_real: priceReal != null ? Number(priceReal) : null,
            price_offer: priceOffer != null ? Number(priceOffer) : null,
            cat1: data.cat1 ? String(data.cat1) : null,
            cat2: data.cat2 ? String(data.cat2) : null,
            cat3: data.cat3 ? String(data.cat3) : null,
          });
          setPreloadLoading(false);
        } catch {
          setPreload(null);
          setPreloadLoading(false);
        }
      })();
    }, 250);

    return () => window.clearTimeout(t);
  }, [barcodeInput]);

  React.useEffect(() => {
    if (!preload) return;
    if (lastAutoFilledEanRef.current === preload.ean) return;
    lastAutoFilledEanRef.current = preload.ean;

    const brand = preload.brand ? String(preload.brand).trim() : "";
    const baseName = String(preload.name ?? "").trim();
    if (!nameInput.trim()) {
      setNameInput(brand ? `${baseName} - ${brand}` : baseName);
    }
    if (!categoryInput.trim() && preloadRepresentativeCategory) {
      setCategoryInput(preloadRepresentativeCategory);
    }

    const suggestedPrice = (() => {
      const offer = preload.price_offer ?? null;
      const real = preload.price_real ?? null;
      if (offer && offer > 0) return offer;
      if (real && real > 0) return real;
      return null;
    })();

    if (suggestedPrice != null) {
      const currentPrice = parseNumberLoose(priceInput);
      if (!currentPrice) {
        setLastEdited("price");
        setPriceInput(formatNumberLoose(suggestedPrice));
      }
    }

    if (!expiresAtInput) setExpiresAtInput("2099-12-31");

    if (!soldByWeight) {
      const currentStock = Number(stockInput);
      const currentMin = Number(lowStockThresholdInput);
      if (!currentStock) setStockInput("100");
      if (!currentMin) setLowStockThresholdInput("50");
    } else {
      const currentStock = Number(stockDecimalInput);
      const currentMin = Number(lowStockThresholdDecimalInput);
      if (!currentStock) setStockDecimalInput("100");
      if (!currentMin) setLowStockThresholdDecimalInput("50");
    }
  }, [preload, soldByWeight]);

  const cost = React.useMemo(() => parseNumberLoose(costInput), [costInput]);
  const margin = React.useMemo(() => parseNumberLoose(marginInput), [marginInput]);
  const price = React.useMemo(() => parseNumberLoose(priceInput), [priceInput]);

  React.useEffect(() => {
    if (lastEdited !== "margin") return;
    const p = round2(cost * (1 + margin / 100));
    setPriceInput(formatNumberLoose(p));
  }, [cost, margin, lastEdited]);

  React.useEffect(() => {
    if (lastEdited !== "price") return;
    if (!cost) {
      setMarginInput("0");
      return;
    }
    const m = round2(((price - cost) / cost) * 100);
    setMarginInput(formatNumberLoose(m));
  }, [cost, price, lastEdited]);

  const goNext = React.useCallback(() => {
    if (step === 1 && rejectDuplicateBarcode(barcodeInput)) return;
    if (step === 2 && !nameInput.trim()) {
      toast.error("Falta el nombre del producto");
      return;
    }
    if (step === 3 && canEditPrice) {
      const c = parseNumberLoose(costInput);
      if (c <= 0) {
        toast.error("Ingresá un precio de compra mayor a 0");
        return;
      }
    }
    setStep((s) => Math.min(STEPS, s + 1));
  }, [step, barcodeInput, rejectDuplicateBarcode, nameInput, costInput, canEditPrice]);

  const goBack = React.useCallback(() => setStep((s) => Math.max(1, s - 1)), []);

  const buildFormData = React.useCallback(() => {
    const fd = new FormData();
    fd.set("name", nameInput.trim());
    fd.set("barcode", barcodeInput.trim());
    fd.set("scale_code", normalizeScaleCode(scaleCodeInput) ?? "");
    fd.set("category", categoryInput.trim());
    fd.set("sold_by_weight", soldByWeight ? "on" : "off");
    fd.set("cost", costInput);
    fd.set("price", priceInput);
    fd.set("expires_at", expiresAtInput.trim());
    fd.set("active", activeProduct ? "on" : "off");
    if (soldByWeight) {
      fd.set("stock_decimal", stockDecimalInput);
      fd.set("low_stock_threshold_decimal", lowStockThresholdDecimalInput);
      fd.set("stock", "0");
      fd.set("low_stock_threshold", "0");
    } else {
      fd.set("stock", stockInput);
      fd.set("low_stock_threshold", lowStockThresholdInput);
      fd.set("stock_decimal", "0");
      fd.set("low_stock_threshold_decimal", "0");
    }
    return fd;
  }, [
    nameInput,
    barcodeInput,
    scaleCodeInput,
    categoryInput,
    soldByWeight,
    costInput,
    priceInput,
    expiresAtInput,
    activeProduct,
    stockDecimalInput,
    lowStockThresholdDecimalInput,
    stockInput,
    lowStockThresholdInput,
  ]);

  const handleSubmit = React.useCallback(() => {
    if (rejectDuplicateBarcode(barcodeInput)) return;
    if (!nameInput.trim()) {
      toast.error("Falta el nombre");
      return;
    }
    setSubmitting(true);
    void (async () => {
      try {
        await action(buildFormData());
      } finally {
        setSubmitting(false);
      }
    })();
  }, [action, buildFormData, nameInput, barcodeInput, rejectDuplicateBarcode]);

  const stepTitle = ["", "Código de barras", "Nombre y tipo", "Precios", "Stock", "Últimos datos"];

  const stepSubtitle = React.useMemo(() => {
    const base: Record<number, string> = {
      1: "Escané o escribí el EAN. Si está en la base, te sugerimos datos en el siguiente paso.",
      2: "Revisá el nombre y elegí si se vende por unidad o por peso.",
      3: "Precio que pagás al proveedor, margen y precio de venta al público.",
      5: "Vencimiento y estado. Después guardamos el producto.",
    };
    base[4] = soldByWeight
      ? "Cantidad en kilos y alerta de stock mínimo."
      : "Unidades en depósito y mínimo.";
    return base;
  }, [soldByWeight]);

  return (
    <div className="flex min-h-full flex-1 flex-col text-slate-950 dark:text-slate-50">
      <div className="mb-3 flex items-center justify-center gap-1.5">
        {Array.from({ length: STEPS }, (_, i) => {
          const n = i + 1;
          const done = n < step;
          const current = n === step;
          return (
            <div
              key={i}
              className={cn(
                "h-2 rounded-full transition-all",
                done && "w-2 bg-cyan-400",
                current && "w-9 bg-gradient-to-r from-blue-600 to-violet-500 shadow-sm shadow-blue-500/30",
                !done && !current && "w-2 bg-slate-300 dark:bg-slate-700"
              )}
            />
          );
        })}
      </div>

      <p className="text-center text-[10px] font-extrabold uppercase tracking-[.18em] text-blue-600 dark:text-blue-300">
        Paso {step} de {STEPS}
      </p>
      <h3 className="mt-1 text-center text-xl font-extrabold tracking-tight">{stepTitle[step]}</h3>
      <p className="mx-auto mt-1 max-w-sm text-balance text-center text-xs leading-5 text-slate-500 dark:text-slate-400">{stepSubtitle[step]}</p>

      <div className="mt-4 min-h-0 flex-1 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_5px_18px_rgba(15,23,42,.06)] dark:border-slate-800 dark:bg-slate-900">
        {step === 1 ? (
          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="h-14 w-full gap-2 rounded-2xl border-0 bg-gradient-to-r from-[#075dcc] via-[#176ee1] to-[#4b45cf] text-base font-extrabold text-white shadow-lg shadow-blue-500/20 hover:brightness-105"
              onClick={() => setScannerOpen(true)}
            >
              <ScanLine className="size-5" />
              Escanear
            </Button>
            <div className="space-y-2">
              <Label htmlFor="wiz-barcode">O escribí el código</Label>
              <div className="flex gap-2">
                <Input
                  id="wiz-barcode"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && rejectDuplicateBarcode(e.currentTarget.value)) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="EAN / código"
                className="h-12 min-w-0 flex-1 rounded-xl border-slate-200 bg-slate-50 text-base dark:border-slate-700 dark:bg-slate-800"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 shrink-0 rounded-xl border-blue-200 text-blue-600 dark:border-blue-900 dark:text-blue-300"
                  title={
                    barcodeInput.trim()
                      ? "Vacía el campo para generar un EAN interno"
                      : "Generar EAN interno (sin código de fabricante)"
                  }
                  disabled={Boolean(barcodeInput.trim())}
                  onClick={() => {
                    const code = generateInternalEan13();
                    setBarcodeInput(code);
                    setExpiresAtInput(INTERNAL_PRODUCT_DEFAULTS.expiresAt);
                    if (soldByWeight) {
                      setStockDecimalInput(INTERNAL_PRODUCT_DEFAULTS.stockKg);
                      setLowStockThresholdDecimalInput(INTERNAL_PRODUCT_DEFAULTS.lowStockKg);
                    } else {
                      setStockInput(INTERNAL_PRODUCT_DEFAULTS.stockUnits);
                      setLowStockThresholdInput(INTERNAL_PRODUCT_DEFAULTS.lowStockUnits);
                    }
                    toast.success("Código interno generado", {
                      description: soldByWeight
                        ? `${code} · Stock ${INTERNAL_PRODUCT_DEFAULTS.stockKg} kg · Mín. ${INTERNAL_PRODUCT_DEFAULTS.lowStockKg} kg · Vto. ${INTERNAL_PRODUCT_DEFAULTS.expiresAt}`
                        : `${code} · Stock ${INTERNAL_PRODUCT_DEFAULTS.stockUnits} u. · Mín. ${INTERNAL_PRODUCT_DEFAULTS.lowStockUnits} u. · Vto. ${INTERNAL_PRODUCT_DEFAULTS.expiresAt}`,
                    });
                  }}
                >
                  <Hash className="size-5" />
                  <span className="sr-only">Generar código interno</span>
                </Button>
              </div>
            </div>
            {preloadLoading ? (
              <p className="text-center text-sm text-muted-foreground">Buscando en la base de referencia…</p>
            ) : null}
            {preload ? (
              <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/[0.08] p-4 text-left dark:bg-emerald-950/25">
                <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">Encontramos datos</div>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {preloadCategoryPath ? <span className="block">{preloadCategoryPath}</span> : null}
                  {preloadSuggestedPrice != null ? (
                    <span className="mt-1 block">Precio referencia: ${preloadSuggestedPrice}</span>
                  ) : null}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wiz-name">Nombre</Label>
              <Input
                id="wiz-name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                required
                className="h-12 rounded-xl border-slate-200 bg-slate-50 text-base dark:border-slate-700 dark:bg-slate-800"
                placeholder="Nombre del producto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wiz-category">Categoría</Label>
              <Input
                id="wiz-category"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                className="h-12 rounded-xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wiz-unit">Tipo de venta</Label>
              <select
                id="wiz-unit"
                value={soldByWeight ? "weight" : "unit"}
                onChange={(e) => setSoldByWeight(e.target.value === "weight")}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-base outline-none focus-visible:ring-2 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="unit">Por unidad</option>
                <option value="weight">Pesable (por kg)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wiz-scale">Código balanza</Label>
              <Input
                id="wiz-scale"
                value={scaleCodeInput}
                onChange={(e) => setScaleCodeInput(e.target.value)}
                onBlur={() => setScaleCodeInput((current) => normalizeScaleCode(current) ?? current.trim())}
                disabled={!soldByWeight}
                placeholder={soldByWeight ? "Ej: 00041" : "Solo si es pesable"}
                className="h-12 rounded-xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wiz-cost">Precio de compra</Label>
              <Input
                id="wiz-cost"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={costInput}
                onChange={(e) => setCostInput(e.target.value)}
                disabled={!canEditPrice}
                className="h-14 rounded-xl border-slate-200 bg-slate-50 text-xl font-extrabold text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wiz-margin">Margen (%)</Label>
              <Input
                id="wiz-margin"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={marginInput}
                onChange={(e) => {
                  setLastEdited("margin");
                  setMarginInput(e.target.value);
                }}
                disabled={!canEditPrice}
                className="h-12 rounded-xl border-slate-200 bg-slate-50 text-base dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wiz-price">Precio venta{soldByWeight ? " (por kg)" : ""}</Label>
              <Input
                id="wiz-price"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={priceInput}
                onChange={(e) => {
                  setLastEdited("price");
                  setPriceInput(e.target.value);
                }}
                disabled={!canEditPrice}
                className="h-14 rounded-xl border-blue-200 bg-blue-50 text-xl font-extrabold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
              />
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            {soldByWeight ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="wiz-sd">Stock (kg)</Label>
                  <Input
                    id="wiz-sd"
                    type="number"
                    inputMode="decimal"
                    step="0.001"
                    value={stockDecimalInput}
                    onChange={(e) => setStockDecimalInput(e.target.value)}
                    disabled={!canEditStock}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wiz-lsd">Stock mínimo (kg)</Label>
                  <Input
                    id="wiz-lsd"
                    type="number"
                    inputMode="decimal"
                    step="0.001"
                    value={lowStockThresholdDecimalInput}
                    onChange={(e) => setLowStockThresholdDecimalInput(e.target.value)}
                    disabled={!canEditStock}
                    className="h-12 rounded-xl"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="wiz-st">Stock (unidades)</Label>
                  <Input
                    id="wiz-st"
                    type="number"
                    step="1"
                    value={stockInput}
                    onChange={(e) => setStockInput(e.target.value)}
                    disabled={!canEditStock}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wiz-lst">Stock mínimo</Label>
                  <Input
                    id="wiz-lst"
                    type="number"
                    step="1"
                    value={lowStockThresholdInput}
                    onChange={(e) => setLowStockThresholdInput(e.target.value)}
                    disabled={!canEditStock}
                    className="h-12 rounded-xl"
                  />
                </div>
              </>
            )}
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wiz-exp">Vencimiento</Label>
              <Input
                id="wiz-exp"
                type="date"
                value={expiresAtInput}
                onChange={(e) => setExpiresAtInput(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40">
              <input
                id="wiz-active"
                type="checkbox"
                checked={activeProduct}
                onChange={(e) => setActiveProduct(e.target.checked)}
                className="size-5"
              />
              <Label htmlFor="wiz-active" className="text-base font-normal">
                Producto activo (visible en el POS)
              </Label>
            </div>
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm dark:border-violet-900 dark:bg-violet-950/30">
              <div className="flex items-center gap-2 font-medium">
                <Package className="size-4" />
                Resumen
              </div>
              <ul className="mt-3 space-y-1.5 text-muted-foreground">
                <li>
                  <span className="text-foreground">{nameInput || "—"}</span>
                </li>
                <li>EAN: {barcodeInput || "—"}</li>
                <li>
                  Compra ${costInput} · Venta ${priceInput}
                  {soldByWeight ? " /kg" : ""}
                </li>
                <li>
                  Stock:{" "}
                  {soldByWeight ? `${stockDecimalInput} kg` : `${stockInput} u.`}
                </li>
              </ul>
            </div>
          </div>
        ) : null}
      </div>

      <div className="sticky bottom-0 mt-4 flex shrink-0 gap-2 border-t border-slate-200 bg-[#f5f8fc]/95 pt-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        {step > 1 ? (
          <Button type="button" variant="outline" className="h-12 flex-1 gap-1 rounded-xl border-slate-300 bg-white font-bold dark:border-slate-700 dark:bg-slate-900" onClick={goBack}>
            <ChevronLeft className="size-4" />
            Atrás
          </Button>
        ) : (
          <div className="flex-1" />
        )}
        {step < STEPS ? (
          <Button type="button" className="h-12 flex-[2] gap-1 rounded-xl bg-gradient-to-r from-[#075dcc] via-[#176ee1] to-[#4b45cf] font-extrabold text-white shadow-lg shadow-blue-500/20" onClick={goNext}>
            Siguiente
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            className="h-12 flex-[2] gap-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 font-extrabold text-white shadow-lg shadow-emerald-500/20"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Guardando…" : "Guardar producto"}
          </Button>
        )}
      </div>

      <BarcodeScanner
        open={scannerOpen}
        continuous={false}
        steppedAfterSuccess={false}
        onClose={() => setScannerOpen(false)}
        onDecoded={(raw) => {
          const code = raw.replace(/\s+/g, "").trim();
          if (!code) return true;
          if (rejectDuplicateBarcode(code)) return false;
          setBarcodeInput(code);
          toast.success("Código leído", { duration: 1500 });
          return true;
        }}
      />
    </div>
  );
}
