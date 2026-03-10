import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const cajas = await prisma.caja.findMany({
    include: { sucursal: { select: { nombre: true } } },
  });
  console.log("=== CAJAS EN BD ===");
  cajas.forEach((c) => {
    console.log(`ID=${c.id} | ${c.nombre} | ${c.sucursal?.nombre} | Estado=${c.estado} | sucursalId=${c.sucursalId}`);
  });
  const arqueos = await prisma.arqueo.findMany();
  console.log("\n=== ARQUEOS ===");
  console.log(arqueos);
}
main().catch(console.error).finally(() => prisma.$disconnect());
