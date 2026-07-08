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
  FiscalEnvironment,
  FiscalPointOfSale,
} from "@/features/billing/types";
import { MONOTRIBUTO_VOUCHER_OPTIONS } from "@/features/billing/types";
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

function defaultVoucherTypes(pos: FiscalPointOfSale | null): number[] {
  if (pos?.voucher_types?.length) return [...pos.voucher_types];
  return [11, 13];
}

function StepBadge({ n, title, done }: { n: number; title: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
          done
            ? "bg-emerald-600 text-white"
            : "border border-border bg-muted/60 text-muted-foreground"
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
  const [pending, startTransition] = React.useTransition();
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const [form, setForm] = React.useState({
    tax_condition: (config?.tax_condition ?? "monotributo") as "monotributo" | "ri",
    cuit: config?.cuit ?? defaults.cuit ?? "",
    razon_social: config?.razon_social ?? defaults.name ?? "",
    domicilio_fiscal: config?.domicilio_fiscal ?? "",
    environment: (config?.environment ?? "homolog") as FiscalEnvironment,
    billing_mode: (config?.billing_mode ?? "per_sale") as "per_sale" | "consolidated",
    is_active: config?.is_active ?? false,
    pos_number_homolog: posHomolog?.pos_number ?? 1,
    pos_number_prod: posProd?.pos_number ?? 1,
    voucher_types_homolog: defaultVoucherTypes(posHomolog),
    voucher_types_prod: defaultVoucherTypes(posProd),
  });

  const activeEnv = form.environment;
  const isTest = activeEnv === "homolog";
  const activeCert = isTest ? certHomolog : certProd;
  const activePosNumber = isTest ? form.pos_number_homolog : form.pos_number_prod;
  const activeVoucherTypes = isTest ? form.voucher_types_homolog : form.voucher_types_prod;
  const certInputRef = React.useRef<HTMLInputElement>(null);

  const setActivePosNumber = (n: number) => {
    setForm((f) =>
      isTest ? { ...f, pos_number_homolog: n } : { ...f, pos_number_prod: n }
    );
  };

  const toggleVoucherType = (type: number) => {
    setForm((f) => {
      const key = isTest ? "voucher_types_homolog" : "voucher_types_prod";
      const current = f[key];
      const has = current.includes(type);
      if (has && type === 11 && current.length === 1) {
        toast.error("Tenés que habilitar al menos Factura C");
        return f;
      }
      const next = has ? current.filter((t) => t !== type) : [...current, type].sort((a, b) => a - b);
      return { ...f, [key]: next };
    });
  };

  const save = () => {
    if (!form.cuit.trim()) {
      toast.error("Completá tu CUIT");
      return;
    }
    if (!form.razon_social.trim()) {
      toast.error("Completá la razón social");
      return;
    }
    if (!activeVoucherTypes.includes(11)) {
      toast.error("Habilitá Factura C para poder facturar");
      return;
    }

    startTransition(async () => {
      try {
        await saveFiscalConfig(form);
        toast.success("Configuración guardada");
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
        toast.success("Listo. Descargá el archivo CSR y subilo a ARCA.");
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
        toast.success(`Conexión OK. Último comprobante autorizado: ${r.lastVoucherNumber}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo conectar con ARCA");
      }
    });
  };

  const syncLast = () => {
    startTransition(async () => {
      try {
        const r = await syncFiscalLastNumber(activeEnv);
        toast.success(`Último número sincronizado: ${r.lastVoucherNumber}`);
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
      {/* Paso 1 — Ambiente */}
      <section className="rounded-2xl border border-border/70 bg-card p-5">
        <StepBadge n={1} title="¿Estás probando o facturando de verdad?" done={datosOk} />
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Elegí un ambiente. Cada uno tiene su propio punto de venta y certificado en ARCA.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, environment: "homolog" }))}
            className={cn(
              "rounded-xl border-2 p-4 text-left transition-all",
              isTest
                ? "border-amber-500 bg-amber-500/[0.08] shadow-sm"
                : "border-border/70 hover:border-border"
            )}
          >
            <div className="flex items-center gap-2">
              <Circle className={cn("size-4", isTest ? "fill-amber-500 text-amber-500" : "text-muted-foreground")} />
              <span className="text-sm font-bold">Prueba (homologación)</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Para probar sin consecuencias. Usá el portal de{" "}
              <strong className="font-semibold text-foreground">ARCA en modo test</strong> y comprobantes
              que no valen legalmente.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, environment: "prod" }))}
            className={cn(
              "rounded-xl border-2 p-4 text-left transition-all",
              !isTest
                ? "border-emerald-600 bg-emerald-600/[0.08] shadow-sm"
                : "border-border/70 hover:border-border"
            )}
          >
            <div className="flex items-center gap-2">
              <Circle
                className={cn("size-4", !isTest ? "fill-emerald-600 text-emerald-600" : "text-muted-foreground")}
              />
              <span className="text-sm font-bold">Producción (facturas reales)</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Solo cuando ya probaste todo. Las facturas emitidas acá son{" "}
              <strong className="font-semibold text-foreground">válidas ante AFIP</strong>.
            </p>
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              isTest
                ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300"
                : "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
            )}
          >
            Configurando: {isTest ? "Prueba" : "Producción"}
          </span>
          {activeCert ? (
            <span className="text-[10px] text-muted-foreground">
              Certificado: {CERT_STATUS_LABELS[activeCert.status]}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground">Sin certificado cargado</span>
          )}
        </div>
      </section>

      {/* Paso 2 — Datos */}
      <section className="rounded-2xl border border-border/70 bg-card p-5">
        <StepBadge n={2} title="Tus datos fiscales" done={datosOk} />
        <p className="mt-2 text-xs text-muted-foreground">
          Monotributista — los mismos datos que figuran en ARCA/AFIP.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="fiscal-cuit" className="text-xs">
              CUIT
            </Label>
            <Input
              id="fiscal-cuit"
              placeholder="20-12345678-9"
              value={form.cuit}
              onChange={(e) => setForm((f) => ({ ...f, cuit: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="fiscal-razon" className="text-xs">
              Razón social o nombre
            </Label>
            <Input
              id="fiscal-razon"
              value={form.razon_social}
              onChange={(e) => setForm((f) => ({ ...f, razon_social: e.target.value }))}
            />
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
        </div>
      </section>

      {/* Paso 3 — Punto de venta y comprobantes */}
      <section className="rounded-2xl border border-border/70 bg-card p-5">
        <StepBadge n={3} title="Punto de venta y comprobantes" done={posOk && activeVoucherTypes.includes(11)} />

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="fiscal-pos" className="text-xs">
              Número de punto de venta
            </Label>
            <Input
              id="fiscal-pos"
              type="number"
              min={1}
              max={99999}
              value={activePosNumber}
              onChange={(e) => setActivePosNumber(Number(e.target.value) || 1)}
            />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              El mismo número que creaste en ARCA para{" "}
              {isTest ? "homologación (test)" : "producción"}.
            </p>
          </div>

          <div className="grid gap-2">
            <span className="text-xs font-medium">¿Qué comprobantes vas a emitir?</span>
            {MONOTRIBUTO_VOUCHER_OPTIONS.map((opt) => {
              const checked = activeVoucherTypes.includes(opt.type);
              return (
                <label
                  key={opt.type}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                    checked ? "border-emerald-500/50 bg-emerald-500/[0.06]" : "border-border/70"
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={checked}
                    onChange={() => toggleVoucherType(opt.type)}
                  />
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
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                      {opt.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <HelpBox>
          <p className="font-medium text-foreground">Cómo crear el punto de venta en ARCA (test)</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4">
            <li>
              Entrá a{" "}
              <a
                href="https://www.afip.gob.ar/ws/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-sky-700 underline dark:text-sky-400"
              >
                ARCA / Administración de Certificados Digitales
              </a>{" "}
              con tu CUIT.
            </li>
            <li>Elegí el ambiente de <strong>homologación</strong> (no producción).</li>
            <li>
              En <em>Administración de puntos de venta y domicilios</em>, creá un punto de venta para
              facturación electrónica (tipo &quot;Factura en línea&quot; o similar).
            </li>
            <li>Anotá el número y cargalo acá. Repetí el proceso en producción cuando estés listo.</li>
          </ol>
        </HelpBox>
      </section>

      {/* Paso 4 — Certificados */}
      <section className="rounded-2xl border border-border/70 bg-card p-5">
        <StepBadge n={4} title="Certificado digital" done={certReady} />
        <p className="mt-2 text-xs text-muted-foreground">
          Certificado para <strong>{isTest ? "prueba" : "producción"}</strong>. Cada ambiente necesita el
          suyo.
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
            {activeCert.expires_at
              ? ` · vence el ${new Date(activeCert.expires_at).toLocaleDateString("es-AR")}`
              : ""}
          </div>
        ) : null}

        <HelpBox>
          <p className="font-medium text-foreground">Pasos en ARCA para obtener el certificado</p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-4">
            <li>
              Acá, tocá <strong>Generar solicitud (CSR)</strong>. Se crea un par de claves; la privada
              (.key) queda guardada de forma segura en el servidor.
            </li>
            <li>
              Descargá el archivo <strong>.csr</strong> y subilo en el portal ARCA del ambiente{" "}
              {isTest ? "de homologación" : "de producción"}.
            </li>
            <li>ARCA te devuelve un archivo <strong>.crt</strong> — subilo acá con el botón correspondiente.</li>
            <li>Probá la conexión para confirmar que todo funciona.</li>
          </ol>
          <p className="mt-2 text-[11px]">
            Formatos aceptados: <code className="rounded bg-muted px-1">.crt</code>,{" "}
            <code className="rounded bg-muted px-1">.pem</code>,{" "}
            <code className="rounded bg-muted px-1">.cer</code>. No compartas tu clave privada (.key).
          </p>
        </HelpBox>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={generateCsr} disabled={pending}>
            <FileKey className="mr-1.5 size-4" />
            1. Generar solicitud (CSR)
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={downloadCsr} disabled={pending}>
            <Download className="mr-1.5 size-4" />
            2. Descargar CSR
          </Button>
          <label className="inline-flex">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => certInputRef.current?.click()}
            >
              <Upload className="mr-1.5 size-4" />
              3. Subir certificado .crt
            </Button>
            <input
              ref={certInputRef}
              type="file"
              accept=".crt,.pem,.cer"
              className="hidden"
              onChange={onCertFile}
            />
          </label>
          <Button type="button" variant="outline" size="sm" onClick={testConn} disabled={pending}>
            <ShieldCheck className="mr-1.5 size-4" />
            4. Probar conexión
          </Button>
        </div>
      </section>

      {/* Activar y guardar */}
      <section className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] p-5">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-1"
            checked={form.is_active}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
          />
          <span>
            <span className="text-sm font-semibold">Activar facturación en el POS</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
              Al cobrar, el sistema emitirá Factura C automáticamente en el ambiente{" "}
              <strong>{isTest ? "de prueba" : "de producción"}</strong>. Recomendamos activar solo
              después de probar la conexión.
            </span>
          </span>
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={save} disabled={pending}>
            Guardar configuración
          </Button>
          <Button type="button" variant="outline" onClick={syncLast} disabled={pending}>
            <RefreshCw className="mr-1.5 size-4" />
            Sincronizar último número
          </Button>
        </div>
      </section>

      {/* Opciones avanzadas */}
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
              Punto de venta en {isTest ? "producción" : "prueba"}:{" "}
              <strong>
                {isTest ? form.pos_number_prod : form.pos_number_homolog}
              </strong>
              . Cambiá de ambiente arriba para editarlo.
            </p>
            <p className="mt-3 font-medium text-foreground">Modo de facturación</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, billing_mode: "per_sale" }))}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold",
                  form.billing_mode === "per_sale"
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-border"
                )}
              >
                Una factura por venta
              </button>
              <button
                type="button"
                disabled
                title="Disponible en una próxima versión"
                className="rounded-full border border-border px-3 py-1 text-xs font-semibold opacity-50"
              >
                Consolidada (próximamente)
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
