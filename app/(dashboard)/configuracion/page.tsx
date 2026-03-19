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
  let sucursalCartaSaludo: string | null = null;
  let sucursalSlug: string | null = null;
  let sucursalPrinterPath: string | null = null;
  let sucursalRut: string | null = null;
  let sucursalGiroComercial: string | null = null;
  let sucursalTelefono: string | null = null;
  let sucursalDireccion: string | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sucursalZonasDelivery: any = null;

  if (rol === "RESTAURANTE" && sucursalId) {
    const suc = await prisma.sucursal.findUnique({
      where: { id: sucursalId },
      select: { nombre: true, logoUrl: true, cartaBg: true, cartaSaludo: true, printerPath: true, rut: true, giroComercial: true, telefono: true, direccion: true, zonasDelivery: true },
    });
    if (suc) {
      sucursalLogoUrl = suc.logoUrl;
      sucursalCartaBg = suc.cartaBg;
      sucursalCartaSaludo = suc.cartaSaludo;
      sucursalPrinterPath = suc.printerPath;
      sucursalRut = suc.rut;
      sucursalGiroComercial = suc.giroComercial;
      sucursalTelefono = suc.telefono;
      sucursalDireccion = suc.direccion;
      sucursalZonasDelivery = suc.zonasDelivery;
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
        sucursalCartaSaludo={sucursalCartaSaludo}
        sucursalSlug={sucursalSlug}
        sucursalPrinterPath={sucursalPrinterPath}
        sucursalRut={sucursalRut}
        sucursalGiroComercial={sucursalGiroComercial}
        sucursalTelefono={sucursalTelefono}
        sucursalDireccion={sucursalDireccion}
        sucursalZonasDelivery={sucursalZonasDelivery}
      />
    </div>
  );
}
