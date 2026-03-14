import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const netaaProducts = [
  // Burritos
  { nombre: "Burrito Enchilado 🔥", desc: "Tortilla de trigo rellena con preparación enchilada y mix de ingredientes frescos.", precio: 6900, categoriaNombre: "Burritos" },
  { nombre: "Burrito Ranchero", desc: "Tortilla de trigo rellena estilo ranchero con proteínas y toppings tradicionales.", precio: 6900, categoriaNombre: "Burritos" },
  { nombre: "Burrito NETAA", desc: "Tortilla de trigo con porotos, proteína sazonada y acompañamientos frescos.", precio: 6900, categoriaNombre: "Burritos" },
  { nombre: "Burrito Mariachi", desc: "Tortilla de trigo rellena con carne sazonada estilo mexicano y mix de vegetales.", precio: 6900, categoriaNombre: "Burritos" },
  { nombre: "Burrito Wero", desc: "Tortilla de trigo rellena con arroz, proteína y toppings frescos.", precio: 6900, categoriaNombre: "Burritos" },
  { nombre: "Burrito Tejano", desc: "Tortilla de trigo rellena con carne estilo tejano y acompañamientos frescos.", precio: 6900, categoriaNombre: "Burritos" },
  // Papas Fritas
  { nombre: "Papas Suprema", desc: "Papas fritas crujientes con carne, salsas y toppings especiales de la casa.", precio: 7699, categoriaNombre: "Papas Fritas" },
  { nombre: "Papas Chingonas", desc: "Papas fritas con carne sazonada, queso fundido y mix de salsas.", precio: 7400, categoriaNombre: "Papas Fritas" },
  { nombre: "Papas Sour", desc: "Papas fritas cubiertas con salsa de queso y salsa ácida tipo sour cream.", precio: 6100, categoriaNombre: "Papas Fritas" },
  // Nachos
  { nombre: "Nachos Supreme", desc: "Nachos crujientes con carne molida, salsa de queso y toppings frescos.", precio: 7300, categoriaNombre: "Nachos" },
  { nombre: "Nachos Chingones", desc: "Nachos con carne molida, guacamole, salsas y crema ácida.", precio: 7400, categoriaNombre: "Nachos" },
  { nombre: "Nachos Sour", desc: "Nachos bañados en salsa de queso con salsa ácida y toppings frescos.", precio: 6000, categoriaNombre: "Nachos" },
  // Quesadillas
  { nombre: "Quesadilla Carne y Queso", desc: "Tortilla de trigo tostada rellena con carne sazonada y queso fundido.", precio: 6500, categoriaNombre: "Quesadillas" },
  { nombre: "Quesadilla Queso", desc: "Tortilla de trigo tostada rellena con abundante queso fundido.", precio: 5200, categoriaNombre: "Quesadillas" },
  { nombre: "Quesadilla Pollo y Queso", desc: "Tortilla de trigo tostada rellena con pollo sazonado y queso fundido.", precio: 6400, categoriaNombre: "Quesadillas" }
];

async function main() {
  try {
    // Buscar sucursal Netaa Mx
    const netaa = await prisma.sucursal.findFirst({
      where: { nombre: { contains: "NETAA" } }
    });

    if (!netaa) {
       console.log("No se encontró Netaa Mx");
       return;
    }

    console.log(`Inyectando en ${netaa.nombre} (ID: ${netaa.id})...`);

    // Procesar Categorias y Productos
    let prefixCount = 100;

    for (const prod of netaaProducts) {
      // Find or create Category
      let categoria = await prisma.categoria.findUnique({
        where: { nombre: prod.categoriaNombre }
      });

      if (!categoria) {
        categoria = await prisma.categoria.create({
          data: { nombre: prod.categoriaNombre, activa: true }
        });
        console.log(`Creada Categoría: ${categoria.nombre}`);
      }

      // Generate unique code MX-100, MX-101...
      const codigoStr = `MX-${prefixCount++}`;

      // Create product
      await prisma.producto.create({
        data: {
          codigo: codigoStr,
          nombre: prod.nombre,
          descripcion: prod.desc,
          precio: prod.precio,
          sucursalId: netaa.id,
          categoriaId: categoria.id,
          activo: true,
          enMenu: true
        }
      });
      console.log(`+ ${prod.nombre} insertado correctamente.`);
    }

    console.log("¡Todo listo! Menú Netaa poblado.");

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
