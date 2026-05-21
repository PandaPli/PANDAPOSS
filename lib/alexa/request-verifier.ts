/**
 * Verificador de requests de Alexa Skill.
 *
 * En produccion, Alexa envia headers de firma que deben validarse
 * con el certificado de Amazon. Aqui hacemos las validaciones basicas:
 * - applicationId coincide con nuestra Skill
 * - timestamp no tiene mas de 150s de antiguedad
 *
 * Para verificacion criptografica completa, usar `ask-sdk-core` en produccion.
 */

const MAX_TIMESTAMP_AGE_MS = 150_000; // 150 segundos

export interface AlexaVerifyResult {
  valid: boolean;
  error?: string;
}

export function verifyAlexaRequest(
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
      console.error(`[alexa:verify] Timestamp rechazado: request=${timestamp}, now=${new Date(now).toISOString()}, diff=${diff}ms`);
      return { valid: false, error: `Request expirado (timestamp diff=${Math.round(diff / 1000)}s > 150s)` };
    }
  }

  return { valid: true };
}
