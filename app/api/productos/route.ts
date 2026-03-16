import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";
import { checkLimit } from "@/core/billing/limitChecker";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const categoriaId = searchParams.get("categoria");

  // Construir filtros como array para AND (evita conflicto si hay múltiples OR)
  const andFilters: object[] = [];

  // Aislamiento estricto: ADMIN_GENERAL ve todo; demás solo ven su sucursal
  if (rol !== "ADMIN_GENERAL") {
    andFilters.push(sucursalId !== null ? { sucursalId } : { id: -1 });
  }

  // Filtro de búsqueda
  if (q) {
    andFilters.push({ OR: [{ nombre: { contains: q } }, { codigo: { contains: q } }] });
  }

  // Filtro por categoría
  if (categoriaId) {
    andFilters.push({ categoriaId: Number(categoriaId) });
  }

  const productos = await prisma.producto.findMany({
    where: {
      activo: true,
      ...(andFilters.length > 0 ? { AND: andFilters } : {}),
    },
    include: { categoria: { select: { nombre: true } } },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(productos);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const body = await req.json();
  const { codigo, nombre, descripcion, precio, costo, stock, stockMinimo, categoriaId, ivaActivo, ivaPorc, imagen, enMenu, enMenuQR } = body;

  if (!codigo || !nombre || precio === undefined) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const effectiveSucursalId = rol !== "ADMIN_GENERAL" ? sucursalId : (body.sucursalId ?? null);
  const { allowed, error: limitError } = await checkLimit(effectiveSucursalId, "productos");
  if (!allowed) return NextResponse.json({ error: limitError }, { status: 403 });

  const producto = await prisma.producto.create({
    data: {
      codigo: codigo.toUpperCase(),
      nombre,
      descripcion: descripcion || null,
      precio,
      costo: costo || null,
      stock: stock || 0,
      stockMinimo: stockMinimo || 0,
      categoriaId: categoriaId || null,
      ivaActivo: ivaActivo || false,
      ivaPorc: ivaPorc || 0,
      imagen: imagen || null,
      enMenu: enMenu ?? true,
      enMenuQR: enMenuQR ?? true,
      // Asignar sucursal al producto (salvo ADMIN_GENERAL que puede crear globales)
      sucursalId: rol !== "ADMIN_GENERAL" ? sucursalId : (body.sucursalId ?? null),
    },
  });

  return NextResponse.json(producto, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol        = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const body = await req.json();
  const { id, ...rawData } = body;

  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  // Verificar propiedad: el producto debe pertenecer a la sucursal del usuario
  const existing = await prisma.producto.findUnique({
    where: { id: Number(id) },
    select: { sucursalId: true },
  });
  if (!existing) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  if (rol !== "ADMIN_GENERAL" && existing.sucursalId !== sucursalId) {
    return NextResponse.json({ error: "Sin permiso para editar este producto" }, { status: 403 });
  }

  // Whitelist de campos editables — previene mass-assignment de sucursalId, activo, etc.
  const CAMPOS: (keyof typeof rawData)[] = [
    "nombre", "descripcion", "precio", "costo", "stock", "stockMinimo",
    "categoriaId", "ivaActivo", "ivaPorc", "imagen", "enMenu", "enMenuQR",
  ];
  const data: Record<string, unknown> = {};
  for (const campo of CAMPOS) {
    if (campo in rawData) data[campo] = rawData[campo];
  }
  // codigo solo editable por ADMIN_GENERAL
  if (rol === "ADMIN_GENERAL" && "codigo" in rawData) {
    data.codigo = String(rawData.codigo).toUpperCase();
  }

  // Validación básica de precio
  if (data.precio !== undefined && (typeof data.precio !== "number" || (data.precio as number) < 0)) {
    return NextResponse.json({ error: "El precio debe ser un número positivo" }, { status: 400 });
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const producto = await prisma.producto.update({
    where: { id: Number(id) },
    data,
  });

  return NextResponse.json(producto);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol        = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  // Verificar que el producto pertenece a la sucursal del usuario
  const producto = await prisma.producto.findUnique({ where: { id } });
  if (!producto) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  if (rol !== "ADMIN_GENERAL" && producto.sucursalId !== sucursalId) {
    return NextResponse.json({ error: "Sin permiso para eliminar este producto" }, { status: 403 });
  }

  // Soft delete: desactivar en lugar de borrar para preservar historial de ventas
  await prisma.producto.update({
    where: { id },
    data: { activo: false, enMenu: false, enMenuQR: false },
  });

  return NextResponse.json({ ok: true });
}
