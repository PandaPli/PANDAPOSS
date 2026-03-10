/**
 * Crea "Mesón" + 30 mesas para cada sucursal que no tenga salas aún.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const sucursales = await prisma.sucursal.findMany({ orderBy: { id: "asc" } });
  console.log(`Sucursales encontradas: ${sucursales.length}`);

  for (const suc of sucursales) {
    const salas = await prisma.sala.count({ where: { sucursalId: suc.id } });
    if (salas > 0) {
      console.log(`  ⏭️  ${suc.nombre} (id:${suc.id}) ya tiene ${salas} sala(s) — omitido`);
      continue;
    }

    const sala = await prisma.sala.create({
      data: { nombre: "Mesón", sucursalId: suc.id },
    });
    await prisma.mesa.createMany({
      data: Array.from({ length: 30 }, (_, i) => ({
        nombre: `Mesa ${i + 1}`,
        salaId: sala.id,
        capacidad: 4,
      })),
    });
    console.log(`  ✅ ${suc.nombre} (id:${suc.id}) → Mesón + 30 mesas creados`);
  }

  console.log("\nListo.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
