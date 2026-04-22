import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Parsea el JSON de observacion de delivery para extraer cliente y metodoPago
function parseObs(obs: string | null): { clienteNombre: string | null; metodoPago: string | null; esRetiro: boolean } {
  if (!obs) return { clienteNombre: null, metodoPago: null, esRetiro: false };
  try {
    // Formato JSON embebido: {"clienteNombre":"...","metodoPago":"...","cargoEnvio":0,...}
    const jsonMatch = obs.match(/\{.*\}/s);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return {
        clienteNombre: data.clienteNombre ?? null,
        metodoPago: data.metodoPago ?? null,
        esRetiro: Number(data.cargoEnvio ?? 1) === 0 || (data.zonaDelivery ?? "").toLowerCase().includes("retiro"),
      };
    }
  } catch {}
  // Formato legacy: "Cliente: Juan, ..."
  const match = obs.match(/Cliente:\s*([^,\n|]+)/i);
  return {
    clienteNombre: match ? match[1].trim() : null,
    metodoPago: null,
    esRetiro: obs.toLowerCase().includes("retiro"),
  };
}

function parseKioskoCliente(obs: string | null): string | null {
  if (!obs) return null;
  const match = obs.match(/👤\s*([^·\n]+)/);
  return match ? match[1].trim() : null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sucursalId = (session.user as { sucursalId?: number | null })?.sucursalId ?? null;

  // Pedidos del día de hoy
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const pedidos = await prisma.pedido.findMany({
    where: {
      OR: [
        { tipo: "DELIVERY" },
        { tipo: "MOSTRADOR", observacion: { contains: "KIOSKO" } },
      ],
      creadoEn: { gte: hoy },
      ...(sucursalId ? { usuario: { sucursalId } } : {}),
    },
    select: {
      id: true,
      numero: true,
      tipo: true,
      estado: true,
      observacion: true,
      mpStatus: true,
      creadoEn: true,
      telefonoCliente: true,
      detalles: {
        select: { precio: true, cantidad: true },
      },
    },
    orderBy: { creadoEn: "desc" },
    take: 60,
  });

  const rows = pedidos.map((p) => {
    const esKiosko = p.tipo === "MOSTRADOR";
    const { clienteNombre, metodoPago, esRetiro } = esKiosko
      ? { clienteNombre: parseKioskoCliente(p.observacion), metodoPago: p.mpStatus === "approved" ? "MERCADOPAGO" : "EFECTIVO", esRetiro: false }
      : parseObs(p.observacion);

    const origen = esKiosko ? "KIOSKO" : esRetiro ? "RETIRO" : "DELIVERY";
    const pagoMP = p.mpStatus === "approved" || metodoPago === "MERCADOPAGO" || metodoPago === "mercadopago";

    const total = p.detalles.reduce((acc, d) => acc + Number(d.precio) * d.cantidad, 0);

    return {
      id: p.id,
      numero: p.numero,
      origen,
      estado: p.estado,
      clienteNombre,
      telefono: p.telefonoCliente,
      metodoPago: metodoPago ?? "EFECTIVO",
      pagoMP,
      total,
      creadoEn: p.creadoEn.toISOString(),
    };
  });

  return NextResponse.json(rows);
}
