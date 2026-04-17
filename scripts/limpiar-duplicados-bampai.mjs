import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Script de limpieza BAMPAI (sucursal 6):
 * 1. Reasigna pedidos/direcciones de duplicados "Luis Rodrigo Vargas" al original (ID 272)
 * 2. Elimina duplicados vaciados
 * 3. Corrige nombres rotos por parsing de PDF
 * 4. Asigna género a los que faltan
 */

const ID_ORIGINAL_VARGAS = 272;
const IDS_DUPLICADOS_VARGAS = [412, 419, 420, 422, 423, 424, 425, 428, 430, 431, 433, 434, 435, 438, 440, 442, 443, 444, 445, 446, 447, 448];

// Nombres rotos por PDF → nombre correcto + género
const CORRECCIONES_NOMBRE = [
  { id: 103, nombre: "Francisca Nilo", genero: "F" },
  { id: 105, nombre: "Francesca Reyes", genero: "F" },
  { id: 106, nombre: "Francisca", genero: "F" },
  { id: 116, nombre: "Kassandra Manosalva", genero: "F" },
  { id: 139, nombre: "Raimundo Silva", genero: "M" },
  { id: 147, nombre: "Constanza Velasquez", genero: "F" },
  { id: 163, nombre: "Jacqueline Duarte", genero: "F" },
  { id: 214, nombre: "Constanza Torres Soto", genero: "F" },
  { id: 278, nombre: "Sofia Barrios", genero: "F" },
  { id: 323, nombre: "Angelina Osorio", genero: "F" },
  { id: 324, nombre: "Constanza Romero", genero: "F" },
  { id: 330, nombre: "Estefanía Ampuero", genero: "F" },
];

const ASIGNAR_GENERO = [
  { id: 1, genero: "M" },     // Angelo manquecoy
  { id: 414, genero: "M" },   // Ivan Quiroz
  { id: 415, genero: "M" },   // ivan
  { id: 418, genero: "F" },   // Alejandra Jeria
  { id: 426, genero: "F" },   // Susana
  { id: 437, genero: "F" },   // Sabrina Valeria Díaz vásquez
];

async function main() {
  console.log(`\n═══════════════════════════════════════════════`);
  console.log(`  LIMPIEZA DE DUPLICADOS — BAMPAI`);
  console.log(`═══════════════════════════════════════════════\n`);

  // --- 1. Reasignar relaciones de duplicados al original ---
  console.log(`🔄 Reasignando relaciones de duplicados de "Luis Rodrigo Vargas" al ID ${ID_ORIGINAL_VARGAS}...`);

  for (const dupId of IDS_DUPLICADOS_VARGAS) {
    // Reasignar direcciones al cliente original
    const dirUpdate = await prisma.direccionCliente.updateMany({
      where: { clienteId: dupId },
      data: { clienteId: ID_ORIGINAL_VARGAS },
    });

    // Reasignar pedidos de delivery al cliente original
    const pedUpdate = await prisma.pedidoDelivery.updateMany({
      where: { clienteId: dupId },
      data: { clienteId: ID_ORIGINAL_VARGAS },
    });

    // Reasignar ventas al cliente original
    const ventaUpdate = await prisma.venta.updateMany({
      where: { clienteId: dupId },
      data: { clienteId: ID_ORIGINAL_VARGAS },
    });

    // Reasignar movimientos de puntos
    const puntosUpdate = await prisma.movimientoPuntos.updateMany({
      where: { clienteId: dupId },
      data: { clienteId: ID_ORIGINAL_VARGAS },
    });

    const cambios = dirUpdate.count + pedUpdate.count + ventaUpdate.count + puntosUpdate.count;
    if (cambios > 0) {
      console.log(`  ID ${dupId}: reasignados ${dirUpdate.count} dir, ${pedUpdate.count} ped, ${ventaUpdate.count} ventas, ${puntosUpdate.count} puntos`);
    }
  }

  // --- 2. Eliminar duplicados ya vaciados ---
  console.log(`\n🗑️  Eliminando duplicados vaciados...`);

  let eliminados = 0;
  for (const dupId of IDS_DUPLICADOS_VARGAS) {
    // Verificar que ya no tiene relaciones
    const dirs = await prisma.direccionCliente.count({ where: { clienteId: dupId } });
    const peds = await prisma.pedidoDelivery.count({ where: { clienteId: dupId } });
    const ventas = await prisma.venta.count({ where: { clienteId: dupId } });
    const puntos = await prisma.movimientoPuntos.count({ where: { clienteId: dupId } });

    if (dirs + peds + ventas + puntos === 0) {
      await prisma.cliente.delete({ where: { id: dupId } });
      eliminados++;
    } else {
      console.log(`  ⚠️  ID ${dupId} aún tiene relaciones — NO eliminado`);
    }
  }
  console.log(`  ✅ Eliminados ${eliminados} duplicados de "Luis Rodrigo Vargas"`);
  console.log(`  📌 Conservado: ID ${ID_ORIGINAL_VARGAS} (con email, teléfono y todas las relaciones reasignadas)`);

  // --- 3. Corregir nombres rotos + asignar género ---
  console.log(`\n🔧 Corrigiendo nombres rotos por PDF...`);

  for (const { id, nombre, genero } of CORRECCIONES_NOMBRE) {
    const c = await prisma.cliente.findUnique({ where: { id }, select: { nombre: true } });
    if (c) {
      await prisma.cliente.update({ where: { id }, data: { nombre, genero } });
      console.log(`  ✅ ID ${id}: "${c.nombre}" → "${nombre}" (${genero})`);
    }
  }

  // --- 4. Asignar género faltante ---
  console.log(`\n🏷️  Asignando género faltante...`);

  for (const { id, genero } of ASIGNAR_GENERO) {
    const c = await prisma.cliente.findUnique({ where: { id }, select: { nombre: true } });
    if (c) {
      await prisma.cliente.update({ where: { id }, data: { genero } });
      console.log(`  ✅ ID ${id}: "${c.nombre}" → ${genero}`);
    }
  }

  // --- 5. Verificación final ---
  console.log(`\n🔍 Verificación final...`);

  const sinGenero = await prisma.cliente.findMany({
    where: { sucursalId: 6, genero: null },
    select: { id: true, nombre: true },
  });

  if (sinGenero.length > 0) {
    console.log(`  ⚠️  Aún quedan ${sinGenero.length} sin género:`);
    sinGenero.forEach(c => console.log(`    ID ${c.id}: ${c.nombre}`));
  } else {
    console.log(`  ✅ Todos los clientes tienen género asignado`);
  }

  const [total, f, m, sinG] = await Promise.all([
    prisma.cliente.count({ where: { sucursalId: 6 } }),
    prisma.cliente.count({ where: { sucursalId: 6, genero: "F" } }),
    prisma.cliente.count({ where: { sucursalId: 6, genero: "M" } }),
    prisma.cliente.count({ where: { sucursalId: 6, genero: null } }),
  ]);

  console.log(`\n═══════════════════════════════════════════════`);
  console.log(`  RESUMEN FINAL`);
  console.log(`═══════════════════════════════════════════════`);
  console.log(`  Total clientes BAMPAI: ${total}`);
  console.log(`  👩 Mujeres:    ${f}`);
  console.log(`  👨 Hombres:    ${m}`);
  console.log(`  ❓ Sin género:  ${sinG}`);
  console.log(`═══════════════════════════════════════════════\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
