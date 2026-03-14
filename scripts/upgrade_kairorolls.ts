import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Buscar sucursal por nombre (contiene Kairo)
    const sucursales = await prisma.sucursal.findMany({
      where: {
        nombre: {
          contains: 'Kairo',
        }
      }
    });

    if (sucursales.length === 0) {
      console.log('No se encontró ninguna sucursal con el nombre KairoRolls');
      return;
    }

    const kairo = sucursales[0];
    console.log(`Sucursal encontrada: ${kairo.nombre} (ID: ${kairo.id})`);

    // Actualizar a PRO y activar features
    const updated = await prisma.sucursal.update({
      where: { id: kairo.id },
      data: {
        plan: 'PRO',
        menuQR: true,
        delivery: true,
        correoActivo: true
      }
    });

    console.log(`¡Éxito! ${updated.nombre} ha sido actualizada al plan ${updated.plan}. Features activadas: MenuQR: ${updated.menuQR}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
