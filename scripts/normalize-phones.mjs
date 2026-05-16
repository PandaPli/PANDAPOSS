import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeForDB(tel) {
  if (!tel) return null;
  const t = tel.trim();
  const digits = t.replace(/\D/g, "");
  if (t.startsWith("+56") && digits.length >= 10) return t;                    // ya OK
  if (digits.length === 11 && digits.startsWith("56")) return "+" + digits;    // agregar +
  if (digits.length === 9 && digits.startsWith("9")) return "+56" + digits;    // agregar +56
  if (digits.length === 8) return "+569" + digits;                             // agregar +569
  return t; // dejar igual
}

async function main() {
  const clientes = await prisma.cliente.findMany({
    select: { id: true, telefono: true },
    where: { telefono: { not: null } },
  });

  console.log(`Total registros con teléfono: ${clientes.length}`);

  const toUpdate = [];
  for (const c of clientes) {
    const normalized = normalizeForDB(c.telefono);
    if (normalized !== c.telefono) {
      toUpdate.push({ id: c.id, old: c.telefono, new: normalized });
    }
  }

  console.log(`Se modificarán: ${toUpdate.length}`);
  console.log(`Sin cambios: ${clientes.length - toUpdate.length}`);

  if (toUpdate.length === 0) {
    console.log("Nada que actualizar.");
    return;
  }

  console.log("\nPrimeros 10 cambios:");
  toUpdate.slice(0, 10).forEach((r) =>
    console.log(`  [${r.id}] ${r.old} → ${r.new}`)
  );

  // Aplicar updates en lotes de 50
  let updated = 0;
  for (const r of toUpdate) {
    await prisma.cliente.update({
      where: { id: r.id },
      data: { telefono: r.new },
    });
    updated++;
  }

  console.log(`\n✅ Actualizados: ${updated} registros`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
