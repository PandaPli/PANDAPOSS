import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Creando mesas para Netaa Mx...");

  const netaa = await prisma.sucursal.findUnique({
    where: { id: 4 }
  });

  if (!netaa) {
    console.log("No se encontró Netaa Mx");
    return;
  }

  // Verificar si ya tiene sala
  let sala = await prisma.sala.findFirst({
    where: { sucursalId: netaa.id }
  });

  if (!sala) {
    sala = await prisma.sala.create({
      data: {
        nombre: "Salón Principal",
        sucursalId: netaa.id
      }
    });
    console.log(`✅ Sala creada para NETAA (ID: ${sala.id})`);

    // Crear 10 mesas
    await prisma.mesa.createMany({
      data: Array.from({ length: 10 }, (_, i) => ({
        nombre: `Mesa ${i + 1}`,
        salaId: sala!.id,
        capacidad: 4,
      })),
    });
    console.log(`✅ 10 Mesas creadas para NETAA`);
  } else {
    console.log(`✅ NETAA ya tiene una sala (ID: ${sala?.id})`);
  }

  console.log("✅ Proceso completado.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
