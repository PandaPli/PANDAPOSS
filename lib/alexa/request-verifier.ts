/**
 * Verificador de requests de Alexa Skill.
 *
 * Implementa la verificacion completa requerida por Amazon:
 * 1. Valida formato de URL del certificado de firma
 * 2. Descarga y cachea el certificado
 * 3. Verifica firma criptografica del body
 * 4. Verifica applicationId y timestamp
 *
 * Ref: https://developer.amazon.com/en-US/docs/alexa/custom-skills/host-a-custom-skill-as-a-web-service.html
 */

import crypto from "crypto";

const MAX_TIMESTAMP_AGE_MS = 150_000; // 150 segundos

// Cache de certificados: URL → { pem, expiresAt }
const certCache = new Map<string, { pem: string; expiresAt: number }>();
const CERT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

export interface AlexaVerifyResult {
  valid: boolean;
  error?: string;
}

/** Verifica que la URL del certificado sea valida segun las reglas de Amazon */
function validateCertUrl(urlStr: string | null | undefined): AlexaVerifyResult {
  if (!urlStr) {
    return { valid: false, error: "Falta header SignatureCertChainUrl" };
  }

  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    return { valid: false, error: "SignatureCertChainUrl no es una URL valida" };
  }

  if (url.protocol !== "https:") {
    return { valid: false, error: "SignatureCertChainUrl debe ser HTTPS" };
  }

  if (url.hostname.toLowerCase() !== "s3.amazonaws.com") {
    return { valid: false, error: "SignatureCertChainUrl debe ser s3.amazonaws.com" };
  }

  if (!url.pathname.startsWith("/echo.api/")) {
    return { valid: false, error: "SignatureCertChainUrl path debe empezar con /echo.api/" };
  }

  const port = url.port || "443";
  if (port !== "443") {
    return { valid: false, error: "SignatureCertChainUrl debe usar puerto 443" };
  }

  return { valid: true };
}

/** Descarga y cachea el certificado PEM */
async function fetchCert(certUrl: string): Promise<string> {
  const cached = certCache.get(certUrl);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.pem;
  }

  const response = await fetch(certUrl, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) {
    throw new Error(`No se pudo descargar certificado: ${response.status}`);
  }

  const pem = await response.text();

  // Validar que el certificado sea valido y no este expirado
  const cert = new crypto.X509Certificate(pem);
  const now = new Date();

  if (now < new Date(cert.validFrom)) {
    throw new Error("Certificado aun no es valido");
  }
  if (now > new Date(cert.validTo)) {
    throw new Error("Certificado expirado");
  }

  // Verificar que el SAN incluye echo-api.amazon.com
  const san = cert.subjectAltName ?? "";
  if (!san.includes("echo-api.amazon.com")) {
    throw new Error("Certificado no tiene SAN echo-api.amazon.com");
  }

  certCache.set(certUrl, { pem, expiresAt: Date.now() + CERT_CACHE_TTL_MS });
  return pem;
}

/** Verifica la firma criptografica del body */
function verifySignature(pem: string, signature: string, body: string): boolean {
  const verifier = crypto.createVerify("SHA1");
  verifier.update(body, "utf8");
  return verifier.verify(pem, signature, "base64");
}

/**
 * Verificacion basica (applicationId + timestamp).
 * Usada como fallback cuando no hay headers de firma (ej: simulador).
 */
export function verifyAlexaRequestBasic(
  body: Record<string, unknown>,
  expectedAppId?: string,
): AlexaVerifyResult {
  // 1. Verificar applicationId
  const session = body.session as Record<string, unknown> | undefined;
  const application = session?.application as Record<string, unknown> | undefined;
  const appId = application?.applicationId as string | undefined;

  if (expectedAppId && appId !== expectedAppId) {
    return { valid: false, error: `applicationId invalido: ${appId}` };
  }

  // 2. Verificar timestamp (anti-replay)
  const request = body.request as Record<string, unknown> | undefined;
  const timestamp = request?.timestamp as string | undefined;

  if (timestamp) {
    const requestTime = new Date(timestamp).getTime();
    const now = Date.now();
    const diff = Math.abs(now - requestTime);
    if (diff > MAX_TIMESTAMP_AGE_MS) {
      return { valid: false, error: `Request expirado (diff=${Math.round(diff / 1000)}s)` };
    }
  }

  return { valid: true };
}

/**
 * Verificacion completa con firma criptografica.
 * Valida headers de Amazon + applicationId + timestamp.
 */
export async function verifyAlexaRequestFull(
  rawBody: string,
  certChainUrl: string | null,
  signature: string | null,
  expectedAppId?: string,
): Promise<AlexaVerifyResult> {
  // Parsear body para validaciones basicas
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return { valid: false, error: "Body no es JSON valido" };
  }

  // Validaciones basicas siempre
  const basicResult = verifyAlexaRequestBasic(body, expectedAppId);
  if (!basicResult.valid) return basicResult;

  // Si no hay headers de firma, aceptar solo en development
  if (!certChainUrl || !signature) {
    if (process.env.NODE_ENV === "production" && process.env.ALEXA_SKIP_SIGNATURE !== "true") {
      return { valid: false, error: "Faltan headers de firma de Alexa" };
    }
    // En dev/test, aceptar sin firma
    return { valid: true };
  }

  // Validar URL del certificado
  const urlResult = validateCertUrl(certChainUrl);
  if (!urlResult.valid) return urlResult;

  // Descargar y validar certificado
  try {
    const pem = await fetchCert(certChainUrl);

    // Verificar firma
    if (!verifySignature(pem, signature, rawBody)) {
      return { valid: false, error: "Firma criptografica invalida" };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error verificando certificado";
    return { valid: false, error: msg };
  }

  return { valid: true };
}
