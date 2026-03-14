const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const sucursal = await prisma.sucursal.findFirst({
    where: { nombre: { contains: 'NETAA' } }
  });

  if (!sucursal) {
    console.log('Sucursal NETAA no encontrada en la base de datos.');
    return;
  }

  console.log(`Sucursal encontrada: ${sucursal.id} - ${sucursal.nombre}`);

  const prods = await prisma.producto.findMany({
    where: { sucursalId: sucursal.id },
    include: { categoria: true }
  });

  console.log(`Productos encontrados: ${prods.length}`);
  console.log(JSON.stringify(prods, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
