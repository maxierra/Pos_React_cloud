import type { IssueVoucherResult } from "./types";

const FISCAL_API_URL = process.env.FISCAL_API_URL ?? "http://localhost:3099";
const FISCAL_API_KEY = process.env.FISCAL_API_KEY ?? "";

type FiscalEnvironment = "homolog" | "prod";

function fiscalConnectionError(cause: unknown): Error {
  const devHint =
    process.env.NODE_ENV !== "production"
      ? " En otra terminal: cd services/fiscal-api && npm install && npm run dev"
      : "";
  const message =
    `No se pudo conectar al servicio fiscal (${FISCAL_API_URL}). ` +
    `¿Está corriendo fiscal-api?${devHint}`;
  if (cause instanceof Error && /fetch failed|ECONNREFUSED|ENOTFOUND/i.test(cause.message)) {
    return new Error(message);
  }
  if (cause instanceof TypeError) {
    return new Error(message);
  }
  return cause instanceof Error ? cause : new Error(message);
}

async function fiscalFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!FISCAL_API_KEY) {
    throw new Error(
      "FISCAL_API_KEY no configurada en .env del servidor. Debe coincidir con la clave en services/fiscal-api/.env"
    );
  }
  let res: Response;
  try {
    res = await fetch(`${FISCAL_API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FISCAL_API_KEY}`,
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch (e) {
    throw fiscalConnectionError(e);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `Error fiscal API (${res.status})`);
  }
  return data as T;
}

export async function generateFiscalCsr(params: {
  businessId: string;
  environment: FiscalEnvironment;
  cuit: string;
  razonSocial: string;
  uploadedBy?: string;
}) {
  return fiscalFetch<{ ok: boolean; csrPem: string }>("/cert/generate", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function uploadFiscalCertificate(params: {
  businessId: string;
  environment: FiscalEnvironment;
  certPem: string;
  uploadedBy?: string;
}) {
  return fiscalFetch<{ ok: boolean; cuit: string; expiresAt: string }>("/cert/upload", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function testFiscalConnection(params: {
  businessId: string;
  environment: FiscalEnvironment;
}) {
  return fiscalFetch<{ ok: boolean; lastVoucherNumber: number; posNumber: number }>("/auth/test", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function syncLastVoucherNumber(params: {
  businessId: string;
  environment: FiscalEnvironment;
  voucherType?: number;
}) {
  const q = new URLSearchParams({
    businessId: params.businessId,
    environment: params.environment,
    voucherType: String(params.voucherType ?? 11),
  });
  return fiscalFetch<{ lastVoucherNumber: number; posNumber: number; voucherType: number }>(
    `/voucher/last-number?${q}`
  );
}

export async function issueFiscalVoucher(params: {
  businessId: string;
  environment: FiscalEnvironment;
  saleId?: string | null;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
  buyerDocType?: number;
  buyerDocNumber?: string;
  buyerName?: string;
  concept?: number;
}): Promise<IssueVoucherResult> {
  return fiscalFetch<IssueVoucherResult>("/voucher/issue", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function issueFiscalCreditNote(params: {
  businessId: string;
  environment: FiscalEnvironment;
  originalVoucherId: string;
}): Promise<IssueVoucherResult> {
  return fiscalFetch<IssueVoucherResult>("/voucher/credit-note", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function downloadFiscalCsr(params: {
  businessId: string;
  environment: FiscalEnvironment;
}): Promise<ArrayBuffer> {
  if (!FISCAL_API_KEY) {
    throw new Error(
      "FISCAL_API_KEY no configurada en .env del servidor. Debe coincidir con la clave en services/fiscal-api/.env"
    );
  }
  const q = new URLSearchParams(params);
  let res: Response;
  try {
    res = await fetch(`${FISCAL_API_URL}/cert/download-csr?${q}`, {
      headers: { Authorization: `Bearer ${FISCAL_API_KEY}` },
      cache: "no-store",
    });
  } catch (e) {
    throw fiscalConnectionError(e);
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Error descargando CSR");
  }
  return res.arrayBuffer();
}
