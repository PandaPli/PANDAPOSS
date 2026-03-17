import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Buscar el usuario
  const usuario = await prisma.usuario.findUnique({
    where: { usuario: 'DONRO' },
    include: { sucursal: { select: { nombre: true, plan: true, activa: true } } },
  });

  if (!usuario) {
    console.log('❌ Usuario DONRO no existe en la base de datos.');
    return;
  }

  console.log('\n📋 Estado actual del usuario DONRO:');
  console.log(`   ID:        ${usuario.id}`);
  console.log(`   Nombre:    ${usuario.nombre}`);
  console.log(`   Rol:       ${usuario.rol}`);
  console.log(`   Status:    ${usuario.status}`);
  console.log(`   Sucursal:  ${usuario.sucursal?.nombre ?? 'Sin sucursal'} (plan: ${usuario.sucursal?.plan})`);
  console.log(`   Sucursal activa: ${usuario.sucursal?.activa}`);

  // 2. Si está inactivo, reactivarlo
  if (usuario.status !== 'ACTIVO') {
    console.log('\n⚠️  Usuario INACTIVO — reactivando...');
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { status: 'ACTIVO' },
    });
    console.log('✅ Usuario reactivado.');
  } else {
    console.log('\n✅ Status: ACTIVO (OK)');
  }

  // 3. Resetear contraseña a: pandaposs8432
  const nuevaPassword = 'pandaposs8432';
  const hash = await bcrypt.hash(nuevaPassword, 10);
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { password: hash },
  });
  console.log(`✅ Contraseña reseteada correctamente.`);
  console.log('\n🔑 Ya puedes ingresar con:');
  console.log(`   Usuario:    DONRO`);
  console.log(`   Contraseña: ${nuevaPassword}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
