// scripts/import-bampai-completo.mjs
// Agrega productos FALTANTES de BamPai (sucursalId=6) sin duplicar los existentes
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const SUCURSAL_ID = 6;

const MENU = [
  // ─── ROLLS PREMIUM ───────────────────────────────────────────────
  { cat: "Rolls Premium", icono: "🔥", productos: [
    { nombre: "Acevichado Hot",         precio: 8900 },
    { nombre: "Suka Acevichada Rolls",  precio: 6800 },
    { nombre: "Shinchimi Fresh Rolls",  precio: 8900 },
    { nombre: "Chicken Woo",            precio: 8900 },
    { nombre: "DolceWoow",              precio: 8900 },
  ]},
  // ─── AVOCADO ROLLS ───────────────────────────────────────────────
  { cat: "Avocado Rolls", icono: "🥑", productos: [
    { nombre: "Avocado Camarón",    precio: 6500 },
    { nombre: "Avocado Champiñón",  precio: 6200 },
    { nombre: "Avocado Kanikama",   precio: 6200 },
    { nombre: "Avocado Palmito",    precio: 6200 },
    { nombre: "Avocado Pollo",      precio: 6300 },
    { nombre: "Avocado Salmón",     precio: 6300 },
  ]},
  // ─── CALIFORNIA ROLLS ────────────────────────────────────────────
  { cat: "California Rolls", icono: "🍥", productos: [
    { nombre: "California Camarón",    precio: 6500 },
    { nombre: "California Champiñón",  precio: 6000 },
    { nombre: "California Kanikama",   precio: 6200 },
    { nombre: "California Palmito",    precio: 6000 },
    { nombre: "California Pollo",      precio: 6300 },
    { nombre: "California Salmón",     precio: 6600 },
  ]},
  // ─── CHEESE CREAM ROLLS ──────────────────────────────────────────
  { cat: "Cheese Cream Rolls", icono: "🧀", productos: [
    { nombre: "Cheese Cream Camarón",    precio: 6600 },
    { nombre: "Cheese Cream Champiñón",  precio: 6000 },
    { nombre: "Cheese Cream Palmito",    precio: 6000 },
    { nombre: "Cheese Cream Pollo",      precio: 6400 },
    { nombre: "Cheese Cream Salmón",     precio: 6700 },
  ]},
  // ─── HOSOMAKI (faltantes) ─────────────────────────────────────────
  { cat: "Hosomaki", icono: "🍣", productos: [
    { nombre: "Hosomaki Camarón", precio: 3300 },
    { nombre: "Hosomaki Choclo",  precio: 2600 },
  ]},
  // ─── HANDROLLS ───────────────────────────────────────────────────
  { cat: "Handrolls", icono: "🍙", productos: [
    { nombre: "Camarón Palta",          precio: 4300 },
    { nombre: "Camarón Queso",          precio: 3600 },
    { nombre: "Camarón Queso Cebollín", precio: 4100 },
    { nombre: "Camarón Queso Palta",    precio: 4600 },
    { nombre: "Champiñón Palta",        precio: 3200 },
    { nombre: "Choclo Palta",           precio: 3300 },
    { nombre: "Choclo Queso",           precio: 3000 },
    { nombre: "Palmito Palta",          precio: 3000 },
    { nombre: "Pollo Palta",            precio: 3500 },
    { nombre: "Pollo Queso",            precio: 3000 },
    { nombre: "Pollo Queso Cebollín",   precio: 3500 },
    { nombre: "Pollo Queso Palta",      precio: 4000 },
    { nombre: "Pollo Solo",             precio: 2900 },
    { nombre: "Queso Aceituna",         precio: 3000 },
    { nombre: "Queso Champiñón",        precio: 3000 },
    { nombre: "Queso Palmito",          precio: 2900 },
    { nombre: "Queso Palta",            precio: 3500 },
    { nombre: "Salmón Palta",           precio: 3800 },
    { nombre: "Salmón Queso",           precio: 3700 },
    { nombre: "Salmón Queso Cebollín",  precio: 4300 },
    { nombre: "Salmón Queso Palta",     precio: 4700 },
    { nombre: "Kanikama Queso",         precio: 2800 },
  ]},
  // ─── FRITOS / ENTRADAS ───────────────────────────────────────────
  { cat: "Fritos / Entradas", icono: "🍤", productos: [
    { nombre: "Bolitas Crispy Camarón",   precio: 3800 },
    { nombre: "Bolitas Crispy Champiñón", precio: 3600 },
    { nombre: "Bolitas Crispy Choclo",    precio: 3600 },
    { nombre: "Bolitas Crispy Kanikama",  precio: 3600 },
    { nombre: "Bolitas Crispy Palta",     precio: 3700 },
    { nombre: "Bolitas Crispy Pollo",     precio: 3700 },
    { nombre: "Bolitas Crispy Salmón",    precio: 3900 },
    { nombre: "Fingers Camarón",          precio: 4800 },
    { nombre: "Fingers Pollo",            precio: 4600 },
    { nombre: "Fingers Salmón",           precio: 4800 },
    { nombre: "Gyozas Camarón",           precio: 6200 },
    { nombre: "Gyozas Pollo",             precio: 5900 },
    { nombre: "Gyozas Salmón",            precio: 6200 },
  ]},
  // ─── FUTOMAKI ────────────────────────────────────────────────────
  { cat: "Futomaki", icono: "🍣", productos: [
    { nombre: "Futomaki Camarón",   precio: 6400 },
    { nombre: "Futomaki Champiñón", precio: 6400 },
    { nombre: "Futomaki Kanikama",  precio: 6300 },
    { nombre: "Futomaki Pollo",     precio: 6400 },
    { nombre: "Futomaki Salmón",    precio: 6400 },
  ]},
  // ─── GOHAN ───────────────────────────────────────────────────────
  { cat: "Gohan", icono: "🍚", productos: [
    { nombre: "Gohan Camarón",     precio: 6000 },
    { nombre: "Gohan Champiñón",   precio: 5700 },
    { nombre: "Gohan Kanikama",    precio: 5900 },
    { nombre: "Gohan Palmito",     precio: 5700 },
    { nombre: "Gohan Pollo",       precio: 5900 },
    { nombre: "Gohan Pollo Frito", precio: 6300 },
    { nombre: "Gohan Salmón",      precio: 6100 },
  ]},
  // ─── TABLAS ──────────────────────────────────────────────────────
  { cat: "Tablas Sushi", icono: "🍣", productos: [
    { nombre: "Tabla 20 Pz",       precio: 11000 },
    { nombre: "Tabla 20 Vegan",    precio: 11000 },
    { nombre: "Tabla 30 Pz",       precio: 15000 },
    { nombre: "Tabla 30 Veggie",   precio: 15300 },
    { nombre: "Tabla 40 Pz",       precio: 19000 },
    { nombre: "Tabla 50 Pz",       precio: 22000 },
    { nombre: "Tabla 60 Pz",       precio: 24000 },
    { nombre: "Tabla 70 Pz",       precio: 29000 },
    { nombre: "Tabla 80 Pz",       precio: 31000 },
    { nombre: "Tabla Hot 46 Pz",   precio: 18900 },
    { nombre: "Tori Tori 40 Pz",   precio: 18800 },
    { nombre: "Tabla Panda 101 Pz",precio: 36000 },
  ]},
  // ─── BEBIDAS ─────────────────────────────────────────────────────
  { cat: "Bebestibles", icono: "🥤", productos: [
    { nombre: "Agua",           precio: 1000 },
    { nombre: "Bebida Lata 220",precio: 1000 },
    { nombre: "Bebida Lata 350",precio: 1500 },
  ]},
  // ─── DELIVERY ────────────────────────────────────────────────────
  { cat: "Delivery", icono: "🚚", enMenu: false, enMenuQR: false, productos: [
    { nombre: "Delivery $3.000", precio: 3000 },
    { nombre: "Delivery $3.200", precio: 3200 },
    { nombre: "Delivery $3.300", precio: 3300 },
    { nombre: "Delivery $3.500", precio: 3500 },
    { nombre: "Delivery $3.800", precio: 3800 },
  ]},
];

async function getOrCreate(nombre, icono) {
  const ex = await prisma.categoria.findFirst({ where: { nombre } });
  if (ex) return ex.id;
  const cr = await prisma.categoria.create({ data: { nombre, icono } });
  console.log(`  📁 Categoría creada: ${nombre} (id:${cr.id})`);
  return cr.id;
}

async function getLastCode() {
  const last = await prisma.producto.findFirst({
    where: { codigo: { startsWith: "BP-" } },
    orderBy: { codigo: "desc" },
    select: { codigo: true },
  });
  if (!last) return 1;
  const n = parseInt(last.codigo.split("-")[1]);
  return isNaN(n) ? 1 : n + 1;
}

async function main() {
  let counter = await getLastCode();
  let creados = 0, omitidos = 0;

  for (const grupo of MENU) {
    const catId = await getOrCreate(grupo.cat, grupo.icono);
    const enMenu   = grupo.enMenu   !== false;
    const enMenuQR = grupo.enMenuQR !== false;

    for (const p of grupo.productos) {
      const existe = await prisma.producto.findFirst({
        where: { nombre: p.nombre, sucursalId: SUCURSAL_ID },
      });
      if (existe) { omitidos++; continue; }

      const codigo = `BP-${String(counter).padStart(4, "0")}`;
      counter++;
      await prisma.producto.create({
        data: {
          codigo,
          nombre: p.nombre,
          precio: p.precio,
          stock: 999,
          stockMinimo: 0,
          sucursalId: SUCURSAL_ID,
          categoriaId: catId,
          enMenu,
          enMenuQR,
          enKiosko: true,
        },
      });
      console.log(`  ✅ ${codigo}  ${p.nombre}  $${p.precio.toLocaleString("es-CL")}`);
      creados++;
    }
  }

  console.log(`\n=== RESUMEN ===\n✅ Creados:  ${creados}\n⏭  Omitidos: ${omitidos}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
