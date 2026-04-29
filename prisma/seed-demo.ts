import { PrismaClient, Rol, EstadoCaja, SectorTipo, PlanTipo } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_SUCURSAL_ID = 5;
const DEMO_USUARIO_ID  = 13;

async function main() {
  console.log("🎭 Creando entorno DEMO...");

  // Sucursal DEMO
  await prisma.sucursal.upsert({
    where: { id: DEMO_SUCURSAL_ID },
    update: {
      nombre:        "PandaPoss Demo",
      plan:          PlanTipo.DEMO,
      sector:        SectorTipo.RESTAURANTE_BAR,
      delivery:      true,
      menuQR:        true,
      correoActivo:  false,
      kioskActivo:   true,
      activa:        true,
    },
    create: {
      id:            DEMO_SUCURSAL_ID,
      nombre:        "PandaPoss Demo",
      plan:          PlanTipo.DEMO,
      sector:        SectorTipo.RESTAURANTE_BAR,
      simbolo:       "$",
      delivery:      true,
      menuQR:        true,
      correoActivo:  false,
      kioskActivo:   true,
      activa:        true,
    },
  });

  // Usuario DEMO
  const hash = await bcrypt.hash("demo1234", 10);
  await prisma.usuario.upsert({
    where: { id: DEMO_USUARIO_ID },
    update: {
      nombre:     "Usuario Demo",
      usuario:    "DEMO",
      password:   hash,
      rol:        Rol.RESTAURANTE,
      sucursalId: DEMO_SUCURSAL_ID,
      status:     "ACTIVO",
    },
    create: {
      id:         DEMO_USUARIO_ID,
      nombre:     "Usuario Demo",
      usuario:    "DEMO",
      password:   hash,
      rol:        Rol.RESTAURANTE,
      sucursalId: DEMO_SUCURSAL_ID,
      status:     "ACTIVO",
    },
  });

  // Categorías (compartidas, upsert por nombre)
  const categorias = [
    { nombre: "Entradas",          estacion: "COCINA"   as const },
    { nombre: "Platos Principales",estacion: "COCINA"   as const },
    { nombre: "Postres",           estacion: "COCINA"   as const },
    { nombre: "Bebidas",           estacion: "BARRA"    as const },
    { nombre: "Combos",            estacion: "COCINA"   as const },
  ];
  const catMap: Record<string, number> = {};
  for (const cat of categorias) {
    const c = await prisma.categoria.upsert({
      where:  { nombre: cat.nombre },
      update: {},
      create: { nombre: cat.nombre, estacion: cat.estacion },
    });
    catMap[cat.nombre] = c.id;
  }

  // Sala + mesas
  const sala = await prisma.sala.upsert({
    where: { id: DEMO_SUCURSAL_ID },
    update: { nombre: "Salón Principal", sucursalId: DEMO_SUCURSAL_ID },
    create: { id: DEMO_SUCURSAL_ID, nombre: "Salón Principal", sucursalId: DEMO_SUCURSAL_ID },
  });

  const mesasExistentes = await prisma.mesa.count({ where: { salaId: sala.id } });
  if (mesasExistentes === 0) {
    await prisma.mesa.createMany({
      data: Array.from({ length: 10 }, (_, i) => ({
        nombre:    `Mesa ${i + 1}`,
        salaId:    sala.id,
        capacidad: 4,
      })),
    });
  }

  // Caja DEMO
  await prisma.caja.upsert({
    where: { id: DEMO_SUCURSAL_ID },
    update: { nombre: "Caja Demo", sucursalId: DEMO_SUCURSAL_ID },
    create: {
      id:         DEMO_SUCURSAL_ID,
      nombre:     "Caja Demo",
      estado:     EstadoCaja.CERRADA,
      sucursalId: DEMO_SUCURSAL_ID,
    },
  });

  // Productos de muestra (scoped a sucursal demo)
  const productos = [
    { codigo: "DM-ENT-01", nombre: "Empanada de pino",       precio: 1500, catNombre: "Entradas"          },
    { codigo: "DM-ENT-02", nombre: "Tabla de quesos",        precio: 5900, catNombre: "Entradas"          },
    { codigo: "DM-PP-01",  nombre: "Lomo a lo pobre",        precio: 8900, catNombre: "Platos Principales"},
    { codigo: "DM-PP-02",  nombre: "Pollo a la plancha",     precio: 7500, catNombre: "Platos Principales"},
    { codigo: "DM-PP-03",  nombre: "Pasta al pesto",         precio: 6900, catNombre: "Platos Principales"},
    { codigo: "DM-PP-04",  nombre: "Salmón mediterráneo",    precio: 9900, catNombre: "Platos Principales"},
    { codigo: "DM-POS-01", nombre: "Cheesecake de maracuyá", precio: 3200, catNombre: "Postres"           },
    { codigo: "DM-POS-02", nombre: "Brownie con helado",     precio: 2800, catNombre: "Postres"           },
    { codigo: "DM-BEB-01", nombre: "Agua mineral",           precio:  800, catNombre: "Bebidas"           },
    { codigo: "DM-BEB-02", nombre: "Jugo natural",           precio: 1800, catNombre: "Bebidas"           },
    { codigo: "DM-BEB-03", nombre: "Cerveza artesanal",      precio: 2500, catNombre: "Bebidas"           },
    { codigo: "DM-COM-01", nombre: "Combo familiar",         precio:18900, catNombre: "Combos"            },
  ];

  for (const p of productos) {
    await prisma.producto.upsert({
      where:  { codigo: p.codigo },
      update: { nombre: p.nombre, precio: p.precio, categoriaId: catMap[p.catNombre], sucursalId: DEMO_SUCURSAL_ID },
      create: {
        codigo:      p.codigo,
        nombre:      p.nombre,
        precio:      p.precio,
        categoriaId: catMap[p.catNombre],
        sucursalId:  DEMO_SUCURSAL_ID,
        stock:       999,
        enMenu:      true,
        enMenuQR:    true,
        enKiosko:    true,
      },
    });
  }

  console.log("✅ Demo lista.");
  console.log("   Usuario : DEMO");
  console.log("   Password: demo1234");
  console.log("   Plan    : DEMO (sin límites)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
