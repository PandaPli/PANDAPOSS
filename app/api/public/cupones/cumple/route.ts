import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DESCUENTO_PORCENTAJE = 30;
const DESCUENTO_TOPE = 15000; // tope máximo en pesos

// POST /api/public/cupones/cumple
// Body: { codigo: string, subtotal: number, sucursalId: number }
// Valida un código de cumpleaños y calcula el descuento aplicable
export async function POST(req: NextRequest) {
  try {
    const { codigo, subtotal, sucursalId } = await req.json();

    if (!codigo || !sucursalId) {
      return NextResponse.json({ error: "Código y sucursalId requeridos" }, { status: 400 });
    }

    // Buscar cliente por codigoCumple dentro de la sucursal
    const cliente = await prisma.cliente.findFirst({
      where: {
        codigoCumple: String(codigo).toUpperCase().trim(),
        sucursalId: Number(sucursalId),
      },
      select: {
        id: true,
        nombre: true,
        codigoCumple: true,
        fechaNacimiento: true,
        activo: true,
      },
    });

    if (!cliente) {
      return NextResponse.json({ error: "Cupón no encontrado" }, { status: 404 });
    }

    if (!cliente.activo) {
      return NextResponse.json({ error: "Este cliente está bloqueado" }, { status: 400 });
    }

    // Verificar que hoy es su cumpleaños (mismo día y mes)
    if (cliente.fechaNacimiento) {
      const hoy = new Date();
      const cumple = new Date(cliente.fechaNacimiento);
      const esCumple =
        hoy.getDate() === cumple.getDate() &&
        hoy.getMonth() === cumple.getMonth();

      if (!esCumple) {
        const mesNombres = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
        const fechaStr = `${cumple.getDate()} ${mesNombres[cumple.getMonth()]}`;
        return NextResponse.json(
          { error: `Este cupón es válido solo el día del cumpleaños (${fechaStr})` },
          { status: 400 }
        );
      }
    }

    // Calcular descuento con tope
    const sub = Number(subtotal ?? 0);
    const descuentoBruto = Math.round((sub * DESCUENTO_PORCENTAJE) / 100);
    const descuentoAplicado = Math.min(descuentoBruto, DESCUENTO_TOPE);

    return NextResponse.json({
      ok: true,
      cliente: cliente.nombre,
      codigo: cliente.codigoCumple,
      porcentaje: DESCUENTO_PORCENTAJE,
      tope: DESCUENTO_TOPE,
      descuentoAplicado,
      esCumpleHoy: !!cliente.fechaNacimiento,
    });
  } catch (e) {
    console.error("[validar-cumple]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
