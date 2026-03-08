import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ConfiguracionClient } from "./ConfiguracionClient";

export default async function ConfiguracionPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  let config = await prisma.configuracion.findUnique({ where: { id: 1 } });

  if (!config) {
    config = await prisma.configuracion.create({
      data: { id: 1, nombreEmpresa: "PANDAPLI", moneda: "CLP", simbolo: "$", ivaPorc: 19 },
    });
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
      <ConfiguracionClient config={plain} />
    </div>
  );
}
