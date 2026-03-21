import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createWriteStream } from "fs";
import { writeFile, unlink } from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";
import { tmpdir } from "os";
import { join } from "path";
import {
  buildPrecuentaBuffer,
  buildBoletaBuffer,
  type PrecuentaData,
  type BoletaData,
} from "@/server/services/print.service";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

// ── Escribe buffer a un dispositivo o archivo (/dev/usb/lp0, etc.) ──────────
function writeToDevice(devicePath: string, buffer: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const stream = createWriteStream(devicePath, { flags: "w" });
    stream.write(buffer, (err) => {
      if (err) { stream.destroy(); return reject(err); }
      stream.end(() => resolve());
    });
    stream.on("error", reject);
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { sucursalId, type, data } = body as {
    sucursalId?: number;
    type: "precuenta" | "boleta";
    data: PrecuentaData | BoletaData;
  };

  if (!type || !data)
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });

  // Obtener configuración de impresora
  let printerPath: string | null = null;
  if (sucursalId) {
    const suc = await prisma.sucursal.findUnique({
      where: { id: Number(sucursalId) },
      select: { printerPath: true },
    });
    printerPath = suc?.printerPath ?? null;
  }

  const buffer = type === "precuenta"
    ? buildPrecuentaBuffer(data as PrecuentaData)
    : buildBoletaBuffer(data as BoletaData);

  // ── Estrategia 1: dispositivo USB directo (/dev/usb/lp0) ──────────────────
  if (printerPath?.startsWith("/dev/")) {
    try {
      await writeToDevice(printerPath, buffer);
      return NextResponse.json({ ok: true, method: "usb" });
    } catch (err) {
      console.warn("[/print usb]", (err as Error).message, "→ intentando lp");
    }
  }

  // ── Estrategia 2: CUPS lp (impresora por defecto del sistema) ─────────────
  const tmpPath = join(tmpdir(), `panda-ticket-${Date.now()}.bin`);
  try {
    await writeFile(tmpPath, buffer);
    await execFileAsync("lp", ["-o", "raw", tmpPath]);
    return NextResponse.json({ ok: true, method: "cups" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al imprimir";
    console.error("[/print lp]", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  } finally {
    try { await unlink(tmpPath); } catch { /* ignorar */ }
  }
}
