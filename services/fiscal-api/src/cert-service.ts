import forge from "node-forge";
import { supabaseAdmin, FISCAL_CERTS_BUCKET } from "./supabase.js";
import { normalizeCuit, storagePrefix, type FiscalEnvironment } from "./config.js";

function storageError(context: string, err: { message: string }): string {
  const msg = `Error ${context}: ${err.message}`;
  if (/bucket not found/i.test(err.message)) {
    return `${msg}. Creá el bucket "${FISCAL_CERTS_BUCKET}" en Supabase Storage (SQL Editor del proyecto).`;
  }
  return msg;
}

export type CertPaths = {
  keyPath: string;
  csrPath: string;
  certPath: string;
};

export function getCertPaths(businessId: string, environment: FiscalEnvironment): CertPaths {
  const prefix = storagePrefix(businessId, environment);
  return {
    keyPath: `${prefix}/private.key`,
    csrPath: `${prefix}/request.csr`,
    certPath: `${prefix}/certificate.crt`,
  };
}

export async function generateCsrAndKey(params: {
  businessId: string;
  environment: FiscalEnvironment;
  cuit: string;
  razonSocial: string;
  uploadedBy?: string;
}) {
  const cuit = normalizeCuit(params.cuit);
  if (cuit.length !== 11) throw new Error("CUIT inválido (debe tener 11 dígitos)");

  const keys = forge.pki.rsa.generateKeyPair(2048);
  const csr = forge.pki.createCertificationRequest();
  csr.publicKey = keys.publicKey;
  csr.setSubject([
    { name: "countryName", value: "AR" },
    { name: "organizationName", value: params.razonSocial.slice(0, 64) || "Empresa" },
    { name: "commonName", value: cuit },
    { name: "serialNumber", value: `CUIT ${cuit}` },
  ]);
  csr.sign(keys.privateKey, forge.md.sha256.create());

  const keyPem = forge.pki.privateKeyToPem(keys.privateKey);
  const csrPem = forge.pki.certificationRequestToPem(csr);
  const paths = getCertPaths(params.businessId, params.environment);

  const keyBytes = Buffer.from(keyPem, "utf8");
  const csrBytes = Buffer.from(csrPem, "utf8");

  const { error: keyErr } = await supabaseAdmin.storage.from(FISCAL_CERTS_BUCKET).upload(paths.keyPath, keyBytes, {
    contentType: "text/plain",
    upsert: true,
  });
  if (keyErr) throw new Error(storageError("guardando clave", keyErr));

  const { error: csrErr } = await supabaseAdmin.storage.from(FISCAL_CERTS_BUCKET).upload(paths.csrPath, csrBytes, {
    contentType: "application/pkcs10",
    upsert: true,
  });
  if (csrErr) throw new Error(storageError("guardando CSR", csrErr));

  const { error: dbErr } = await supabaseAdmin.from("fiscal_certificates").upsert(
    {
      business_id: params.businessId,
      environment: params.environment,
      storage_path_key: paths.keyPath,
      storage_path_csr: paths.csrPath,
      storage_path_cert: null,
      cuit,
      status: "pending_upload",
      uploaded_by: params.uploadedBy ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "business_id,environment" }
  );
  if (dbErr) throw new Error(`Error DB certificado: ${dbErr.message}`);

  return { csrPem, paths };
}

export async function downloadCsr(businessId: string, environment: FiscalEnvironment): Promise<string> {
  // Read storage_path_csr from the DB record so we fetch from the exact path
  // that was written during CSR generation, regardless of any businessId
  // mismatch between sessions.
  const { data: certRow } = await supabaseAdmin
    .from("fiscal_certificates")
    .select("storage_path_csr")
    .eq("business_id", businessId)
    .eq("environment", environment)
    .maybeSingle();

  const csrPath = certRow?.storage_path_csr ?? getCertPaths(businessId, environment).csrPath;

  const { data, error } = await supabaseAdmin.storage.from(FISCAL_CERTS_BUCKET).download(csrPath);
  if (error || !data) throw new Error("CSR no encontrado. Generá una solicitud primero.");
  return await data.text();
}

export async function uploadCertificate(params: {
  businessId: string;
  environment: FiscalEnvironment;
  certPem: string;
  uploadedBy?: string;
}) {
  // Fetch the DB record to get the actual stored key path and cuit together.
  // We deliberately use storage_path_key from the DB instead of recomputing it
  // from params.businessId: if the CSR was generated in a session where a
  // different active_business_id cookie was set (producing a different storage
  // prefix), getCertPaths() would derive the wrong path and the download fails
  // with "Clave privada no encontrada".
  const { data: certRow } = await supabaseAdmin
    .from("fiscal_certificates")
    .select("cuit, storage_path_key")
    .eq("business_id", params.businessId)
    .eq("environment", params.environment)
    .maybeSingle();

  if (!certRow?.storage_path_key) {
    throw new Error(
      "No se encontró una solicitud de certificado (CSR) activa para este negocio y ambiente. " +
      "Generá primero una nueva solicitud (CSR) y luego subí el certificado que emitió ARCA."
    );
  }

  const cuit = normalizeCuit(certRow.cuit ?? "");
  const cert = forge.pki.certificateFromPem(params.certPem);
  const paths = getCertPaths(params.businessId, params.environment);

  // Use the path recorded in the DB (not recomputed from businessId) so we
  // always read the key from where it was actually written.
  const { data: keyBlob, error: keyErr } = await supabaseAdmin.storage
    .from(FISCAL_CERTS_BUCKET)
    .download(certRow.storage_path_key);
  if (keyErr || !keyBlob) {
    throw new Error(
      `Clave privada no encontrada en storage (${certRow.storage_path_key}). ` +
      "Es posible que el archivo haya sido eliminado manualmente del bucket. " +
      "Generá una nueva solicitud CSR para regenerar la clave."
    );
  }

  const keyPem = await keyBlob.text();
  const privateKey = forge.pki.privateKeyFromPem(keyPem);

  // Validate cert ↔ private-key pair by comparing RSA modulus (n).
  // This is more reliable than encrypt/decrypt round-trip, which can fail on
  // non-standard ARCA cert padding and produces cryptic error messages.
  const certPublicKey = cert.publicKey as forge.pki.rsa.PublicKey;
  const certModulus = certPublicKey.n?.toString(16);
  const keyModulus = (privateKey as forge.pki.rsa.PrivateKey).n?.toString(16);
  if (!certModulus || !keyModulus || certModulus !== keyModulus) {
    throw new Error(
      "El certificado no corresponde a la clave privada almacenada. " +
      "Subí el certificado que ARCA emitió exactamente para la solicitud (CSR) vigente. " +
      "Si ya regeneraste una nueva solicitud, volvé a pedirle el certificado a ARCA."
    );
  }

  // PEM content → plain text upload (avoids server-side MIME-detection conflicts
  // with application/x-x509-ca-cert; text/plain is already in the bucket allow-list).
  const certBytes = Buffer.from(params.certPem, "utf8");
  const { error: uploadErr } = await supabaseAdmin.storage.from(FISCAL_CERTS_BUCKET).upload(paths.certPath, certBytes, {
    contentType: "text/plain",
    upsert: true,
  });
  if (uploadErr) throw new Error(storageError("subiendo certificado", uploadErr));

  const notAfter = cert.validity.notAfter;
  const notBefore = cert.validity.notBefore;

  // .select() is required so Supabase returns the updated row count;
  // without it, 0-rows-matched returns { error: null } and we'd never know
  // the certificate row didn't exist (e.g., CSR was never generated first).
  const { data: updated, error: dbErr } = await supabaseAdmin
    .from("fiscal_certificates")
    .update({
      storage_path_cert: paths.certPath,
      status: "active",
      issued_at: notBefore.toISOString(),
      expires_at: notAfter.toISOString(),
      uploaded_by: params.uploadedBy ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("business_id", params.businessId)
    .eq("environment", params.environment)
    .select("id");
  if (dbErr) throw new Error(`Error actualizando certificado: ${dbErr.message}`);
  if (!updated || updated.length === 0) {
    throw new Error(
      "No se encontró el registro de certificado en la base de datos. " +
      "Asegurate de haber generado primero una Solicitud de certificado (CSR) " +
      "para este ambiente antes de subir el .crt."
    );
  }

  return { cuit, expiresAt: notAfter.toISOString() };
}

export async function loadCertAndKey(businessId: string, environment: FiscalEnvironment) {
  const { data: meta, error } = await supabaseAdmin
    .from("fiscal_certificates")
    .select("*")
    .eq("business_id", businessId)
    .eq("environment", environment)
    .eq("status", "active")
    .maybeSingle();
  if (error || !meta) throw new Error("Certificado activo no encontrado para este ambiente");

  const [certRes, keyRes] = await Promise.all([
    supabaseAdmin.storage.from(FISCAL_CERTS_BUCKET).download(meta.storage_path_cert!),
    supabaseAdmin.storage.from(FISCAL_CERTS_BUCKET).download(meta.storage_path_key),
  ]);
  if (certRes.error || !certRes.data) throw new Error("No se pudo leer el certificado");
  if (keyRes.error || !keyRes.data) throw new Error("No se pudo leer la clave privada");

  return {
    cert: await certRes.data.text(),
    key: await keyRes.data.text(),
    cuit: meta.cuit as string,
    expiresAt: meta.expires_at as string | null,
  };
}
