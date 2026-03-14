import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const total = await p.producto.count({ where: { sucursalId: 1 } });
  const porCat = await p.categoria.findMany({
    include: { _count: { select: { productos: { where: { sucursalId: 1 } } } } }
  });
  console.log(`\nTotal productos CasaFaroles: ${total}`);
  porCat.forEach(c => console.log(`  ${c.nombre}: ${c._count.productos}`));
}
main().catch(console.error).finally(() => p.$disconnect());
