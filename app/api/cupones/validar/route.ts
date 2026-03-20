import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST /api/cupones/validar
// Body: { codigo: string, sucursalId: number, subtotal: number }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { codigo, sucursalId, subtotal } = await req.json();

  if (!codigo || !sucursalId) {
    return NextResponse.json({ error: "Código y sucursalId requeridos" }, { status: 400 });
  }

  const cupon = await prisma.cupon.findUnique({
    where: { sucursalId_codigo: { sucursalId: Number(sucursalId), codigo: String(codigo).toUpperCase().trim() } },
  });

  if (!cupon) {
    return NextResponse.json({ error: "Cupón no encontrado" }, { status: 404 });
  }

  if (!cupon.activo) {
    return NextResponse.json({ error: "Este cupón está desactivado" }, { status: 400 });
  }

  if (cupon.venceEn && new Date() > cupon.venceEn) {
    return NextResponse.json({ error: "Este cupón ha expirado" }, { status: 400 });
  }

  if (cupon.usoMax !== null && cupon.usoActual >= cupon.usoMax) {
    return NextResponse.json({ error: "Este cupón ya alcanzó el límite de usos" }, { status: 400 });
  }

  const sub = Number(subtotal ?? 0);
  const descuentoAplicado =
    cupon.tipo === "PORCENTAJE"
      ? Math.round((sub * Number(cupon.valor)) / 100 * 100) / 100
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
