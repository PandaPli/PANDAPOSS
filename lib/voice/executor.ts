/**
 * Executor de herramientas POS para voz.
 *
 * Cada funcion recibe argumentos del modelo OpenAI Realtime y ejecuta
 * la accion correspondiente contra la base de datos via Prisma.
 * Todas las funciones aplican aislamiento por sucursalId.
 */

import { prisma } from "@/lib/db";
import { PedidoService } from "@/server/services/pedido.service";
import type { Prisma, Estacion, EstadoMesa } from "@prisma/client";

// ── Contexto de ejecucion ──────────────────────────────────
interface VoiceContext {
  userId: number;
  sucursalId: number | null;
  rol: string;
}

interface VoiceResult {
  ok: boolean;
  message: string;
  data?: unknown;
}

// ── Dispatcher principal ───────────────────────────────────
export async function executeVoiceTool(
  name: string,
  args: Record<string, unknown>,
  ctx: VoiceContext,
): Promise<VoiceResult> {
  if (!ctx.sucursalId) {
    return { ok: false, message: "No tienes una sucursal asignada." };
  }

  try {
    switch (name) {
      case "crear_pedido":
        return await crearPedido(args, ctx);
      case "leer_comanda":
        return await leerComanda(args, ctx);
      case "actualizar_pedido":
        return await actualizarPedido(args, ctx);
      case "cancelar_producto":
        return await cancelarProducto(args, ctx);
      case "consultar_stock":
        return await consultarStock(args, ctx);
      case "consultar_ventas":
        return await consultarVentas(args, ctx);
      case "estado_cocina":
        return await estadoCocina(args, ctx);
      case "estado_mesas":
        return await estadoMesas(args, ctx);
      default:
        return { ok: false, message: `Herramienta desconocida: ${name}` };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno";
    console.error(`[voice:executor] ${name} error:`, error);
    return { ok: false, message: msg };
  }
}

// ── Helpers ────────────────────────────────────────────────

/** Busca una mesa por nombre/numero en la sucursal */
async function findMesa(mesaNombre: string, sucursalId: number) {
  const nombre = mesaNombre.trim();

  // Busqueda exacta
  let mesa = await prisma.mesa.findFirst({
    where: {
      nombre: { equals: nombre },
      sala: { sucursalId },
    },
    select: { id: true, nombre: true, estado: true },
  });

  if (mesa) return mesa;

  // Busqueda case-insensitive con contains
  mesa = await prisma.mesa.findFirst({
    where: {
      nombre: { contains: nombre },
      sala: { sucursalId },
    },
    select: { id: true, nombre: true, estado: true },
  });

  if (mesa) return mesa;

  // Solo numero — buscar "Mesa X", "X", etc.
  const soloNumero = nombre.replace(/\D/g, "");
  if (soloNumero) {
    mesa = await prisma.mesa.findFirst({
      where: {
        nombre: { contains: soloNumero },
        sala: { sucursalId },
      },
      select: { id: true, nombre: true, estado: true },
    });
  }

  return mesa;
}

/** Busca un pedido activo por numero o mesa */
async function findPedidoActivo(
  opts: { numero?: number; mesa?: string },
  ctx: VoiceContext,
) {
  if (opts.numero) {
    return prisma.pedido.findFirst({
      where: {
        numero: opts.numero,
        estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
        OR: [
          { caja: { sucursalId: ctx.sucursalId } },
          { mesa: { sala: { sucursalId: ctx.sucursalId } } },
          { usuario: { sucursalId: ctx.sucursalId } },
        ],
      },
      include: { detalles: true, mesa: true },
    });
  }

  if (opts.mesa && ctx.sucursalId) {
    const mesa = await findMesa(opts.mesa, ctx.sucursalId);
    if (!mesa) return null;

    return prisma.pedido.findFirst({
      where: {
        mesaId: mesa.id,
        estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] },
      },
      include: { detalles: true, mesa: true },
      orderBy: { creadoEn: "desc" },
    });
  }

  return null;
}

/** Busca un producto por nombre con fuzzy matching */
async function findProducto(nombre: string, sucursalId: number) {
  const term = nombre.trim().toLowerCase();

  // 1. Exacto
  let producto = await prisma.producto.findFirst({
    where: { sucursalId, activo: true, nombre: { equals: nombre } },
    select: { id: true, nombre: true, precio: true },
  });
  if (producto) return producto;

  // 2. Contains
  producto = await prisma.producto.findFirst({
    where: { sucursalId, activo: true, nombre: { contains: term } },
    select: { id: true, nombre: true, precio: true },
  });
  if (producto) return producto;

  // 3. Buscar todos y hacer matching por palabras
  const todos = await prisma.producto.findMany({
    where: { sucursalId, activo: true },
    select: { id: true, nombre: true, precio: true },
  });

  // Partial match — alguna palabra del termino aparece en el nombre
  const palabras = term.split(/\s+/).filter((p) => p.length > 2);
  const match = todos.find((p) => {
    const nombreLower = p.nombre.toLowerCase();
    return palabras.some((palabra) => nombreLower.includes(palabra));
  });

  if (match) return match;

  // 4. Word-based — cada palabra del nombre del producto aparece en el termino
  const matchInverso = todos.find((p) => {
    const palabrasProducto = p.nombre.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    return palabrasProducto.length > 0 && palabrasProducto.some((w) => term.includes(w));
  });

  return matchInverso ?? null;
}

// ── 1. Crear pedido ────────────────────────────────────────

async function crearPedido(
  args: Record<string, unknown>,
  ctx: VoiceContext,
): Promise<VoiceResult> {
  const items = args.items as Array<{ nombre: string; cantidad?: number; observacion?: string }> | undefined;
  if (!items || items.length === 0) {
    return { ok: false, message: "Necesito al menos un producto para crear el pedido." };
  }

  let mesaId: number | null = null;
  const mesaNombre = args.mesa as string | undefined;

  if (mesaNombre && ctx.sucursalId) {
    const mesa = await findMesa(mesaNombre, ctx.sucursalId);
    if (!mesa) {
      return { ok: false, message: `No encontre la mesa "${mesaNombre}".` };
    }
    mesaId = mesa.id;
  }

  // Resolver cada item a un productoId
  const resolvedItems: Array<{ productoId: number; cantidad: number; observacion: string | null }> = [];
  const notFound: string[] = [];

  for (const item of items) {
    const producto = await findProducto(item.nombre, ctx.sucursalId!);
    if (!producto) {
      notFound.push(item.nombre);
      continue;
    }
    resolvedItems.push({
      productoId: producto.id,
      cantidad: item.cantidad ?? 1,
      observacion: item.observacion ?? null,
    });
  }

  if (notFound.length > 0 && resolvedItems.length === 0) {
    return { ok: false, message: `No encontre estos productos: ${notFound.join(", ")}.` };
  }

  // Obtener una caja abierta para la sucursal
  const caja = await prisma.caja.findFirst({
    where: { sucursalId: ctx.sucursalId!, estado: "ABIERTA" },
    select: { id: true },
  });

  const pedido = await PedidoService.create({
    mesaId,
    cajaId: caja?.id ?? null,
    usuarioId: ctx.userId,
    tipo: mesaId ? "COCINA" : "MOSTRADOR",
    items: resolvedItems,
    observacion: (args.observacion as string) ?? null,
  });

  // Emitir evento socket si hay IO global
  const io = (global as unknown as { io?: { to: (room: string) => { emit: (event: string, data: unknown) => void } } }).io;
  if (io && ctx.sucursalId) {
    io.to(`sucursal_${ctx.sucursalId}_kds`).emit("pedido:nuevo", pedido);
    io.to(`tenant_${ctx.sucursalId}_kds`).emit("order:created", pedido);
  }

  const mesaLabel = mesaId ? ` en mesa ${mesaNombre}` : " de mostrador";
  let msg = `Pedido #${pedido.numero} creado${mesaLabel} con ${resolvedItems.length} producto(s).`;
  if (notFound.length > 0) {
    msg += ` No encontre: ${notFound.join(", ")}.`;
  }

  return { ok: true, message: msg, data: { pedidoId: pedido.id, numero: pedido.numero } };
}

// ── 2. Leer comanda ────────────────────────────────────────

async function leerComanda(
  args: Record<string, unknown>,
  ctx: VoiceContext,
): Promise<VoiceResult> {
  const pedido = await findPedidoActivo(
    { numero: args.numero as number | undefined, mesa: args.mesa as string | undefined },
    ctx,
  );

  if (!pedido) {
    return { ok: false, message: "No encontre un pedido activo con esos datos." };
  }

  const detalles = pedido.detalles
    .filter((d) => !d.cancelado)
    .map((d) => `${d.cantidad}x ${d.nombre ?? "Producto"} ($${Number(d.precio ?? 0).toLocaleString("es-CL")})`)
    .join(", ");

  const total = pedido.detalles
    .filter((d) => !d.cancelado)
    .reduce((sum, d) => sum + Number(d.precio ?? 0) * d.cantidad, 0);

  const mesaLabel = pedido.mesa ? ` - Mesa ${pedido.mesa.nombre}` : "";

  return {
    ok: true,
    message: `Pedido #${pedido.numero}${mesaLabel} (${pedido.estado}): ${detalles}. Total: $${total.toLocaleString("es-CL")}.`,
    data: { pedidoId: pedido.id, estado: pedido.estado },
  };
}

// ── 3. Actualizar pedido ───────────────────────────────────

async function actualizarPedido(
  args: Record<string, unknown>,
  ctx: VoiceContext,
): Promise<VoiceResult> {
  const estado = args.estado as string | undefined;
  if (!estado) {
    return { ok: false, message: "Necesito saber a que estado cambiar el pedido." };
  }

  const pedido = await findPedidoActivo(
    { numero: args.numero as number | undefined, mesa: args.mesa as string | undefined },
    ctx,
  );

  if (!pedido) {
    return { ok: false, message: "No encontre un pedido activo con esos datos." };
  }

  const updated = await PedidoService.update(pedido.id, {
    estado,
    usuarioId: ctx.userId,
  });

  // Emitir evento socket
  const io = (global as unknown as { io?: { to: (room: string) => { emit: (event: string, data: unknown) => void } } }).io;
  if (io && ctx.sucursalId) {
    io.to(`sucursal_${ctx.sucursalId}_kds`).emit("pedido:actualizado", updated);
  }

  const etiquetas: Record<string, string> = {
    EN_PROCESO: "en preparacion",
    LISTO: "listo",
    ENTREGADO: "entregado",
    CANCELADO: "cancelado",
  };

  return {
    ok: true,
    message: `Pedido #${pedido.numero} marcado como ${etiquetas[estado] ?? estado}.`,
  };
}

// ── 4. Cancelar producto ───────────────────────────────────

async function cancelarProducto(
  args: Record<string, unknown>,
  ctx: VoiceContext,
): Promise<VoiceResult> {
  const productoNombre = args.producto as string | undefined;
  if (!productoNombre) {
    return { ok: false, message: "Necesito saber que producto cancelar." };
  }

  const pedido = await findPedidoActivo(
    { numero: args.numero as number | undefined, mesa: args.mesa as string | undefined },
    ctx,
  );

  if (!pedido) {
    return { ok: false, message: "No encontre un pedido activo con esos datos." };
  }

  // Buscar el detalle que coincida con el producto
  const term = productoNombre.toLowerCase();
  const detalle = pedido.detalles.find((d) => {
    if (d.cancelado) return false;
    const nombre = (d.nombre ?? "").toLowerCase();
    return nombre === term || nombre.includes(term) || term.includes(nombre);
  });

  if (!detalle) {
    return { ok: false, message: `No encontre "${productoNombre}" en el pedido #${pedido.numero}.` };
  }

  const cantidadACancelar = (args.cantidad as number) ?? detalle.cantidad;

  if (cantidadACancelar >= detalle.cantidad) {
    // Cancelar todo el detalle
    await prisma.detallePedido.update({
      where: { id: detalle.id },
      data: { cancelado: true },
    });
  } else {
    // Reducir cantidad
    await prisma.detallePedido.update({
      where: { id: detalle.id },
      data: { cantidad: detalle.cantidad - cantidadACancelar },
    });
  }

  // Evento de auditoria
  await prisma.eventoPedido.create({
    data: {
      pedidoId: pedido.id,
      usuarioId: ctx.userId,
      tipo: "CANCELACION_PRODUCTO",
      descripcion: `Cancelado ${cantidadACancelar}x ${detalle.nombre ?? "Producto"} (voz)`,
    },
  }).catch(() => { /* no bloquear */ });

  return {
    ok: true,
    message: `Cancelado ${cantidadACancelar}x ${detalle.nombre ?? "Producto"} del pedido #${pedido.numero}.`,
  };
}

// ── 5. Consultar stock ─────────────────────────────────────

async function consultarStock(
  args: Record<string, unknown>,
  ctx: VoiceContext,
): Promise<VoiceResult> {
  const busqueda = args.busqueda as string | undefined;
  const categoria = args.categoria as string | undefined;

  const where: Prisma.ProductoWhereInput = {
    sucursalId: ctx.sucursalId!,
    activo: true,
  };

  if (busqueda) {
    where.nombre = { contains: busqueda.trim() };
  }

  if (categoria) {
    where.categoria = { is: { nombre: { contains: categoria.trim() } } };
  }

  const productos = await prisma.producto.findMany({
    where,
    select: {
      nombre: true,
      precio: true,
      stock: true,
      inventariable: true,
      categoria: { select: { nombre: true } },
    },
    take: 15,
    orderBy: { nombre: "asc" },
  });

  if (productos.length === 0) {
    return { ok: true, message: "No encontre productos con esos filtros." };
  }

  const lista = productos
    .map((p) => {
      const stock = p.inventariable ? ` (stock: ${Number(p.stock)})` : "";
      return `${p.nombre} $${Number(p.precio).toLocaleString("es-CL")}${stock} [${p.categoria?.nombre ?? "Sin cat"}]`;
    })
    .join("; ");

  return {
    ok: true,
    message: `${productos.length} producto(s) encontrado(s): ${lista}.`,
  };
}

// ── 6. Consultar ventas ────────────────────────────────────

async function consultarVentas(
  args: Record<string, unknown>,
  ctx: VoiceContext,
): Promise<VoiceResult> {
  const periodo = (args.periodo as string) ?? "hoy";

  const now = new Date();
  let desde: Date;

  switch (periodo) {
    case "ayer": {
      const ayer = new Date(now);
      ayer.setDate(ayer.getDate() - 1);
      ayer.setHours(0, 0, 0, 0);
      desde = ayer;
      break;
    }
    case "semana": {
      const semana = new Date(now);
      semana.setDate(semana.getDate() - 7);
      semana.setHours(0, 0, 0, 0);
      desde = semana;
      break;
    }
    case "mes": {
      const mes = new Date(now.getFullYear(), now.getMonth(), 1);
      desde = mes;
      break;
    }
    default: {
      // hoy
      const hoy = new Date(now);
      hoy.setHours(0, 0, 0, 0);
      desde = hoy;
    }
  }

  const hasta =
    periodo === "ayer"
      ? (() => {
          const fin = new Date(desde);
          fin.setDate(fin.getDate() + 1);
          return fin;
        })()
      : now;

  const ventas = await prisma.venta.findMany({
    where: {
      creadoEn: { gte: desde, lte: hasta },
      estado: "PAGADA",
      caja: { sucursalId: ctx.sucursalId! },
    },
    select: { total: true, metodoPago: true },
  });

  if (ventas.length === 0) {
    return { ok: true, message: `No hay ventas registradas para ${periodo}.` };
  }

  const totalGeneral = ventas.reduce((sum, v) => sum + Number(v.total), 0);

  // Desglose por metodo de pago
  const porMetodo: Record<string, { count: number; total: number }> = {};
  for (const v of ventas) {
    const metodo = v.metodoPago ?? "OTRO";
    if (!porMetodo[metodo]) porMetodo[metodo] = { count: 0, total: 0 };
    porMetodo[metodo].count++;
    porMetodo[metodo].total += Number(v.total);
  }

  const desglose = Object.entries(porMetodo)
    .map(([metodo, data]) => `${metodo}: ${data.count} ventas, $${data.total.toLocaleString("es-CL")}`)
    .join("; ");

  return {
    ok: true,
    message: `Ventas ${periodo}: ${ventas.length} ventas, total $${totalGeneral.toLocaleString("es-CL")}. ${desglose}.`,
  };
}

// ── 7. Estado cocina / KDS ─────────────────────────────────

async function estadoCocina(
  args: Record<string, unknown>,
  ctx: VoiceContext,
): Promise<VoiceResult> {
  const estacion = args.estacion as string | undefined;

  const baseWhere = {
    estado: { in: ["PENDIENTE", "EN_PROCESO", "LISTO"] as const },
    OR: [
      { caja: { sucursalId: ctx.sucursalId } },
      { mesa: { sala: { sucursalId: ctx.sucursalId } } },
      { usuario: { sucursalId: ctx.sucursalId } },
    ],
  } satisfies Prisma.PedidoWhereInput;

  // Si hay filtro de estacion, agregar condicion en detalles
  const estacionWhere = estacion
    ? {
        ...baseWhere,
        detalles: {
          some: {
            cancelado: false,
            producto: { is: { categoria: { is: { estacion: estacion as Estacion } } } },
          },
        },
      } satisfies Prisma.PedidoWhereInput
    : baseWhere;

  const [pendientes, enProceso, listos] = await Promise.all([
    prisma.pedido.count({ where: { ...estacionWhere, estado: "PENDIENTE" } as Prisma.PedidoWhereInput }),
    prisma.pedido.count({ where: { ...estacionWhere, estado: "EN_PROCESO" } as Prisma.PedidoWhereInput }),
    prisma.pedido.count({ where: { ...estacionWhere, estado: "LISTO" } as Prisma.PedidoWhereInput }),
  ]);

  const label = estacion ? ` (${estacion})` : "";

  return {
    ok: true,
    message: `Cocina${label}: ${pendientes} pendiente(s), ${enProceso} en proceso, ${listos} listo(s).`,
    data: { pendientes, enProceso, listos },
  };
}

// ── 8. Estado mesas ────────────────────────────────────────

async function estadoMesas(
  args: Record<string, unknown>,
  ctx: VoiceContext,
): Promise<VoiceResult> {
  const salaNombre = args.sala as string | undefined;
  const estadoFilter = args.estado as string | undefined;

  const where: Prisma.MesaWhereInput = {
    sala: { sucursalId: ctx.sucursalId! },
  };

  if (salaNombre) {
    where.sala = { sucursalId: ctx.sucursalId!, nombre: { contains: salaNombre.trim() } };
  }

  if (estadoFilter) {
    where.estado = estadoFilter as EstadoMesa;
  }

  const mesas = await prisma.mesa.findMany({
    where,
    select: { nombre: true, estado: true, sala: { select: { nombre: true } } },
    orderBy: [{ salaId: "asc" }, { nombre: "asc" }],
  });

  if (mesas.length === 0) {
    return { ok: true, message: "No encontre mesas con esos filtros." };
  }

  // Conteo por estado
  const conteo: Record<string, number> = {};
  for (const m of mesas) {
    conteo[m.estado] = (conteo[m.estado] ?? 0) + 1;
  }

  const resumen = Object.entries(conteo)
    .map(([estado, count]) => `${count} ${estado.toLowerCase()}`)
    .join(", ");

  // Listar las mesas libres (util para el garzon)
  const libres = mesas
    .filter((m) => m.estado === "LIBRE")
    .map((m) => m.nombre)
    .slice(0, 10);

  let msg = `${mesas.length} mesa(s): ${resumen}.`;
  if (libres.length > 0 && !estadoFilter) {
    msg += ` Libres: ${libres.join(", ")}${libres.length < mesas.filter((m) => m.estado === "LIBRE").length ? "..." : ""}.`;
  }

  return { ok: true, message: msg };
}
