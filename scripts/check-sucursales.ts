import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sucursales = await prisma.sucursal.findMany({
    select: { id: true, nombre: true }
  });
  console.table(sucursales);
}

main().finally(() => prisma.$disconnect());
