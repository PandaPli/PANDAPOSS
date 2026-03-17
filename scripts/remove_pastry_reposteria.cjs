// remove_pastry_reposteria.cjs
// Ejecutar ANTES de `prisma db push`
// Comando: node scripts/remove_pastry_reposteria.cjs

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Buscando usuarios con rol PASTRY...');

  const pastryUsers = await prisma.usuario.findMany({
    where: { rol: 'PASTRY' },
    select: { id: true, nombre: true, usuario: true, sucursal: { select: { nombre: true } } },
  });

  if (pastryUsers.length === 0) {
    console.log('   ✅ No hay usuarios con rol PASTRY.');
  } else {
    console.log(`   Encontrados: ${pastryUsers.length} usuario(s):`);
    pastryUsers.forEach(u => console.log(`     - [${u.id}] ${u.nombre} (${u.usuario}) — Sucursal: ${u.sucursal?.nombre ?? 'Sin sucursal'}`));

    const deleted = await prisma.usuario.deleteMany({ where: { rol: 'PASTRY' } });
    console.log(`   🗑️  ${deleted.count} usuario(s) PASTRY eliminado(s).`);
  }

  console.log('\n🔍 Buscando pedidos con tipo REPOSTERIA...');

  const repostCount = await prisma.pedido.count({ where: { tipo: 'REPOSTERIA' } });

  if (repostCount === 0) {
    console.log('   ✅ No hay pedidos con tipo REPOSTERIA.');
  } else {
    console.log(`   Encontrados: ${repostCount} pedido(s) — reasignando a MOSTRADOR...`);
    const updated = await prisma.pedido.updateMany({
      where: { tipo: 'REPOSTERIA' },
      data: { tipo: 'MOSTRADOR' },
    });
    console.log(`   ✅ ${updated.count} pedido(s) reasignados a MOSTRADOR.`);
  }

  console.log('\n✅ Listo. Ahora ejecuta: npx prisma db push');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
