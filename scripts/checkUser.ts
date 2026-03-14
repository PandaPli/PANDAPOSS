import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.usuario.findMany({
    where: { usuario: { contains: 'NETAA' } },
    include: { sucursal: true, tenant: true }
  });
  fs.writeFileSync('scripts/userOutput2.json', JSON.stringify(users, null, 2), 'utf-8');
}

main().finally(() => prisma.$disconnect());
