import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Elimina duplicados de BAMPAI (sucursal 6).
 * Para cada grupo: conserva el que tiene más datos (email > teléfono > más antiguo),
 * reasigna todas las relaciones al original y elimina los sobrantes.
 */

// Grupos: [id_a_conservar, ...ids_a_eliminar]
const GRUPOS = [
  // Allison .      — conservar 74 (tiene email)
  [74,  [467]],
  // Vivi Vasquez   — conservar 183 (tiene email)
  [183, [466]],
  // Luis R. Vargas — conservar 272 (tiene email + tel)
  [272, [474, 477, 478]],
  // Sebastian M.   — conservar 360 (tiene email)
  [360, [489]],
  // Elena          — conservar 49 (tiene email)
  [49,  [495]],
  // yesica (test)  — conservar 479 (el más antiguo), resto borrar
  [479, [483, 484, 487, 488, 492, 493, 498, 518, 519]],
  // Ambar          — conservar 486
  [486, [497]],
  // Paola          — conservar 494 (tiene teléfono)
  [494, [490]],
  // Gabriel E.G.A. — conservar 503 (tiene email)
  [503, [504]],
  // Javiera Muñoz  — conservar 506
  [506, [507]],
];

async function reasignarYEliminar(keepId, dupIds) {
  let totalReasignados = 0;

  for (const dupId of dupIds) {
    // Reasignar todas las relaciones al cliente a conservar
    const [dir, ped, venta, puntos] = await Promise.all([
      prisma.direccionCliente.updateMany({ where: { clienteId: dupId }, data: { clienteId: keepId } }),
      prisma.pedidoDelivery.updateMany({ where: { clienteId: dupId }, data: { clienteId: keepId } }),
      prisma.venta.updateMany({ where: { clienteId: dupId }, data: { clienteId: keepId } }),
      prisma.movimientoPuntos.updateMany({ where: { clienteId: dupId }, data: { clienteId: keepId } }),
    ]);

    const cambios = dir.count + ped.count + venta.count + puntos.count;
    if (cambios > 0) {
      console.log(`    ID ${dupId}: reasignados ${dir.count} dir, ${ped.count} ped, ${venta.count} ventas, ${puntos.count} puntos`);
    }
    totalReasignados += cambios;

    await prisma.cliente.delete({ where: { id: dupId } });
  }

  return totalReasignados;
}

async function main() {
  console.log(`\n═══════════════════════════════════════════════`);
  console.log(`  LIMPIEZA DE DUPLICADOS — BAMPAI`);
  console.log(`═══════════════════════════════════════════════\n`);

  let totalEliminados = 0;

  for (const [keepId, dupIds] of GRUPOS) {
    const keeper = await prisma.cliente.findUnique({ where: { id: keepId }, select: { nombre: true } });
    if (!keeper) { console.log(`  ⚠️  ID ${keepId} no existe, saltando`); continue; }

    // Filtrar IDs que existan realmente
    const existentes = await prisma.cliente.findMany({
      where: { id: { in: dupIds } },
      select: { id: true },
    });
    const idsExistentes = existentes.map(c => c.id);

    if (idsExistentes.length === 0) {
      console.log(`  ✓ "${keeper.nombre}" — sin duplicados pendientes`);
      continue;
    }

    console.log(`  🗑️  "${keeper.nombre}" (conservar ID ${keepId}) → eliminar IDs: ${idsExistentes.join(", ")}`);
    await reasignarYEliminar(keepId, idsExistentes);
    totalEliminados += idsExistentes.length;
    console.log(`      ✅ ${idsExistentes.length} eliminados\n`);
  }

  // Asignar género a los nuevos que quedaron sin él
  console.log(`🏷️  Asignando género a nuevos clientes sin detectar...`);
  await prisma.cliente.updateMany({ where: { sucursalId: 6, genero: null, nombre: { in: ["yesica", "Ambar", "Paola", "Elena"] } }, data: { genero: "F" } });
  await prisma.cliente.updateMany({ where: { sucursalId: 6, genero: null, nombre: { contains: "Gabriel" } }, data: { genero: "M" } });
  await prisma.cliente.updateMany({ where: { sucursalId: 6, genero: null, nombre: { contains: "Javiera" } }, data: { genero: "F" } });

  // Re-ejecutar asignación masiva para cualquier otro nuevo sin género
  const sinGenero = await prisma.cliente.findMany({
    where: { sucursalId: 6, genero: null },
    select: { id: true, nombre: true },
  });

  if (sinGenero.length > 0) {
    console.log(`  ⚠️  Quedan ${sinGenero.length} sin género:`);
    sinGenero.forEach(c => console.log(`    ID ${c.id}: ${c.nombre}`));
  }

  // Resumen
  const [total, f, m, sinG] = await Promise.all([
    prisma.cliente.count({ where: { sucursalId: 6 } }),
    prisma.cliente.count({ where: { sucursalId: 6, genero: "F" } }),
    prisma.cliente.count({ where: { sucursalId: 6, genero: "M" } }),
    prisma.cliente.count({ where: { sucursalId: 6, genero: null } }),
  ]);

  console.log(`\n═══════════════════════════════════════════════`);
  console.log(`  RESUMEN FINAL`);
  console.log(`═══════════════════════════════════════════════`);
  console.log(`  Duplicados eliminados: ${totalEliminados}`);
  console.log(`  Total clientes BAMPAI: ${total}`);
  console.log(`  👩 Mujeres:    ${f}`);
  console.log(`  👨 Hombres:    ${m}`);
  console.log(`  ❓ Sin género:  ${sinG}`);
  console.log(`═══════════════════════════════════════════════\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
