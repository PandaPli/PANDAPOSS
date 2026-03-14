import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Starting phone number update...');
  const clientes = await prisma.cliente.findMany();
  let count = 0;

  for (const client of clientes) {
    if (client.telefono) {
      // Remove any whitespace and common +569 or 569 prefixes
      let t = client.telefono.trim();
      
      const orig = t;
      
      // Clean up common spaces in the prefix
      t = t.replace(/^\+?56\s*9\s*/, '');
      // Also catch if it just starts with 569
      t = t.replace(/^569\s*/, '');

      t = t.trim();

      if (orig !== t) {
        console.log(`Updating client ${client.id}: ${orig} -> ${t}`);
        await prisma.cliente.update({
          where: { id: client.id },
          data: { telefono: t }
        });
        count++;
      }
    }
  }

  console.log(`Updated ${count} clients.`);
  await prisma.$disconnect();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
