import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendToThermal } from "@/server/services/print.service";

// ── ESC/POS helpers ────────────────────────────────────────────────────────
const ESC = 0x1b;
const GS  = 0x1d;
const INIT    = Buffer.from([ESC, 0x40]);
const AL      = Buffer.from([ESC, 0x61, 0x00]); // align left
const AC      = Buffer.from([ESC, 0x61, 0x01]); // align center
const BOLD_ON = Buffer.from([ESC, 0x45, 0x01]);
const BOLD_OFF= Buffer.from([ESC, 0x45, 0x00]);
const DBL_ON  = Buffer.from([ESC, 0x21, 0x30]); // double height+width
const DBL_OFF = Buffer.from([ESC, 0x21, 0x00]);
const LF      = Buffer.from([0x0a]);
const CUT     = Buffer.from([GS, 0x56, 0x42, 0x05]);

const W = 32;
const LINE  = "─".repeat(W);
const DLINE = "═".repeat(W);

const center = (s: string) =>
  s.length >= W ? s.slice(0, W) : " ".repeat(Math.floor((W - s.length) / 2)) + s;

const row = (l: string, r: string) => {
  const space = Math.max(1, W - l.length - r.length);
  return (l + " ".repeat(space) + r).slice(0, W);
};

// ── Precuenta builder ──────────────────────────────────────────────────────
interface PrecuentaData {
  simbolo?: string;
  mesaNombre?: string;
  meseroNombre?: string;
  sucursalNombre?: string;
  sucursalRut?: string;
  sucursalTelefono?: string;
  sucursalDireccion?: string;
  sucursalGiroComercial?: string;
  items: { nombre: string; cantidad: number; precio: number }[];
  subtotal: number;
  descuento: number;
  descuentoMonto: number;
  ivaPorc: number;
  ivaMonto: number;
  total: number;
  fecha: string;
  hora: string;
}

function buildPrecuenta(d: PrecuentaData): Buffer {
  const sim = d.simbolo ?? "$";
  const fmt = (n: number) => `${sim}${Math.round(n).toLocaleString("es-CL")}`;

  const lines: string[] = [];

  // Header sucursal
  if (d.sucursalNombre) lines.push(center(d.sucursalNombre.toUpperCase()));
  if (d.sucursalGiroComercial) lines.push(center(d.sucursalGiroComercial));
  if (d.sucursalRut) lines.push(center(`RUT: ${d.sucursalRut}`));
  if (d.sucursalDireccion) lines.push(center(d.sucursalDireccion));
  if (d.sucursalTelefono) lines.push(center(`Tel: ${d.sucursalTelefono}`));
  lines.push(LINE);

  lines.push(center("*** PRECUENTA ***"));
  lines.push(center("NO ES BOLETA NI FACTURA"));
  lines.push(LINE);

  // Mesa y fecha
  if (d.mesaNombre)   lines.push(row("Mesa:", d.mesaNombre));
  if (d.meseroNombre) lines.push(row("Atendido por:", d.meseroNombre));
  lines.push(row("Fecha:", `${d.fecha} ${d.hora}`));
  lines.push(LINE);

  // Ítems
  for (const item of d.items) {
    const total = fmt(item.precio * item.cantidad);
    const nombre = item.nombre.slice(0, W - 6 - total.length);
    lines.push(row(`${item.cantidad}x ${nombre}`, total));
  }
  lines.push(LINE);

  // Totales
  if (d.descuento > 0) {
    lines.push(row("Subtotal", fmt(d.subtotal)));
    lines.push(row(`Descuento (${d.descuento}%)`, `-${fmt(d.descuentoMonto)}`));
  }
  if (d.ivaPorc > 0) {
    lines.push(row(`IVA (${d.ivaPorc}%)`, fmt(d.ivaMonto)));
  }
  lines.push(DLINE);
  lines.push(row("TOTAL", fmt(d.total)));
  lines.push(LINE);

  // Propinas sugeridas
  lines.push(center("-- Propinas sugeridas --"));
  lines.push(row("10% Maravilloso", fmt(d.total * 1.1)));
  lines.push(row("15% Excelente",   fmt(d.total * 1.15)));
  lines.push(row("20% Extraordinario", fmt(d.total * 1.2)));
  lines.push(LINE);
  lines.push(center("-- PandaPoss --"));
  lines.push("");
  lines.push("");

  const text = lines.join("\n");

  const topTitle = d.sucursalNombre ? d.sucursalNombre.toUpperCase() + "\n" : "";

  return Buffer.concat([
    INIT,
    AC, BOLD_ON, DBL_ON,
    Buffer.from(topTitle, "utf8"),
    DBL_OFF, BOLD_OFF, AL,
    Buffer.from(text, "utf8"),
    LF, CUT,
  ]);
}

// ── Boleta builder ─────────────────────────────────────────────────────────
interface BoletaData {
  simbolo?: string;
  ventaId: number;
  mesaLabel?: string;
  grupoNombre?: string;
  meseroNombre?: string;
  sucursalNombre?: string;
  sucursalRut?: string;
  sucursalTelefono?: string;
  sucursalDireccion?: string;
  sucursalGiroComercial?: string;
  items: { nombre: string; cantidad: number; precio: number }[];
  subtotal: number;
  descuentoMonto: number;
  descuentoPorcentaje: number;
  impuestoMonto: number;
  impuestoPorcentaje: number;
  total: number;
  pagos: { metodoPago: string; monto: number }[];
  vuelto: number;
  fecha: string;
  hora: string;
}

const METODO_LABEL: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
  MIXTO: "Mixto",
};

function buildBoleta(d: BoletaData): Buffer {
  const sim = d.simbolo ?? "$";
  const fmt = (n: number) => `${sim}${Math.round(n).toLocaleString("es-CL")}`;

  const lines: string[] = [];

  if (d.sucursalNombre) lines.push(center(d.sucursalNombre.toUpperCase()));
  if (d.sucursalGiroComercial) lines.push(center(d.sucursalGiroComercial));
  if (d.sucursalRut) lines.push(center(`RUT: ${d.sucursalRut}`));
  if (d.sucursalDireccion) lines.push(center(d.sucursalDireccion));
  if (d.sucursalTelefono) lines.push(center(`Tel: ${d.sucursalTelefono}`));
  lines.push(LINE);

  lines.push(center(`BOLETA #${d.ventaId}`));
  lines.push(center("Comprobante de pago"));
  lines.push(LINE);

  if (d.mesaLabel)    lines.push(row("Mesa:", d.mesaLabel));
  if (d.grupoNombre)  lines.push(row("Grupo:", d.grupoNombre));
  if (d.meseroNombre) lines.push(row("Mesero:", d.meseroNombre));
  lines.push(row("Fecha:", `${d.fecha} ${d.hora}`));
  lines.push(LINE);

  for (const item of d.items) {
    const total = fmt(item.precio * item.cantidad);
    const nombre = item.nombre.slice(0, W - 6 - total.length);
    lines.push(row(`${item.cantidad}x ${nombre}`, total));
  }
  lines.push(LINE);

  lines.push(row("Subtotal", fmt(d.subtotal)));
  if (d.descuentoMonto > 0) {
    lines.push(row(`Descuento (${d.descuentoPorcentaje}%)`, `-${fmt(d.descuentoMonto)}`));
  }
  if (d.impuestoMonto > 0) {
    lines.push(row(`IVA (${d.impuestoPorcentaje}%)`, fmt(d.impuestoMonto)));
  }
  lines.push(DLINE);
  lines.push(row("TOTAL PAGADO", fmt(d.total)));
  lines.push(LINE);

  // Detalle pagos
  for (const p of d.pagos) {
    const label = METODO_LABEL[p.metodoPago] ?? p.metodoPago;
    lines.push(row(label, fmt(p.monto)));
  }
  if (d.vuelto > 0) lines.push(row("Vuelto", fmt(d.vuelto)));
  lines.push(LINE);

  // Propinas
  lines.push(center("-- Propinas sugeridas --"));
  lines.push(row("10%", fmt(d.total * 1.1)));
  lines.push(row("15%", fmt(d.total * 1.15)));
  lines.push(row("20%", fmt(d.total * 1.2)));
  lines.push(LINE);
  lines.push(center("Gracias por tu visita"));
  lines.push(center("-- PandaPoss --"));
  lines.push("");
  lines.push("");

  const text = lines.join("\n");
  const topTitle = d.sucursalNombre ? d.sucursalNombre.toUpperCase() + "\n" : "";

  return Buffer.concat([
    INIT,
    AC, BOLD_ON, DBL_ON,
    Buffer.from(topTitle, "utf8"),
    DBL_OFF, BOLD_OFF, AL,
    Buffer.from(text, "utf8"),
    LF, CUT,
  ]);
}

// ── Route Handler ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { sucursalId, type, data } = body as {
    sucursalId: number;
    type: "precuenta" | "boleta";
    data: PrecuentaData | BoletaData;
  };

  if (!sucursalId || !type || !data) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  const sucursal = await prisma.sucursal.findUnique({
    where: { id: Number(sucursalId) },
    select: { printerIp: true },
  });

  if (!sucursal?.printerIp) {
    return NextResponse.json({ error: "Sin impresora configurada" }, { status: 422 });
  }

  try {
    const buffer = type === "precuenta"
      ? buildPrecuenta(data as PrecuentaData)
      : buildBoleta(data as BoletaData);

    await sendToThermal(sucursal.printerIp, buffer);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error de impresión";
    console.error("[print-receipt]", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
