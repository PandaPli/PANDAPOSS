import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Genera un código único tipo: BDAY-A4X9K2
function generarCodigo(nombre: string): string {
  const prefix = nombre.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "X").padEnd(3, "X");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let rand = "";
  for (let i = 0; i < 6; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${rand}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sucursalId = searchParams.get("sucursalId");

  if (!sucursalId) return NextResponse.json({ error: "sucursalId requerido" }, { status: 400 });

  const sucursal = await prisma.sucursal.findUnique({
    where: { id: Number(sucursalId) },
    select: { id: true, nombre: true, activa: true },
  });

  if (!sucursal || !sucursal.activa) {
    return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
  }

  return NextResponse.json(sucursal);
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, telefono, direccion, fechaNacimiento, genero, sucursalId } = await req.json();

    if (!nombre?.trim()) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
    if (!sucursalId) return NextResponse.json({ error: "sucursalId requerido" }, { status: 400 });

    // Verificar que la sucursal existe
    const sucursal = await prisma.sucursal.findUnique({
      where: { id: Number(sucursalId) },
      select: { id: true, nombre: true, activa: true },
    });
    if (!sucursal || !sucursal.activa) {
      return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
    }

    // Buscar cliente existente por email o teléfono
    let clienteExistente = null;
    if (email) {
      clienteExistente = await prisma.cliente.findFirst({
        where: { email: email.trim(), sucursalId: Number(sucursalId) },
      });
    }
    if (!clienteExistente && telefono) {
      const telLimpio = telefono.replace(/^\+?56\s*9?\s*/, "").replace(/\s/g, "");
      clienteExistente = await prisma.cliente.findFirst({
        where: { telefono: { contains: telLimpio }, sucursalId: Number(sucursalId) },
      });
    }

    // Generar código de cumpleaños si no tiene
    let codigoCumple: string;
    if (clienteExistente?.codigoCumple) {
      codigoCumple = clienteExistente.codigoCumple;
    } else {
      // Asegurar unicidad
      let intento = 0;
      do {
        codigoCumple = generarCodigo(nombre);
        intento++;
        if (intento > 20) break;
      } while (await prisma.cliente.findFirst({ where: { codigoCumple } }));
    }

    const data = {
      nombre: nombre.trim(),
      email: email?.trim() || null,
      telefono: telefono?.replace(/^\+?56\s*9?\s*/, "").replace(/\s/g, "") || null,
      direccion: direccion?.trim() || null,
      genero: genero || null,
      fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
      codigoCumple,
    };

    let cliente;
    if (clienteExistente) {
      cliente = await prisma.cliente.update({
        where: { id: clienteExistente.id },
        data,
      });
    } else {
      cliente = await prisma.cliente.create({
        data: { ...data, sucursalId: Number(sucursalId), activo: true },
      });
    }

    return NextResponse.json({
      ok: true,
      nombre: cliente.nombre,
      codigoCumple: cliente.codigoCumple,
      esNuevo: !clienteExistente,
    });
  } catch (e) {
    console.error("[registro]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
