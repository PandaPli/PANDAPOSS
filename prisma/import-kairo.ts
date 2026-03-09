import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

// ─── CSV data ─────────────────────────────────────────
const CSV_PATH = "C:\\Users\\PANDA\\Downloads\\Cat_logo_KAIROSUSHI.csv";
const SUCURSAL_ID = 3; // Kairo Rolls B

// ─── Productos a EXCLUIR (no son productos reales) ────
const EXCLUIR = [
  "Event Registration",
  "Propinas",
  "Delivery 3",
  "Delivery 32",
  "Delivery 33",
  "Delivery 35",
  "Delivery 38",
];

// ─── Mapeo de categoría por prefijo del nombre ────────
const CATEGORIA_MAP: Record<string, string> = {
  "Acevichado": "Hotrolls",
  "Suka Acevichada": "Rolls Especiales",
  "Shinchimi": "Rolls Especiales",
  "Chicken Woo": "Rolls Especiales",
  "Dolcewoow": "Rolls Especiales",
  "Avocado": "Avocado",
  "California": "California",
  "Chesse Cream": "Cheese Cream",
  "Futomaki": "Futomaki",
  "Sake ": "Sake",
  "Hotrolls": "Hotrolls",
  "Hosomaki": "Hosomaki",
  "Handrolls": "Handrolls",
  "Temaki": "Temaki",
  "Bolitas Crispys": "Bolitas Crispys",
  "Finggers": "Finggers",
  "Gyozas": "Gyozas",
  "Gohan": "Gohan",
  "Ramen": "Ramen",
  "Woki Noodles": "Woki Noodles",
  "Woki Pad Th": "Woki Pad Thai",
  "Woki Padthai": "Woki Pad Thai",
  "Woki Rice": "Woki Rice",
  "Tropical Bowl": "Tropical Bowl",
  "Sushiburger": "Sushiburger",
  "Sushi Dog": "Sushi Dog",
  "Sushidog": "Sushi Dog",
  "Tabla": "Tablas",
  "Taba ": "Tablas",
  "Tori Tori": "Tablas",
  "Tabla Panda": "Tablas",
  "Bebida": "Bebidas",
  "Agua": "Bebidas",
  "Salsa": "Salsas",
  "Ingrediente Extra": "Extras",
  "Papel De Arroz": "Extras",
  "Tamago": "Extras",
};

function detectCategoria(nombre: string): string {
  // Check longest match first (more specific prefixes)
  const sorted = Object.entries(CATEGORIA_MAP).sort(
    (a, b) => b[0].length - a[0].length
  );
  for (const [prefix, cat] of sorted) {
    if (nombre.startsWith(prefix) || nombre.includes(prefix)) {
      return cat;
    }
  }
  return "Otros";
}

function limpiarNombre(raw: string): string {
  // Remove "KAIROSUSHI - " prefix and trailing dots
  return raw
    .replace(/^KAIROSUSHI\s*-\s*/, "")
    .replace(/\.$/, "")
    .trim();
}

interface CsvRow {
  nombre: string;
  precio: number;
}

function parseCsv(path: string): CsvRow[] {
  const content = fs.readFileSync(path, "utf-8");
  const lines = content.split("\n").slice(1); // skip header

  const rows: CsvRow[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // CSV parsing: split by comma but respect the structure
    const parts = trimmed.split(",");
    // Nombre is at index 3, Precio de venta at index 4
    const rawNombre = parts[3]?.trim();
    const precio = Number(parts[4]?.trim());

    if (!rawNombre || isNaN(precio)) continue;

    const nombre = limpiarNombre(rawNombre);

    // Excluir productos no reales
    if (EXCLUIR.some((ex) => nombre === ex)) continue;

    rows.push({ nombre, precio });
  }

  return rows;
}

function deduplicar(rows: CsvRow[]): CsvRow[] {
  const seen = new Map<string, CsvRow>();
  for (const row of rows) {
    const key = row.nombre.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, row);
    } else {
      // Keep the one with higher price (more recent/accurate)
      const existing = seen.get(key)!;
      if (row.precio > existing.precio) {
        seen.set(key, row);
      }
    }
  }
  return Array.from(seen.values());
}

async function main() {
  console.log("🐼 Importando catálogo Kairo Rolls B...\n");

  // 1. Parse CSV
  const rawRows = parseCsv(CSV_PATH);
  console.log(`📄 CSV leído: ${rawRows.length} productos (filtrados de basura)`);

  // 2. Deduplicar
  const rows = deduplicar(rawRows);
  console.log(`🧹 Después de deduplicar: ${rows.length} productos únicos\n`);

  // 3. Detectar categorías necesarias
  const categoriasNeeded = new Set<string>();
  for (const row of rows) {
    categoriasNeeded.add(detectCategoria(row.nombre));
  }
  console.log(`📂 Categorías detectadas: ${Array.from(categoriasNeeded).join(", ")}\n`);

  // 4. Crear categorías que no existan
  const categoriaIdMap = new Map<string, number>();
  for (const catNombre of categoriasNeeded) {
    const existing = await prisma.categoria.findUnique({
      where: { nombre: catNombre },
    });
    if (existing) {
      categoriaIdMap.set(catNombre, existing.id);
      console.log(`  ✅ Categoría "${catNombre}" ya existe (id=${existing.id})`);
    } else {
      const created = await prisma.categoria.create({
        data: { nombre: catNombre, activa: true },
      });
      categoriaIdMap.set(catNombre, created.id);
      console.log(`  🆕 Categoría "${catNombre}" creada (id=${created.id})`);
    }
  }

  // 5. Insertar productos
  console.log(`\n🍣 Insertando ${rows.length} productos...\n`);
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const codigo = `KR-${String(i + 1).padStart(4, "0")}`;
    const catNombre = detectCategoria(row.nombre);
    const categoriaId = categoriaIdMap.get(catNombre)!;

    // Check if code already exists
    const existing = await prisma.producto.findUnique({
      where: { codigo },
    });
    if (existing) {
      skipped++;
      continue;
    }

    await prisma.producto.create({
      data: {
        codigo,
        nombre: row.nombre,
        precio: row.precio,
        stock: 99999, // Stock ilimitado
        stockMinimo: 0,
        ivaActivo: false, // Precio neto = precio final
        ivaPorc: 0,
        activo: true,
        enMenu: true,
        categoriaId,
        sucursalId: SUCURSAL_ID,
      },
    });

    created++;
    if (created % 20 === 0) {
      console.log(`  ... ${created} productos creados`);
    }
  }

  console.log(`\n✅ Importación completada!`);
  console.log(`   🆕 Creados: ${created}`);
  console.log(`   ⏭️  Saltados (ya existían): ${skipped}`);
  console.log(`   📂 Categorías: ${categoriasNeeded.size}`);
  console.log(`   🏪 Sucursal: Kairo Rolls B (id=${SUCURSAL_ID})`);

  // 6. Summary by category
  console.log(`\n📊 Resumen por categoría:`);
  const summary = new Map<string, number>();
  for (const row of rows) {
    const cat = detectCategoria(row.nombre);
    summary.set(cat, (summary.get(cat) || 0) + 1);
  }
  for (const [cat, count] of Array.from(summary.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${cat}: ${count} productos`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
