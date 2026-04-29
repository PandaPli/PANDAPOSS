import { NextRequest, NextResponse } from "next/server";
import { createPandiAnswer } from "../pandi-engine";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question : "";
  const history = Array.isArray(body?.history) ? body.history : [];

  if (!question.trim()) {
    return NextResponse.json({ error: "Pregunta requerida" }, { status: 400 });
  }

  const answer = createPandiAnswer({ question, history });

  return NextResponse.json(answer);
}
