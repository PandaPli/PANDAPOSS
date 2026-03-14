/**
 * Importa catálogo de KairoSushi desde CSV de Odoo
 * Sucursal ID: 2 (KairoRolls Bollenar)
 */
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const SUCURSAL_ID = 3;
const CSV_PATH = path.join(process.env.USERPROFILE || "", "Downloads", "Cat_logo_KAIROSUSHI.csv");

// Productos a omitir (no son ítems de carta real)
const SKIP_NAMES = [
  "event registration",
  "propinas",
  "delivery 3",
  "delivery 32",
  "delivery 33",
  "delivery 35",
  "delivery 38",
];

function slugify(str: string): string {
  return str
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 20);
}

async function main() {
  // Leer CSV
  const raw = fs.readFileSync(CSV_PATH, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim());
  const [header, ...rows] = lines;
  console.log("Header:", header);
  console.log("Total filas:", rows.length);

  // Parsear filas
  interface Row { categoria: string; nombre: string; precio: number }
  const productos: Row[] = [];
  const seenNames = new Set<string>();

  for (const row of rows) {
    const cols = row.split(",");
    const categoria = cols[0]?.trim() ?? "";
    const nombreRaw = cols[3]?.trim() ?? "";
    const precioStr = cols[4]?.trim() ?? "0";
    const precio = Number(precioStr);

    // Limpiar nombre: quitar prefijo "KAIROSUSHI - "
    const nombre = nombreRaw.replace(/^KAIROSUSHI\s*-\s*/i, "").trim().toUpperCase();

    // Saltar vacíos, precios negativos o productos especiales
    if (!nombre || precio <= 0) continue;
    if (SKIP_NAMES.some((s) => nombre.toLowerCase().includes(s))) {
      console.log("  ⏭️  Omitiendo:", nombre);
      continue;
    }

    // Deduplicar por nombre
    if (seenNames.has(nombre)) {
      console.log("  ⚠️  Duplicado omitido:", nombre);
      continue;
    }
    seenNames.add(nombre);

    productos.push({ categoria, nombre, precio });
  }

  console.log(`\nProductos a importar: ${productos.length}`);

  // Crear/encontrar categoría "Carta General"
  let cat = await prisma.categoria.findFirst({ where: { nombre: "Carta General" } });
  if (!cat) {
    cat = await prisma.categoria.create({ data: { nombre: "Carta General", icono: "🍱" } });
    console.log("✅ Categoría creada: Carta General (id:", cat.id, ")");
  } else {
    console.log("ℹ️  Categoría existente: Carta General (id:", cat.id, ")");
  }

  // Obtener último código KS existente para continuar la secuencia
  const lastKS = await prisma.producto.findFirst({
    where: { codigo: { startsWith: "KS-" } },
    orderBy: { codigo: "desc" },
    select: { codigo: true },
  });
  let counter = 1;
  if (lastKS) {
    const num = parseInt(lastKS.codigo.replace("KS-", ""), 10);
    if (!isNaN(num)) counter = num + 1;
  }

  // Importar productos
  let creados = 0;
  let errores = 0;

  for (const p of productos) {
    const codigo = `KS-${String(counter).padStart(4, "0")}`;
    counter++;

    try {
      await prisma.producto.create({
        data: {
          codigo,
          nombre: p.nombre,
          precio: p.precio,
          categoriaId: cat.id,
          sucursalId: SUCURSAL_ID,
          activo: true,
          enMenu: true,
          stock: 0,
          stockMinimo: 0,
        },
      });
      console.log(`  ✅ ${codigo} - ${p.nombre} ($${p.precio})`);
      creados++;
    } catch (err: unknown) {
      console.error(`  ❌ Error en ${p.nombre}:`, (err as Error).message);
      errores++;
    }
  }

  console.log(`\n=== Resumen ===`);
  console.log(`Creados:  ${creados}`);
  console.log(`Errores:  ${errores}`);
  console.log(`Omitidos: ${rows.length - productos.length - errores}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
