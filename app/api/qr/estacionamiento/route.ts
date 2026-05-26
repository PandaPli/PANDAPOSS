import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkFeature } from "@/core/billing/featureChecker";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  try {
    const { allowed, error } = await checkFeature(sucursalId, "menuQR");
    if (!allowed) return NextResponse.json({ error }, { status: 403 });
  } catch (err: any) {
    console.error("[FEATURE CHECK ERROR]:", err);
    return NextResponse.json({ error: "No se pudo verificar el acceso." }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const sucursal = searchParams.get("sucursal");
  const estacionamientoId = searchParams.get("estacionamiento");
  const numero = searchParams.get("numero") ?? `E-${estacionamientoId}`;

  if (!sucursal || !estacionamientoId) {
    return NextResponse.json({ error: "Parámetros sucursal y estacionamiento requeridos" }, { status: 400 });
  }

  const clientBaseUrl = searchParams.get("baseUrl");
  const appUrl = clientBaseUrl || process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const menuUrl = `${appUrl}/menu?sucursal=${sucursal}&estacionamiento=${estacionamientoId}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(menuUrl, {
      width: 400,
      margin: 2,
      color: { dark: "#1e3a5f", light: "#ffffff" },
      errorCorrectionLevel: "H",
    });

    return NextResponse.json({ qr: qrDataUrl, url: menuUrl, numero });
  } catch (err: any) {
    console.error("[QR ESTACIONAMIENTO ERROR]:", err);
    return NextResponse.json({ error: "Fallo al generar el QR" }, { status: 500 });
  }
}
