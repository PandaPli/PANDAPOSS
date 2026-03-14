import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const sucursales = await prisma.sucursal.findMany({
      where: {
        nombre: {
          contains: 'NETAA',
        }
      }
    });

    if (sucursales.length === 0) {
      console.log('No se encontró ninguna sucursal con el nombre NETAA');
      return;
    }

    const netaa = sucursales[0];
    console.log(`Sucursal encontrada: ${netaa.nombre} (ID: ${netaa.id})`);

    const updated = await prisma.sucursal.update({
      where: { id: netaa.id },
      data: {
        plan: 'PRO',
        menuQR: true,
        delivery: true,
        correoActivo: true
      }
    });

    console.log(`¡Éxito! ${updated.nombre} ha sido actualizada al plan ${updated.plan}. Features: QR=${updated.menuQR}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
