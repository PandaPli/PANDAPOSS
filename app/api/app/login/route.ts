import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

// Roles allowed to use the desktop bot app
const ALLOWED_ROLES = ["RESTAURANTE", "ADMIN_GENERAL"] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Find user by email (case-insensitive)
    const user = await prisma.usuario.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        status: "ACTIVO",
      },
      include: {
        sucursal: {
          select: {
            id: true,
            nombre: true,
            plan: true,
            agente: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    // Only allow RESTAURANTE and ADMIN_GENERAL roles
    if (!ALLOWED_ROLES.includes(user.rol as (typeof ALLOWED_ROLES)[number])) {
      return NextResponse.json(
        { error: "Tu cuenta no tiene permisos para usar el Bot Smart" },
        { status: 403 }
      );
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    if (!user.sucursal) {
      return NextResponse.json(
        { error: "Tu cuenta no tiene una sucursal asignada" },
        { status: 403 }
      );
    }

    // Verify the sucursal has PRIME plan (required for Bot Smart)
    if (user.sucursal.plan !== "PRIME") {
      return NextResponse.json(
        {
          error: `El Bot Smart requiere plan PRIME. Tu sucursal tiene plan ${user.sucursal.plan}.`,
        },
        { status: 403 }
      );
    }

    // Get or create the AgenteWsp record for this sucursal
    let agente = user.sucursal.agente;
    if (!agente) {
      const created = await prisma.agenteWsp.create({
        data: {
          sucursalId: user.sucursal.id,
          activo: false,
          estado: "DESCONECTADO",
        },
        select: { id: true },
      });
      agente = created;
    }

    // Return session data for the Electron app
    return NextResponse.json({
      agentId: agente.id,
      sucursalId: user.sucursal.id,
      restaurantName: user.sucursal.nombre,
      plan: user.sucursal.plan,
      // Shared API key from server environment — used by the agent to authenticate
      apiKey: process.env.AGENTE_API_KEY ?? "",
      // Anthropic key stored server-side, forwarded to the local agent process
      anthropicKey: process.env.ANTHROPIC_API_KEY ?? "",
    });
  } catch (err) {
    console.error("[app/login] error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
