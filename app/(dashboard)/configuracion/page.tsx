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

  // Logo actual de la sucursal (si aplica)
  let sucursalLogoUrl: string | null = null;
  if (rol === "ADMIN_SUCURSAL" && sucursalId) {
    const suc = await prisma.sucursal.findUnique({ where: { id: sucursalId }, select: { logoUrl: true } });
    sucursalLogoUrl = suc?.logoUrl ?? null;
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
      />
    </div>
  );
}
