import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Rol } from "@/types";
import { UsuarioRepo } from "@/server/repositories/usuario.repo";
import { checkLimit } from "@/core/billing/limitChecker";

const ADMIN_ROLES: Rol[] = ["ADMIN_GENERAL", "RESTAURANTE"];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (!ADMIN_ROLES.includes(rol)) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;
  const usuarios = await UsuarioRepo.list({ sucursalId, isAdmin: rol === "ADMIN_GENERAL" });
  return NextResponse.json(usuarios);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (!ADMIN_ROLES.includes(rol)) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const { nombre, usuario, password, email, rolUsuario, sucursalId } = await req.json();
  if (!nombre || !usuario || !password) {
    return NextResponse.json({ error: "Nombre, usuario y contraseña son requeridos" }, { status: 400 });
  }

  const existe = await UsuarioRepo.findByUsuario(usuario);
  if (existe) return NextResponse.json({ error: "El nombre de usuario ya existe" }, { status: 400 });

  const userSucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  // Tenant isolation: non-admin can only create users in their own sucursal
  const effectiveSucursalId = rol === "ADMIN_GENERAL"
    ? (sucursalId ?? null)
    : userSucursalId;

  // Prevent privilege escalation: non-admin cannot assign admin roles
  const allowedRoles = ["SECRETARY", "CASHIER", "WAITER", "CHEF", "BAR", "DELIVERY"];
  if (rol !== "ADMIN_GENERAL" && !allowedRoles.includes(rolUsuario)) {
    return NextResponse.json({ error: "No tienes permisos para asignar ese rol" }, { status: 403 });
  }

  const { allowed, error } = await checkLimit(effectiveSucursalId, "usuarios");
  if (!allowed) return NextResponse.json({ error }, { status: 403 });

  const nuevoUsuario = await UsuarioRepo.create({
    nombre, usuario, password, email,
    rol: rolUsuario,
    sucursalId: effectiveSucursalId,
  });
  return NextResponse.json(nuevoUsuario, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as { rol: Rol }).rol;
  if (!ADMIN_ROLES.includes(rol)) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const { id, password, rolUsuario, sucursalId: newSucursalId, ...rest } = await req.json();
  const data: Record<string, unknown> = { ...rest };
  if (rolUsuario) {
    // Prevent privilege escalation
    const allowedRoles = ["SECRETARY", "CASHIER", "WAITER", "CHEF", "BAR", "DELIVERY"];
    if (rol !== "ADMIN_GENERAL" && !allowedRoles.includes(rolUsuario)) {
      return NextResponse.json({ error: "No tienes permisos para asignar ese rol" }, { status: 403 });
    }
    data.rol = rolUsuario;
  }
  // Tenant isolation: non-admin cannot change sucursal of a user
  if (rol === "ADMIN_GENERAL" && newSucursalId !== undefined) {
    data.sucursalId = newSucursalId ?? null;
  }

  const actualizado = await UsuarioRepo.update(Number(id), data, password);
  return NextResponse.json(actualizado);
}
