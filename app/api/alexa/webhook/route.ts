import { NextRequest, NextResponse } from "next/server";
import { handleAlexaRequest, type AlexaRequestBody } from "@/lib/alexa/intent-handler";
import { verifyAlexaRequest } from "@/lib/alexa/request-verifier";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

/**
 * POST /api/alexa/webhook
 *
 * Endpoint que recibe las requests de la Alexa Skill.
 * Alexa envia un JSON con session, request y context.
 * Nosotros respondemos con outputSpeech para que Alexa hable.
 *
 * Configuracion en Alexa Developer Console:
 * - Endpoint: https://tu-dominio.vercel.app/api/alexa/webhook
 * - SSL: "My development endpoint has a certificate from a trusted CA"
 *
 * Variables de entorno opcionales:
 * - ALEXA_SKILL_ID: para verificar applicationId
 * - ALEXA_DEFAULT_SUCURSAL_ID: sucursal por defecto si no hay account linking
 * - ALEXA_DEFAULT_USER_ID: usuario por defecto
 */

export async function POST(req: NextRequest) {
  // Rate limit por IP: 60 requests/min (Alexa puede enviar rapido)
  const ip = getClientIp(req);
  const rl = rateLimit(`alexa:webhook:${ip}`, { max: 60, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas peticiones" },
      { status: 429 },
    );
  }

  let body: AlexaRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  // Verificar request de Alexa
  const expectedSkillId = process.env.ALEXA_SKILL_ID;
  console.log(`[alexa:webhook] Request type=${body.request?.type}, skillId=${expectedSkillId ? "set" : "empty"}, appId=${(body.session?.application as Record<string, unknown>)?.applicationId}`);

  const verification = verifyAlexaRequest(
    body as unknown as Record<string, unknown>,
    expectedSkillId,
  );
  if (!verification.valid) {
    console.error("[alexa:webhook] Verificacion fallida:", verification.error);
    return NextResponse.json({ error: verification.error }, { status: 403 });
  }

  try {
    const response = await handleAlexaRequest(body);
    return NextResponse.json(response);
  } catch (error) {
    console.error("[alexa:webhook] Error:", error);
    return NextResponse.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "Hubo un error procesando tu pedido. Intenta de nuevo.",
        },
        shouldEndSession: false,
      },
    });
  }
}
