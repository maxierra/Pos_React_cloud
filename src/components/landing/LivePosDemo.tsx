"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, CreditCard, PackagePlus, Receipt, ScanLine, Sparkles } from "lucide-react";

import { FakeCart } from "@/components/landing/FakeCart";
import { FakeDashboard } from "@/components/landing/FakeDashboard";
import { FakePOS } from "@/components/landing/FakePOS";
import { getDemoChrome } from "@/components/landing/demo-chrome";
import type {
  DemoAppearance,
  DemoCartLine,
  DemoProduct,
  DemoSale,
  DemoStep,
} from "@/components/landing/demo-types";
import { cn } from "@/lib/utils";

const PRODUCTS: DemoProduct[] = [
  { id: "alfajor", name: "Alfajor Triple", price: 1800, category: "snacks" },
  { id: "coca", name: "Coca Cola 500ml", price: 2200, category: "bebidas" },
  { id: "agua", name: "Agua Mineral 1.5L", price: 1300, category: "bebidas" },
  { id: "papas", name: "Papas Fritas 150g", price: 2100, category: "snacks" },
  { id: "yerba", name: "Yerba 500g", price: 3900, category: "almacen" },
];

const DEMO_STEPS: DemoStep[] = [
  { id: "s1", type: "search", query: "coca" },
  { id: "s2", type: "add", productId: "coca" },
  { id: "s3", type: "search", query: "alfajor" },
  { id: "s4", type: "add", productId: "alfajor" },
  { id: "s5", type: "search", query: "papas" },
  { id: "s6", type: "add", productId: "papas" },
  { id: "s7", type: "pay", paymentMethod: "cash" },
];

const PRODUCT_BARCODES: Record<string, string> = {
  coca: "7790895001223",
  alfajor: "7790040172374",
  papas: "7791234123490",
  agua: "7795555003108",
  yerba: "7799876543212",
};

const MOCK_BUSINESS = {
  name: "Mi Negocio Demo",
  address: "Av. Corrientes 1234, CABA",
  phone: "11 5555-1234",
  cuit: "20-12345678-9",
  header: "Gracias por su compra",
  footer: "Ticket no válido como factura",
};

const SALES_MS = {
  start: 1800,
  search: 2400,
  add: 2500,
  payOpenModal: 1500,
  payPreview: 2900,
  payConfirm: 1900,
  payShowTicket: 5800,
};

const DASHBOARD_MS = 7500;
const PHASE_GAP_MS = 1500;

type SaleTicketSnapshot = {
  lines: DemoCartLine[];
  total: number;
  cashReceived: number;
  change: number;
  method: DemoSale["paymentMethod"];
  saleId: string;
  at: string;
};

function moneyAr(value: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
}

function methodLabel(m: DemoSale["paymentMethod"]) {
  if (m === "cash") return "Efectivo";
  if (m === "card") return "Tarjeta";
  return "Transferencia";
}

export function LivePosDemo() {
  const [demoSkin, setDemoSkin] = useState<DemoAppearance>("light");
  const [phase, setPhase] = useState<"load" | "sales" | "dashboard">("load");
  const [loadStepIdx, setLoadStepIdx] = useState(0);
  const [salesStepIdx, setSalesStepIdx] = useState(0);

  const [query, setQuery] = useState("");
  const [barcodeValue, setBarcodeValue] = useState("");
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [cart, setCart] = useState<DemoCartLine[]>([]);
  const [sales, setSales] = useState<DemoSale[]>([]);
  const [lastPaymentMethod, setLastPaymentMethod] = useState<DemoSale["paymentMethod"] | null>(null);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<DemoSale["paymentMethod"] | null>(null);
  const [cashReceived, setCashReceived] = useState(0);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [ticketPreviewOpen, setTicketPreviewOpen] = useState(false);
  const [saleTicket, setSaleTicket] = useState<SaleTicketSnapshot | null>(null);

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);
  const [pulseKey, setPulseKey] = useState(0);
  const [status, setStatus] = useState("Iniciando demo...");

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = useMemo(() => cart.reduce((acc, line) => acc + line.qty * line.price, 0), [cart]);
  const totalRef = useRef(0);
  totalRef.current = total;
  const cartRef = useRef(cart);
  cartRef.current = cart;
  const change = Math.max(0, cashReceived - total);

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };
  const schedule = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timeoutsRef.current.push(id);
    return id;
  };

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (phase === "load") {
      setStatus("Preparando pantalla de carga de productos...");
      setLoadStepIdx(0);
      setProductModalOpen(false);
      setLoadingProductId(null);
      setBarcodeValue("");
      setQuery("");
      return;
    }

    if (phase === "sales") {
      setStatus("Mostrando flujo de venta en caja");
      setSalesStepIdx(0);
      setQuery("");
      setBarcodeValue("");
      setActiveProductId(null);
      setCart([]);
      setSelectedPaymentMethod(null);
      setCashReceived(0);
      setPaymentModalOpen(false);
      setTicketPreviewOpen(false);
      setSaleTicket(null);
      return;
    }

    setStatus("Dashboard actualizado en tiempo real");
    timerRef.current = setTimeout(() => {
      setDemoSkin((s) => (s === "light" ? "dark" : "light"));
      setPhase("load");
    }, DASHBOARD_MS);
  }, [phase]);

  useEffect(() => {
    if (phase !== "load") return;

    const next = (ms: number) => {
      timerRef.current = setTimeout(() => setLoadStepIdx((i) => i + 1), ms);
    };

    if (loadStepIdx === 0) {
      setStatus("Abriendo modal: Nuevo producto");
      setProductModalOpen(true);
      next(1050);
      return;
    }
    if (loadStepIdx === 1) {
      setStatus(`Escaneando código ${PRODUCT_BARCODES.coca}`);
      setBarcodeValue(PRODUCT_BARCODES.coca);
      setLoadingProductId("coca");
      next(1400);
      return;
    }
    if (loadStepIdx === 2) {
      setStatus("Producto detectado: Coca Cola 500ml");
      next(1100);
      return;
    }
    if (loadStepIdx === 3) {
      setStatus("Guardando producto y stock inicial");
      setLoadingProductId(null);
      next(950);
      return;
    }
    if (loadStepIdx === 4) {
      setStatus(`Escaneando código ${PRODUCT_BARCODES.alfajor}`);
      setBarcodeValue(PRODUCT_BARCODES.alfajor);
      setLoadingProductId("alfajor");
      next(1400);
      return;
    }
    if (loadStepIdx === 5) {
      setStatus("Producto detectado: Alfajor Triple");
      next(1100);
      return;
    }
    if (loadStepIdx === 6) {
      setStatus("Guardando producto y finalizando carga");
      setLoadingProductId(null);
      next(950);
      return;
    }

    setProductModalOpen(false);
    setBarcodeValue("");
    timerRef.current = setTimeout(() => {
      setSalesStepIdx(0);
      setPhase("sales");
    }, PHASE_GAP_MS);
  }, [phase, loadStepIdx]);

  useEffect(() => {
    if (phase !== "sales") return;

    if (salesStepIdx <= 0) {
      clearAllTimeouts();
      const kickoff = setTimeout(() => setSalesStepIdx(1), SALES_MS.start);
      timerRef.current = kickoff;
      return () => {
        clearTimeout(kickoff);
        clearAllTimeouts();
      };
    }

    clearAllTimeouts();
    if (timerRef.current) clearTimeout(timerRef.current);

    if (salesStepIdx === DEMO_STEPS.length + 1) {
      timerRef.current = setTimeout(() => {
        setSalesStepIdx(0);
        setPhase("dashboard");
      }, PHASE_GAP_MS);
      return () => {
        clearAllTimeouts();
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    const step = DEMO_STEPS[salesStepIdx - 1];
    if (!step) return;

    const next = (ms: number) => {
      timerRef.current = setTimeout(() => setSalesStepIdx((i) => i + 1), ms);
    };

    if (step.type === "search") {
      const product = PRODUCTS.find((p) => p.name.toLowerCase().includes(step.query.toLowerCase()));
      const barcode = product ? PRODUCT_BARCODES[product.id] ?? "" : "";
      setStatus(barcode ? `Escaneando código ${barcode}` : `Buscando: ${step.query}`);
      setActiveProductId(null);
      setQuery(step.query);
      setBarcodeValue(barcode);
      next(SALES_MS.search);
      return () => {
        clearAllTimeouts();
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    if (step.type === "add") {
      const product = PRODUCTS.find((p) => p.id === step.productId);
      if (!product) {
        next(850);
        return () => {
          clearAllTimeouts();
          if (timerRef.current) clearTimeout(timerRef.current);
        };
      }
      setStatus(`Agregando ${product.name} al carrito`);
      setActiveProductId(product.id);
      setBarcodeValue(PRODUCT_BARCODES[product.id] ?? "");
      setCart((prev) => {
        const found = prev.find((x) => x.productId === product.id);
        if (found) return prev.map((x) => (x.productId === product.id ? { ...x, qty: x.qty + 1 } : x));
        return [...prev, { productId: product.id, name: product.name, qty: 1, price: product.price }];
      });
      setPulseKey((k) => k + 1);
      next(SALES_MS.add);
      return () => {
        clearAllTimeouts();
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    if (step.type === "pay") {
      const currentTotal = totalRef.current;
      const received = Math.ceil(currentTotal / 100) * 100 + 500;
      const method = step.paymentMethod;

      setStatus("Abriendo modal de cobro");
      setPaymentModalOpen(true);
      setSelectedPaymentMethod(method);
      setCashReceived(received);
      setTicketPreviewOpen(false);
      setSaleTicket(null);

      schedule(() => {
        setStatus("Revisando total y medio de pago");
        setTicketPreviewOpen(true);
      }, SALES_MS.payOpenModal);

      schedule(() => {
        setStatus("Confirmando cobro...");
        setTicketPreviewOpen(false);
      }, SALES_MS.payOpenModal + SALES_MS.payPreview);

      schedule(() => {
        const lines = cartRef.current.map((l) => ({ ...l }));
        const totalSnap = lines.reduce((acc, l) => acc + l.qty * l.price, 0);
        const changeSnap = Math.max(0, received - totalSnap);
        const saleId = `VTA-${Date.now().toString().slice(-8)}`;
        const at = new Intl.DateTimeFormat("es-AR", {
          dateStyle: "short",
          timeStyle: "medium",
        }).format(new Date());

        if (totalSnap > 0) {
          setLastPaymentMethod(method);
          setSales((prev) => [
            ...prev.slice(-11),
            { id: saleId, total: totalSnap, paymentMethod: method, createdAt: Date.now() },
          ]);
          setSaleTicket({
            lines,
            total: totalSnap,
            cashReceived: received,
            change: changeSnap,
            method,
            saleId,
            at,
          });
        }
        setCart([]);
        setQuery("");
        setBarcodeValue("");
        setPaymentModalOpen(false);
        setPulseKey((k) => k + 1);
        setStatus("Venta registrada — mostrando ticket");
      }, SALES_MS.payOpenModal + SALES_MS.payPreview + SALES_MS.payConfirm);

      schedule(() => {
        setSaleTicket(null);
        setSalesStepIdx((i) => i + 1);
      }, SALES_MS.payOpenModal + SALES_MS.payPreview + SALES_MS.payConfirm + SALES_MS.payShowTicket);

      return () => {
        clearAllTimeouts();
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    return () => {
      clearAllTimeouts();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, salesStepIdx]);

  const simulatedLoadedProducts = useMemo(
    () => PRODUCTS.filter((p) => ["coca", "alfajor"].includes(p.id) || loadStepIdx >= 6),
    [loadStepIdx]
  );

  const chrome = useMemo(() => getDemoChrome(demoSkin), [demoSkin]);

  return (
    <section
      className={cn(
        "max-md:rounded-2xl max-md:shadow-md rounded-3xl p-3 shadow-sm transition-[background-color,border-color,box-shadow] duration-500 sm:p-4 md:p-6 md:shadow-sm",
        chrome.shell
      )}
    >
      <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wide sm:gap-2 sm:px-3 sm:py-1 sm:text-[11px]",
                chrome.demoBadge
              )}
            >
              <Sparkles className="size-3 sm:size-3.5" />
              Demo en vivo
            </div>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide sm:px-2.5 sm:text-[10px]",
                demoSkin === "light"
                  ? "border-sky-400/50 bg-sky-100 text-sky-900"
                  : "border-fuchsia-500/35 bg-fuchsia-950/40 text-fuchsia-200"
              )}
            >
              {demoSkin === "light" ? "Secuencia clara" : "Secuencia oscura"}
            </span>
          </div>
          <h3 className={cn("mt-1.5 text-base font-semibold tracking-tight sm:mt-2 sm:text-xl md:text-2xl", chrome.h3)}>
            Secuencia automatica del sistema POS
          </h3>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn("w-full max-w-full rounded-xl border px-2.5 py-1.5 text-[11px] sm:w-auto sm:max-w-md sm:px-3 sm:py-2 sm:text-xs", chrome.statusBox)}
          >
            {status}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-1.5 sm:mb-4 sm:gap-2">
        {[
          { id: "load", label: "1. Carga de productos" },
          { id: "sales", label: "2. Pantalla de ventas" },
          { id: "dashboard", label: "3. Dashboard final" },
        ].map((item) => (
          <div
            key={item.id}
            className={cn(
              "rounded-lg border px-1.5 py-1.5 text-[10px] transition sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs",
              phase === item.id ? chrome.stepOn : chrome.stepOff
            )}
          >
            <span className="block leading-tight sm:inline">{item.label}</span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {phase === "load" ? (
          <motion.div
            key="load"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn("rounded-xl border p-3 sm:rounded-2xl sm:p-4", chrome.panel)}
          >
            <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className={cn("text-sm font-semibold tracking-tight", chrome.h3)}>Productos</div>
                <div className={cn("text-[11px] sm:text-xs", chrome.muted)}>Alta, edición y control de stock.</div>
              </div>
              <div
                className={cn(
                  "inline-flex w-fit items-center gap-1 rounded-lg border px-2 py-1 text-[11px] sm:rounded-xl sm:px-2.5 sm:py-1.5 sm:text-xs",
                  chrome.panelAlt
                )}
              >
                <PackagePlus className={cn("size-3.5", chrome.accent)} />
                Nuevo producto
              </div>
            </div>

            <div className={cn("overflow-x-auto rounded-lg border sm:overflow-hidden sm:rounded-xl", chrome.tableShell)}>
              <table className="w-full min-w-[480px] text-xs sm:min-w-0 sm:text-sm">
                <thead>
                  <tr className={cn("border-b", chrome.tableHead)}>
                    <th className="px-3 py-2 text-left font-medium">Producto</th>
                    <th className="px-3 py-2 text-left font-medium">Stock</th>
                    <th className="px-3 py-2 text-left font-medium">Precio</th>
                    <th className="px-3 py-2 text-left font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {simulatedLoadedProducts.map((p) => (
                    <tr key={p.id} className={cn("border-b last:border-b-0", chrome.tableRowBorder)}>
                      <td className={cn("px-3 py-2 font-medium", chrome.h3)}>{p.name}</td>
                      <td className={cn("px-3 py-2", chrome.muted)}>Stock: 24 | Mín: 5</td>
                      <td className={cn("px-3 py-2 font-numeric", chrome.h3)}>$ {p.price}</td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-lg border px-2 py-1 text-[11px] font-medium",
                            chrome.pillSuccess
                          )}
                        >
                          <CheckCircle2 className="mr-1 size-3.5" />
                          Activo
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <AnimatePresence>
              {productModalOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className={cn("mt-4 rounded-xl border p-4", chrome.modalBlock)}
                >
                  <div className={cn("mb-2 text-sm font-semibold", chrome.h3)}>Modal: Nuevo producto</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className={cn("rounded-lg border px-3 py-2 text-xs", chrome.innerWell)}>
                      <div className={chrome.muted}>Escaner</div>
                      <div className={cn("mt-1 inline-flex items-center gap-1", chrome.h3)}>
                        <ScanLine className={cn("size-3.5", chrome.accent)} />
                        {barcodeValue || "Esperando código..."}
                      </div>
                    </div>
                    <div className={cn("rounded-lg border px-3 py-2 text-xs", chrome.innerWell)}>
                      <div className={chrome.muted}>Producto detectado</div>
                      <div className={cn("mt-1 font-medium", chrome.h3)}>
                        {loadingProductId ? PRODUCTS.find((p) => p.id === loadingProductId)?.name : "Sin lectura"}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        ) : null}

        {phase === "sales" ? (
          <motion.div
            key="sales"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative grid gap-3 lg:grid-cols-[1fr_0.95fr] lg:gap-4"
          >
            <FakePOS
              products={PRODUCTS}
              searchQuery={query}
              activeProductId={activeProductId}
              barcodeValue={barcodeValue}
              chrome={chrome}
            />
            <div className="grid gap-4">
              <FakeCart
                lines={cart}
                total={total}
                paymentMethod={lastPaymentMethod}
                salePulseKey={pulseKey}
                chrome={chrome}
              />
              <div className={cn("rounded-xl border p-3 sm:rounded-2xl sm:p-4", chrome.paySidePanel)}>
                <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold sm:text-sm">
                  <CreditCard className={cn("size-4", chrome.accent)} />
                  <span className={chrome.h3}>Simulación de cobro</span>
                </div>
                <div className="grid gap-2 text-xs">
                  <div className={cn("rounded-lg border px-3 py-2", chrome.payRow)}>
                    <span className={chrome.muted}>Medio elegido: </span>
                    <span className={cn("font-medium", chrome.h3)}>
                      {selectedPaymentMethod ? methodLabel(selectedPaymentMethod) : "-"}
                    </span>
                  </div>
                  <div className={cn("rounded-lg border px-3 py-2", chrome.payRow)}>
                    <span className={chrome.muted}>Efectivo recibido: </span>
                    <span className={cn("font-medium", chrome.h3)}>{moneyAr(cashReceived || 0)}</span>
                  </div>
                  <div className={cn("rounded-lg border px-3 py-2", chrome.payRow)}>
                    <span className={chrome.muted}>Vuelto simulado: </span>
                    <span className={cn("font-medium", chrome.h3)}>{moneyAr(change)}</span>
                  </div>
                </div>
                {paymentModalOpen ? (
                  <div className={cn("mt-3 rounded-xl border p-3", chrome.modalPayInner)}>
                    <div className={cn("text-xs", chrome.muted)}>Modal de pago abierto</div>
                    <div className={cn("text-sm font-medium", chrome.h3)}>Total a cobrar: {moneyAr(total)}</div>
                  </div>
                ) : null}
                {ticketPreviewOpen ? (
                  <div className={cn("mt-3 rounded-xl border p-3", chrome.modalPayInner)}>
                    <div className={cn("mb-1 inline-flex items-center gap-1 text-xs", chrome.muted)}>
                      <Receipt className="size-3.5" />
                      Preview antes de confirmar
                    </div>
                    <div className={cn("text-sm", chrome.h3)}>Total: {moneyAr(total)}</div>
                    <div className={cn("text-sm", chrome.h3)}>
                      Pago: {selectedPaymentMethod ? methodLabel(selectedPaymentMethod) : "-"}
                    </div>
                    <div className={cn("text-sm", chrome.h3)}>Vuelto: {moneyAr(change)}</div>
                  </div>
                ) : null}
              </div>
            </div>

            <AnimatePresence>
              {saleTicket ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "absolute inset-0 z-10 flex items-start justify-center overflow-y-auto rounded-2xl p-4",
                    chrome.ticketOverlay
                  )}
                >
                  <motion.div
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 16, opacity: 0 }}
                    className={cn(
                      "w-full max-w-[280px] rounded-lg border-2 border-dashed p-4 shadow-xl",
                      demoSkin === "light"
                        ? "border-neutral-400 bg-white text-black"
                        : "border-neutral-600 bg-zinc-900 text-zinc-100"
                    )}
                  >
                    <div
                      className={cn(
                        "border-b border-dashed pb-3 text-center text-[11px] leading-relaxed",
                        demoSkin === "light" ? "border-neutral-400" : "border-neutral-600"
                      )}
                    >
                      <div className="font-bold uppercase tracking-wide">{MOCK_BUSINESS.name}</div>
                      <div>{MOCK_BUSINESS.address}</div>
                      <div>Tel: {MOCK_BUSINESS.phone}</div>
                      <div>CUIT: {MOCK_BUSINESS.cuit}</div>
                      <div
                        className={cn(
                          "mt-1 text-[10px]",
                          demoSkin === "light" ? "text-neutral-600" : "text-zinc-400"
                        )}
                      >
                        {MOCK_BUSINESS.header}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "my-3 space-y-1 border-b border-dashed pb-3 font-mono text-[10px]",
                        demoSkin === "light" ? "border-neutral-400" : "border-neutral-600"
                      )}
                    >
                      <div
                        className={cn(
                          "flex justify-between",
                          demoSkin === "light" ? "text-neutral-500" : "text-zinc-400"
                        )}
                      >
                        <span>Venta</span>
                        <span>{saleTicket.saleId}</span>
                      </div>
                      <div
                        className={cn(
                          "flex justify-between",
                          demoSkin === "light" ? "text-neutral-500" : "text-zinc-400"
                        )}
                      >
                        <span>Fecha</span>
                        <span className="text-right">{saleTicket.at}</span>
                      </div>
                      <div
                        className={cn(
                          "pt-2 text-[9px] uppercase",
                          demoSkin === "light" ? "text-neutral-500" : "text-zinc-500"
                        )}
                      >
                        Detalle
                      </div>
                      {saleTicket.lines.map((line) => (
                        <div key={line.productId} className="flex justify-between gap-2">
                          <span className="max-w-[140px] truncate">
                            {line.qty}x {line.name}
                          </span>
                          <span>{moneyAr(line.qty * line.price)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between font-semibold">
                        <span>TOTAL</span>
                        <span>{moneyAr(saleTicket.total)}</span>
                      </div>
                      <div
                        className={cn(
                          "flex justify-between",
                          demoSkin === "light" ? "text-neutral-700" : "text-zinc-300"
                        )}
                      >
                        <span>Pago</span>
                        <span>{methodLabel(saleTicket.method)}</span>
                      </div>
                      <div
                        className={cn(
                          "flex justify-between",
                          demoSkin === "light" ? "text-neutral-700" : "text-zinc-300"
                        )}
                      >
                        <span>Recibido</span>
                        <span>{moneyAr(saleTicket.cashReceived)}</span>
                      </div>
                      <div
                        className={cn(
                          "flex justify-between font-semibold",
                          demoSkin === "light" ? "text-emerald-700" : "text-emerald-400"
                        )}
                      >
                        <span>Vuelto</span>
                        <span>{moneyAr(saleTicket.change)}</span>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "mt-3 border-t border-dashed pt-2 text-center text-[9px]",
                        demoSkin === "light"
                          ? "border-neutral-400 text-neutral-600"
                          : "border-neutral-600 text-zinc-500"
                      )}
                    >
                      {MOCK_BUSINESS.footer}
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        ) : null}

        {phase === "dashboard" ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid gap-3 sm:gap-4"
          >
            <FakeDashboard sales={sales} chrome={chrome} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

