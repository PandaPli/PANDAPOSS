import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const CUMPLE_PORCENTAJE = 30;
const CUMPLE_TOPE = 15000;

// POST /api/cupones/validar
// Body: { codigo: string, sucursalId: number, subtotal: number }
// Valida cupones normales Y cupones de cumpleaños (codigoCumple en Cliente)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { codigo, sucursalId, subtotal } = await req.json();

  if (!codigo || !sucursalId) {
    return NextResponse.json({ error: "Código y sucursalId requeridos" }, { status: 400 });
  }

  const codigoNorm = String(codigo).toUpperCase().trim();
  const sucId = Number(sucursalId);
  const sub = Number(subtotal ?? 0);

  // ── 1. Buscar en cupones normales ──
  const cupon = await prisma.cupon.findUnique({
    where: { sucursalId_codigo: { sucursalId: sucId, codigo: codigoNorm } },
  });

  if (cupon) {
    if (!cupon.activo)
      return NextResponse.json({ error: "Este cupón está desactivado" }, { status: 400 });
    if (cupon.venceEn && new Date() > cupon.venceEn)
      return NextResponse.json({ error: "Este cupón ha expirado" }, { status: 400 });
    if (cupon.usoMax !== null && cupon.usoActual >= cupon.usoMax)
      return NextResponse.json({ error: "Este cupón ya alcanzó el límite de usos" }, { status: 400 });

    const descuentoAplicado =
      cupon.tipo === "PORCENTAJE"
        ? Math.round((sub * Number(cupon.valor)) / 100)
        : Math.min(Number(cupon.valor), sub);

    return NextResponse.json({
      id: cupon.id,
      codigo: cupon.codigo,
      tipo: cupon.tipo,
      valor: Number(cupon.valor),
      descripcion: cupon.descripcion,
      descuentoAplicado,
    });
  }

  // ── 2. Buscar como cupón de cumpleaños (Cliente.codigoCumple) ──
  const cliente = await prisma.cliente.findFirst({
    where: { codigoCumple: codigoNorm, sucursalId: sucId },
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

  // Verificar que hoy es su cumpleaños
  if (cliente.fechaNacimiento) {
    const hoy = new Date();
    const cumple = new Date(cliente.fechaNacimiento);
    const esCumple =
      hoy.getDate() === cumple.getDate() && hoy.getMonth() === cumple.getMonth();

    if (!esCumple) {
      const meses = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
      const fechaStr = `${cumple.getDate()} ${meses[cumple.getMonth()]}`;
      return NextResponse.json(
        { error: `Cupón válido solo el día del cumpleaños (${fechaStr})` },
        { status: 400 }
      );
    }
  } else {
    return NextResponse.json(
      { error: "Este cliente no tiene fecha de cumpleaños registrada" },
      { status: 400 }
    );
  }

  // Calcular descuento con tope
  const descuentoBruto = Math.round((sub * CUMPLE_PORCENTAJE) / 100);
  const descuentoAplicado = Math.min(descuentoBruto, CUMPLE_TOPE);

  return NextResponse.json({
    id: -cliente.id,            // ID negativo para distinguirlo de cupones normales
    codigo: cliente.codigoCumple,
    tipo: "PORCENTAJE",
    valor: CUMPLE_PORCENTAJE,
    descripcion: `🎂 Cumpleaños de ${cliente.nombre.split(" ")[0]} · 30% (tope $15.000)`,
    descuentoAplicado,
    esCumple: true,
  });
}
