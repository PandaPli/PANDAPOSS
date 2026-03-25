import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CARGOS = [
  "Secretaria",
  "Mesero/a",
  "Cocinero/a",
  "Bartender",
  "Cajero/a",
  "Repartidor/a",
];

async function main() {
  for (const nombre of CARGOS) {
    await prisma.cargo.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
    console.log(`✓ ${nombre}`);
  }
  console.log("Cargos insertados correctamente.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
