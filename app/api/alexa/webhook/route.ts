import { NextRequest, NextResponse } from "next/server";
import { handleAlexaRequest, type AlexaRequestBody } from "@/lib/alexa/intent-handler";
import { verifyAlexaRequestFull } from "@/lib/alexa/request-verifier";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

/**
 * POST /api/alexa/webhook
 *
 * Endpoint que recibe las requests de la Alexa Skill de PandaPOS.
 * Implementa verificacion criptografica completa de firma de Amazon.
 *
 * Configuracion en Alexa Developer Console:
 * - Endpoint: https://pandaposs.vercel.app/api/alexa/webhook
 * - SSL: "My development endpoint is a sub-domain of a domain that has a wildcard certificate"
 *
 * Variables de entorno:
 * - ALEXA_SKILL_ID: para verificar applicationId
 * - ALEXA_DEFAULT_SUCURSAL_ID: sucursal por defecto si no hay account linking
 * - ALEXA_DEFAULT_USER_ID: usuario por defecto
 * - ALEXA_SKIP_SIGNATURE: "true" para saltear verificacion de firma (solo dev)
 */

export async function POST(req: NextRequest) {
  // Rate limit: clave fija para todo el trafico de Alexa (no por IP,
  // porque Amazon usa un pool pequeño de IPs compartidas)
  const ip = getClientIp(req);
  const rl = rateLimit(`alexa:webhook:${ip}`, { max: 120, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas peticiones" },
      { status: 429 },
    );
  }

  // Leer body como texto crudo (necesario para verificacion de firma)
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  // Headers de firma de Alexa
  const certChainUrl = req.headers.get("signaturecertchainurl");
  const signature = req.headers.get("signature-256") ?? req.headers.get("signature");

  const expectedSkillId = process.env.ALEXA_SKILL_ID;

  // Verificacion completa: firma criptografica + applicationId + timestamp
  const verification = await verifyAlexaRequestFull(
    rawBody,
    certChainUrl,
    signature,
    expectedSkillId,
  );

  if (!verification.valid) {
    console.error("[alexa:webhook] Verificacion fallida:", verification.error);
    return NextResponse.json({ error: verification.error }, { status: 403 });
  }

  let body: AlexaRequestBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  console.log(`[alexa:webhook] ${body.request?.type} intent=${body.request?.intent?.name ?? "-"}`);

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
