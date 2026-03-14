/**
 * Carga los 4 productos con datos de stock corruptos en el Excel.
 * Se insertan con stock=0 y stockMinimo=0.
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const SUCURSAL_ID = 1; // CasaFaroles

const productos = [
  { codigo: "CF-10522",         categoria: "BEBIDAS", nombre: "COCA COLA 330",  costo: 200,  precio: 1900 },
  { codigo: "CF-14521452000",   categoria: "BAR",     nombre: "GIN REDBULL",    costo: 7400, precio: 7400 },
  { codigo: "CF-20001",         categoria: "BAR",     nombre: "MOJITO REDBULL", costo: 1500, precio: 7900 },
  { codigo: "CF-105242",        categoria: "BAR",     nombre: "OLD FASHION",    costo: 1500, precio: 6900 },
];

async function main() {
  for (const p of productos) {
    const cat = await prisma.categoria.upsert({
      where: { nombre: p.categoria },
      update: {},
      create: { nombre: p.categoria, activa: true },
    });
    await prisma.producto.upsert({
      where: { codigo: p.codigo },
      update: { nombre: p.nombre, precio: p.precio, costo: p.costo, categoriaId: cat.id, sucursalId: SUCURSAL_ID, stock: 0, stockMinimo: 0, enMenu: true, activo: true },
      create: { codigo: p.codigo, nombre: p.nombre, precio: p.precio, costo: p.costo, categoriaId: cat.id, sucursalId: SUCURSAL_ID, stock: 0, stockMinimo: 0, enMenu: true, activo: true },
    });
    console.log(`✅ ${p.codigo} — ${p.nombre} (stock corregido a 0)`);
  }
  console.log("\n✅ 4 productos corregidos e insertados.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
