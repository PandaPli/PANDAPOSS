// scripts/backup.mjs — Respaldo de datos críticos: carta, clientes, usuarios, configuración
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outDir = path.resolve("backups");
  const outFile = path.join(outDir, `backup_${timestamp}.json`);

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log("📦 Iniciando respaldo...\n");

  // ── 1. CONFIGURACIÓN ──────────────────────────────────────────────────────
  const configuracion = await prisma.configuracion.findMany();
  console.log(`  ✅ Configuración: ${configuracion.length} registro(s)`);

  // ── 2. SUCURSALES ─────────────────────────────────────────────────────────
  const sucursales = await prisma.sucursal.findMany({
    select: {
      id: true,
      nombre: true,
      direccion: true,
      telefono: true,
      email: true,
      logoUrl: true,
      activa: true,
      plan: true,
      sector: true,
      delivery: true,
      menuQR: true,
      rut: true,
      tenantId: true,
      simbolo: true,
      correoActivo: true,
      kioskActivo: true,
      cartaBg: true,
      cartaTagline: true,
      cartaSaludo: true,
      giroComercial: true,
      socialFacebook: true,
      socialInstagram: true,
      socialWhatsapp: true,
      printerPath: true,
      printerIp: true,
      flayerUrl: true,
      flayerActivo: true,
    },
  });
  console.log(`  ✅ Sucursales: ${sucursales.length}`);

  // ── 3. USUARIOS (sin password) ────────────────────────────────────────────
  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true,
      nombre: true,
      usuario: true,
      email: true,
      rol: true,
      status: true,
      sucursalId: true,
      tenantId: true,
      creadoEn: true,
    },
    orderBy: { id: "asc" },
  });
  console.log(`  ✅ Usuarios: ${usuarios.length}`);

  // ── 4. CATEGORÍAS (con orden) ─────────────────────────────────────────────
  const categorias = await prisma.categoria.findMany({
    orderBy: { orden: "asc" },
  });
  console.log(`  ✅ Categorías: ${categorias.length}`);

  // ── 5. PRODUCTOS (con variantes y opciones) ───────────────────────────────
  const productos = await prisma.producto.findMany({
    include: {
      variantes: {
        include: { opciones: { orderBy: { orden: "asc" } } },
        orderBy: { orden: "asc" },
      },
    },
    orderBy: [{ categoriaId: "asc" }, { nombre: "asc" }],
  });
  console.log(`  ✅ Productos: ${productos.length}`);

  // ── 6. COMBOS ─────────────────────────────────────────────────────────────
  const combos = await prisma.combo.findMany({
    orderBy: { nombre: "asc" },
  });
  console.log(`  ✅ Combos: ${combos.length}`);

  // ── 7. CLIENTES ───────────────────────────────────────────────────────────
  const clientes = await prisma.cliente.findMany({
    include: {
      direcciones: true,
    },
    orderBy: { id: "asc" },
  });
  console.log(`  ✅ Clientes: ${clientes.length}`);

  // ── ARMAR BACKUP ──────────────────────────────────────────────────────────
  const backup = {
    meta: {
      generadoEn: new Date().toISOString(),
      version: "1.0",
      totales: {
        configuracion: configuracion.length,
        sucursales: sucursales.length,
        usuarios: usuarios.length,
        categorias: categorias.length,
        productos: productos.length,
        combos: combos.length,
        clientes: clientes.length,
      },
    },
    configuracion,
    sucursales,
    usuarios,
    categorias,
    productos,
    combos,
    clientes,
  };

  fs.writeFileSync(outFile, JSON.stringify(backup, null, 2), "utf8");

  const kb = (fs.statSync(outFile).size / 1024).toFixed(1);
  console.log(`\n✅ Respaldo guardado en: ${outFile}`);
  console.log(`   Tamaño: ${kb} KB`);
}

main()
  .catch((e) => {
    console.error("❌ Error en respaldo:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
