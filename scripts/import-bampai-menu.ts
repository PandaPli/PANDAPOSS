/**
 * Importa productos nuevos para BAMPAI (sucursal ID 6)
 * Omite duplicados existentes en DB
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SUCURSAL_ID = 6;

// IDs se resolverán dinámicamente en runtime
let CAT_HOSOMAKI = 0;
let CAT_TABLAS   = 0;

// Productos nuevos agrupados por categoría
// (ya excluidos los que existen: Hosomaki Camarón, Shinchimi Fresh Rolls, todas las Tablas)
const NUEVOS: { cat: string; icono: string; productos: { nombre: string; precio: number }[] }[] = [
  {
    cat: "Hosomaki", icono: "🍣",
    productos: [
      { nombre: "Hosomaki Champiñón", precio: 3000 },
      { nombre: "Hosomaki Pollo",     precio: 3100 },
      { nombre: "Hosomaki Queso",     precio: 2500 },
      { nombre: "Hosomaki Salmón",    precio: 3400 },
    ],
  },
  {
    cat: "Hot Rolls", icono: "🔥",
    productos: [
      { nombre: "Hot Rolls Palmito",  precio: 6000 },
      { nombre: "Hot Rolls Almendra", precio: 6100 },
      { nombre: "Hot Rolls Camarón",  precio: 6500 },
      { nombre: "Hot Rolls Kanikama", precio: 6000 },
      { nombre: "Hot Rolls Pollo",    precio: 6300 },
      { nombre: "Hot Rolls Salmón",   precio: 6600 },
    ],
  },
  {
    cat: "Sakes", icono: "🍱",
    productos: [
      { nombre: "Sake Camarón",  precio: 7400 },
      { nombre: "Sake Champiñón",precio: 7300 },
      { nombre: "Sake Kanikama", precio: 7300 },
      { nombre: "Sake Palta",    precio: 7500 },
      { nombre: "Sake Salmón",   precio: 7500 },
    ],
  },
  {
    cat: "Sushi Burger", icono: "🍔",
    productos: [
      { nombre: "Sushi Burger Camarón",  precio: 6200 },
      { nombre: "Sushi Burger Champiñón",precio: 5900 },
      { nombre: "Sushi Burger Palmito",  precio: 5900 },
      { nombre: "Sushi Burger Pollo",    precio: 5500 },
      { nombre: "Sushi Burger Salmón",   precio: 6500 },
    ],
  },
  {
    cat: "Temaki", icono: "🌯",
    productos: [
      { nombre: "Temaki Camarón",  precio: 3100 },
      { nombre: "Temaki Champiñón",precio: 3000 },
      { nombre: "Temaki Choclo",   precio: 2900 },
      { nombre: "Temaki Pollo",    precio: 3000 },
      { nombre: "Temaki Salmón",   precio: 3200 },
    ],
  },
  {
    cat: "Ramen", icono: "🍜",
    productos: [
      { nombre: "Ramen Camarón",  precio: 6800 },
      { nombre: "Ramen Cerdo",    precio: 7300 },
      { nombre: "Ramen Champiñón",precio: 6000 },
      { nombre: "Ramen Pollo",    precio: 6500 },
      { nombre: "Ramen Salmón",   precio: 7000 },
      { nombre: "Ramen Vacuno",   precio: 7500 },
    ],
  },
  {
    cat: "Woki", icono: "🍛",
    productos: [
      { nombre: "Woki Rice Camarón",      precio: 6000 },
      { nombre: "Woki Rice Cerdo",        precio: 6500 },
      { nombre: "Woki Rice Champiñón",    precio: 5500 },
      { nombre: "Woki Rice Pollo",        precio: 5800 },
      { nombre: "Woki Rice Salmón",       precio: 6000 },
      { nombre: "Woki Rice Vacuno",       precio: 6500 },
      { nombre: "Woki Noodles Camarón",   precio: 6000 },
      { nombre: "Woki Noodles Cerdo",     precio: 6500 },
      { nombre: "Woki Noodles Champiñón", precio: 5500 },
      { nombre: "Woki Noodles Pollo",     precio: 5800 },
      { nombre: "Woki Noodles Salmón",    precio: 6000 },
      { nombre: "Woki Noodles Vacuno",    precio: 6500 },
      { nombre: "Woki Pad Thai Camarón",  precio: 6000 },
      { nombre: "Woki Pad Thai Cerdo",    precio: 6500 },
      { nombre: "Woki Pad Thai Champiñón",precio: 5500 },
      { nombre: "Woki Pad Thai Pollo",    precio: 5800 },
      { nombre: "Woki Pad Thai Salmón",   precio: 6000 },
      { nombre: "Woki Pad Thai Vacuno",   precio: 6500 },
    ],
  },
  {
    cat: "Bowls", icono: "🍲",
    productos: [
      { nombre: "Tropical Bowl Camarón",  precio: 6000 },
      { nombre: "Tropical Bowl Champiñón",precio: 5500 },
      { nombre: "Tropical Bowl Pollo",    precio: 5800 },
      { nombre: "Tropical Bowl Salmón",   precio: 6000 },
    ],
  },
  {
    cat: "Otros", icono: "🍥",
    productos: [
      { nombre: "Sushi Dog Salmón", precio: 5300 },
      { nombre: "Sushi Dog Pollo",  precio: 5000 },
    ],
  },
  {
    cat: "Salsas", icono: "🧂",
    productos: [
      { nombre: "Salsa Acevichada",   precio: 950 },
      { nombre: "Salsa Soya",         precio: 600 },
      { nombre: "Salsa Sriracha Mayo",precio: 950 },
      { nombre: "Salsa Unagui",       precio: 800 },
    ],
  },
  {
    cat: "Extras", icono: "➕",
    productos: [
      { nombre: "Ingrediente Extra", precio: 1000 },
      { nombre: "Papel de Arroz",    precio: 500  },
      { nombre: "Tamago (Huevo)",    precio: 1000 },
    ],
  },
];

async function getOrCreateCategoria(nombre: string, icono: string): Promise<number> {
  // Para Hosomaki/Tablas usamos la existente (o la creamos si no existe)
  if (nombre === "Hosomaki" && CAT_HOSOMAKI > 0) return CAT_HOSOMAKI;
  if (nombre === "Tablas Sushi" && CAT_TABLAS > 0) return CAT_TABLAS;

  const existing = await prisma.categoria.findFirst({ where: { nombre } });
  if (existing) return existing.id;

  const created = await prisma.categoria.create({ data: { nombre, icono } });
  console.log(`  📁 Categoría creada: ${nombre} (id: ${created.id})`);
  return created.id;
}

async function getLastBPCode(): Promise<number> {
  const last = await prisma.producto.findFirst({
    where: { codigo: { startsWith: "BP-" } },
    orderBy: { codigo: "desc" },
    select: { codigo: true },
  });
  if (!last) return 1;
  const num = parseInt(last.codigo.replace("BP-", ""), 10);
  return isNaN(num) ? 1 : num + 1;
}

async function main() {
  // Resolver IDs de categorías existentes dinámicamente
  const catHoso = await prisma.categoria.findFirst({ where: { nombre: "Hosomaki" } });
  if (catHoso) { CAT_HOSOMAKI = catHoso.id; console.log(`  Hosomaki → id ${CAT_HOSOMAKI}`); }
  const catTablas = await prisma.categoria.findFirst({ where: { nombre: "Tablas Sushi" } });
  if (catTablas) { CAT_TABLAS = catTablas.id; console.log(`  Tablas Sushi → id ${CAT_TABLAS}`); }

  let counter = await getLastBPCode();
  let creados = 0;
  let omitidos = 0;

  for (const grupo of NUEVOS) {
    const catId = await getOrCreateCategoria(grupo.cat, grupo.icono);
    console.log(`\n🗂  ${grupo.cat} (cat ${catId})`);

    for (const p of grupo.productos) {
      // Verificar duplicado por nombre
      const existe = await prisma.producto.findFirst({
        where: { nombre: p.nombre, sucursalId: SUCURSAL_ID },
      });
      if (existe) {
        console.log(`  ⏭️  Ya existe: ${p.nombre}`);
        omitidos++;
        continue;
      }

      const codigo = `BP-${String(counter).padStart(4, "0")}`;
      counter++;

      await prisma.producto.create({
        data: {
          codigo,
          nombre: p.nombre,
          precio: p.precio,
          categoriaId: catId,
          sucursalId: SUCURSAL_ID,
          activo: true,
          enMenu: true,
          enMenuQR: true,
          stock: 0,
          stockMinimo: 0,
        },
      });
      console.log(`  ✅ ${codigo}  ${p.nombre}  $${p.precio.toLocaleString()}`);
      creados++;
    }
  }

  console.log(`\n=== RESUMEN ===`);
  console.log(`✅ Creados:  ${creados}`);
  console.log(`⏭️  Omitidos: ${omitidos}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
