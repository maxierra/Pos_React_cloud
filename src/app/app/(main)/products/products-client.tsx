"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { motion, AnimatePresence } from "framer-motion";
import { Download, Pencil, Plus, ScanBarcode, ScanLine, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { ONBOARDING_GUIDE_QUERY, ONBOARDING_GUIDE_TOTAL_STEPS } from "@/app/app/(main)/onboarding/onboarding-guide-constants";
import { OnboardingSpotlight } from "@/app/app/(main)/onboarding/onboarding-spotlight";
import { parseScaleBarcode } from "@/app/app/(main)/pos/utils/scale-barcode";
import { createProduct, deleteProduct, updateProduct } from "@/app/app/(main)/products/actions";
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

const PRODUCTS_PER_PAGE = 100;

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
    if (hasActiveFilters) return filtered;
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filtered.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filtered, hasActiveFilters, currentPage]);

  const showingFrom = filtered.length === 0 ? 0 : hasActiveFilters ? 1 : (currentPage - 1) * PRODUCTS_PER_PAGE + 1;
  const showingTo =
    filtered.length === 0 ? 0 : hasActiveFilters ? filtered.length : Math.min(currentPage * PRODUCTS_PER_PAGE, filtered.length);

  const onCreate = React.useCallback(
    async (formData: FormData) => {
      startTransition(() => {
        (async () => {
          try {
            await createProduct(formData);
            toast.success("Producto creado");
            setOpenCreate(false);
            if (guideProductStep) {
              router.push(`/app/cash?${ONBOARDING_GUIDE_QUERY}=cash`);
              return;
            }
            router.refresh();
          } catch (err) {
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
    <div className="relative mt-6">
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {hasActiveFilters
            ? `Mostrando ${filtered.length} resultados`
            : `${products.length} productos Â· pÃ¡gina ${page} de ${totalPages}`}
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
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

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="product-search-name" className="text-xs text-muted-foreground">
            Buscar por nombre
          </Label>
          <Input
            id="product-search-name"
            type="search"
            placeholder="Ej: oreo, lecheâ€¦"
            value={nameQuery}
            onChange={(e) => {
              setNameQuery(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="product-search-barcode" className="text-xs text-muted-foreground">
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
              className="h-10 rounded-xl pl-9"
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

      <div className="mt-4 overflow-hidden rounded-2xl border bg-card">
        <div className="overflow-auto">
          <table className="w-full min-w-[860px] text-sm">
            <colgroup>
              <col className="w-[46%]" />
              <col className="w-[18%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead className="bg-[var(--pos-surface-2)] text-muted-foreground">
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-medium">Producto</th>
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
                  <tr key={p.id} className="border-b last:border-b-0">
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
                          <div className="truncate font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {[formatVariant(p) || null, p.barcode ? `EAN: ${p.barcode}` : null, p.expires_at ? `Vence: ${p.expires_at}` : null]
                              .filter(Boolean)
                              .join(" Â· ")}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm leading-5 text-muted-foreground">{formatStock(p)}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-numeric">${p.price}</td>
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
                ? `La bÃºsqueda muestra todos los resultados encontrados (${filtered.length}).`
                : `Mostrando ${showingFrom}-${showingTo} de ${filtered.length} productos.`}
            </div>
            {!hasActiveFilters ? (
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

      <AnimatePresence>
        {openCreate ? (
          <motion.div
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 p-4 max-lg:p-0"
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
                "flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--pos-border)] bg-card shadow-xl",
                "max-lg:fixed max-lg:inset-0 max-lg:h-[100dvh] max-lg:max-h-none max-lg:max-w-none max-lg:rounded-none max-lg:border-0"
              )}
              initial={{ y: 16, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 16, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex shrink-0 items-center justify-between border-b px-5 py-4 max-lg:pt-[max(1rem,env(safe-area-inset-top))]">
                <div>
                  <div id="modal-create-title" className="text-base font-semibold tracking-tight max-lg:text-lg">
                    Nuevo producto
                  </div>
                  <div className="text-xs text-muted-foreground max-lg:hidden">
                    CargÃ¡ datos, precio y stock.
                  </div>
                  <div className="text-[11px] text-muted-foreground lg:hidden">
                    Asistente paso a paso: cÃ³digo, datos, precios y stock.
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setOpenCreate(false)}>
                  <X className="size-4" />
                </Button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                <div className={cn(pending ? "pointer-events-none opacity-80" : "")}>
                  {isMobileAssist ? (
                    <ProductCreateMobileWizard
                      action={onCreate}
                      canEditPrice={canEditPrice}
                      canEditStock={canEditStock}
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
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 p-4 max-lg:p-0"
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

