import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

// Roles allowed to use the desktop bot app
const ALLOWED_ROLES = ["RESTAURANTE", "ADMIN_GENERAL"] as const;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`app:login:${ip}`, { max: 5, windowMs: 60_000 });
  if (!rl.allowed) return NextResponse.json({ error: "Demasiados intentos. Espera un momento." }, { status: 429 });

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
    // SECURITY: API keys must NOT be sent to the client. The desktop app
    // should use its own env vars or a secure token exchange instead.
    return NextResponse.json({
      agentId: agente.id,
      sucursalId: user.sucursal.id,
      restaurantName: user.sucursal.nombre,
      plan: user.sucursal.plan,
    });
  } catch (err) {
    console.error("[app/login] error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
