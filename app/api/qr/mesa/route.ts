import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkFeature } from "@/core/billing/featureChecker";
import { prisma } from "@/lib/db";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  // Verificar feature menuQR (ADMIN_GENERAL siempre puede)
  try {
    const { allowed, error } = await checkFeature(sucursalId, "menuQR");
    if (!allowed) return NextResponse.json({ error }, { status: 403 });
  } catch (err: any) {
    console.error("[FEATURE CHECK ERROR]:", err);
    return NextResponse.json({ error: "No se pudo verificar el acceso a esta función." }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const sucursal = searchParams.get("sucursal");
  const mesa     = searchParams.get("mesa");

  if (!sucursal || !mesa) {
    return NextResponse.json({ error: "Parámetros sucursal y mesa requeridos" }, { status: 400 });
  }

  // Validar que la mesa pertenece a la sucursal indicada
  const mesaDb = await prisma.mesa.findFirst({
    where: { id: Number(mesa), sala: { sucursalId: Number(sucursal) } },
    select: { id: true, nombre: true },
  });

  if (!mesaDb) {
    return NextResponse.json({ error: "La mesa no pertenece a esta sucursal." }, { status: 404 });
  }

  const nombre = searchParams.get("nombre") ?? mesaDb.nombre;

  // URL segura: solo desde variables de entorno del servidor
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const menuUrl = `${appUrl}/menu?sucursal=${sucursal}&mesa=${mesa}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(menuUrl, {
      width: 400,
      margin: 2,
      color: { dark: "#1e1b4b", light: "#ffffff" },
      errorCorrectionLevel: "H",
    });

    return NextResponse.json({ qr: qrDataUrl, url: menuUrl, mesa: nombre });
  } catch (err: any) {
    console.error("[QR GENERATION ERROR]:", err);
    return NextResponse.json({ error: "Fallo interno al generar el código QR" }, { status: 500 });
  }
}
