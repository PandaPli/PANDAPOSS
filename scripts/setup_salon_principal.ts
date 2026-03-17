import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const SALA_ID   = 3;   // Salón de Casa Faroles
  const TOTAL     = 40;  // mesas objetivo
  const CAPACIDAD = 4;

  // 1. Renombrar sala a "Salón Principal"
  await prisma.sala.update({
    where: { id: SALA_ID },
    data: { nombre: 'Salón Principal' },
  });
  console.log('✅ Sala renombrada a "Salón Principal"');

  // 2. Contar mesas actuales
  const actuales = await prisma.mesa.count({ where: { salaId: SALA_ID } });
  const faltan   = TOTAL - actuales;
  console.log(`   Mesas actuales: ${actuales} → Faltan: ${faltan}`);

  if (faltan <= 0) {
    console.log('   Nada que agregar, ya tiene 40 o más mesas.');
    return;
  }

  // 3. Crear mesas faltantes (Mesa 31 … Mesa 40)
  const nuevas = Array.from({ length: faltan }, (_, i) => ({
    salaId:    SALA_ID,
    nombre:    `Mesa ${actuales + i + 1}`,
    capacidad: CAPACIDAD,
    estado:    'LIBRE' as const,
  }));

  await prisma.mesa.createMany({ data: nuevas });
  console.log(`✅ ${faltan} mesas creadas (Mesa ${actuales + 1} – Mesa ${TOTAL})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
