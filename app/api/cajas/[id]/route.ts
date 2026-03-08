import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: idStr } = await params;
  const id = Number(idStr);
  const body = await req.json();
  const { action, saldoInicio, saldoFinal, observacion } = body;
  const userId = (session.user as { id: number }).id;

  if (action === "abrir") {
    const caja = await prisma.caja.findUnique({ where: { id } });
    if (!caja) return NextResponse.json({ error: "Caja no encontrada" }, { status: 404 });
    if (caja.estado === "ABIERTA") return NextResponse.json({ error: "La caja ya está abierta" }, { status: 400 });

    const [cajaActualizada] = await prisma.$transaction([
      prisma.caja.update({
        where: { id },
        data: {
          estado: "ABIERTA",
          saldoInicio: saldoInicio || 0,
          usuarioId: userId,
          abiertaEn: new Date(),
          cerradaEn: null,
        },
      }),
      prisma.arqueo.create({
        data: {
          cajaId: id,
          usuarioId: userId,
          saldoInicio: saldoInicio || 0,
        },
      }),
    ]);

    return NextResponse.json(cajaActualizada);
  }

  if (action === "cerrar") {
    const caja = await prisma.caja.findUnique({ where: { id } });
    if (!caja) return NextResponse.json({ error: "Caja no encontrada" }, { status: 404 });
    if (caja.estado === "CERRADA") return NextResponse.json({ error: "La caja ya está cerrada" }, { status: 400 });

    // Calcular total ventas del período
    const totalVentas = await prisma.venta.aggregate({
      _sum: { total: true },
      where: {
        cajaId: id,
        estado: "PAGADA",
        creadoEn: { gte: caja.abiertaEn ?? undefined },
      },
    });

    const totalVentasMonto = Number(totalVentas._sum.total ?? 0);
    const esperado = Number(caja.saldoInicio) + totalVentasMonto;
    const diferencia = (saldoFinal ?? 0) - esperado;

    // Actualizar último arqueo abierto
    const arqueoAbierto = await prisma.arqueo.findFirst({
      where: { cajaId: id, cerradaEn: null },
      orderBy: { abiertaEn: "desc" },
    });

    const [cajaActualizada] = await prisma.$transaction([
      prisma.caja.update({
        where: { id },
        data: {
          estado: "CERRADA",
          cerradaEn: new Date(),
          usuarioId: null,
        },
      }),
      ...(arqueoAbierto
        ? [
            prisma.arqueo.update({
              where: { id: arqueoAbierto.id },
              data: {
                saldoFinal: saldoFinal ?? 0,
                totalVentas: totalVentasMonto,
                diferencia,
                observacion: observacion || null,
                cerradaEn: new Date(),
              },
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ ...cajaActualizada, totalVentas: totalVentasMonto, diferencia });
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
}
