import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enviarCuponCumpleanos } from "@/lib/email/cupon";

export async function POST(req: NextRequest) {
  try {
    const { email, codigoCumple, sucursalId } = await req.json();

    if (!email || !codigoCumple || !sucursalId) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Verificar que el código existe y obtener datos del cliente y sucursal
    const [cliente, sucursal] = await Promise.all([
      prisma.cliente.findFirst({
        where: { codigoCumple },
        select: { nombre: true, email: true },
      }),
      prisma.sucursal.findUnique({
        where: { id: Number(sucursalId) },
        select: { nombre: true },
      }),
    ]);

    if (!cliente || !sucursal) {
      return NextResponse.json({ error: "Datos no encontrados" }, { status: 404 });
    }

    // Si no tiene RESEND_API_KEY configurada, simular éxito (para desarrollo)
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_placeholder") {
      console.log(`[email-dev] Cupón ${codigoCumple} → ${email}`);
      // Guardar email en el cliente si no tenía
      if (!cliente.email) {
        await prisma.cliente.update({
          where: { codigoCumple },
          data: { email },
        });
      }
      return NextResponse.json({ ok: true, dev: true });
    }

    await enviarCuponCumpleanos({
      to: email,
      nombre: cliente.nombre,
      codigoCumple,
      sucursalNombre: sucursal.nombre,
      sucursalId: Number(sucursalId),
    });

    // Guardar email en el cliente si no tenía
    if (!cliente.email) {
      await prisma.cliente.update({
        where: { codigoCumple },
        data: { email },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[enviar-cupon]", e);
    return NextResponse.json({ error: "Error al enviar el correo" }, { status: 500 });
  }
}
