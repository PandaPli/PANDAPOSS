import * as net from "net";

// ── ESC/POS Constants ──────────────────────────────────────────────────────
const ESC = 0x1b;
const GS  = 0x1d;

const CMD_INIT          = Buffer.from([ESC, 0x40]);
const CMD_ALIGN_LEFT    = Buffer.from([ESC, 0x61, 0x00]);
const CMD_ALIGN_CENTER  = Buffer.from([ESC, 0x61, 0x01]);
const CMD_BOLD_ON       = Buffer.from([ESC, 0x45, 0x01]);
const CMD_BOLD_OFF      = Buffer.from([ESC, 0x45, 0x00]);
const CMD_DOUBLE_ON     = Buffer.from([ESC, 0x21, 0x30]);
const CMD_DOUBLE_OFF    = Buffer.from([ESC, 0x21, 0x00]);
const CMD_FEED_CUT      = Buffer.from([GS,  0x56, 0x42, 0x05]);
const CMD_LF            = Buffer.from([0x0a]);

// ── Shared layout helpers ───────────────────────────────────────────────────
const W     = 32;
const LINE  = "─".repeat(W);
const DLINE = "═".repeat(W);

const centerText = (s: string) =>
  s.length >= W ? s.slice(0, W) : " ".repeat(Math.floor((W - s.length) / 2)) + s;

const rowText = (l: string, r: string) => {
  const space = Math.max(1, W - l.length - r.length);
  return (l + " ".repeat(space) + r).slice(0, W);
};

// ── Precuenta builder ──────────────────────────────────────────────────────
export interface PrecuentaData {
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

export function buildPrecuentaBuffer(d: PrecuentaData): Buffer {
  const sim = d.simbolo ?? "$";
  const fmt = (n: number) => `${sim}${Math.round(n).toLocaleString("es-CL")}`;
  const lines: string[] = [];

  if (d.sucursalNombre)        lines.push(centerText(d.sucursalNombre.toUpperCase()));
  if (d.sucursalGiroComercial) lines.push(centerText(d.sucursalGiroComercial));
  if (d.sucursalRut)           lines.push(centerText(`RUT: ${d.sucursalRut}`));
  if (d.sucursalDireccion)     lines.push(centerText(d.sucursalDireccion));
  if (d.sucursalTelefono)      lines.push(centerText(`Tel: ${d.sucursalTelefono}`));
  lines.push(LINE);
  lines.push(centerText("*** PRECUENTA ***"));
  lines.push(centerText("NO ES BOLETA NI FACTURA"));
  lines.push(LINE);
  if (d.mesaNombre)   lines.push(rowText("Mesa:", d.mesaNombre));
  if (d.meseroNombre) lines.push(rowText("Atendido por:", d.meseroNombre));
  lines.push(rowText("Fecha:", `${d.fecha} ${d.hora}`));
  lines.push(LINE);
  for (const item of d.items) {
    const total  = fmt(item.precio * item.cantidad);
    const nombre = item.nombre.slice(0, W - 6 - total.length);
    lines.push(rowText(`${item.cantidad}x ${nombre}`, total));
  }
  lines.push(LINE);
  if (d.descuento > 0) {
    lines.push(rowText("Subtotal", fmt(d.subtotal)));
    lines.push(rowText(`Descuento (${d.descuento}%)`, `-${fmt(d.descuentoMonto)}`));
  }
  if (d.ivaPorc > 0) lines.push(rowText(`IVA (${d.ivaPorc}%)`, fmt(d.ivaMonto)));
  lines.push(DLINE);
  lines.push(rowText("TOTAL", fmt(d.total)));
  lines.push(LINE);
  lines.push(centerText("-- Propinas sugeridas --"));
  lines.push(rowText("10% Maravilloso",       fmt(d.total * 1.1)));
  lines.push(rowText("15% Excelente",         fmt(d.total * 1.15)));
  lines.push(rowText("20% Extraordinario",    fmt(d.total * 1.2)));
  lines.push(LINE);
  lines.push(centerText("-- PandaPoss --"));
  lines.push("");
  lines.push("");

  const topTitle = d.sucursalNombre ? d.sucursalNombre.toUpperCase() + "\n" : "";
  return Buffer.concat([
    CMD_INIT,
    CMD_ALIGN_CENTER, CMD_BOLD_ON, CMD_DOUBLE_ON,
    Buffer.from(topTitle, "utf8"),
    CMD_DOUBLE_OFF, CMD_BOLD_OFF, CMD_ALIGN_LEFT,
    Buffer.from(lines.join("\n"), "utf8"),
    CMD_LF, CMD_FEED_CUT,
  ]);
}

// ── Boleta builder ─────────────────────────────────────────────────────────
const METODO_LABEL: Record<string, string> = {
  EFECTIVO: "Efectivo", TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia", MIXTO: "Mixto",
};

export interface BoletaData {
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

export function buildBoletaBuffer(d: BoletaData): Buffer {
  const sim = d.simbolo ?? "$";
  const fmt = (n: number) => `${sim}${Math.round(n).toLocaleString("es-CL")}`;
  const lines: string[] = [];

  if (d.sucursalNombre)        lines.push(centerText(d.sucursalNombre.toUpperCase()));
  if (d.sucursalGiroComercial) lines.push(centerText(d.sucursalGiroComercial));
  if (d.sucursalRut)           lines.push(centerText(`RUT: ${d.sucursalRut}`));
  if (d.sucursalDireccion)     lines.push(centerText(d.sucursalDireccion));
  if (d.sucursalTelefono)      lines.push(centerText(`Tel: ${d.sucursalTelefono}`));
  lines.push(LINE);
  lines.push(centerText(`BOLETA #${d.ventaId}`));
  lines.push(centerText("Comprobante de pago"));
  lines.push(LINE);
  if (d.mesaLabel)    lines.push(rowText("Mesa:", d.mesaLabel));
  if (d.grupoNombre)  lines.push(rowText("Grupo:", d.grupoNombre));
  if (d.meseroNombre) lines.push(rowText("Mesero:", d.meseroNombre));
  lines.push(rowText("Fecha:", `${d.fecha} ${d.hora}`));
  lines.push(LINE);
  for (const item of d.items) {
    const total  = fmt(item.precio * item.cantidad);
    const nombre = item.nombre.slice(0, W - 6 - total.length);
    lines.push(rowText(`${item.cantidad}x ${nombre}`, total));
  }
  lines.push(LINE);
  lines.push(rowText("Subtotal", fmt(d.subtotal)));
  if (d.descuentoMonto > 0)
    lines.push(rowText(`Descuento (${d.descuentoPorcentaje}%)`, `-${fmt(d.descuentoMonto)}`));
  if (d.impuestoMonto > 0)
    lines.push(rowText(`IVA (${d.impuestoPorcentaje}%)`, fmt(d.impuestoMonto)));
  lines.push(DLINE);
  lines.push(rowText("TOTAL PAGADO", fmt(d.total)));
  lines.push(LINE);
  for (const p of d.pagos)
    lines.push(rowText(METODO_LABEL[p.metodoPago] ?? p.metodoPago, fmt(p.monto)));
  if (d.vuelto > 0) lines.push(rowText("Vuelto", fmt(d.vuelto)));
  lines.push(LINE);
  lines.push(centerText("-- Propinas sugeridas --"));
  lines.push(rowText("10%", fmt(d.total * 1.1)));
  lines.push(rowText("15%", fmt(d.total * 1.15)));
  lines.push(rowText("20%", fmt(d.total * 1.2)));
  lines.push(LINE);
  lines.push(centerText("Gracias por tu visita"));
  lines.push(centerText("-- PandaPoss --"));
  lines.push("");
  lines.push("");

  const topTitle = d.sucursalNombre ? d.sucursalNombre.toUpperCase() + "\n" : "";
  return Buffer.concat([
    CMD_INIT,
    CMD_ALIGN_CENTER, CMD_BOLD_ON, CMD_DOUBLE_ON,
    Buffer.from(topTitle, "utf8"),
    CMD_DOUBLE_OFF, CMD_BOLD_OFF, CMD_ALIGN_LEFT,
    Buffer.from(lines.join("\n"), "utf8"),
    CMD_LF, CMD_FEED_CUT,
  ]);
}

// ── TCP Send ───────────────────────────────────────────────────────────────
export function sendToThermal(ipPort: string, data: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const [host, portStr] = ipPort.includes(":") ? ipPort.split(":") : [ipPort, "9100"];
    const port = parseInt(portStr, 10) || 9100;

    const socket = new net.Socket();
    const TIMEOUT_MS = 5000;

    socket.setTimeout(TIMEOUT_MS);

    socket.connect(port, host, () => {
      socket.write(data, (err) => {
        if (err) {
          socket.destroy();
          return reject(err);
        }
        socket.end(() => {
          socket.destroy();
          resolve();
        });
      });
    });

    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error(`Timeout conectando a impresora ${host}:${port}`));
    });

    socket.on("error", (err) => {
      socket.destroy();
      reject(err);
    });
  });
}

// ── Ticket Builder ─────────────────────────────────────────────────────────
/**
 * Convierte texto plano (32 cols) a buffer ESC/POS listo para imprimir.
 * El contenido ya viene formateado desde el cliente (NuevaVentaClient, etc.)
 */
export function buildTicketBuffer(content: string): Buffer {
  const parts: Buffer[] = [
    CMD_INIT,
    CMD_ALIGN_LEFT,
    Buffer.from(content, "utf8"),
    CMD_LF,
    CMD_FEED_CUT,
  ];
  return Buffer.concat(parts);
}

// ── Ticket de Venta (formato enriquecido) ──────────────────────────────────
export interface TicketVentaData {
  nombreSucursal: string;
  rut?: string | null;
  giroComercial?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  simbolo?: string;
  folio: number;
  fecha: string;
  hora: string;
  cajero?: string | null;
  mesa?: string | null;
  items: { nombre: string; cantidad: number; precio: number; observacion?: string | null }[];
  subtotal: number;
  descuento?: number;
  total: number;
  metodoPago?: string | null;
  cuponCodigo?: string | null;
}

export function buildTicketVenta(data: TicketVentaData): Buffer {
  const W    = 32;
  const LINE = "=".repeat(W);
  const sim  = data.simbolo ?? "$";

  const center = (s: string) =>
    s.length >= W ? s : " ".repeat(Math.floor((W - s.length) / 2)) + s;
  const row = (l: string, r: string) =>
    (l + " ".repeat(Math.max(1, W - l.length - r.length)) + r).slice(0, W);

  const lines: string[] = [];

  // Header
  if (data.nombreSucursal) lines.push(center(data.nombreSucursal));
  if (data.giroComercial)  lines.push(center(data.giroComercial));
  if (data.rut)            lines.push(center(`RUT: ${data.rut}`));
  if (data.direccion)      lines.push(center(data.direccion));
  if (data.telefono)       lines.push(center(`Tel: ${data.telefono}`));
  lines.push(LINE);

  // Folio y fecha
  lines.push(center(`BOLETA #${data.folio}`));
  lines.push(row(data.fecha, data.hora));
  if (data.cajero) lines.push(`Cajero: ${data.cajero}`);
  if (data.mesa)   lines.push(`Mesa: ${data.mesa}`);
  lines.push(LINE);

  // Ítems
  for (const item of data.items) {
    const precio = `${sim}${item.precio.toFixed(0)}`;
    const nombre = item.nombre.toUpperCase().slice(0, W - 6 - precio.length);
    lines.push(row(`${item.cantidad}x ${nombre}`, precio));
    if (item.observacion) lines.push(`    * ${item.observacion}`);
  }
  lines.push(LINE);

  // Totales
  if (data.descuento && data.descuento > 0) {
    lines.push(row("Subtotal", `${sim}${data.subtotal.toFixed(0)}`));
    if (data.cuponCodigo) {
      lines.push(row(`Cupón ${data.cuponCodigo}`, `-${sim}${data.descuento.toFixed(0)}`));
    } else {
      lines.push(row("Descuento", `-${sim}${data.descuento.toFixed(0)}`));
    }
  }
  lines.push(row("TOTAL", `${sim}${data.total.toFixed(0)}`));
  if (data.metodoPago) lines.push(row("Pago", data.metodoPago));
  lines.push(LINE);
  lines.push(center("-- PandaPoss --"));
  lines.push("");
  lines.push("");

  const text = lines.join("\n");

  const parts: Buffer[] = [
    CMD_INIT,
    CMD_ALIGN_CENTER,
    CMD_BOLD_ON,
    CMD_DOUBLE_ON,
    Buffer.from(data.nombreSucursal + "\n", "utf8"),
    CMD_DOUBLE_OFF,
    CMD_BOLD_OFF,
    CMD_ALIGN_LEFT,
    Buffer.from(text, "utf8"),
    CMD_LF,
    CMD_FEED_CUT,
  ];

  return Buffer.concat(parts);
}
