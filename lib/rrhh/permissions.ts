import type { Rol } from "@/types";

export type RrhhPermission =
  | "rrhh.sucursales.read"
  | "rrhh.empleados.read"
  | "rrhh.empleados.write"
  | "rrhh.asistencias.read"
  | "rrhh.asistencias.write"
  | "rrhh.reportes.read";

export type RrhhSession = {
  userId: number;
  role: Rol;
  sucursalIds: number[];
};

const rolePermissions: Record<Rol, RrhhPermission[]> = {
  ADMIN_GENERAL: [
    "rrhh.sucursales.read",
    "rrhh.empleados.read",
    "rrhh.empleados.write",
    "rrhh.asistencias.read",
    "rrhh.asistencias.write",
    "rrhh.reportes.read",
  ],
  RESTAURANTE: [
    "rrhh.sucursales.read",
    "rrhh.empleados.read",
    "rrhh.empleados.write",
    "rrhh.asistencias.read",
    "rrhh.asistencias.write",
    "rrhh.reportes.read",
  ],
  SECRETARY: [
    "rrhh.sucursales.read",
    "rrhh.empleados.read",
    "rrhh.empleados.write",
    "rrhh.asistencias.read",
    "rrhh.asistencias.write",
    "rrhh.reportes.read",
  ],
  CASHIER: [],
  WAITER: [],
  CHEF: [],
  BAR: [],
  DELIVERY: [],
};

export function hasPermission(session: RrhhSession, permission: RrhhPermission) {
  return rolePermissions[session.role].includes(permission);
}

export function canAccessSucursal(session: RrhhSession, sucursalId: number) {
  return session.role === "ADMIN_GENERAL" || session.sucursalIds.includes(sucursalId);
}

export function assertPermission(session: RrhhSession, permission: RrhhPermission) {
  if (!hasPermission(session, permission)) throw new Error("FORBIDDEN_PERMISSION");
}

export function assertSucursalAccess(session: RrhhSession, sucursalId: number) {
  if (!canAccessSucursal(session, sucursalId)) throw new Error("FORBIDDEN_SUCURSAL");
}
