import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";
import { AnalisisClient } from "./AnalisisClient";

// ─── Types ────────────────────────────────────────────────────────────────────

type FechaPreset = "hoy" | "ayer" | "7d" | "30d" | "mes" | "personalizado";
type TurnoKey   = "manana" | "tarde" | "noche";

export interface VentaTurno   { turno: string; label: string; total: number; pedidos: number }
export interface TopProducto  { nombre: string; categoria: string; cantidad: number; total: number }
export interface BajaRotacion { nombre: string; categoria: string; cantidad: number; ultimaVenta: string | null }
export interface VentaHora    { hora: string; total: number; pedidos: number }
export interface VentaCategoria { categoria: string; total: number; pedidos: number }
export interface AlertaSinVenta { nombre: string; diasSinVenta: number; ultimaVenta: string | null }
export interface UsuarioOption  { id: number; nombre: string }
export interface CategoriaOption { id: number; nombre: string }

export interface AnalisisData {
  // KPIs
  totalVentas: number;
  totalPedidos: number;
  ticketPromedio: number;
  // Breakdowns
  ventasPorTurno:    VentaTurno[];
  topProductos:      TopProducto[];
  bajaRotacion:      BajaRotacion[];
  ventasPorHora:     VentaHora[];
  ventasPorCategoria: VentaCategoria[];
  // Alertas
  alertasSinVenta:   AlertaSinVenta[];
  // Filter options
  usuarios:   UsuarioOption[];
  categorias: CategoriaOption[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDateRange(preset: FechaPreset, desde?: string, hasta?: string) {
  const now   = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);

  switch (preset) {
    case "hoy":  return { from: today, to: now };
    case "ayer": {
      const ayer    = new Date(today); ayer.setDate(ayer.getDate() - 1);
      const finAyer = new Date(today); finAyer.setMilliseconds(-1);
      return { from: ayer, to: finAyer };
    }
    case "7d":  return { from: new Date(now.getTime() - 7  * 86_400_000), to: now };
    case "30d": return { from: new Date(now.getTime() - 30 * 86_400_000), to: now };
    case "mes": return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
    case "personalizado": {
      const from = desde ? new Date(desde + "T00:00:00") : today;
      const to   = hasta ? new Date(hasta + "T23:59:59") : now;
      return { from, to };
    }
    default: return { from: today, to: now };
  }
}

function shiftOf(d: Date): TurnoKey {
  const h = d.getHours();
  if (h >= 6 && h < 14) return "manana";
  if (h >= 14 && h < 20) return "tarde";
  return "noche";
}

const SHIFT_LABEL: Record<TurnoKey, string> = {
  manana: "Mañana",
  tarde:  "Tarde",
  noche:  "Noche",
};

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getAnalytics(
  rol: Rol,
  sucursalId: number | null,
  fechaPreset: FechaPreset,
  desde: string | undefined,
  hasta: string | undefined,
  turnoFiltro: TurnoKey | null,
  usuarioFiltro: number | null,
  categoriaFiltro: number | null,
): Promise<AnalisisData> {
  const sucFilter =
    rol !== "ADMIN_GENERAL" && sucursalId ? { caja: { sucursalId } } : {};

  const { from, to } = getDateRange(fechaPreset, desde, hasta);

  // ── Filter options ──
  const [usuariosRaw, categoriasRaw] = await Promise.all([
    prisma.usuario.findMany({
      where: sucursalId && rol !== "ADMIN_GENERAL"
        ? { sucursalId, status: "ACTIVO" }
        : { status: "ACTIVO" },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.categoria.findMany({
      where: { activa: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  // ── Ventas in range (all, before turno filter) ──
  const ventasRaw = await prisma.venta.findMany({
    where: {
      ...sucFilter,
      estado: "PAGADA",
      creadoEn: { gte: from, lte: to },
      ...(usuarioFiltro ? { usuarioId: usuarioFiltro } : {}),
    },
    select: { id: true, total: true, creadoEn: true },
  });

  // ── Ventas por turno (all, no turno filter) ──
  const turnoMap: Record<TurnoKey, { total: number; pedidos: number }> = {
    manana: { total: 0, pedidos: 0 },
    tarde:  { total: 0, pedidos: 0 },
    noche:  { total: 0, pedidos: 0 },
  };
  for (const v of ventasRaw) {
    const t = shiftOf(v.creadoEn);
    turnoMap[t].total   += Number(v.total);
    turnoMap[t].pedidos += 1;
  }
  const ventasPorTurno: VentaTurno[] = (["manana", "tarde", "noche"] as TurnoKey[]).map((k) => ({
    turno:   k,
    label:   SHIFT_LABEL[k],
    total:   turnoMap[k].total,
    pedidos: turnoMap[k].pedidos,
  }));

  // ── Apply turno filter for downstream KPIs ──
  const ventasFiltradas = turnoFiltro
    ? ventasRaw.filter((v) => shiftOf(v.creadoEn) === turnoFiltro)
    : ventasRaw;

  const ventaIds = ventasFiltradas.map((v) => v.id);

  // ── KPIs ──
  let totalVentas  = 0;
  let totalPedidos = ventasFiltradas.length;
  for (const v of ventasFiltradas) totalVentas += Number(v.total);

  // ── Detalles for filtered ventas ──
  const detallesRaw = ventaIds.length > 0
    ? await prisma.detalleVenta.findMany({
        where: {
          ventaId:    { in: ventaIds },
          productoId: { not: null },
          ...(categoriaFiltro
            ? { producto: { categoriaId: categoriaFiltro } }
            : {}),
        },
        select: {
          ventaId:    true,
          productoId: true,
          cantidad:   true,
          subtotal:   true,
          venta: { select: { creadoEn: true } },
          producto: {
            select: {
              nombre:      true,
              categoriaId: true,
              categoria: { select: { nombre: true } },
            },
          },
        },
      })
    : [];

  // If category filter is active, override KPI totals with detalle subtotals
  if (categoriaFiltro && detallesRaw.length > 0) {
    totalVentas  = detallesRaw.reduce((s, d) => s + Number(d.subtotal), 0);
    totalPedidos = new Set(detallesRaw.map((d) => d.ventaId)).size;
  }
  const ticketPromedio = totalPedidos > 0 ? totalVentas / totalPedidos : 0;

  // ── Top 10 productos ──
  const prodMap = new Map<number, TopProducto>();
  for (const d of detallesRaw) {
    if (!d.productoId || !d.producto) continue;
    const prev = prodMap.get(d.productoId);
    if (prev) {
      prev.cantidad += d.cantidad;
      prev.total    += Number(d.subtotal);
    } else {
      prodMap.set(d.productoId, {
        nombre:    d.producto.nombre,
        categoria: d.producto.categoria?.nombre ?? "Sin categoría",
        cantidad:  d.cantidad,
        total:     Number(d.subtotal),
      });
    }
  }
  const topProductos = Array.from(prodMap.values())
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 10);

  // ── Baja rotación (bottom 5 + 0 sales) ──
  const bottom5 = Array.from(prodMap.values())
    .sort((a, b) => a.cantidad - b.cantidad)
    .slice(0, 5)
    .map((p) => ({
      nombre:      p.nombre,
      categoria:   p.categoria,
      cantidad:    p.cantidad,
      ultimaVenta: null as string | null,
    }));

  // Find last sale date for baja rotación products
  if (bottom5.length > 0) {
    const nombresBaja = bottom5.map((p) => p.nombre);
    const lastSales = await prisma.detalleVenta.findMany({
      where: {
        productoId: { not: null },
        producto: { nombre: { in: nombresBaja } },
        venta: { ...sucFilter, estado: "PAGADA" },
      },
      select: {
        producto: { select: { nombre: true } },
        venta:    { select: { creadoEn: true } },
      },
      orderBy: { venta: { creadoEn: "desc" } },
      distinct: ["productoId"],
    });
    const lastSaleMap = new Map(
      lastSales.map((s) => [s.producto!.nombre, s.venta.creadoEn.toISOString()])
    );
    for (const p of bottom5) {
      p.ultimaVenta = lastSaleMap.get(p.nombre) ?? null;
    }
  }

  // Active products with 0 sales in period
  const sinVentaEnPeriodo: BajaRotacion[] = [];
  if (ventaIds.length > 0) {
    const vendidosIds = new Set(detallesRaw.map((d) => d.productoId).filter(Boolean));
    const productosActivos = await prisma.producto.findMany({
      where: {
        activo:    true,
        enMenu:    true,
        ...(sucursalId && rol !== "ADMIN_GENERAL" ? { sucursalId } : {}),
        ...(categoriaFiltro ? { categoriaId: categoriaFiltro } : {}),
        id: { notIn: vendidosIds.size > 0 ? [...vendidosIds].filter(Boolean) as number[] : [-1] },
      },
      select: {
        id:        true,
        nombre:    true,
        categoria: { select: { nombre: true } },
      },
      take: 10,
    });
    for (const p of productosActivos) {
      sinVentaEnPeriodo.push({
        nombre:      p.nombre,
        categoria:   p.categoria?.nombre ?? "Sin categoría",
        cantidad:    0,
        ultimaVenta: null,
      });
    }
  }

  const bajaRotacion = [...bottom5, ...sinVentaEnPeriodo].slice(0, 10);

  // ── Ventas por hora ──
  const horaMap = new Map<number, { total: number; pedidos: number }>();
  for (const v of ventasFiltradas) {
    const h = v.creadoEn.getHours();
    const prev = horaMap.get(h);
    if (prev) { prev.total += Number(v.total); prev.pedidos += 1; }
    else horaMap.set(h, { total: Number(v.total), pedidos: 1 });
  }
  const ventasPorHora: VentaHora[] = Array.from(horaMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([h, d]) => ({
      hora:    `${String(h).padStart(2, "0")}:00`,
      total:   d.total,
      pedidos: d.pedidos,
    }));

  // ── Ventas por categoría ──
  const catMap = new Map<string, { total: number; pedidos: Set<number> }>();
  for (const d of detallesRaw) {
    if (!d.producto) continue;
    const cat = d.producto.categoria?.nombre ?? "Sin categoría";
    const prev = catMap.get(cat);
    if (prev) { prev.total += Number(d.subtotal); prev.pedidos.add(d.ventaId); }
    else catMap.set(cat, { total: Number(d.subtotal), pedidos: new Set([d.ventaId]) });
  }
  const ventasPorCategoria: VentaCategoria[] = Array.from(catMap.entries())
    .map(([cat, d]) => ({ categoria: cat, total: d.total, pedidos: d.pedidos.size }))
    .sort((a, b) => b.total - a.total);

  // ── Alertas: productos sin venta en 7 días ──
  const hace7 = new Date(Date.now() - 7 * 86_400_000);
  const vendidosUlt7Ids = await prisma.detalleVenta.findMany({
    where: {
      productoId: { not: null },
      venta: { ...sucFilter, estado: "PAGADA", creadoEn: { gte: hace7 } },
    },
    select: { productoId: true },
    distinct: ["productoId"],
  });
  const vendidos7Set = new Set(vendidosUlt7Ids.map((d) => d.productoId));

  const productosParaAlerta = await prisma.producto.findMany({
    where: {
      activo: true,
      enMenu: true,
      ...(sucursalId && rol !== "ADMIN_GENERAL" ? { sucursalId } : {}),
      id: { notIn: vendidos7Set.size > 0 ? [...vendidos7Set].filter(Boolean) as number[] : [-1] },
    },
    select: {
      id:        true,
      nombre:    true,
    },
    take: 20,
  });

  // Get last sale date for alert products
  const alertasSinVenta: AlertaSinVenta[] = [];
  if (productosParaAlerta.length > 0) {
    const alertaIds = productosParaAlerta.map((p) => p.id);
    const lastSalesAlerta = await prisma.detalleVenta.findMany({
      where: {
        productoId: { in: alertaIds },
        venta: { ...sucFilter, estado: "PAGADA" },
      },
      select: {
        productoId: true,
        venta: { select: { creadoEn: true } },
      },
      orderBy: { venta: { creadoEn: "desc" } },
      distinct: ["productoId"],
    });
    const lastAlertaMap = new Map(
      lastSalesAlerta.map((s) => [s.productoId!, s.venta.creadoEn])
    );

    for (const p of productosParaAlerta) {
      const last = lastAlertaMap.get(p.id);
      const dias = last
        ? Math.floor((Date.now() - last.getTime()) / 86_400_000)
        : 999;
      alertasSinVenta.push({
        nombre:      p.nombre,
        diasSinVenta: dias,
        ultimaVenta: last ? last.toISOString() : null,
      });
    }
    alertasSinVenta.sort((a, b) => b.diasSinVenta - a.diasSinVenta);
  }

  return {
    totalVentas,
    totalPedidos,
    ticketPromedio,
    ventasPorTurno,
    topProductos,
    bajaRotacion,
    ventasPorHora,
    ventasPorCategoria,
    alertasSinVenta,
    usuarios:   usuariosRaw,
    categorias: categoriasRaw,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Props = { searchParams: Promise<{ [k: string]: string | undefined }> };

export default async function AnalisisPage({ searchParams }: Props) {
  const params = await searchParams;

  const session    = await getServerSession(authOptions);
  const simbolo    = (session?.user as { simbolo?: string })?.simbolo ?? "$";
  const rol        = (session?.user as { rol?: Rol })?.rol ?? "CASHIER";
  const sucursalId = (session?.user as { sucursalId?: number | null })?.sucursalId ?? null;

  const fechaPreset   = (params.fecha as FechaPreset) || "hoy";
  const desde         = params.desde;
  const hasta         = params.hasta;
  const turnoFiltro   = (params.turno as TurnoKey) || null;
  const usuarioFiltro = params.usuarioId ? parseInt(params.usuarioId) : null;
  const catFiltro     = params.categoriaId ? parseInt(params.categoriaId) : null;

  const data = await getAnalytics(
    rol, sucursalId,
    fechaPreset, desde, hasta,
    turnoFiltro, usuarioFiltro, catFiltro,
  );

  return (
    <AnalisisClient
      data={data}
      simbolo={simbolo}
      filters={{ fecha: fechaPreset, desde, hasta, turno: turnoFiltro ?? "", usuarioId: params.usuarioId ?? "", categoriaId: params.categoriaId ?? "" }}
    />
  );
}
