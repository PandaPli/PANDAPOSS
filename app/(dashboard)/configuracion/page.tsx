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

  // Logo y slug actual de la sucursal (si aplica)
  let sucursalLogoUrl: string | null = null;
  let sucursalSlug: string | null = null;
  let sucursalDescripcionDelivery: string | null = null;
  let sucursalInstagram: string | null = null;
  let sucursalFacebook: string | null = null;
  let sucursalWhatsapp: string | null = null;
  let sucursalTiktok: string | null = null;
  
  if (rol === "RESTAURANTE" && sucursalId) {
    const suc = await prisma.sucursal.findUnique({ where: { id: sucursalId }, select: { nombre: true, logoUrl: true, descripcionDelivery: true, instagram: true, facebook: true, whatsapp: true, tiktok: true } });
    if (suc) {
      sucursalLogoUrl = suc.logoUrl;
      sucursalDescripcionDelivery = suc.descripcionDelivery;
      sucursalInstagram = suc.instagram;
      sucursalFacebook = suc.facebook;
      sucursalWhatsapp = suc.whatsapp;
      sucursalTiktok = suc.tiktok;
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
        sucursalSlug={sucursalSlug}
        sucursalDescripcionDelivery={sucursalDescripcionDelivery}
        sucursalInstagram={sucursalInstagram}
        sucursalFacebook={sucursalFacebook}
        sucursalWhatsapp={sucursalWhatsapp}
        sucursalTiktok={sucursalTiktok}
      />
    </div>
  );
}
