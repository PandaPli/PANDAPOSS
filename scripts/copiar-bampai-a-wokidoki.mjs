/**
 * Copia categorías seleccionadas de BamPai (ID 6) a WokiDoki (ID 7).
 * Ejecutar: node scripts/copiar-bampai-a-wokidoki.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BAMPAI_ID   = 6;
const WOKIDOKI_ID = 7;

// Categorías de BamPai a copiar (id → nombre para log)
const CATEGORIAS_IDS = [
  37, // Tablas Clasicas
  40, // Rolls Clásicos
  19, // SushiBurger /SushiDog
  34, // Fritos & Entradas
  22, // Woki
  23, // Bowls
  26, // Salsas
  38, // Bebestibles
];

async function main() {
  // 1. Traer todos los productos de BamPai en esas categorías
  const productos = await prisma.producto.findMany({
    where: {
      sucursalId: BAMPAI_ID,
      categoriaId: { in: CATEGORIAS_IDS },
      activo: true,
    },
    include: { categoria: { select: { nombre: true } } },
    orderBy: [{ categoriaId: "asc" }, { nombre: "asc" }],
  });

  console.log(`\n📦 Productos encontrados en BamPai: ${productos.length}`);

  // 2. Traer los productos que ya existen en WokiDoki para evitar duplicados
  const yaExistentes = await prisma.producto.findMany({
    where: { sucursalId: WOKIDOKI_ID },
    select: { nombre: true, categoriaId: true },
  });
  const existeSet = new Set(yaExistentes.map((p) => `${p.categoriaId}|${p.nombre.toLowerCase().trim()}`));

  // 3. Obtener último código WD- para continuar la secuencia
  const ultimoCodigo = await prisma.producto.findFirst({
    where: { sucursalId: WOKIDOKI_ID, codigo: { startsWith: "WD-" } },
    orderBy: { codigo: "desc" },
    select: { codigo: true },
  });
  let counter = ultimoCodigo
    ? parseInt(ultimoCodigo.codigo.replace("WD-", ""), 10) + 1
    : 1001;

  // 4. Crear los productos nuevos
  let creados = 0;
  let omitidos = 0;

  for (const p of productos) {
    const key = `${p.categoriaId}|${p.nombre.toLowerCase().trim()}`;

    if (existeSet.has(key)) {
      console.log(`  ⏭  Omitido (ya existe): [${p.categoria?.nombre}] ${p.nombre}`);
      omitidos++;
      continue;
    }

    await prisma.producto.create({
      data: {
        codigo:      `WD-${counter}`,
        nombre:      p.nombre,
        descripcion: p.descripcion,
        precio:      p.precio,
        imagen:      p.imagen,
        ivaActivo:   p.ivaActivo,
        ivaPorc:     p.ivaPorc,
        activo:      true,
        enMenu:      true,
        enMenuQR:    true,
        enKiosko:    false,
        stock:       "0",
        stockMinimo: "0",
        categoriaId: p.categoriaId,
        sucursalId:  WOKIDOKI_ID,
      },
    });

    console.log(`  ✅ Creado WD-${counter}: [${p.categoria?.nombre}] ${p.nombre} — $${p.precio}`);
    counter++;
    creados++;

    // marcar como existente para evitar duplicar en la misma corrida
    existeSet.add(key);
  }

  console.log(`\n✔  Resumen: ${creados} productos creados, ${omitidos} omitidos.\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
