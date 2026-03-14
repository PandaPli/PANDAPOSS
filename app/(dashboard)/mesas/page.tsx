import { prisma } from "@/lib/db";
import { MesasClient } from "./MesasClient";
import { getFreshSessionUser } from "@/lib/auth";
import type { Rol } from "@/types";

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
      ? {
          // id del pedido más reciente (para referencia)
          id: m.pedidos[m.pedidos.length - 1].id,
          // creadoEn del pedido más antiguo (tiempo real de ocupación)
          creadoEn: m.pedidos[0].creadoEn.toISOString(),
          // Suma de ítems y total de TODOS los pedidos activos
          _count: {
            detalles: m.pedidos.reduce((acc, p) => acc + p._count.detalles, 0),
          },
          total: m.pedidos.reduce((acc, p) =>
            acc + p.detalles.reduce((s, d) => {
              // Usar precio fijo guardado en el detalle; fallback al precio actual del producto
              const precio = Number(d.precio ?? d.producto?.precio ?? d.combo?.precio ?? 0);
              return s + precio * d.cantidad;
            }, 0), 0),
        }
      : null,
  }));

  return (
    <div className="space-y-6">
      <MesasClient mesas={mesasData} />
    </div>
  );
}

