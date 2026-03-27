// scripts/recovery.mjs — Recuperación post-reset de base de datos
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Iniciando recuperación...\n");

  // ─────────────────────────────────────────────
  // 1. SUCURSALES
  // ─────────────────────────────────────────────
  console.log("📍 Creando sucursales...");

  // BamPai — forzar id=6 para que el import script funcione
  const bampai = await prisma.sucursal.upsert({
    where: { id: 6 },
    update: { nombre: "BamPai", activa: true },
    create: {
      id: 6,
      nombre: "BamPai",
      simbolo: "$",
      activa: true,
      telefono: "+56931412102",
      direccion: "Aromos 371",
    },
  });
  console.log(`  ✅ BamPai (id=${bampai.id})`);

  const netaa = await prisma.sucursal.upsert({
    where: { id: 2 },
    update: { nombre: "NETAAA" },
    create: {
      id: 2,
      nombre: "NETAAA",
      simbolo: "$",
      activa: true,
      telefono: "+56944277770",
      direccion: "Aromos Llolleo",
    },
  });
  console.log(`  ✅ NETAAA (id=${netaa.id})`);

  const faroles = await prisma.sucursal.upsert({
    where: { id: 3 },
    update: { nombre: "Casa Faroles" },
    create: {
      id: 3,
      nombre: "Casa Faroles",
      simbolo: "$",
      activa: true,
    },
  });
  console.log(`  ✅ Casa Faroles (id=${faroles.id})`);

  // ─────────────────────────────────────────────
  // 2. SALAS Y MESAS por sucursal
  // ─────────────────────────────────────────────
  console.log("\n🏠 Creando salas y mesas...");
  for (const suc of [bampai, netaa, faroles]) {
    const sala = await prisma.sala.upsert({
      where: { id: suc.id },
      update: {},
      create: { id: suc.id, nombre: "Sala Principal", sucursalId: suc.id },
    });
    const count = await prisma.mesa.count({ where: { salaId: sala.id } });
    if (count === 0) {
      await prisma.mesa.createMany({
        data: Array.from({ length: 20 }, (_, i) => ({
          nombre: `Mesa ${i + 1}`,
          salaId: sala.id,
          capacidad: 4,
        })),
      });
      console.log(`  ✅ ${suc.nombre} — 20 mesas creadas`);
    }
  }

  // ─────────────────────────────────────────────
  // 3. CAJAS
  // ─────────────────────────────────────────────
  console.log("\n💰 Creando cajas...");
  for (const suc of [bampai, netaa, faroles]) {
    await prisma.caja.upsert({
      where: { id: suc.id },
      update: {},
      create: {
        id: suc.id,
        nombre: "Caja Principal",
        estado: "CERRADA",
        sucursalId: suc.id,
      },
    });
  }
  console.log("  ✅ Cajas creadas");

  // ─────────────────────────────────────────────
  // 4. USUARIO MAURICIO (Admin Sucursal BamPai)
  // ─────────────────────────────────────────────
  console.log("\n👤 Creando usuarios...");
  const hash = await bcrypt.hash("bampai2024", 10);
  await prisma.usuario.upsert({
    where: { usuario: "MAURICIO" },
    update: {},
    create: {
      nombre: "Mauricio",
      usuario: "MAURICIO",
      password: hash,
      rol: "RESTAURANTE",
      sucursalId: bampai.id,
    },
  });
  console.log("  ✅ MAURICIO (pass: bampai2024) → BamPai");

  // ─────────────────────────────────────────────
  // 5. PLANES — asignar PRIME a BamPai y Netaa
  // ─────────────────────────────────────────────
  console.log("\n⭐ Asignando planes...");
  try {
    await prisma.sucursal.update({ where: { id: 6 }, data: { plan: "PRIME" } });
    await prisma.sucursal.update({ where: { id: 2 }, data: { plan: "PRIME" } });
    console.log("  ✅ BamPai y NETAAA → PRIME");
  } catch { console.log("  ⚠️  Campo plan no disponible aún"); }

  console.log("\n✅ Recuperación base completada.");
  console.log("\nPróximos pasos:");
  console.log("  node scripts/import-bampai-clientes-pdf.mjs");
  console.log("  npx ts-node --compiler-options '{\"module\":\"CommonJS\"}' scripts/seed_netaa_menu.ts");
  console.log("  npx ts-node --compiler-options '{\"module\":\"CommonJS\"}' scripts/import-bampai-menu.ts");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
