"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Circle,
  Download,
  FileKey,
  HelpCircle,
  RefreshCw,
  ShieldCheck,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type {
  BusinessFiscalConfig,
  FiscalCertificate,
  FiscalCertificateStatus,
  FiscalDocumentOutputMode,
  FiscalEnvironment,
  FiscalPointOfSale,
  TaxCondition,
} from "@/features/billing/types";
import {
  defaultFiscalVoucherTypeForTaxCondition,
  voucherOptionsForTaxCondition,
} from "@/features/billing/types";
import {
  downloadCertificateCsr,
  generateCertificateRequest,
  saveFiscalConfig,
  syncFiscalLastNumber,
  testFiscalAuth,
  uploadCertificateFromPem,
} from "@/app/app/(main)/settings/fiscal-actions";

type Props = {
  defaults: {
    cuit: string | null;
    name: string;
  };
  config: BusinessFiscalConfig | null;
  posHomolog: FiscalPointOfSale | null;
  posProd: FiscalPointOfSale | null;
  certHomolog: FiscalCertificate | null;
  certProd: FiscalCertificate | null;
};

const CERT_STATUS_LABELS: Record<FiscalCertificateStatus, string> = {
  pending_upload: "Falta subir el certificado",
  active: "Certificado activo",
  expired: "Certificado vencido",
  revoked: "Certificado revocado",
};

function defaultVoucherTypes(pos: FiscalPointOfSale | null, taxCondition: TaxCondition): number[] {
  if (pos?.voucher_types?.length) return [...pos.voucher_types];
  const required = defaultFiscalVoucherTypeForTaxCondition(taxCondition);
  return required === 6 ? [6, 8] : [11, 13];
}

function StepBadge({ n, title, done }: { n: number; title: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
          done ? "bg-emerald-600 text-white" : "border border-border bg-muted/60 text-muted-foreground"
        )}
      >
        {done ? <CheckCircle2 className="size-3.5" /> : n}
      </span>
      <span className="text-sm font-semibold text-foreground">{title}</span>
    </div>
  );
}

function HelpBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 rounded-xl border border-sky-500/20 bg-sky-500/[0.06] p-3 text-xs leading-relaxed text-muted-foreground">
      <HelpCircle className="mt-0.5 size-4 shrink-0 text-sky-600 dark:text-sky-400" />
      <div>{children}</div>
    </div>
  );
}

export function FiscalConfigForm({
  defaults,
  config,
  posHomolog,
  posProd,
  certHomolog,
  certProd,
}: Props) {
  const initialTaxCondition = (config?.tax_condition ?? "monotributo") as TaxCondition;
  const [pending, startTransition] = React.useTransition();
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [documentStyle, setDocumentStyle] = React.useState<FiscalDocumentOutputMode>(
    (config?.document_output_mode ?? "factura") as FiscalDocumentOutputMode
  );

  const [form, setForm] = React.useState({
    tax_condition: initialTaxCondition,
    cuit: config?.cuit ?? defaults.cuit ?? "",
    razon_social: config?.razon_social ?? defaults.name ?? "",
    domicilio_fiscal: config?.domicilio_fiscal ?? "",
    iibb: config?.iibb ?? "",
    activity_start_date: config?.activity_start_date ?? "",
    environment: (config?.environment ?? "homolog") as FiscalEnvironment,
    billing_mode: (config?.billing_mode ?? "per_sale") as "per_sale" | "consolidated",
    document_output_mode: (config?.document_output_mode ?? "factura") as FiscalDocumentOutputMode,
    is_active: config?.is_active ?? false,
    pos_number_homolog: posHomolog?.pos_number ?? 1,
    pos_number_prod: posProd?.pos_number ?? 1,
    voucher_types_homolog: defaultVoucherTypes(posHomolog, initialTaxCondition),
    voucher_types_prod: defaultVoucherTypes(posProd, initialTaxCondition),
  });

  const activeEnv = form.environment;
  const activeTaxCondition = form.tax_condition;
  const isTest = activeEnv === "homolog";
  const activeCert = isTest ? certHomolog : certProd;
  const activePosNumber = isTest ? form.pos_number_homolog : form.pos_number_prod;
  const activeVoucherTypes = isTest ? form.voucher_types_homolog : form.voucher_types_prod;
  const activeVoucherOptions = voucherOptionsForTaxCondition(activeTaxCondition);
  const activeRequiredVoucherType = defaultFiscalVoucherTypeForTaxCondition(activeTaxCondition);
  const certInputRef = React.useRef<HTMLInputElement>(null);

  const setActivePosNumber = (n: number) => {
    setForm((f) => (isTest ? { ...f, pos_number_homolog: n } : { ...f, pos_number_prod: n }));
  };

  const updateTaxCondition = (taxCondition: TaxCondition) => {
    const defaultTypes = taxCondition === "ri" ? [6, 8] : [11, 13];
    setForm((f) => ({
      ...f,
      tax_condition: taxCondition,
      voucher_types_homolog: defaultTypes,
      voucher_types_prod: defaultTypes,
    }));
  };

  const toggleVoucherType = (type: number) => {
    setForm((f) => {
      const key = isTest ? "voucher_types_homolog" : "voucher_types_prod";
      const current = f[key];
      const has = current.includes(type);
      const required = defaultFiscalVoucherTypeForTaxCondition(f.tax_condition);
      if (has && type === required && current.length === 1) {
        toast.error(required === 6 ? "Tenes que habilitar al menos Factura B" : "Tenes que habilitar al menos Factura C");
        return f;
      }
      const next = has ? current.filter((t) => t !== type) : [...current, type].sort((a, b) => a - b);
      return { ...f, [key]: next };
    });
  };

  const save = () => {
    if (!form.cuit.trim()) {
      toast.error("Completa tu CUIT");
      return;
    }
    if (!form.razon_social.trim()) {
      toast.error("Completa la razon social");
      return;
    }
    if (!activeVoucherTypes.includes(activeRequiredVoucherType)) {
      toast.error(activeRequiredVoucherType === 6 ? "Habilita Factura B para poder facturar" : "Habilita Factura C para poder facturar");
      return;
    }

    startTransition(async () => {
      try {
        await saveFiscalConfig({ ...form, document_output_mode: documentStyle });
        toast.success("Configuracion guardada");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al guardar");
      }
    });
  };

  const generateCsr = () => {
    startTransition(async () => {
      try {
        await generateCertificateRequest({
          environment: activeEnv,
          cuit: form.cuit,
          razonSocial: form.razon_social,
        });
        toast.success("Listo. Descarga el archivo CSR y subilo a ARCA.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  };

  const downloadCsr = () => {
    startTransition(async () => {
      try {
        const pem = await downloadCertificateCsr(activeEnv);
        const blob = new Blob([pem], { type: "application/pkcs10" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `solicitud-${activeEnv}.csr`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  };

  const onCertFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    startTransition(async () => {
      try {
        const pem = await file.text();
        await uploadCertificateFromPem({ environment: activeEnv, certPem: pem });
        toast.success("Certificado activado");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error");
      }
    });
    e.target.value = "";
  };

  const testConn = () => {
    startTransition(async () => {
      try {
        const r = await testFiscalAuth(activeEnv);
        toast.success(`Conexion OK. Ultimo comprobante autorizado: ${r.lastVoucherNumber}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo conectar con ARCA");
      }
    });
  };

  const syncLast = () => {
    startTransition(async () => {
      try {
        const r = await syncFiscalLastNumber(activeEnv);
        toast.success(`Ultimo numero sincronizado: ${r.lastVoucherNumber}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  };

  const certReady = activeCert?.status === "active";
  const datosOk = Boolean(form.cuit.trim() && form.razon_social.trim());
  const posOk = activePosNumber >= 1;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border/70 bg-card p-5">
        <StepBadge n={1} title="Ambiente" done={datosOk} />
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Cada ambiente tiene su propio punto de venta y su propio certificado en ARCA.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, environment: "homolog" }))}
            className={cn(
              "rounded-xl border-2 p-4 text-left transition-all",
              isTest ? "border-amber-500 bg-amber-500/[0.08] shadow-sm" : "border-border/70 hover:border-border"
            )}
          >
            <div className="flex items-center gap-2">
              <Circle className={cn("size-4", isTest ? "fill-amber-500 text-amber-500" : "text-muted-foreground")} />
              <span className="text-sm font-bold">Prueba</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Para validar certificados, punto de venta y emision sin impacto real.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, environment: "prod" }))}
            className={cn(
              "rounded-xl border-2 p-4 text-left transition-all",
              !isTest ? "border-emerald-600 bg-emerald-600/[0.08] shadow-sm" : "border-border/70 hover:border-border"
            )}
          >
            <div className="flex items-center gap-2">
              <Circle className={cn("size-4", !isTest ? "fill-emerald-600 text-emerald-600" : "text-muted-foreground")} />
              <span className="text-sm font-bold">Produccion</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Solo cuando ya probaste todo y estas listo para emitir comprobantes reales.
            </p>
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-5">
        <StepBadge n={2} title="Condicion fiscal y datos" done={datosOk} />
        <p className="mt-2 text-xs text-muted-foreground">
          Completa tus datos tal como figuran en ARCA/AFIP y elige como facturas.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => updateTaxCondition("monotributo")}
            className={cn(
              "rounded-xl border-2 p-4 text-left transition-all",
              activeTaxCondition === "monotributo"
                ? "border-sky-500 bg-sky-500/[0.08] shadow-sm"
                : "border-border/70 hover:border-border"
            )}
          >
            <p className="text-sm font-bold">Monotributista</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Emite Factura C y Nota de Credito C.</p>
          </button>
          <button
            type="button"
            onClick={() => updateTaxCondition("ri")}
            className={cn(
              "rounded-xl border-2 p-4 text-left transition-all",
              activeTaxCondition === "ri"
                ? "border-emerald-600 bg-emerald-600/[0.08] shadow-sm"
                : "border-border/70 hover:border-border"
            )}
          >
            <p className="text-sm font-bold">Responsable inscripto</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Emite Factura A o Factura B segun la condicion fiscal del cliente.
            </p>
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="fiscal-cuit" className="text-xs">
              CUIT
            </Label>
            <Input id="fiscal-cuit" placeholder="20-12345678-9" value={form.cuit} onChange={(e) => setForm((f) => ({ ...f, cuit: e.target.value }))} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="fiscal-razon" className="text-xs">
              Razon social o nombre
            </Label>
            <Input id="fiscal-razon" value={form.razon_social} onChange={(e) => setForm((f) => ({ ...f, razon_social: e.target.value }))} />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="fiscal-domicilio" className="text-xs">
              Domicilio fiscal <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="fiscal-domicilio"
              placeholder="Calle, localidad, provincia"
              value={form.domicilio_fiscal}
              onChange={(e) => setForm((f) => ({ ...f, domicilio_fiscal: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="fiscal-iibb" className="text-xs">
              Ingresos Brutos / IIBB <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="fiscal-iibb"
              placeholder="Numero de inscripcion"
              value={form.iibb}
              onChange={(e) => setForm((f) => ({ ...f, iibb: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="fiscal-activity-start" className="text-xs">
              Inicio de actividades <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="fiscal-activity-start"
              type="date"
              value={form.activity_start_date}
              onChange={(e) => setForm((f) => ({ ...f, activity_start_date: e.target.value }))}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-5">
        <StepBadge n={3} title="Punto de venta y comprobantes" done={posOk && activeVoucherTypes.includes(activeRequiredVoucherType)} />

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="fiscal-pos" className="text-xs">
              Numero de punto de venta
            </Label>
            <Input id="fiscal-pos" type="number" min={1} max={99999} value={activePosNumber} onChange={(e) => setActivePosNumber(Number(e.target.value) || 1)} />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              El mismo numero que creaste en ARCA para {isTest ? "homologacion" : "produccion"}.
            </p>
          </div>

          <div className="grid gap-2">
            <span className="text-xs font-medium">Comprobantes habilitados</span>
            {activeTaxCondition === "ri" ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] px-3 py-2 text-xs leading-relaxed text-emerald-950 dark:text-emerald-200">
                <strong>Responsable inscripto:</strong> este punto de venta queda preparado para emitir
                <strong> Factura A</strong> y <strong>Factura B</strong>.
                <span className="block mt-1 text-emerald-900/80 dark:text-emerald-300/90">
                  Factura A aplica cuando el cliente tiene condicion fiscal compatible. Factura B aplica para consumidor final.
                </span>
              </div>
            ) : null}
            {activeVoucherOptions.map((opt) => {
              const checked = activeVoucherTypes.includes(opt.type);
              return (
                <label
                  key={opt.type}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                    checked ? "border-emerald-500/50 bg-emerald-500/[0.06]" : "border-border/70"
                  )}
                >
                  <input type="checkbox" className="mt-0.5" checked={checked} onChange={() => toggleVoucherType(opt.type)} />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                      {opt.label}
                      <span className="font-normal text-muted-foreground">(tipo {opt.type})</span>
                      {opt.recommended ? (
                        <span className="rounded-full bg-emerald-100 px-1.5 py-0 text-[9px] font-bold uppercase text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Recomendado
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">{opt.description}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Modo de facturacion</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Elegi si queres emitir una factura por cada venta o acumular para cierre consolidado.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, billing_mode: "per_sale" }))}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  form.billing_mode === "per_sale" ? "border-emerald-600 bg-emerald-600 text-white" : "border-border bg-background"
                )}
              >
                Una factura por venta
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, billing_mode: "consolidated" }))}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  form.billing_mode === "consolidated" ? "border-sky-600 bg-sky-600 text-white" : "border-border bg-background"
                )}
              >
                Facturacion consolidada
              </button>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              {form.billing_mode === "per_sale"
                ? "Cada venta se intenta facturar en el momento del cobro."
                : "Las ventas quedan pendientes y despues se facturan juntas desde Facturacion."}
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Salida visible en POS</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Elegi si queres trabajar viendo el comprobante como ticket o como factura. El formato visual fino lo ajustamos despues.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDocumentStyle("ticket")}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  documentStyle === "ticket" ? "border-amber-500 bg-amber-500 text-white" : "border-border bg-background"
                )}
              >
                Tipo ticket
              </button>
              <button
                type="button"
                onClick={() => setDocumentStyle("factura")}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  documentStyle === "factura" ? "border-violet-600 bg-violet-600 text-white" : "border-border bg-background"
                )}
              >
                Tipo factura
              </button>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Preferencia actual: <strong>{documentStyle === "ticket" ? "ticket" : "factura"}</strong>.
            </p>
          </div>
        </div>

        <HelpBox>
          <p className="font-medium text-foreground">Como crear el punto de venta en ARCA</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4">
            <li>Entra al portal ARCA con tu CUIT.</li>
            <li>Elige el ambiente correcto: homologacion o produccion.</li>
            <li>Crea un punto de venta para factura electronica.</li>
            <li>Anota el numero y cargalo aqui.</li>
          </ol>
        </HelpBox>

        {activeTaxCondition === "ri" ? (
          <HelpBox>
            <p>
              Si elegis <strong>Responsable inscripto</strong>, tu negocio puede trabajar con
              <strong> Factura A</strong> o <strong>Factura B</strong> segun el perfil fiscal del cliente.
              En el POS ya se muestran y piden los datos fiscales del comprador para preparar ese paso.
            </p>
            <p className="mt-2">
              En esta configuracion ves el punto de venta base y los comprobantes iniciales del flujo.
              <strong> Factura B</strong> queda como referencia para ventas a consumidor final y
              <strong> Factura A</strong> aplica cuando el cliente tiene condicion fiscal compatible.
            </p>
          </HelpBox>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-5">
        <StepBadge n={4} title="Certificado digital" done={certReady} />
        <p className="mt-2 text-xs text-muted-foreground">
          Cada ambiente necesita su propio certificado. La clave privada queda guardada en el servidor.
        </p>

        {activeCert ? (
          <div
            className={cn(
              "mt-3 rounded-xl border px-3 py-2 text-xs",
              certReady
                ? "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-900 dark:text-emerald-200"
                : "border-amber-500/30 bg-amber-500/[0.06] text-amber-900 dark:text-amber-200"
            )}
          >
            <strong>{CERT_STATUS_LABELS[activeCert.status]}</strong>
            {activeCert.expires_at ? ` · vence el ${new Date(activeCert.expires_at).toLocaleDateString("es-AR")}` : ""}
          </div>
        ) : null}

        <HelpBox>
          <ol className="list-decimal space-y-1.5 pl-4">
            <li>Genera la solicitud CSR.</li>
            <li>Descargala y subila en ARCA para el ambiente elegido.</li>
            <li>Subi luego el certificado .crt devuelto por ARCA.</li>
            <li>Proba la conexion para verificar que responde el servicio fiscal.</li>
          </ol>
        </HelpBox>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={generateCsr} disabled={pending}>
            <FileKey className="mr-1.5 size-4" />
            1. Generar CSR
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={downloadCsr} disabled={pending}>
            <Download className="mr-1.5 size-4" />
            2. Descargar CSR
          </Button>
          <label className="inline-flex">
            <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => certInputRef.current?.click()}>
              <Upload className="mr-1.5 size-4" />
              3. Subir certificado
            </Button>
            <input ref={certInputRef} type="file" accept=".crt,.pem,.cer" className="hidden" onChange={onCertFile} />
          </label>
          <Button type="button" variant="outline" size="sm" onClick={testConn} disabled={pending}>
            <ShieldCheck className="mr-1.5 size-4" />
            4. Probar conexion
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] p-5">
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" className="mt-1" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
          <span>
            <span className="text-sm font-semibold">Activar facturacion en el POS</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
              Al cobrar, el sistema emitira {form.billing_mode === "consolidated" ? "comprobantes consolidados" : activeTaxCondition === "ri" ? "Factura A o B" : "Factura C"} en el ambiente{" "}
              <strong>{isTest ? "de prueba" : "de produccion"}</strong>.
            </span>
          </span>
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={save} disabled={pending}>
            Guardar configuracion
          </Button>
          <Button type="button" variant="outline" onClick={syncLast} disabled={pending}>
            <RefreshCw className="mr-1.5 size-4" />
            Sincronizar ultimo numero
          </Button>
        </div>
      </section>

      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          {showAdvanced ? "Ocultar opciones avanzadas" : "Opciones avanzadas"}
        </button>
        {showAdvanced ? (
          <div className="mt-3 rounded-xl border border-dashed border-border/70 p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Otro ambiente</p>
            <p className="mt-1">
              Punto de venta en {isTest ? "produccion" : "prueba"}: <strong>{isTest ? form.pos_number_prod : form.pos_number_homolog}</strong>.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
