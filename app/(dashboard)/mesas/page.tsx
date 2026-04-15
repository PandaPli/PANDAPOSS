import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { MesasClient } from "./MesasClient";
import { getFreshSessionUser } from "@/lib/auth";
import type { Rol } from "@/types";

export const metadata: Metadata = { title: "PP — Mesas" };

async function getMesas(rol: Rol | undefined, sucursalId: number | null) {
  const where =
    rol !== "ADMIN_GENERAL" && sucursalId
      ? { sala: { sucursalId } }
      : {};

  return prisma.mesa.findMany({
    where,
    include: {
      sala: { select: { nombre: true, esQR: true } },
      pedidos: {
        // Sin take: 1 → traemos TODOS los pedidos activos para sumar total real
        where: { estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] } },
        orderBy: { creadoEn: "asc" },
        select: {
          id: true,
          creadoEn: true,
          // Solo contar detalles activos (no cancelados ni ya pagados en grupo)
          _count: { select: { detalles: { where: { cancelado: false, pagado: false } } } },
          detalles: {
            // Excluir cancelados y pagados del cálculo de total
            where: { cancelado: false, pagado: false },
            select: {
              cantidad: true,
              precio: true,                                    // precio fijo al momento de la orden
              grupo: true,
              producto: { select: { precio: true } },         // fallback si precio no guardado
              combo:    { select: { precio: true } },
            },
          },
        },
      },
    },
    orderBy: [{ salaId: "asc" }, { nombre: "asc" }],
  });
}

export default async function MesasPage() {
  const user = await getFreshSessionUser();
  if (!user) return null;

  const rol = user.rol as Rol;
  const sucursalId = user.sucursalId;
  const mesas = await getMesas(rol, sucursalId);

  // Serializar (Decimal → number) y calcular total
  const mesasData = mesas.map((m) => ({
    id: m.id,
    nombre: m.nombre,
    estado: m.estado as "LIBRE" | "OCUPADA" | "CUENTA" | "RESERVADA",
    capacidad: m.capacidad,
    salaId: m.salaId,
    sala: m.sala,
    pedidoActivo: m.pedidos.length > 0
      ? (() => {
          // id del pedido más reciente (para referencia)
          const id = m.pedidos[m.pedidos.length - 1].id;
          // creadoEn del pedido más antiguo (tiempo real de ocupación)
          const creadoEn = m.pedidos[0].creadoEn.toISOString();
          // Suma de ítems y total de TODOS los pedidos activos
          const detalleCount = m.pedidos.reduce((acc, p) => acc + p._count.detalles, 0);
          // Calcular total y totales por grupo en una sola pasada
          const grupoPrices: Record<string, number> = {};
          let total = 0;
          for (const p of m.pedidos) {
            for (const d of p.detalles) {
              const precio = Number(d.precio ?? d.producto?.precio ?? d.combo?.precio ?? 0);
              const monto = precio * d.cantidad;
              total += monto;
              if (d.grupo) {
                grupoPrices[d.grupo] = (grupoPrices[d.grupo] ?? 0) + monto;
              }
            }
          }
          const grupos = Object.entries(grupoPrices)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([grupo, t]) => ({ grupo, total: t }));
          return { id, creadoEn, total, _count: { detalles: detalleCount }, grupos };
        })()
      : null,
  }));

  return (
    <div className="space-y-6">
      <MesasClient mesas={mesasData} />
    </div>
  );
}

