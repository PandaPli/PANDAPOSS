import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.rol !== "ADMIN_GENERAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sucursalId = req.nextUrl.searchParams.get("sucursalId");

  const where = sucursalId ? { sucursalId: Number(sucursalId) } : {};

  const evaluaciones = await prisma.evaluacion.findMany({
    where,
    orderBy: { creadoEn: "desc" },
    take: 100,
    include: {
      pedido: {
        select: {
          id: true,
          numero: true,
          delivery: {
            select: {
              cliente: { select: { nombre: true, telefono: true } },
            },
          },
        },
      },
      sucursal: { select: { nombre: true } },
    },
  });

  const all = await prisma.evaluacion.findMany({
    where,
    select: { estrellas: true },
  });

  const promedio =
    all.length > 0
      ? all.reduce((a, e) => a + e.estrellas, 0) / all.length
      : 0;

  return NextResponse.json({
    promedio: Math.round(promedio * 10) / 10,
    total: all.length,
    evaluaciones: evaluaciones.map((e) => ({
      id: e.id,
      nick: e.nick,
      estrellas: e.estrellas,
      comentario: e.comentario,
      creadoEn: e.creadoEn,
      sucursal: e.sucursal.nombre,
      pedidoId: e.pedido.id,
      pedidoNumero: e.pedido.numero,
      clienteNombre: e.pedido.delivery?.cliente.nombre ?? null,
      clienteTelefono: e.pedido.delivery?.cliente.telefono ?? null,
    })),
  });
}
