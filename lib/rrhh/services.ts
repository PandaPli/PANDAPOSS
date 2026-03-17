import { assertPermission, assertSucursalAccess, type RrhhSession } from "./permissions";

function splitFullName(fullName: string) {
  const normalized = fullName.trim().replace(/\s+/g, " ");
  const parts = normalized.split(" ").filter(Boolean);

  if (parts.length <= 1) {
    return { nombres: normalized || "Sin nombre", apellidos: "" };
  }

  if (parts.length === 2) {
    return { nombres: parts[0], apellidos: parts[1] };
  }

  return {
    nombres: parts.slice(0, Math.max(1, parts.length - 2)).join(" "),
    apellidos: parts.slice(-2).join(" "),
  };
}

export async function listSucursales(prisma: any, session: RrhhSession) {
  assertPermission(session, "rrhh.sucursales.read");

  return prisma.sucursal.findMany({
    where: {
      activa: true,
      ...(session.role === "ADMIN_GENERAL" ? {} : { id: { in: session.sucursalIds } }),
    },
    select: {
      id: true,
      nombre: true,
      activa: true,
      _count: {
        select: {
          empleados: true,
          asistencias: true,
        },
      },
    },
    orderBy: { nombre: "asc" },
  });
}

export async function listEmpleados(prisma: any, session: RrhhSession, sucursalId?: number) {
  assertPermission(session, "rrhh.empleados.read");
  if (sucursalId) assertSucursalAccess(session, sucursalId);

  return prisma.empleado.findMany({
    where: {
      sucursalId: sucursalId ?? { in: session.sucursalIds },
    },
    include: {
      sucursal: true,
      usuario: { select: { id: true, nombre: true, usuario: true, rol: true } },
      departamento: true,
      cargo: true,
    },
    orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
  });
}

export async function createEmpleado(prisma: any, session: RrhhSession, input: any) {
  assertPermission(session, "rrhh.empleados.write");
  assertSucursalAccess(session, input.sucursalId);

  return prisma.empleado.create({
    data: {
      sucursalId: input.sucursalId,
      departamentoId: input.departamentoId,
      cargoId: input.cargoId,
      nombres: input.nombres,
      apellidos: input.apellidos,
      documento: input.documento,
      email: input.email,
      telefono: input.telefono,
      fechaIngreso: input.fechaIngreso ? new Date(input.fechaIngreso) : undefined,
      salarioBase: input.salarioBase,
    },
  });
}

export async function importUsuariosAsEmpleados(prisma: any, session: RrhhSession, sucursalId: number) {
  assertPermission(session, "rrhh.empleados.write");
  assertSucursalAccess(session, sucursalId);

  const usuarios = await prisma.usuario.findMany({
    where: {
      sucursalId,
      status: "ACTIVO",
      rol: { not: "ADMIN_GENERAL" },
    },
    select: {
      id: true,
      nombre: true,
      email: true,
      creadoEn: true,
    },
    orderBy: { id: "asc" },
  });

  let created = 0;
  let linked = 0;
  let skipped = 0;

  for (const usuario of usuarios) {
    const existingByUsuario = await prisma.empleado.findUnique({
      where: { usuarioId: usuario.id },
      select: { id: true },
    });

    if (existingByUsuario) {
      skipped += 1;
      continue;
    }

    const existingByEmail = usuario.email
      ? await prisma.empleado.findFirst({
          where: { email: usuario.email },
          select: { id: true, usuarioId: true, sucursalId: true },
        })
      : null;

    // Solo vincular si el empleado existente pertenece a la MISMA sucursal
    if (existingByEmail && !existingByEmail.usuarioId && existingByEmail.sucursalId === sucursalId) {
      await prisma.empleado.update({
        where: { id: existingByEmail.id },
        data: { usuarioId: usuario.id },
      });
      linked += 1;
      continue;
    }

    // Si el email existe pero en otra sucursal → omitir (no tocar datos ajenos)
    if (existingByEmail && existingByEmail.sucursalId !== sucursalId) {
      skipped += 1;
      continue;
    }

    if (existingByEmail && existingByEmail.usuarioId) {
      skipped += 1;
      continue;
    }

    const { nombres, apellidos } = splitFullName(usuario.nombre);

    await prisma.empleado.create({
      data: {
        sucursalId,
        usuarioId: usuario.id,
        nombres,
        apellidos,
        email: usuario.email ?? undefined,
        fechaIngreso: usuario.creadoEn,
      },
    });
    created += 1;
  }

  return {
    sucursalId,
    totalUsuarios: usuarios.length,
    created,
    linked,
    skipped,
  };
}

export async function listAsistencias(prisma: any, session: RrhhSession, sucursalId?: number) {
  assertPermission(session, "rrhh.asistencias.read");
  if (sucursalId) assertSucursalAccess(session, sucursalId);

  return prisma.asistencia.findMany({
    where: {
      sucursalId: sucursalId ?? { in: session.sucursalIds },
    },
    include: {
      empleado: true,
      sucursal: true,
    },
    orderBy: [{ fecha: "desc" }, { creadoEn: "desc" }],
  });
}

const ESTADOS_VALIDOS = ["PRESENTE", "TARDE", "AUSENTE", "PERMISO"] as const;

export async function createAsistencia(prisma: any, session: RrhhSession, input: any) {
  assertPermission(session, "rrhh.asistencias.write");
  assertSucursalAccess(session, input.sucursalId);

  // Validar estado contra enum permitido
  if (!ESTADOS_VALIDOS.includes(input.estado)) {
    throw new Error(`INVALID_ESTADO`);
  }

  const empleado = await prisma.empleado.findUnique({
    where: { id: input.empleadoId },
    select: { sucursalId: true },
  });

  if (!empleado || empleado.sucursalId !== input.sucursalId) {
    throw new Error("EMPLEADO_INVALIDO_PARA_SUCURSAL");
  }

  // Evitar duplicados: un empleado solo puede tener una asistencia por día
  const fechaDia = new Date(input.fecha);
  fechaDia.setHours(0, 0, 0, 0);
  const fechaSig = new Date(fechaDia);
  fechaSig.setDate(fechaSig.getDate() + 1);

  const existente = await prisma.asistencia.findFirst({
    where: {
      empleadoId: input.empleadoId,
      fecha: { gte: fechaDia, lt: fechaSig },
    },
    select: { id: true },
  });

  if (existente) {
    throw new Error("ASISTENCIA_DUPLICADA");
  }

  return prisma.asistencia.create({
    data: {
      sucursalId: input.sucursalId,
      empleadoId: input.empleadoId,
      fecha: new Date(input.fecha),
      horaEntrada: input.horaEntrada ? new Date(input.horaEntrada) : undefined,
      horaSalida: input.horaSalida ? new Date(input.horaSalida) : undefined,
      estado: input.estado,
      observacion: input.observacion,
    },
  });
}
