import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DeliveryClient } from "./DeliveryClient";

async function getPedidosDelivery(sucursalId: number | null, rol: string | null) {
  return prisma.pedido.findMany({
    where: {
      tipo: "DELIVERY",
      estado: { notIn: ["ENTREGADO", "CANCELADO"] },
      ...(rol !== "ADMIN_GENERAL" && sucursalId
        ? { caja: { sucursalId } }
        : {}),
    },
    include: {
      usuario: { select: { nombre: true } },
      detalles: {
        include: {
          producto: { select: { nombre: true } },
          combo: { select: { nombre: true } },
        },
      },
    },
    orderBy: { creadoEn: "desc" },
  });
}

export default async function DeliveryPage() {
  const session = await getServerSession(authOptions);
  const plan = (session?.user as { plan?: string })?.plan ?? "BASIC";

  // Redirigir si no tiene plan PRO
  if (plan !== "PRO") {
    redirect("/panel?upgrade=delivery");
  }

  const sucursalId = (session?.user as { sucursalId?: number })?.sucursalId ?? null;
  const rol = (session?.user as { rol?: string })?.rol ?? null;
  const simbolo = (session?.user as { simbolo?: string })?.simbolo ?? "$";

  const pedidos = await getPedidosDelivery(sucursalId, rol);

  const data = pedidos.map((p) => ({
    id: p.id,
    numero: p.numero,
    estado: p.estado,
    observacion: p.observacion,
    creadoEn: p.creadoEn.toISOString(),
    usuario: p.usuario.nombre,
    detalles: p.detalles.map((d) => ({
      id: d.id,
      cantidad: d.cantidad,
      observacion: d.observacion,
      nombre: d.producto?.nombre ?? d.combo?.nombre ?? "—",
    })),
  }));

  return (
    <div className="space-y-6">
      <DeliveryClient pedidos={data} simbolo={simbolo} />
    </div>
  );
}
