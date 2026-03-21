import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Activar kiosk en todas las sucursales con plan PRIME
  const updated = await prisma.sucursal.updateMany({
    where: { plan: "PRIME" },
    data: { kioskActivo: true },
  });
  console.log(`✅ Kiosk activado en ${updated.count} sucursal(es) PRIME`);

  const sucursales = await prisma.sucursal.findMany({
    where: { plan: "PRIME" },
    select: { id: true, nombre: true, plan: true, kioskActivo: true },
  });
  console.table(sucursales);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
