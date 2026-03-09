/**
 * Script para crear la Caja principal de CasaFaroles (sucursalId = 2)
 */
import { PrismaClient, EstadoCaja } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🏦 Creando caja para CasaFaroles...\n");

  const caja = await prisma.caja.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      nombre: "Caja Principal",
      estado: EstadoCaja.CERRADA,
      sucursalId: 2,
    },
  });

  console.log(`✅ Caja creada: "${caja.nombre}" (id=${caja.id}, sucursalId=${caja.sucursalId}, estado=${caja.estado})`);
  console.log("\n👉 Siguiente paso: entrar a /cajas y abrir la caja con el saldo inicial.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
