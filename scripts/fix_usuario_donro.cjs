// fix_usuario_donro.cjs  — ejecutar con: node scripts/fix_usuario_donro.cjs
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const usuario = await prisma.usuario.findUnique({
    where: { usuario: 'DONRO' },
    include: { sucursal: { select: { nombre: true, plan: true, activa: true } } },
  });

  if (!usuario) {
    console.log('❌ Usuario DONRO no existe en la base de datos.');
    return;
  }

  console.log('\n📋 Estado del usuario DONRO:');
  console.log('   ID:       ', usuario.id);
  console.log('   Nombre:   ', usuario.nombre);
  console.log('   Rol:      ', usuario.rol);
  console.log('   Status:   ', usuario.status);
  console.log('   Sucursal: ', usuario.sucursal?.nombre ?? 'Sin sucursal');

  const updates = {};

  if (usuario.status !== 'ACTIVO') {
    console.log('\n⚠️  Usuario INACTIVO — reactivando...');
    updates.status = 'ACTIVO';
  }

  // Resetear contraseña
  const nuevaPassword = 'pandaposs8432';
  updates.password = await bcrypt.hash(nuevaPassword, 10);

  await prisma.usuario.update({ where: { id: usuario.id }, data: updates });

  console.log('✅ Contraseña reseteada.');
  if (updates.status) console.log('✅ Usuario reactivado.');
  console.log('\n🔑 Credenciales:');
  console.log('   Usuario:    DONRO');
  console.log('   Contraseña: pandaposs8432');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
