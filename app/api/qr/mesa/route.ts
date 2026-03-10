import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkFeature } from "@/core/billing/featureChecker";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  // Verificar feature menuQR (ADMIN_GENERAL siempre puede)
  const { allowed, error } = await checkFeature(sucursalId, "menuQR");
  if (!allowed) return NextResponse.json({ error }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const sucursal = searchParams.get("sucursal");
  const mesa     = searchParams.get("mesa");
  const nombre   = searchParams.get("nombre") ?? `Mesa ${mesa}`;

  if (!sucursal || !mesa) {
    return NextResponse.json({ error: "Parámetros sucursal y mesa requeridos" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const menuUrl = `${appUrl}/menu?sucursal=${sucursal}&mesa=${mesa}`;

  const qrDataUrl = await QRCode.toDataURL(menuUrl, {
    width: 400,
    margin: 2,
    color: { dark: "#1e1b4b", light: "#ffffff" },
    errorCorrectionLevel: "H",
  });

  return NextResponse.json({ qr: qrDataUrl, url: menuUrl, mesa: nombre });
}
