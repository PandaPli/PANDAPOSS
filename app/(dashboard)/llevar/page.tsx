import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LlevarClient } from "./LlevarClient";
import type { Rol } from "@/types";

export const metadata: Metadata = { title: "PP — Para Llevar" };

export default async function LlevarPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const rol = (session.user as { rol?: Rol })?.rol;
  const sucursalId = (session.user as { sucursalId?: number | null })?.sucursalId ?? null;
  const simbolo = (session.user as { simbolo?: string })?.simbolo ?? "$";

  if (!rol || !["ADMIN_GENERAL", "RESTAURANTE", "CASHIER"].includes(rol)) redirect("/panel");

  const cajaAbierta = sucursalId
    ? await prisma.caja.findFirst({
        where: { estado: "ABIERTA", sucursalId },
        select: { abiertaEn: true },
        orderBy: { abiertaEn: "desc" },
      })
    : null;
  const turnoDesde = cajaAbierta?.abiertaEn ?? (() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  })();

  const [productos, pedidosLlevar] = await Promise.all([
    prisma.producto.findMany({
      where: { activo: true, enMenu: true, ...(sucursalId ? { sucursalId } : {}) },
      include: { categoria: { select: { nombre: true } } },
      orderBy: [{ categoria: { nombre: "asc" } }, { nombre: "asc" }],
    }),
    prisma.pedido.findMany({
      where: {
        tipo: "MOSTRADOR",
        observacion: { contains: "PARA LLEVAR" },
        creadoEn: { gte: turnoDesde },
        ...(rol !== "ADMIN_GENERAL" && sucursalId ? { usuario: { sucursalId } } : {}),
      },
      include: {
        detalles: {
          include: {
            producto: { select: { nombre: true, precio: true } },
            combo: { select: { nombre: true, precio: true } },
          },
        },
      },
      orderBy: { creadoEn: "desc" },
      take: 100,
    }),
  ]);

  const productosData = productos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    precio: Number(p.precio),
    imagen: p.imagen,
    categoria: p.categoria ? { nombre: p.categoria.nombre } : undefined,
  }));

  const pedidosData = pedidosLlevar.map((p) => {
    const obs = p.observacion ?? "";
    const nombreMatch = obs.match(/👤\s*(.+?)(?:\s*·|$)/);
    const horaMatch = obs.match(/🕐\s*(.+?)(?:\s*·|$)/);
    const subtotal = p.detalles.reduce(
      (acc, d) => acc + Number(d.producto?.precio ?? d.combo?.precio ?? 0) * d.cantidad,
      0,
    );
    return {
      id: p.id,
      numero: p.numero,
      estado: p.estado,
      clienteNombre: nombreMatch?.[1]?.trim() ?? "Sin nombre",
      horaRetiro: horaMatch?.[1]?.trim() ?? null,
      total: subtotal,
      creadoEn: p.creadoEn.toISOString(),
      detalles: p.detalles.map((d) => ({
        id: d.id,
        cantidad: d.cantidad,
        nombre: d.nombre ?? d.producto?.nombre ?? d.combo?.nombre ?? "Item",
        precio: Number(d.producto?.precio ?? d.combo?.precio ?? 0),
      })),
    };
  });

  return (
    <LlevarClient
      productos={productosData}
      pedidos={pedidosData}
      sucursalId={sucursalId}
      simbolo={simbolo}
    />
  );
}
