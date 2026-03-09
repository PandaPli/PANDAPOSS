/**
 * Script de importación masiva — CasaFaroles
 * Fuente: productos_cargamasiva_CasaFaroles.csv
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SUCURSAL_ID = 2; // CasaFaroles

// Datos del CSV — precios en CLP (S/. = símbolo local)
const csvData = [
  { codigo: "153",  categoria: "BAR",          nombre: "A CARMEN ETIQUETA NEGRA",  precio: 6900 },
  { codigo: "119",  categoria: "BAR",          nombre: "ABSOLUT",                  precio: 6500 },
  { codigo: "135",  categoria: "BAR",          nombre: "ABSOLUT SABORES",          precio: 6900 },
  { codigo: "190",  categoria: "SIN ALCOHOL",  nombre: "AGUA CON GAS",             precio: 1900 },
  { codigo: "850",  categoria: "SIN ALCOHOL",  nombre: "AGUA CON GAS (2)",         precio: 1900 },
  { codigo: "195",  categoria: "SIN ALCOHOL",  nombre: "AGUA SIN GAS",             precio: 1900 },
  { codigo: "68",   categoria: "BAR",          nombre: "ALTO DEL CARMEN 35",       precio: 4900 },
  { codigo: "851",  categoria: "BAR",          nombre: "ALTO DEL CARMEN 35°",      precio: 4900 },
  { codigo: "150",  categoria: "BAR",          nombre: "ALTO DEL CARMEN 40°",      precio: 5800 },
  { codigo: "151",  categoria: "BAR",          nombre: "ALTO TRANSP 40°",          precio: 5900 },
  { codigo: "1001", categoria: "BAR",          nombre: "AMARETTO",                 precio: 5900 },
  { codigo: "2",    categoria: "BAR",          nombre: "AMARETTO DISARONNO",       precio: 6900 },
  { codigo: "1",    categoria: "BEBIDAS",      nombre: "AMARETTO SOUR",            precio: 5900 },
  { codigo: "31",   categoria: "BAR",          nombre: "APEROL",                   precio: 6900 },
  { codigo: "186",  categoria: "BAR",          nombre: "APEROL MARACUYA",          precio: 7900 },
  { codigo: "63",   categoria: "BROCHETAS",    nombre: "ARPONES DE CARNE",         precio: 12900 },
  { codigo: "64",   categoria: "BROCHETAS",    nombre: "ARPONES DE POLLO",         precio: 10900 },
  { codigo: "89",   categoria: "BAR",          nombre: "AUSTRAL CALAFATE",         precio: 4500 },
  { codigo: "852",  categoria: "BAR",          nombre: "AUSTRAL CALAFATE (2)",     precio: 4500 },
  { codigo: "116",  categoria: "BAR",          nombre: "AUSTRAL CALAFATE 500CC",   precio: 5800 },
  { codigo: "90",   categoria: "BAR",          nombre: "AUSTRAL LAGER",            precio: 4500 },
  { codigo: "91",   categoria: "BAR",          nombre: "AUSTRAL TORRES DEL PAINE", precio: 4500 },
  { codigo: "270",  categoria: "SANDWICHS AVE",nombre: "AVE ALEMAN",               precio: 7800 },
  { codigo: "184",  categoria: "SANDWICHS AVE",nombre: "AVE CHACARERA",            precio: 7800 },
  { codigo: "271",  categoria: "SANDWICHS AVE",nombre: "AVE COMPLETO",             precio: 7800 },
  { codigo: "273",  categoria: "SANDWICHS AVE",nombre: "AVE ITALIANA",             precio: 8800 },
  { codigo: "274",  categoria: "SANDWICHS AVE",nombre: "AVE LUCO",                 precio: 7700 },
  { codigo: "278",  categoria: "SANDWICHS AVE",nombre: "AVE MAYO",                 precio: 7600 },
  { codigo: "277",  categoria: "SANDWICHS AVE",nombre: "AVE PALTA",                precio: 7600 },
  { codigo: "275",  categoria: "SANDWICHS AVE",nombre: "AVE PIMENTON",             precio: 7400 },
  { codigo: "183",  categoria: "SANDWICHS AVE",nombre: "AVE SOLA",                 precio: 7200 },
  { codigo: "276",  categoria: "SANDWICHS AVE",nombre: "AVE TOMATE",               precio: 7600 },
];

async function main() {
  console.log("🚀 Importando productos para CasaFaroles...\n");

  // 1. Crear categorías únicas si no existen
  const categoriasUnicas = [...new Set(csvData.map((r) => r.categoria))];
  const categoriaMap: Record<string, number> = {};

  for (const nombre of categoriasUnicas) {
    const cat = await prisma.categoria.upsert({
      where: { nombre },
      update: {},
      create: { nombre, activa: true },
    });
    categoriaMap[nombre] = cat.id;
    console.log(`📁 Categoría: ${nombre} (id=${cat.id})`);
  }

  // 2. Importar productos (upsert por código)
  let creados = 0;
  let actualizados = 0;
  let errores = 0;

  for (const row of csvData) {
    // El código en la BD es UPPERCASE y único globalmente
    // Para CasaFaroles usamos prefijo CF- para evitar colisiones
    const codigoFinal = `CF-${row.codigo.padStart(4, "0")}`;

    try {
      const existing = await prisma.producto.findUnique({ where: { codigo: codigoFinal } });

      if (existing) {
        await prisma.producto.update({
          where: { codigo: codigoFinal },
          data: {
            nombre: row.nombre,
            precio: row.precio,
            categoriaId: categoriaMap[row.categoria],
            sucursalId: SUCURSAL_ID,
            enMenu: true,
            activo: true,
          },
        });
        actualizados++;
        console.log(`  ✏️  Actualizado: ${codigoFinal} — ${row.nombre}`);
      } else {
        await prisma.producto.create({
          data: {
            codigo: codigoFinal,
            nombre: row.nombre,
            precio: row.precio,
            categoriaId: categoriaMap[row.categoria],
            sucursalId: SUCURSAL_ID,
            enMenu: true,
            activo: true,
            stock: 0,
            stockMinimo: 0,
          },
        });
        creados++;
        console.log(`  ✅ Creado:     ${codigoFinal} — ${row.nombre} ($${row.precio.toLocaleString()})`);
      }
    } catch (err) {
      console.error(`  ❌ Error en ${codigoFinal}: ${err}`);
      errores++;
    }
  }

  console.log(`\n🎉 Importación completada:`);
  console.log(`   ✅ Creados:     ${creados}`);
  console.log(`   ✏️  Actualizados: ${actualizados}`);
  console.log(`   ❌ Errores:     ${errores}`);
  console.log(`   📦 Total:       ${csvData.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
