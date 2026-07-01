import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

export const dynamic = "force-dynamic";

// GET /api/compras — historial de compras de la sucursal
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  const sessionSucursalId = (session.user as { sucursalId?: number | null })?.sucursalId;

  const { searchParams } = new URL(req.url);
  const take = Math.min(Number(searchParams.get("take") ?? "50"), 200);

  const sucursalId =
    rol === "ADMIN_GENERAL"
      ? searchParams.get("sucursalId") ? Number(searchParams.get("sucursalId")) : undefined
      : sessionSucursalId ?? -1;

  const compras = await prisma.compra.findMany({
    where: sucursalId ? { sucursalId } : {},
    include: {
      proveedor: { select: { id: true, nombre: true } },
      detalles: {
        select: {
          id: true, nombre: true, cantidad: true, costoUnitario: true, subtotal: true,
          productoId: true, ingredienteId: true,
        },
      },
    },
    orderBy: { creadoEn: "desc" },
    take,
  });

  return NextResponse.json(compras.map((c) => ({
    id: c.id,
    numeroDocumento: c.numeroDocumento,
    observacion: c.observacion,
    total: Number(c.total),
    creadoEn: c.creadoEn,
    proveedor: c.proveedor,
    detalles: c.detalles.map((d) => ({
      ...d,
      cantidad: Number(d.cantidad),
      costoUnitario: Number(d.costoUnitario),
      subtotal: Number(d.subtotal),
    })),
  })));
}

interface ItemCompra {
  productoId?: number;
  ingredienteId?: number;
  cantidad: number;
  costoUnitario: number;
}

// POST /api/compras — registrar compra: crea detalles, sube stock y kardex ENTRADA
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  const sessionSucursalId = (session.user as { sucursalId?: number | null })?.sucursalId;
  if (!["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY"].includes(rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  const { proveedorId, numeroDocumento, observacion, items } = body as {
    proveedorId?: number;
    numeroDocumento?: string;
    observacion?: string;
    items: ItemCompra[];
  };

  const sucursalId =
    rol === "ADMIN_GENERAL" && body.sucursalId ? Number(body.sucursalId) : sessionSucursalId;
  if (!sucursalId) return NextResponse.json({ error: "sucursalId requerido" }, { status: 400 });

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "La compra debe tener al menos un ítem" }, { status: 400 });
  }
  for (const it of items) {
    if ((!it.productoId && !it.ingredienteId) || (it.productoId && it.ingredienteId)) {
      return NextResponse.json({ error: "Cada ítem debe referir a un producto O un ingrediente" }, { status: 400 });
    }
    if (!(Number(it.cantidad) > 0) || Number(it.costoUnitario) < 0) {
      return NextResponse.json({ error: "Cantidad debe ser > 0 y costo >= 0" }, { status: 400 });
    }
  }

  // Cargar nombres y validar pertenencia a la sucursal
  const productoIds = items.filter((i) => i.productoId).map((i) => Number(i.productoId));
  const ingredienteIds = items.filter((i) => i.ingredienteId).map((i) => Number(i.ingredienteId));

  const [productos, ingredientes] = await Promise.all([
    prisma.producto.findMany({
      where: { id: { in: productoIds } },
      select: { id: true, nombre: true, sucursalId: true },
    }),
    prisma.ingrediente.findMany({
      where: { id: { in: ingredienteIds } },
      select: { id: true, nombre: true, sucursalId: true },
    }),
  ]);

  const prodMap = new Map(productos.map((p) => [p.id, p]));
  const ingMap = new Map(ingredientes.map((i) => [i.id, i]));

  for (const it of items) {
    if (it.productoId) {
      const p = prodMap.get(Number(it.productoId));
      if (!p) return NextResponse.json({ error: `Producto ${it.productoId} no existe` }, { status: 404 });
      if (rol !== "ADMIN_GENERAL" && p.sucursalId !== sucursalId) {
        return NextResponse.json({ error: `Producto ${p.nombre} no pertenece a tu sucursal` }, { status: 403 });
      }
    }
    if (it.ingredienteId) {
      const i = ingMap.get(Number(it.ingredienteId));
      if (!i) return NextResponse.json({ error: `Ingrediente ${it.ingredienteId} no existe` }, { status: 404 });
      if (rol !== "ADMIN_GENERAL" && i.sucursalId !== sucursalId) {
        return NextResponse.json({ error: `Ingrediente ${i.nombre} no pertenece a tu sucursal` }, { status: 403 });
      }
    }
  }

  const total = items.reduce((s, it) => s + Number(it.cantidad) * Number(it.costoUnitario), 0);

  try {
    const compra = await prisma.$transaction(async (tx) => {
      const nueva = await tx.compra.create({
        data: {
          sucursalId,
          proveedorId: proveedorId ? Number(proveedorId) : null,
          numeroDocumento: numeroDocumento?.trim() || null,
          observacion: observacion?.trim() || null,
          total,
        },
      });

      for (const it of items) {
        const cant = Number(it.cantidad);
        const costo = Number(it.costoUnitario);
        const nombre = it.productoId
          ? prodMap.get(Number(it.productoId))!.nombre
          : ingMap.get(Number(it.ingredienteId))!.nombre;

        await tx.compraDetalle.create({
          data: {
            compraId: nueva.id,
            productoId: it.productoId ? Number(it.productoId) : null,
            ingredienteId: it.ingredienteId ? Number(it.ingredienteId) : null,
            nombre,
            cantidad: cant,
            costoUnitario: costo,
            subtotal: cant * costo,
          },
        });

        if (it.productoId) {
          await tx.producto.update({
            where: { id: Number(it.productoId) },
            data: { stock: { increment: cant } },
          });
          await tx.kardex.create({
            data: {
              productoId: Number(it.productoId),
              tipo: "ENTRADA",
              cantidad: cant,
              motivo: `Compra #${nueva.id}${numeroDocumento ? ` (doc ${numeroDocumento.trim()})` : ""}`,
            },
          });
        } else {
          await tx.ingrediente.update({
            where: { id: Number(it.ingredienteId) },
            data: { stock: { increment: cant }, costo },
          });
          await tx.kardexIngrediente.create({
            data: {
              ingredienteId: Number(it.ingredienteId),
              tipo: "ENTRADA",
              cantidad: cant,
              motivo: `Compra #${nueva.id}${numeroDocumento ? ` (doc ${numeroDocumento.trim()})` : ""}`,
              compraId: nueva.id,
            },
          });
        }
      }

      return nueva;
    });

    return NextResponse.json({ ok: true, compraId: compra.id, total }, { status: 201 });
  } catch (err) {
    console.error("POST /api/compras:", err);
    return NextResponse.json({ error: "Error al registrar la compra" }, { status: 500 });
  }
}
