import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.usuario.findMany({
    select: {
      id: true,
      nombre: true,
      usuario: true,
      rol: true,
      password: true,
      status: true,
    }
  });

  console.table(users);
}

main().finally(() => prisma.$disconnect());
