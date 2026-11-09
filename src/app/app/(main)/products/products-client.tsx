"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Boxes, Download, FileSpreadsheet, Package, Pencil, Plus, ScanBarcode, ScanLine, Search, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { ONBOARDING_GUIDE_QUERY, ONBOARDING_GUIDE_TOTAL_STEPS } from "@/app/app/(main)/onboarding/onboarding-guide-constants";
import { OnboardingSpotlight } from "@/app/app/(main)/onboarding/onboarding-spotlight";
import { parseScaleBarcode } from "@/app/app/(main)/pos/utils/scale-barcode";
import { createProduct, deleteProduct, importProducts, updateProduct, type ProductImportRow } from "@/app/app/(main)/products/actions";
import { ProductCreateMobileWizard } from "@/app/app/(main)/products/product-create-mobile-wizard";
import { ProductForm } from "@/app/app/(main)/products/product-form";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIsMobilePos } from "@/hooks/use-is-mobile-pos";
import { normalizeScaleCode } from "@/lib/scale-barcode";
import type { BusinessType } from "@/lib/business-types";
import { cn } from "@/lib/utils";

type ProductRow = {
  id: string;
  name: string;
  image_path: string | null;
  image_url: string | null;
  barcode: string | null;
  scale_code: string | null;
  category: string | null;
  variant_group: string | null;
  size: string | null;
  color: string | null;
  price: string | number;
  cost: string | number;
  sold_by_weight: boolean;
  stock: number;
  stock_decimal: string | number;
  low_stock_threshold: number;
  low_stock_threshold_decimal: string | number;
  expires_at: string | null;
  active: boolean;
};

type Props = {
  products: ProductRow[];
  business?: {
    name: string | null;
    address: string | null;
    phone: string | null;
    cuit: string | null;
  };
  businessType?: BusinessType;
  canEditPrice?: boolean;
  canEditStock?: boolean;
  /** Recorrido inicial: resaltar Â«Nuevo productoÂ» y llevar a Caja al guardar. */
  guideProductStep?: boolean;
};

type CreateGuidePhase = "barcode" | "name" | "cost" | "price" | "stock" | "lowStock" | "submit";
type CreateGuideConfirm = {
  cost: boolean;
  price: boolean;
  stock: boolean;
  lowStock: boolean;
};

const PRODUCTS_PER_PAGE = 10;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toAmount(value: string | number) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(value: string | number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(toAmount(value));
}

function formatStockValue(value: string | number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return String(value ?? "0");
  return Number.isInteger(n) ? String(n) : n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 3 });
}

function buildProductsPdfHtml(params: {
  products: ProductRow[];
  business?: Props["business"];
  generatedAt: Date;
}) {
  const { products, business, generatedAt } = params;
  const businessName = business?.name?.trim() || "Mi negocio";
  const businessLines = [business?.address, business?.phone ? `WhatsApp / Tel: ${business.phone}` : null]
    .filter(Boolean)
    .map((line) => `<div class="contact-line">${escapeHtml(String(line))}</div>`)
    .join("");
  const dateLabel = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long",
  }).format(generatedAt);
  const rows = products
    .map((product) => {
      const detail = [product.category, product.size ? `Talle ${product.size}` : null, product.color ? `Color ${product.color}` : null]
        .filter(Boolean)
        .join(" · ");
      const meta = detail || (product.barcode ? `Cod. ${product.barcode}` : "Consultar disponibilidad");

      return `
        <tr>
          <td>
            <div class="name">${escapeHtml(product.name)}</div>
            <div class="meta">${escapeHtml(meta)}</div>
          </td>
          <td class="price">${escapeHtml(formatMoney(product.price))}</td>
        </tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Lista de precios - ${escapeHtml(businessName)}</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #1f2937; background: #e8ecf1; }
      .page { width: 210mm; min-height: 297mm; margin: 0 auto; background:
        radial-gradient(circle at top right, rgba(180, 138, 61, 0.12), transparent 28%),
        linear-gradient(180deg, #fffefb 0%, #f4f6f8 100%);
        padding: 16mm 14mm 18mm; }
      .hero {
        position: relative;
        overflow: hidden;
        border-radius: 24px;
        padding: 18px 20px;
        background: linear-gradient(135deg, #163242 0%, #234e62 55%, #335f63 100%);
        color: white;
        box-shadow: 0 18px 40px rgba(22, 50, 66, 0.2);
      }
      .hero::after {
        content: "";
        position: absolute;
        right: -40px;
        top: -30px;
        width: 180px;
        height: 180px;
        border-radius: 999px;
        background: rgba(255,255,255,0.07);
      }
      .hero-grid { position: relative; z-index: 1; display: flex; justify-content: space-between; gap: 18px; }
      .eyebrow { margin: 0 0 10px; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(232, 211, 169, 0.92); }
      .hero h1 { margin: 0; font-size: 34px; line-height: 1.05; }
      .hero p { margin: 10px 0 0; max-width: 480px; font-size: 14px; line-height: 1.5; color: rgba(244,246,248,0.9); }
      .hero-side {
        min-width: 210px;
        align-self: flex-start;
        border-radius: 18px;
        padding: 14px 16px;
        background: rgba(255,255,255,0.12);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(232, 211, 169, 0.22);
      }
      .hero-side strong { display: block; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 8px; color: rgba(232, 211, 169, 0.9); }
      .hero-side .label { font-size: 22px; font-weight: 700; line-height: 1.15; }
      .hero-side .date { margin-top: 8px; font-size: 12px; color: rgba(255,255,255,0.86); }
      .contact-strip { display: flex; flex-wrap: wrap; gap: 10px; margin: 16px 0 18px; }
      .contact-line {
        border: 1px solid #d6d3c9;
        border-radius: 999px;
        padding: 8px 12px;
        background: #fffdfa;
        font-size: 12px;
        color: #4b5563;
      }
      .section-title {
        margin: 0 0 12px;
        font-size: 12px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: #7b5b2e;
      }
      table { width: 100%; border-collapse: collapse; }
      thead th {
        border-bottom: 1px solid #d8dde3;
        padding: 0 0 12px;
        text-align: left;
        font-size: 11px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #7b8794;
      }
      thead th:last-child { text-align: right; }
      tbody td {
        border-bottom: 1px solid #e4e7eb;
        padding: 15px 0;
        font-size: 13px;
        vertical-align: top;
      }
      .name { font-weight: 700; color: #183247; margin-bottom: 4px; font-size: 14px; }
      .meta { color: #6b7280; font-size: 11px; letter-spacing: 0.01em; }
      .price {
        text-align: right;
        white-space: nowrap;
        font-size: 16px;
        font-weight: 800;
        color: #7b5b2e;
      }
      .footer {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        margin-top: 18px;
        padding-top: 12px;
        border-top: 1px solid #d8dde3;
        font-size: 11px;
        color: #6b7280;
      }
      @page { size: A4; margin: 10mm; }
      @media print {
        body { background: white; }
        .page { width: auto; min-height: auto; margin: 0; padding: 0; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <header class="hero">
        <div class="hero-grid">
          <div>
            <div class="eyebrow">Catalogo comercial</div>
            <h1>${escapeHtml(businessName)}</h1>
            <p>Lista de precios pensada para compartir con clientes de forma clara, prolija y profesional.</p>
          </div>
          <div class="hero-side">
            <strong>Lista de precios</strong>
            <div class="label">Vigente hoy</div>
            <div class="date">Actualizado: ${escapeHtml(dateLabel)}</div>
          </div>
        </div>
      </header>
      ${businessLines ? `<section class="contact-strip">${businessLines}</section>` : ""}
      <div class="section-title">Productos y precios</div>
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Precio</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <footer class="footer">
        <div>Los precios pueden actualizarse sin previo aviso.</div>
        <div>Gracias por elegir ${escapeHtml(businessName)}.</div>
      </footer>
    </div>
  </body>
</html>`;
}

function resolveProductCreateOnboardingGuide(confirm: CreateGuideConfirm): {
  target: Element | null;
  phase: CreateGuidePhase;
} {
  if (typeof document === "undefined") return { target: null, phase: "barcode" };

  const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
  if (!dialog) return { target: null, phase: "barcode" };

  const q = (sel: string) => dialog.querySelector(sel);

  const barcodeEl = q("#barcode") as HTMLInputElement | null;
  const barcode = barcodeEl?.value?.trim() ?? "";
  if (barcode.length < 6) return { target: barcodeEl ?? dialog, phase: "barcode" };

  const nameEl = q("#name") as HTMLInputElement | null;
  const name = nameEl?.value?.trim() ?? "";
  if (name.length < 2) return { target: nameEl ?? dialog, phase: "name" };

  const costEl = q("#cost") as HTMLInputElement | null;
  const cost = parseFloat(String(costEl?.value ?? ""));
  if (!Number.isFinite(cost) || cost <= 0 || !confirm.cost) return { target: costEl ?? dialog, phase: "cost" };

  const priceEl = q("#price") as HTMLInputElement | null;
  const price = parseFloat(String(priceEl?.value ?? ""));
  if (!Number.isFinite(price) || price <= 0 || !confirm.price) return { target: priceEl ?? dialog, phase: "price" };

  const soldByWeight = (q('input[name="sold_by_weight"]') as HTMLInputElement)?.value === "on";
  const stockSel = soldByWeight ? "#stock_decimal" : "#stock";
  const stockEl = q(stockSel) as HTMLInputElement | null;
  const stock = parseFloat(String(stockEl?.value ?? ""));
  if (!Number.isFinite(stock) || stock <= 0 || !confirm.stock) return { target: stockEl ?? dialog, phase: "stock" };

  const lowStockSel = soldByWeight ? "#low_stock_threshold_decimal" : "#low_stock_threshold";
  const lowStockEl = q(lowStockSel) as HTMLInputElement | null;
  const lowStock = parseFloat(String(lowStockEl?.value ?? ""));
  if (!Number.isFinite(lowStock) || lowStock <= 0 || !confirm.lowStock) {
    return { target: lowStockEl ?? dialog, phase: "lowStock" };
  }

  const submitBtn = dialog.querySelector('form button[type="submit"]') as HTMLButtonElement | null;
  return { target: submitBtn ?? dialog, phase: "submit" };
}

function productCreateGuideHints(phase: CreateGuidePhase): { title: string; description: React.ReactNode } {
  switch (phase) {
    case "barcode":
      return {
        title: "EscaneÃ¡ el producto",
        description: (
          <>
            EscaneÃ¡ o escribÃ­ el <span className="font-semibold text-foreground">cÃ³digo de barras</span>. Si existe en la
            base, se autocompletan los datos.
          </>
        ),
      };
    case "name":
      return {
        title: "RevisÃ¡ el nombre sugerido",
        description: (
          <>
            ConfirmÃ¡ el <span className="font-semibold text-foreground">nombre</span> (si no vino completo, ajustalo).
          </>
        ),
      };
    case "cost":
      return {
        title: "AjustÃ¡ precio de compra",
        description: (
          <>
            RevisÃ¡ el <span className="font-semibold text-foreground">precio de compra</span> para que el margen quede
            correcto.
          </>
        ),
      };
    case "price":
      return {
        title: "AjustÃ¡ precio de venta",
        description: (
          <>
            ConfirmÃ¡ el <span className="font-semibold text-foreground">precio de venta</span> sugerido y corregilo si hace
            falta.
          </>
        ),
      };
    case "stock":
      return {
        title: "CargÃ¡ cantidad inicial",
        description: (
          <>
            IndicÃ¡ cuÃ¡nto <span className="font-semibold text-foreground">stock inicial</span> entra (unidades o kg).
          </>
        ),
      };
    case "lowStock":
      return {
        title: "DefinÃ­ stock mÃ­nimo",
        description: (
          <>
            MarcÃ¡ el <span className="font-semibold text-foreground">stock mÃ­nimo</span> para alertas de reposiciÃ³n.
          </>
        ),
      };
    default:
      return {
        title: "GuardÃ¡ el producto",
        description: (
          <>
            TocÃ¡ <span className="font-semibold text-foreground">Â«Guardar productoÂ»</span> para crearlo y seguir con la
            caja.
          </>
        ),
      };
  }
}

function formatStock(p: ProductRow) {
  return p.sold_by_weight
    ? `Stock: ${p.stock_decimal} | MÃ­n: ${p.low_stock_threshold_decimal}`
    : `Stock: ${p.stock} | MÃ­n: ${p.low_stock_threshold}`;
}

function isLowStock(p: ProductRow) {
  const stock = p.sold_by_weight ? Number(p.stock_decimal) : Number(p.stock);
  const threshold = p.sold_by_weight ? Number(p.low_stock_threshold_decimal) : Number(p.low_stock_threshold);
  return p.active && Number.isFinite(stock) && Number.isFinite(threshold) && stock <= threshold;
}

function formatVariant(p: ProductRow) {
  const parts = [p.category, p.size ? `Talle ${p.size}` : null, p.color ? `Color ${p.color}` : null].filter(Boolean);
  return parts.join(" Â· ");
}

function normCode(s: string) {
  return String(s ?? "").replace(/\s+/g, "").trim().toLowerCase();
}

function findProductByScannedCode(products: ProductRow[], raw: string): ProductRow | undefined {
  const stable = normCode(raw);
  if (!stable) return undefined;

  const exact = products.find((p) => normCode(p.barcode ?? "") === stable);
  if (exact) return exact;

  const parsed = parseScaleBarcode(stable.replace(/\s+/g, ""));
  if (parsed) {
    const sc = normalizeScaleCode(parsed.scaleCode)?.toLowerCase() ?? "";
    return products.find((p) => (normalizeScaleCode(p.scale_code)?.toLowerCase() ?? "") === sc);
  }

  return undefined;
}

export function ProductsClient({
  products,
  business,
  businessType = "retail",
  canEditPrice = true,
  canEditStock = true,
  guideProductStep = false,
}: Props) {
  const router = useRouter();
  const isMobileAssist = useIsMobilePos();
  const [openCreate, setOpenCreate] = React.useState(false);
  const [editProduct, setEditProduct] = React.useState<ProductRow | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [exportingPdf, setExportingPdf] = React.useState(false);
  const [scannerSearchOpen, setScannerSearchOpen] = React.useState(false);
  const [duplicateProductDialogOpen, setDuplicateProductDialogOpen] = React.useState(false);
  const [recentlyCreatedProducts, setRecentlyCreatedProducts] = React.useState<ProductRow[]>([]);
  const [importOpen, setImportOpen] = React.useState(false);
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [importing, setImporting] = React.useState(false);

  const newProductHighlightRef = React.useRef<HTMLSpanElement>(null);
  const formGuideTargetRef = React.useRef<Element | null>(null);
  const [formGuideTick, setFormGuideTick] = React.useState(0);
  const [createGuideConfirm, setCreateGuideConfirm] = React.useState<CreateGuideConfirm>({
    cost: false,
    price: false,
    stock: false,
    lowStock: false,
  });

  const [nameQuery, setNameQuery] = React.useState("");
  const [barcodeQuery, setBarcodeQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const barcodeSearchRef = React.useRef<HTMLInputElement>(null);
  const knownProducts = React.useMemo(() => [...recentlyCreatedProducts, ...products], [products, recentlyCreatedProducts]);
  const notifyDuplicateBarcode = React.useCallback(
    (raw: string) => {
      const code = normCode(raw);
      if (!code) return false;
      const foundByScan = findProductByScannedCode(knownProducts, code);
      const scaleCode = /^\d{1,5}$/.test(code) ? normalizeScaleCode(code) : null;
      const alreadyLoaded =
        Boolean(foundByScan) ||
        Boolean(scaleCode && knownProducts.some((product) => normalizeScaleCode(product.scale_code ?? "") === scaleCode));
      if (!alreadyLoaded) return false;
      setOpenCreate(false);
      setDuplicateProductDialogOpen(true);
      return true;
    },
    [knownProducts]
  );

  const filtered = React.useMemo(() => {
    const nq = nameQuery.trim().toLowerCase();
    const bq = normCode(barcodeQuery);

    return products.filter((p) => {
      if (nq && !p.name.toLowerCase().includes(nq)) return false;
      if (bq) {
        const b = normCode(p.barcode ?? "");
        const sc = normCode(p.scale_code ?? "");
        if (!b.includes(bq) && !sc.includes(bq)) return false;
      }
      return true;
    });
  }, [products, nameQuery, barcodeQuery]);

  const hasActiveFilters = Boolean(nameQuery.trim() || normCode(barcodeQuery));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
  const currentPage = hasActiveFilters ? 1 : Math.min(page, totalPages);

  const paginatedProducts = React.useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filtered.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filtered, currentPage]);

  const showingFrom = filtered.length === 0 ? 0 : (currentPage - 1) * PRODUCTS_PER_PAGE + 1;
  const showingTo = filtered.length === 0 ? 0 : Math.min(currentPage * PRODUCTS_PER_PAGE, filtered.length);

  const onCreate = React.useCallback(
    async (formData: FormData) => {
      startTransition(() => {
        (async () => {
          try {
            await createProduct(formData);
            const barcode = String(formData.get("barcode") ?? "").trim() || null;
            const scaleCode = normalizeScaleCode(String(formData.get("scale_code") ?? ""));
            if (barcode || scaleCode) {
              const recentProduct: ProductRow = {
                id: crypto.randomUUID(),
                name: String(formData.get("name") ?? "").trim(),
                image_path: null,
                image_url: null,
                barcode,
                scale_code: scaleCode,
                category: String(formData.get("category") ?? "").trim() || null,
                variant_group: null,
                size: String(formData.get("size") ?? "").trim() || null,
                color: String(formData.get("color") ?? "").trim() || null,
                price: String(formData.get("price") ?? "0"),
                cost: String(formData.get("cost") ?? "0"),
                sold_by_weight: String(formData.get("sold_by_weight") ?? "off") === "on",
                stock: Number(formData.get("stock") ?? 0),
                stock_decimal: String(formData.get("stock_decimal") ?? "0"),
                low_stock_threshold: Number(formData.get("low_stock_threshold") ?? 0),
                low_stock_threshold_decimal: String(formData.get("low_stock_threshold_decimal") ?? "0"),
                expires_at: String(formData.get("expires_at") ?? "").trim() || null,
                active: String(formData.get("active") ?? "") !== "off",
              };
              setRecentlyCreatedProducts((current) => [recentProduct, ...current]);
            }
            toast.success("Producto creado");
            setOpenCreate(false);
            if (guideProductStep) {
              router.push(`/app/cash?${ONBOARDING_GUIDE_QUERY}=cash`);
              return;
            }
            router.refresh();
          } catch (err) {
            if (err instanceof Error && /ya está cargado/i.test(err.message)) {
              setOpenCreate(false);
              setDuplicateProductDialogOpen(true);
              return;
            }
            toast.error("No se pudo crear", {
              description: err instanceof Error ? err.message : "Error",
            });
          }
        })();
      });
    },
    [guideProductStep, router]
  );

  const onUpdate = React.useCallback(
    async (formData: FormData) => {
      startTransition(() => {
        (async () => {
          try {
            await updateProduct(formData);
            toast.success("Producto actualizado");
            setEditProduct(null);
            router.refresh();
          } catch (err) {
            toast.error("No se pudo guardar", {
              description: err instanceof Error ? err.message : "Error",
            });
          }
        })();
      });
    },
    [router]
  );

  const onDelete = React.useCallback(
    async (id: string) => {
      const ok = window.confirm("Â¿Borrar este producto? Esta acciÃ³n no se puede deshacer.");
      if (!ok) return;

      startTransition(() => {
        (async () => {
          try {
            const fd = new FormData();
            fd.set("id", id);
            await deleteProduct(fd);
            toast.success("Producto borrado");
            if (editProduct?.id === id) setEditProduct(null);
            router.refresh();
          } catch (err) {
            toast.error("No se pudo borrar", {
              description: err instanceof Error ? err.message : "Error",
            });
          }
        })();
      });
    },
    [router, editProduct?.id]
  );

  const openEdit = React.useCallback((p: ProductRow) => {
    setOpenCreate(false);
    setEditProduct(p);
  }, []);

  const exportProductsPdf = React.useCallback(() => {
    if (filtered.length === 0) {
      toast.error("No hay productos para exportar");
      return;
    }

    setExportingPdf(true);

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");

    const cleanup = () => {
      window.setTimeout(() => {
        iframe.remove();
        setExportingPdf(false);
      }, 500);
    };

    iframe.onload = () => {
      const frameWindow = iframe.contentWindow;
      if (!frameWindow) {
        toast.error("No se pudo abrir la vista de impresiÃƒÂ³n");
        cleanup();
        return;
      }

      frameWindow.focus();

      window.setTimeout(() => {
        try {
          frameWindow.print();
        } catch {
          toast.error("No se pudo iniciar la impresiÃƒÂ³n");
        } finally {
          cleanup();
        }
      }, 150);
    };

    iframe.srcdoc = buildProductsPdfHtml({
      products: filtered,
      business,
      generatedAt: new Date(),
    });

    document.body.appendChild(iframe);
  }, [business, filtered]);

  const downloadImportTemplate = React.useCallback(async () => {
    const XLSX = await import("xlsx");
    const examples = [
      { nombre: "Coca Cola 500 ml", codigo_barras: "7790895001223", categoria: "Bebidas", costo: 900, precio: 1500, stock: 24, stock_minimo: 5, venta_por_peso: "NO", vencimiento: "", activo: "SI", talle: "", color: "" },
      { nombre: "Manzana roja", codigo_barras: "", categoria: "Frutas", costo: 1200, precio: 1900, stock: 8.5, stock_minimo: 2, venta_por_peso: "SI", vencimiento: "2026-12-31", activo: "SI", talle: "", color: "" },
      { nombre: "Remera clásica", codigo_barras: "7791234567890", categoria: "Indumentaria", costo: 8000, precio: 14500, stock: 10, stock_minimo: 2, venta_por_peso: "NO", vencimiento: "", activo: "SI", talle: "M", color: "Negro" },
    ];
    const instructions = [
      ["PLANTILLA DE PRODUCTOS - INSTRUCCIONES"],
      ["Completá la hoja Productos sin cambiar los nombres de las columnas."],
      ["nombre", "Obligatorio. Nombre que se verá en el sistema."],
      ["codigo_barras", "Opcional. Debe ser único; no uses notación científica."],
      ["costo / precio / stock / stock_minimo", "Usá sólo números, sin $ ni separadores de miles."],
      ["venta_por_peso", "Escribí SI para kilos/decimales o NO para unidades."],
      ["vencimiento", "Opcional. Formato AAAA-MM-DD, por ejemplo 2026-12-31."],
      ["activo", "SI para venderlo o NO para dejarlo inactivo."],
      ["talle / color", "Opcionales, útiles para indumentaria."],
      ["Importante", "Borrá las filas de ejemplo antes de cargar tus productos si no querés importarlas."],
    ];
    const workbook = XLSX.utils.book_new();
    const productsSheet = XLSX.utils.json_to_sheet(examples);
    productsSheet["!cols"] = [28, 19, 18, 12, 12, 12, 14, 18, 16, 10, 12, 14].map((wch) => ({ wch }));
    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);
    instructionsSheet["!cols"] = [{ wch: 34 }, { wch: 78 }];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instrucciones");
    XLSX.utils.book_append_sheet(workbook, productsSheet, "Productos");
    XLSX.writeFile(workbook, "plantilla-productos-tienda360.xlsx");
  }, []);

  const handleImportProducts = React.useCallback(async () => {
    if (!importFile) return;
    setImporting(true);
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await importFile.arrayBuffer(), { type: "array", cellDates: false });
      const sheet = workbook.Sheets["Productos"] ?? workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error("El archivo no contiene ninguna hoja.");
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const yes = (value: unknown) => ["si", "sí", "yes", "true", "1"].includes(String(value).trim().toLowerCase());
      const numberValue = (value: unknown) => {
        if (typeof value === "number") return value;
        const normalized = String(value ?? "").trim().replace(/\s/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
      };
      const rows: ProductImportRow[] = rawRows
        .filter((row) => Object.values(row).some((value) => String(value).trim()))
        .map((row) => ({
          name: String(row.nombre ?? "").trim(),
          barcode: String(row.codigo_barras ?? "").trim() || null,
          category: String(row.categoria ?? "").trim() || null,
          cost: numberValue(row.costo), price: numberValue(row.precio), stock: numberValue(row.stock),
          low_stock_threshold: numberValue(row.stock_minimo), sold_by_weight: yes(row.venta_por_peso),
          expires_at: String(row.vencimiento ?? "").trim() || null, active: String(row.activo ?? "SI").trim() === "" || yes(row.activo),
          size: String(row.talle ?? "").trim() || null, color: String(row.color ?? "").trim() || null,
        }));
      if (!rows.length) throw new Error("No se encontraron filas en la hoja Productos.");
      const result = await importProducts(rows);
      toast.success(`${result.imported} productos importados`);
      setImportOpen(false); setImportFile(null); router.refresh();
    } catch (error) {
      toast.error("No se pudo importar el archivo", { description: error instanceof Error ? error.message : "Revisá la plantilla." });
    } finally { setImporting(false); }
  }, [importFile, router]);

  const handleBarcodeKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const raw = barcodeSearchRef.current?.value ?? barcodeQuery;
      const found = findProductByScannedCode(products, raw);
      if (found) {
        openEdit(found);
        setBarcodeQuery("");
      } else {
        toast.error("No hay producto con ese cÃ³digo", {
          description: "VerificÃ¡ el cÃ³digo o cargalo en el producto.",
        });
      }
    },
    [barcodeQuery, products, openEdit]
  );

  React.useEffect(() => {
    if (!openCreate) return;
    const timer = window.setTimeout(() => {
      const input = document.getElementById(isMobileAssist ? "wiz-barcode" : "barcode") as HTMLInputElement | null;
      input?.focus({ preventScroll: true });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [openCreate, isMobileAssist]);

  const showProductSpotlight = guideProductStep && !openCreate;

  React.useEffect(() => {
    if (!openCreate) {
      setCreateGuideConfirm({ cost: false, price: false, stock: false, lowStock: false });
      return;
    }
    if (isMobileAssist || !guideProductStep) return;
    const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
    if (!dialog) return;

    const markIfValid = (id: string) => {
      const el = dialog.querySelector(`#${id}`) as HTMLInputElement | null;
      const n = parseFloat(String(el?.value ?? ""));
      return Number.isFinite(n) && n > 0;
    };

    const onFocusOut = (ev: Event) => {
      const t = ev.target as HTMLElement | null;
      if (!(t instanceof HTMLInputElement)) return;

      if (t.id === "price") {
        if (markIfValid("price")) setCreateGuideConfirm((prev) => ({ ...prev, price: true }));
        return;
      }
      if (t.id === "cost") {
        if (markIfValid("cost")) setCreateGuideConfirm((prev) => ({ ...prev, cost: true }));
        return;
      }
      if (t.id === "stock" || t.id === "stock_decimal") {
        if (markIfValid(t.id)) setCreateGuideConfirm((prev) => ({ ...prev, stock: true }));
        return;
      }
      if (t.id === "low_stock_threshold" || t.id === "low_stock_threshold_decimal") {
        if (markIfValid(t.id)) setCreateGuideConfirm((prev) => ({ ...prev, lowStock: true }));
      }
    };

    dialog.addEventListener("focusout", onFocusOut, true);
    return () => dialog.removeEventListener("focusout", onFocusOut, true);
  }, [openCreate, isMobileAssist, guideProductStep]);

  React.useEffect(() => {
    if (!guideProductStep || !openCreate || isMobileAssist) return undefined;
    const id = window.setInterval(() => setFormGuideTick((x) => x + 1), 180);
    return () => clearInterval(id);
  }, [guideProductStep, openCreate, isMobileAssist]);

  React.useLayoutEffect(() => {
    if (!guideProductStep || !openCreate || isMobileAssist) {
      formGuideTargetRef.current = null;
      return;
    }
    formGuideTargetRef.current = resolveProductCreateOnboardingGuide(createGuideConfirm).target;
  }, [guideProductStep, openCreate, formGuideTick, isMobileAssist, createGuideConfirm]);

  const createGuidePhase = React.useMemo(() => {
    if (!guideProductStep || !openCreate || isMobileAssist) return null;
    return resolveProductCreateOnboardingGuide(createGuideConfirm).phase;
  }, [guideProductStep, openCreate, formGuideTick, isMobileAssist, createGuideConfirm]);

  const showCreateFormSpotlight = Boolean(guideProductStep && openCreate && !isMobileAssist);
  const createFormGuideCopy = productCreateGuideHints(createGuidePhase ?? "name");

  React.useEffect(() => {
    if (!guideProductStep || !openCreate || isMobileAssist) return undefined;
    const idsByPhase: Record<CreateGuidePhase, string[]> = {
      barcode: ["barcode"],
      name: ["name"],
      cost: ["cost"],
      price: ["price"],
      stock: ["stock", "stock_decimal"],
      lowStock: ["low_stock_threshold", "low_stock_threshold_decimal"],
      submit: [],
    };
    const t = window.setTimeout(() => {
      const phase = createGuidePhase ?? "barcode";
      const ids = idsByPhase[phase];
      for (const id of ids) {
        const el = document.getElementById(id) as HTMLElement | null;
        if (!el) continue;
        el.focus({ preventScroll: true });
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        break;
      }
    }, 260);
    return () => window.clearTimeout(t);
  }, [guideProductStep, openCreate, isMobileAssist, createGuidePhase]);

  React.useEffect(() => {
    if (!showProductSpotlight) return undefined;
    const rafId = window.requestAnimationFrame(() => {
      const wrap = newProductHighlightRef.current;
      if (!wrap) return;
      wrap.scrollIntoView({ block: "center", behavior: "smooth" });
      wrap.querySelector("button")?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [showProductSpotlight]);

  return (
    <div className="relative min-h-full bg-[#f5f8fc] px-4 pb-28 pt-5 text-slate-950 md:mt-6 md:min-h-0 md:bg-transparent md:px-0 md:pb-0 md:pt-0 md:text-foreground dark:bg-slate-950 md:dark:bg-transparent">
      <OnboardingSpotlight
        active={showProductSpotlight}
        targetRef={newProductHighlightRef}
        stackBase={88}
        dimBackground={false}
        stepIndex={2}
        totalSteps={ONBOARDING_GUIDE_TOTAL_STEPS}
        title="Tu primer producto"
        description={
          <>
            <span className="font-semibold text-foreground">TocÃ¡ el botÃ³n verde Â«Nuevo productoÂ»</span> arriba a la
            derecha: es lo Ãºnico que se ve nÃ­tido y titila. El resto queda borroso a propÃ³sito.
          </>
        }
      />

      <OnboardingSpotlight
        active={showCreateFormSpotlight}
        targetRef={formGuideTargetRef}
        stackBase={96}
        dimBackground={false}
        remeasureSignal={formGuideTick}
        stepIndex={2}
        totalSteps={ONBOARDING_GUIDE_TOTAL_STEPS}
        title={createFormGuideCopy.title}
        description={createFormGuideCopy.description}
      />

      <section className="md:hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[27px] font-extrabold tracking-tight">Productos</h1>
            <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">Catálogo, precios y existencias</p>
          </div>
          <Button type="button" onClick={() => { setEditProduct(null); setOpenCreate(true); }} className="h-11 rounded-xl bg-gradient-to-r from-[#075dcc] to-[#4b45cf] px-3 text-xs font-extrabold text-white shadow-lg shadow-blue-500/20">
            <Plus className="size-4" />Nuevo
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-gradient-to-br from-[#075dcc] to-[#176ee1] p-3 text-white shadow-md shadow-blue-500/15"><span className="flex size-8 items-center justify-center rounded-lg bg-white/15"><Package className="size-4 text-cyan-200" /></span><p className="mt-2 text-[9px] font-bold text-blue-100">Total</p><p className="text-xl font-extrabold">{products.length}</p></div>
          <div className="rounded-2xl border border-emerald-200 bg-white p-3 shadow-sm dark:border-emerald-900 dark:bg-slate-900"><span className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950"><Boxes className="size-4 text-emerald-600" /></span><p className="mt-2 text-[9px] font-bold text-slate-500">Activos</p><p className="text-xl font-extrabold text-emerald-600">{products.filter((p) => p.active).length}</p></div>
          <div className="rounded-2xl border border-amber-200 bg-white p-3 shadow-sm dark:border-amber-900 dark:bg-slate-900"><span className="flex size-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950"><AlertTriangle className="size-4 text-amber-600" /></span><p className="mt-2 text-[9px] font-bold text-slate-500">Stock bajo</p><p className="text-xl font-extrabold text-amber-600">{products.filter(isLowStock).length}</p></div>
        </div>
        <Button type="button" variant="outline" onClick={() => setImportOpen(true)} className="mt-3 h-11 w-full gap-2 rounded-xl bg-white dark:bg-slate-900">
          <Upload className="size-4" /> Importar productos desde Excel
        </Button>
      </section>

      <div className="hidden flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:flex">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{hasActiveFilters
            ? `Mostrando ${filtered.length} resultados`
            : `${products.length} productos · página ${page} de ${totalPages}`}</span>
          {totalPages > 1 ? (
            <div className="flex items-center gap-1.5">
              <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg px-2.5" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1}>Anterior</Button>
              <span className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow-sm">{currentPage}</span>
              <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg px-2.5" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage === totalPages}>Siguiente</Button>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <Button type="button" variant="outline" onClick={() => setImportOpen(true)} className="gap-2 rounded-2xl">
            <Upload className="size-4" /> Importar Excel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={exportProductsPdf}
            disabled={exportingPdf || filtered.length === 0}
            className="gap-2 rounded-2xl"
          >
            <Download className="size-4" />
            {exportingPdf ? "Preparando PDF..." : "Exportar PDF"}
          </Button>
          <span
          ref={newProductHighlightRef}
          className={cn(
            "inline-flex flex-col items-end gap-2 sm:items-center",
            showProductSpotlight && "relative z-[92]"
          )}
          >
          {showProductSpotlight ? (
            <span className="pointer-events-none rounded-full bg-emerald-600 px-3 py-1.5 text-center text-[11px] font-bold uppercase leading-none tracking-wide text-white shadow-lg shadow-emerald-900/30 ring-2 ring-white/80 ring-offset-2 ring-offset-transparent animate-pulse">
              Paso 1 Â· TocÃ¡ acÃ¡
            </span>
          ) : null}
          <Button
            type="button"
            onClick={() => {
              setEditProduct(null);
              setOpenCreate(true);
            }}
            className={cn(
              "gap-2 rounded-2xl font-semibold",
              showProductSpotlight
                ? "animate-onboarding-product-pulse relative min-h-12 min-w-[min(100vw-2rem,280px)] border-2 border-white/90 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-8 text-base font-bold text-white hover:brightness-110 hover:saturate-110 md:min-w-[260px]"
                : "h-10"
            )}
          >
            <Plus className={cn("size-4", showProductSpotlight && "size-5")} />
            Nuevo producto
          </Button>
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 md:gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="product-search-name" className="sr-only md:not-sr-only md:text-xs md:text-muted-foreground">
            Buscar por nombre
          </Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blue-500 dark:text-blue-300" />
            <Input
              id="product-search-name"
              type="search"
              placeholder="Ej: oreo, leche…"
              value={nameQuery}
              onChange={(e) => {
                setNameQuery(e.target.value);
                setPage(1);
              }}
              className="h-12 rounded-xl border-slate-300 bg-white pl-10 shadow-sm md:h-11 dark:border-blue-300/35 dark:bg-[#17243a] dark:text-white dark:placeholder:text-slate-400 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-500/30"
              autoComplete="off"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="product-search-barcode" className="sr-only md:not-sr-only md:text-xs md:text-muted-foreground">
            CÃ³digo de barras
          </Label>
          <div className="relative">
            <ScanBarcode className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={barcodeSearchRef}
              id="product-search-barcode"
              type="text"
              inputMode="numeric"
              placeholder="Filtrar o escanear y Enter"
              value={barcodeQuery}
              onChange={(e) => {
                setBarcodeQuery(e.target.value);
                setPage(1);
              }}
              onKeyDown={handleBarcodeKeyDown}
              className="h-12 rounded-xl border-slate-300 bg-white pl-10 shadow-sm md:h-11 dark:border-blue-300/35 dark:bg-[#17243a] dark:text-white dark:placeholder:text-slate-400 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-500/30"
              autoComplete="off"
            />
          </div>
          <p className="hidden text-[11px] text-muted-foreground lg:block">
            EnfocÃ¡ este campo y escaneÃ¡: al terminar (Enter) se abre la ediciÃ³n.
          </p>
        </div>
      </div>

      {isMobileAssist ? (
        <div className="mt-3 lg:hidden">
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full gap-2 rounded-xl border-emerald-600/40 bg-[var(--pos-surface)] font-semibold"
            onClick={() => setScannerSearchOpen(true)}
          >
            <ScanLine className="size-5" />
            Escanear para buscar y editar
          </Button>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Lee el cÃ³digo de un producto ya cargado y se abre el formulario para ajustar stock y precios.
          </p>
        </div>
      ) : null}

      <div className="mt-4 hidden overflow-hidden rounded-2xl border border-blue-200/80 bg-white shadow-[0_18px_45px_-32px_rgba(37,99,235,.55)] md:block dark:border-blue-300/20 dark:bg-[#101a2e]">
        <div className="overflow-auto">
          <table className="w-full min-w-[860px] text-sm">
            <colgroup>
              <col className="w-[46%]" />
              <col className="w-[18%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead className="bg-gradient-to-r from-blue-50 to-sky-50 text-blue-900/65 dark:from-[#17243a] dark:to-[#1a2942] dark:text-blue-200/70">
              <tr className="border-b text-[11px] uppercase tracking-[0.12em] [&_th]:font-bold">
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em]">Producto</th>
                <th className="px-4 py-3 text-left font-medium">Stock</th>
                <th className="px-4 py-3 text-left font-medium">Precio</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    {products.length === 0
                      ? "No hay productos cargados."
                      : "NingÃºn producto coincide con la bÃºsqueda."}
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => (
                  <tr key={p.id} className="group border-b border-blue-100 bg-white transition-all even:bg-sky-50/55 hover:bg-blue-50 hover:shadow-[inset_3px_0_0_#3b82f6] last:border-b-0 dark:border-blue-300/15 dark:bg-[#101a2e] dark:even:bg-[#142139] dark:hover:bg-[#1a2b47]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-[var(--pos-surface-2)]">
                          {p.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Sin foto</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-slate-800 group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300">{p.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {[formatVariant(p) || null, p.barcode ? `EAN: ${p.barcode}` : null, p.expires_at ? `Vence: ${p.expires_at}` : null]
                              .filter(Boolean)
                              .join(" Â· ")}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm leading-5 text-muted-foreground">{formatStock(p)}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-numeric font-extrabold text-slate-900 dark:text-white">${p.price}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-lg border px-2 py-1 text-[11px] font-medium",
                          p.active
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-[var(--pos-border)] bg-[var(--pos-surface-2)] text-muted-foreground"
                        )}
                      >
                        {p.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex min-w-[170px] items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 gap-2 rounded-xl border-[var(--pos-border)] bg-[var(--pos-surface)] px-3 text-xs hover:bg-[var(--pos-surface-2)]"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="size-3.5" />
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => onDelete(p.id)}
                          aria-label={`Eliminar ${p.name}`}
                          title="Eliminar producto"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 ? (
          <div className="flex flex-col gap-3 border-t bg-[var(--pos-surface)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              {hasActiveFilters
                ? `Mostrando ${showingFrom}-${showingTo} de ${filtered.length} resultados.`
                : `Mostrando ${showingFrom}-${showingTo} de ${filtered.length} productos.`}
            </div>
            {totalPages > 1 ? (
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <div className="min-w-[110px] text-center text-xs font-medium text-muted-foreground">
                  PÃ¡gina {page} / {totalPages}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:hidden">
        <div className="flex items-center justify-between"><p className="text-xs font-bold text-slate-600 dark:text-slate-300">{hasActiveFilters ? `${filtered.length} resultados` : `Mostrando ${showingFrom}-${showingTo} de ${filtered.length}`}</p><Button type="button" variant="ghost" size="sm" onClick={exportProductsPdf} disabled={exportingPdf || filtered.length === 0} className="h-8 gap-1 rounded-lg text-[10px] text-blue-600"><Download className="size-3.5" />PDF</Button></div>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900">{products.length === 0 ? "No hay productos cargados." : "Ningún producto coincide con la búsqueda."}</div>
        ) : paginatedProducts.map((p) => (
          <article key={`mobile-${p.id}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_5px_18px_rgba(15,23,42,.06)] dark:border-slate-800 dark:bg-slate-900">
            <div className="flex gap-3 p-3">
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt={p.name} className="size-full object-cover" />
                ) : <Package className="size-6 text-slate-300 dark:text-slate-600" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2"><div className="min-w-0"><h2 className="truncate text-sm font-extrabold">{p.name}</h2><p className="mt-0.5 truncate text-[10px] text-slate-500">{[formatVariant(p) || p.category, p.barcode ? `EAN ${p.barcode}` : null].filter(Boolean).join(" · ") || "Sin código"}</p></div><span className={cn("shrink-0 rounded-full px-2 py-1 text-[9px] font-extrabold", p.active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800")}>{p.active ? "Activo" : "Inactivo"}</span></div>
                <div className="mt-3 flex items-end justify-between gap-2"><div><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Precio</p><p className="text-lg font-extrabold text-blue-600 tabular-nums">${p.price}</p></div><div className="text-right"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Stock</p><p className={cn("text-sm font-extrabold", isLowStock(p) ? "text-amber-600" : "text-slate-700 dark:text-slate-200")}>{formatStock(p)}</p></div></div>
              </div>
            </div>
            <div className="grid grid-cols-[1fr_auto] border-t border-slate-100 dark:border-slate-800"><button type="button" onClick={() => openEdit(p)} className="flex h-11 items-center justify-center gap-2 text-xs font-extrabold text-blue-600 transition hover:bg-blue-50 dark:hover:bg-blue-950/30"><Pencil className="size-3.5" />Editar producto</button><button type="button" onClick={() => onDelete(p.id)} className="flex h-11 w-12 items-center justify-center border-l border-slate-100 text-rose-500 dark:border-slate-800" aria-label={`Eliminar ${p.name}`}><Trash2 className="size-4" /></button></div>
          </article>
        ))}

        {filtered.length > 0 && totalPages > 1 ? (
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pt-1"><Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1}>Anterior</Button><span className="text-[10px] font-bold text-slate-500">{page}/{totalPages}</span><Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage === totalPages}>Siguiente</Button></div>
        ) : null}
      </div>

      <AnimatePresence>
        {importOpen ? (
          <motion.div className="fixed inset-0 z-[96] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget && !importing) setImportOpen(false); }} role="dialog" aria-modal="true" aria-labelledby="import-products-title">
            <motion.div className="w-full max-w-xl overflow-hidden rounded-2xl border bg-card shadow-xl" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }}>
              <div className="flex items-start justify-between border-b px-5 py-4"><div><h2 id="import-products-title" className="font-semibold">Importar productos desde Excel</h2><p className="mt-1 text-xs text-muted-foreground">Descargá la plantilla, completala y subí todos tus productos juntos.</p></div><Button type="button" variant="ghost" size="icon" disabled={importing} onClick={() => setImportOpen(false)}><X className="size-4" /></Button></div>
              <div className="space-y-4 p-5">
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30"><div className="flex gap-3"><FileSpreadsheet className="mt-0.5 size-5 shrink-0 text-blue-600" /><div><p className="text-sm font-semibold">1. Descargá la plantilla con ejemplos</p><p className="mt-1 text-xs text-muted-foreground">Incluye instrucciones y tres productos de muestra. Podés borrarlos y agregar todas las filas que necesites.</p><Button type="button" variant="outline" size="sm" className="mt-3 gap-2 bg-white dark:bg-slate-950" onClick={downloadImportTemplate}><Download className="size-3.5" />Descargar plantilla Excel</Button></div></div></div>
                <div><Label htmlFor="products-import-file">2. Subí la plantilla completada</Label><Input id="products-import-file" type="file" accept=".xlsx,.xls,.csv" className="mt-2 h-11" disabled={importing} onChange={(event) => setImportFile(event.target.files?.[0] ?? null)} /><p className="mt-2 text-[11px] text-muted-foreground">Máximo 5.000 productos. El nombre es obligatorio y los códigos de barras no deben repetirse.</p></div>
                <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={importing} onClick={() => setImportOpen(false)}>Cancelar</Button><Button type="button" disabled={!importFile || importing} onClick={handleImportProducts} className="gap-2"><Upload className="size-4" />{importing ? "Importando..." : "Importar productos"}</Button></div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {openCreate ? (
          <motion.div
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm max-lg:p-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setOpenCreate(false);
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-create-title"
          >
            <motion.div
              className={cn(
                "product-create-modal product-create-vivid flex max-h-[min(94vh,920px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-blue-400/30 bg-card shadow-2xl",
                "max-lg:fixed max-lg:inset-0 max-lg:h-[100dvh] max-lg:max-h-none max-lg:max-w-none max-lg:rounded-none max-lg:border-0"
              )}
              initial={{ y: 16, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 16, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18 }}
            >
              <div className="product-create-header relative flex shrink-0 items-center justify-between overflow-hidden border-b border-blue-400/30 px-6 py-5 text-white max-lg:pt-[max(1rem,env(safe-area-inset-top))] lg:px-8">
                <div className="relative z-10 flex items-center gap-4">
                  <div className="grid size-14 place-items-center rounded-2xl border border-white/20 bg-blue-500/30 shadow-lg"><Package className="size-7" /></div>
                  <div>
                  <div id="modal-create-title" className="text-base font-extrabold tracking-tight max-lg:text-xl lg:font-semibold">
                    Nuevo producto
                  </div>
                  <div className="text-sm text-blue-100 max-lg:hidden">
                    Cargá los datos del producto, precio y stock
                  </div>
                  <div className="text-[11px] text-blue-100 lg:hidden">
                    Asistente paso a paso · simple y rápido
                  </div>
                </div>
                </div>
                <Button type="button" variant="ghost" size="icon" className="relative z-10 text-white hover:bg-white/15 hover:text-white" onClick={() => setOpenCreate(false)}>
                  <X className="size-4" />
                </Button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-[#f5f8fc] p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] dark:bg-[#07111f] lg:p-6">
                <div className={cn(pending ? "pointer-events-none opacity-80" : "")}>
                  {isMobileAssist ? (
                    <ProductCreateMobileWizard
                      action={onCreate}
                      canEditPrice={canEditPrice}
                      canEditStock={canEditStock}
                      onDuplicateBarcode={notifyDuplicateBarcode}
                    />
                  ) : (
                    <ProductForm
                      businessType={businessType}
                      title=""
                      description={undefined}
                      container={false}
                      action={onCreate}
                      canEditPrice={canEditPrice}
                      canEditStock={canEditStock}
                      submitPulse={showCreateFormSpotlight && createGuidePhase === "submit"}
                      modalDesign
                      onCancel={() => setOpenCreate(false)}
                      onDuplicateBarcode={notifyDuplicateBarcode}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {editProduct ? (
          <motion.div
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm max-lg:p-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setEditProduct(null);
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-edit-title"
          >
            <motion.div
              className={cn(
                "flex max-h-[min(90vh,920px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--pos-border)] bg-card shadow-xl",
                "max-lg:fixed max-lg:inset-0 max-lg:h-[100dvh] max-lg:max-h-none max-lg:max-w-none max-lg:rounded-none max-lg:border-0"
              )}
              initial={{ y: 16, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 16, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex shrink-0 items-center justify-between border-b px-5 py-4 max-lg:pt-[max(1rem,env(safe-area-inset-top))]">
                <div>
                  <div id="modal-edit-title" className="text-base font-semibold tracking-tight max-lg:text-lg">
                    Editar producto
                  </div>
                  <div className="text-xs text-muted-foreground max-lg:hidden">
                    ActualizÃ¡ precios, stock y cÃ³digo.
                  </div>
                  <div className="text-[11px] text-muted-foreground lg:hidden">
                    PodÃ©s escanear para cambiar el cÃ³digo o ajustar stock.
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setEditProduct(null)}>
                  <X className="size-4" />
                </Button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                <div className={cn(pending ? "pointer-events-none opacity-80" : "")}>
                  <ProductForm
                    businessType={businessType}
                    key={editProduct.id}
                    title={editProduct.name}
                    description="El precio de venta se recalcula en base a costo y margen."
                    container={false}
                    defaults={{
                      id: editProduct.id,
                      name: editProduct.name,
                      image_path: editProduct.image_path,
                      image_url: editProduct.image_url,
                      barcode: editProduct.barcode,
                      scale_code: editProduct.scale_code,
                      category: editProduct.category,
                      variant_group: editProduct.variant_group,
                      size: editProduct.size,
                      color: editProduct.color,
                      cost: Number(editProduct.cost),
                      price: Number(editProduct.price),
                      expires_at: editProduct.expires_at,
                      sold_by_weight: editProduct.sold_by_weight,
                      stock: Number(editProduct.stock),
                      stock_decimal: Number(editProduct.stock_decimal),
                      low_stock_threshold: Number(editProduct.low_stock_threshold),
                      low_stock_threshold_decimal: Number(editProduct.low_stock_threshold_decimal),
                      active: editProduct.active,
                    }}
                    action={onUpdate}
                    canEditPrice={canEditPrice}
                    canEditStock={canEditStock}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {duplicateProductDialogOpen ? (
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="duplicate-product-title"
            aria-describedby="duplicate-product-description"
          >
            <motion.div
              className="w-full max-w-md overflow-hidden rounded-3xl border border-amber-300/60 bg-white shadow-[0_30px_100px_rgba(2,6,23,.45)] dark:border-amber-500/30 dark:bg-slate-900"
              initial={{ y: 12, scale: 0.97 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
            >
              <div className="flex items-start gap-4 border-b border-amber-100 bg-amber-50 px-6 py-5 dark:border-amber-500/10 dark:bg-amber-500/10">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20">
                  <AlertTriangle className="size-6" strokeWidth={2.5} />
                </span>
                <div className="min-w-0 pt-0.5">
                  <h2 id="duplicate-product-title" className="text-lg font-black tracking-tight text-slate-950 dark:text-white">
                    Este producto ya está cargado
                  </h2>
                  <p id="duplicate-product-description" className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
                    Este producto ya está ingresado. Tocá «Cargar otro» para abrir un formulario nuevo.
                  </p>
                </div>
              </div>
              <div className="space-y-5 px-6 py-5">
                <Button
                  type="button"
                  autoFocus
                  className="h-12 w-full gap-2 rounded-xl bg-blue-600 text-base font-extrabold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
                  onClick={() => {
                    setDuplicateProductDialogOpen(false);
                    setOpenCreate(true);
                  }}
                >
                  <ScanLine className="size-5" />
                  Cargar otro
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <BarcodeScanner
        open={scannerSearchOpen}
        continuous={false}
        steppedAfterSuccess={false}
        onClose={() => setScannerSearchOpen(false)}
        onDecoded={(raw) => {
          const code = raw.replace(/\s+/g, "").trim();
          if (!code) return false;
          const found = findProductByScannedCode(products, code);
          if (found) {
            openEdit(found);
            setBarcodeQuery("");
            toast.success("Producto encontrado", { description: found.name, duration: 1200 });
            return true;
          }
          toast.error("No hay producto con ese cÃ³digo", {
            description: "CreÃ¡ uno nuevo con Â«Nuevo productoÂ» o revisÃ¡ el cÃ³digo.",
          });
          return false;
        }}
      />
    </div>
  );
}

