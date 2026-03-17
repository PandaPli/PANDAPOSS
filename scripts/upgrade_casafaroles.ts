import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const sucursal = await prisma.sucursal.findFirst({
      where: { nombre: { contains: 'Casa Faroles' } },
    });

    if (!sucursal) {
      console.log('No se encontró la sucursal Casa Faroles');
      return;
    }

    console.log(`Sucursal encontrada: ${sucursal.nombre} (ID: ${sucursal.id}) — Plan actual: ${sucursal.plan}`);

    const updated = await prisma.sucursal.update({
      where: { id: sucursal.id },
      data: {
        plan: 'PRO',
        menuQR: true,
        delivery: true,
        correoActivo: true,
      },
    });

    console.log(`✅ ${updated.nombre} actualizada a plan ${updated.plan}`);
    console.log(`   menuQR=${updated.menuQR} | delivery=${updated.delivery} | correo=${updated.correoActivo}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
