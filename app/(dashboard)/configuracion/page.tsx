import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ConfiguracionClient } from "./ConfiguracionClient";
import type { Rol } from "@/types";

export default async function ConfiguracionPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const rol = (session.user as { rol: Rol }).rol;
  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  let config = await prisma.configuracion.findUnique({ where: { id: 1 } });

  if (!config) {
    config = await prisma.configuracion.create({
      data: { id: 1, nombreEmpresa: "PandaPoss", moneda: "CLP", simbolo: "$", ivaPorc: 19 },
    });
  }

  // Logo, slug, ruta impresora y datos de la sucursal (si aplica)
  let sucursalLogoUrl: string | null = null;
  let sucursalCartaBg: string | null = null;
  let sucursalCartaTagline: string | null = null;
  let sucursalCartaSaludo: string | null = null;
  let sucursalSlug: string | null = null;
  let sucursalPrinterPath: string | null = null;
  let sucursalPrinterIp: string | null = null;
  let sucursalRut: string | null = null;
  let sucursalGiroComercial: string | null = null;
  let sucursalTelefono: string | null = null;
  let sucursalDireccion: string | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sucursalZonasDelivery: any = null;
  let sucursalSocialFacebook:  string | null = null;
  let sucursalSocialInstagram: string | null = null;
  let sucursalSocialWhatsapp:  string | null = null;
  let sucursalSocialYoutube:   string | null = null;
  let sucursalSocialTiktok:    string | null = null;
  let sucursalSocialTwitter:   string | null = null;
  let sucursalFlayerUrl:       string | null = null;
  let sucursalFlayerActivo:    boolean       = false;
  let sucursalMpAccessToken:   string | null = null;

  if (rol === "RESTAURANTE" && sucursalId) {
    const suc = await prisma.sucursal.findUnique({
      where: { id: sucursalId },
      select: {
        nombre: true, logoUrl: true, cartaBg: true, cartaTagline: true, cartaSaludo: true,
        printerPath: true, printerIp: true, rut: true, giroComercial: true,
        telefono: true, direccion: true, zonasDelivery: true,
        socialFacebook: true, socialInstagram: true, socialWhatsapp: true,
        socialYoutube: true, socialTiktok: true, socialTwitter: true,
        flayerUrl: true, flayerActivo: true, mpAccessToken: true,
      },
    });
    if (suc) {
      sucursalLogoUrl = suc.logoUrl;
      sucursalCartaBg = suc.cartaBg;
      sucursalCartaTagline = suc.cartaTagline;
      sucursalCartaSaludo = suc.cartaSaludo;
      sucursalPrinterPath = suc.printerPath;
      sucursalPrinterIp = suc.printerIp;
      sucursalRut = suc.rut;
      sucursalGiroComercial = suc.giroComercial;
      sucursalTelefono = suc.telefono;
      sucursalDireccion = suc.direccion;
      sucursalZonasDelivery = suc.zonasDelivery;
      sucursalSocialFacebook  = suc.socialFacebook;
      sucursalSocialInstagram = suc.socialInstagram;
      sucursalSocialWhatsapp  = suc.socialWhatsapp;
      sucursalSocialYoutube   = suc.socialYoutube;
      sucursalSocialTiktok    = suc.socialTiktok;
      sucursalSocialTwitter   = suc.socialTwitter;
      sucursalFlayerUrl       = suc.flayerUrl;
      sucursalFlayerActivo    = suc.flayerActivo;
      sucursalMpAccessToken   = suc.mpAccessToken;
      const { createSlug } = await import("@/lib/slug");
      sucursalSlug = createSlug(suc.nombre);
    }
  }

  const plain = {
    id: config.id,
    nombreEmpresa: config.nombreEmpresa,
    rut: config.rut,
    direccion: config.direccion,
    telefono: config.telefono,
    email: config.email,
    moneda: config.moneda,
    simbolo: config.simbolo,
    ivaPorc: Number(config.ivaPorc),
    logoUrl: config.logoUrl,
  };

  return (
    <div className="space-y-6">
      <ConfiguracionClient
        config={plain}
        rol={rol}
        sucursalId={sucursalId}
        sucursalLogoUrl={sucursalLogoUrl}
        sucursalCartaBg={sucursalCartaBg}
        sucursalCartaTagline={sucursalCartaTagline}
        sucursalCartaSaludo={sucursalCartaSaludo}
        sucursalSlug={sucursalSlug}
        sucursalPrinterPath={sucursalPrinterPath}
        sucursalPrinterIp={sucursalPrinterIp}
        sucursalRut={sucursalRut}
        sucursalGiroComercial={sucursalGiroComercial}
        sucursalTelefono={sucursalTelefono}
        sucursalDireccion={sucursalDireccion}
        sucursalZonasDelivery={sucursalZonasDelivery}
        sucursalSocialFacebook={sucursalSocialFacebook}
        sucursalSocialInstagram={sucursalSocialInstagram}
        sucursalSocialWhatsapp={sucursalSocialWhatsapp}
        sucursalSocialYoutube={sucursalSocialYoutube}
        sucursalSocialTiktok={sucursalSocialTiktok}
        sucursalSocialTwitter={sucursalSocialTwitter}
        sucursalFlayerUrl={sucursalFlayerUrl}
        sucursalFlayerActivo={sucursalFlayerActivo}
        sucursalMpAccessToken={sucursalMpAccessToken}
      />
    </div>
  );
}
