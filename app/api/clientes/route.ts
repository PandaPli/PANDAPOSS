import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";
import { checkLimit } from "@/core/billing/limitChecker";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const clientes = await prisma.cliente.findMany({
    where: {
      activo: true,
      ...(rol !== "ADMIN_GENERAL" && sucursalId ? { sucursalId } : {}),
      ...(q
        ? {
            OR: [
              { nombre: { contains: q } },
              { email: { contains: q } },
              { telefono: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { nombre: "asc" },
    select: {
      id: true, nombre: true, email: true, telefono: true,
      direccion: true, genero: true, fechaNacimiento: true,
      codigoCumple: true, activo: true, sucursalId: true,
      puntos: true, rut: true,
      sucursal: { select: { id: true, nombre: true } },
    },
  });

  return NextResponse.json(clientes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { nombre, email, telefono, direccion, genero, fechaNacimiento, sucursalId: sucursalIdBody } = body;

  if (!nombre) {
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
  }

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalIdSesion = (session.user as { sucursalId: number | null }).sucursalId;
  const effectiveSucursalId = rol === "ADMIN_GENERAL" ? (sucursalIdBody || null) : sucursalIdSesion;
  const { allowed, error: limitError } = await checkLimit(effectiveSucursalId, "clientes");
  if (!allowed) return NextResponse.json({ error: limitError }, { status: 403 });

  let cleanTelefono = telefono || null;
  if (cleanTelefono) {
    cleanTelefono = cleanTelefono.trim();
    cleanTelefono = cleanTelefono.replace(/^\+?56\s*9\s*/, '');
    cleanTelefono = cleanTelefono.replace(/^569\s*/, '');
    cleanTelefono = cleanTelefono.trim();
  }

  const cliente = await prisma.cliente.create({
    data: {
      nombre,
      email: email || null,
      telefono: cleanTelefono,
      direccion: direccion || null,
      genero: genero || null,
      fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
      sucursalId: effectiveSucursalId,
    },
  });

  return NextResponse.json(cliente, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  // Verificar que el cliente pertenece a la sucursal del usuario
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    select: { sucursalId: true },
  });
  if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  if (rol !== "ADMIN_GENERAL" && cliente.sucursalId !== sucursalId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Hard delete en cascada: ventas → detalles, pedidos delivery, direcciones, cliente
  await prisma.$transaction(async (tx) => {
    // 1. Obtener ventas del cliente
    const ventas = await tx.venta.findMany({ where: { clienteId: id }, select: { id: true } });
    const ventaIds = ventas.map((v) => v.id);

    // 2. Eliminar detalles de venta
    if (ventaIds.length > 0) {
      await tx.detalleVenta.deleteMany({ where: { ventaId: { in: ventaIds } } });
      await tx.venta.deleteMany({ where: { id: { in: ventaIds } } });
    }

    // 3. Eliminar pedidos delivery
    await tx.pedidoDelivery.deleteMany({ where: { clienteId: id } });

    // 4. Eliminar direcciones
    await tx.direccionCliente.deleteMany({ where: { clienteId: id } });

    // 5. Eliminar cliente
    await tx.cliente.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { id, ...data } = body;

  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  // Evitar que nombre quede vacío
  if ("nombre" in data && (!data.nombre || !String(data.nombre).trim()))
    return NextResponse.json({ error: "El nombre no puede estar vacío" }, { status: 400 });

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  // C5: Validar que el cliente pertenece a la sucursal del usuario
  if (rol !== "ADMIN_GENERAL") {
    const existing = await prisma.cliente.findUnique({
      where: { id: Number(id) },
      select: { sucursalId: true },
    });
    if (!existing) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    if (existing.sucursalId !== sucursalId)
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (data.telefono) {
    let t = String(data.telefono).trim();
    t = t.replace(/^\+?56\s*9\s*/, "");
    t = t.replace(/^569\s*/, "");
    data.telefono = t.trim() || null;
  }

  const cliente = await prisma.cliente.update({
    where: { id: Number(id) },
    data,
  });

  return NextResponse.json(cliente);
}
