import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

// GET /api/repartidores
// Lista repartidores (usuarios con rol DELIVERY) y sus pedidos activos
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const { searchParams } = new URL(req.url);
  const conPedidos = searchParams.get("conPedidos") === "true";

  const repartidores = await prisma.usuario.findMany({
    where: {
      rol: "DELIVERY",
      status: "ACTIVO",
      ...(rol !== "ADMIN_GENERAL" && sucursalId ? { sucursalId } : {}),
    },
    select: {
      id: true,
      nombre: true,
      usuario: true,
      email: true,
      sucursalId: true,
      sucursal: { select: { nombre: true } },
      ...(conPedidos
        ? {
            pedidosRepartidor: {
              where: { estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] } },
              select: {
                id: true,
                numero: true,
                estado: true,
                direccionEntrega: true,
                telefonoCliente: true,
                observacion: true,
                creadoEn: true,
                detalles: {
                  select: {
                    cantidad: true,
                    producto: { select: { nombre: true } },
                    combo: { select: { nombre: true } },
                  },
                },
              },
              orderBy: { creadoEn: "asc" },
            },
          }
        : {}),
    },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(repartidores);
}
