import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Activar kiosk en Netaa Mx (sucursal con nombre que contiene "Netaa") y plan PRIME
  const updated = await prisma.sucursal.updateMany({
    where: { nombre: { contains: "Netaa" } },
    data: { kioskActivo: true, plan: "PRIME" },
  });
  console.log(`✅ Kiosk activado en ${updated.count} sucursal(es) Netaa Mx — plan PRIME`);

  const sucursales = await prisma.sucursal.findMany({
    where: { nombre: { contains: "Netaa" } },
    select: { id: true, nombre: true, plan: true, kioskActivo: true },
  });
  console.table(sucursales);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
