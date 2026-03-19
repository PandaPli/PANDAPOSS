/**
 * migrate-uploads-to-blob.mjs
 * Sube todos los archivos locales de /public/uploads a Vercel Blob
 * y actualiza las URLs en la BD (Sucursal.logoUrl + Producto.imagen).
 *
 * Uso: node scripts/migrate-uploads-to-blob.mjs
 * Requiere BLOB_READ_WRITE_TOKEN en .env.local
 */

import { readFileSync } from "fs";
// Cargar .env.local manualmente
try {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
  }
} catch { /* no .env.local */ }
import { put } from "@vercel/blob";
import { PrismaClient } from "@prisma/client";
import { readFile, readdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "..", "public", "uploads");

const MIME = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

const prisma = new PrismaClient();

async function uploadFile(localPath, filename) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "png";
  const contentType = MIME[ext] ?? "image/png";
  const buffer = await readFile(localPath);
  const blob = await put(`uploads/${filename}`, buffer, {
    access: "public",
    contentType,
  });
  return blob.url;
}

async function main() {
  console.log("📂 Leyendo archivos en public/uploads ...");
  let files;
  try {
    files = await readdir(UPLOADS_DIR);
  } catch {
    console.error("❌ No existe public/uploads — nada que migrar.");
    return;
  }

  if (files.length === 0) {
    console.log("✅ No hay archivos locales para migrar.");
    return;
  }

  console.log(`🔍 ${files.length} archivo(s) encontrado(s)\n`);

  // Mapa filename → nueva URL en Blob
  const urlMap = {};

  for (const filename of files) {
    const localPath = path.join(UPLOADS_DIR, filename);
    try {
      console.log(`⬆️  Subiendo ${filename} ...`);
      const blobUrl = await uploadFile(localPath, filename);
      urlMap[`/uploads/${filename}`] = blobUrl;
      console.log(`   ✅ ${blobUrl}`);
    } catch (err) {
      console.error(`   ❌ Error subiendo ${filename}:`, err.message);
    }
  }

  console.log("\n🔄 Actualizando base de datos ...\n");

  // Sucursales — campo logoUrl
  const sucursales = await prisma.sucursal.findMany({
    where: { logoUrl: { not: null } },
    select: { id: true, nombre: true, logoUrl: true },
  });

  for (const suc of sucursales) {
    const newUrl = urlMap[suc.logoUrl];
    if (!newUrl) continue;
    await prisma.sucursal.update({
      where: { id: suc.id },
      data: { logoUrl: newUrl },
    });
    console.log(`🏪 Sucursal #${suc.id} "${suc.nombre}"\n   ${suc.logoUrl}\n   → ${newUrl}`);
  }

  // Productos — campo imagen
  const productos = await prisma.producto.findMany({
    where: { imagen: { not: null } },
    select: { id: true, nombre: true, imagen: true },
  });

  for (const prod of productos) {
    const newUrl = urlMap[prod.imagen];
    if (!newUrl) continue;
    await prisma.producto.update({
      where: { id: prod.id },
      data: { imagen: newUrl },
    });
    console.log(`🛒 Producto #${prod.id} "${prod.nombre}"\n   ${prod.imagen}\n   → ${newUrl}`);
  }

  console.log("\n✅ Migración completada.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
