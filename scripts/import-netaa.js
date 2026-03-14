const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const netaaProducts = [
  // 🌯 Burritos
  { nombre: "Burrito Enchilado 🔥", descripcion: "Tortilla de trigo rellena con preparación enchilada y mix de ingredientes frescos.", precio: 6900, categoria: "Burritos" },
  { nombre: "Burrito Ranchero", descripcion: "Tortilla de trigo rellena estilo ranchero con proteínas y toppings tradicionales.", precio: 6900, categoria: "Burritos" },
  { nombre: "Burrito NETAA", descripcion: "Tortilla de trigo con porotos, proteína sazonada y acompañamientos frescos.", precio: 6900, categoria: "Burritos" },
  { nombre: "Burrito Mariachi", descripcion: "Tortilla de trigo rellena con carne sazonada estilo mexicano y mix de vegetales.", precio: 6900, categoria: "Burritos" },
  { nombre: "Burrito Wero", descripcion: "Tortilla de trigo rellena con arroz, proteína y toppings frescos.", precio: 6900, categoria: "Burritos" },
  { nombre: "Burrito Tejano", descripcion: "Tortilla de trigo rellena con carne estilo tejano y acompañamientos frescos.", precio: 6900, categoria: "Burritos" },

  // 🍟 Papas Fritas
  { nombre: "Papas Suprema", descripcion: "Papas fritas crujientes con carne, salsas y toppings especiales de la casa.", precio: 7699, categoria: "Papas Fritas" },
  { nombre: "Papas Chingonas", descripcion: "Papas fritas con carne sazonada, queso fundido y mix de salsas.", precio: 7400, categoria: "Papas Fritas" },
  { nombre: "Papas Sour", descripcion: "Papas fritas cubiertas con salsa de queso y salsa ácida tipo sour cream.", precio: 6100, categoria: "Papas Fritas" },

  // 🧀 Nachos
  { nombre: "Nachos Supreme", descripcion: "Nachos crujientes con carne molida, salsa de queso y toppings frescos.", precio: 7300, categoria: "Nachos" },
  { nombre: "Nachos Chingones", descripcion: "Nachos con carne molida, guacamole, salsas y crema ácida.", precio: 7400, categoria: "Nachos" },
  { nombre: "Nachos Sour", descripcion: "Nachos bañados en salsa de queso con salsa ácida y toppings frescos.", precio: 6000, categoria: "Nachos" },

  // 🫓 Quesadillas
  { nombre: "Quesadilla Carne y Queso", descripcion: "Tortilla de trigo tostada rellena con carne sazonada y queso fundido.", precio: 6500, categoria: "Quesadillas" },
  { nombre: "Quesadilla Queso", descripcion: "Tortilla de trigo tostada rellena con abundante queso fundido.", precio: 5200, categoria: "Quesadillas" },
  { nombre: "Quesadilla Pollo y Queso", descripcion: "Tortilla de trigo tostada rellena con pollo sazonado y queso fundido.", precio: 6400, categoria: "Quesadillas" },
];

async function run() {
  const sucursal = await prisma.sucursal.findFirst({
    where: { nombre: { contains: 'NETAA' } }
  });

  if (!sucursal) {
    console.log('Sucursal NETAA no encontrada, abortando inserción.');
    return;
  }

  console.log(`Sucursal encontrada: ${sucursal.nombre} (ID: ${sucursal.id})`);

  for (const item of netaaProducts) {
    // 1. Obtener o crear la categoría
    let cat = await prisma.categoria.findUnique({
      where: { nombre: item.categoria }
    });
    
    if (!cat) {
      cat = await prisma.categoria.create({
        data: { nombre: item.categoria, activa: true }
      });
      console.log(`Categoría creada: ${cat.nombre}`);
    }

    // 2. Crear el producto
    // Generar prefijo de código usando las iniciales de categoría + timestamp
    const codigoPrefix = item.categoria.substring(0, 3).toUpperCase();
    const codigoUnico = `${codigoPrefix}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;

    await prisma.producto.create({
      data: {
        codigo: codigoUnico,
        nombre: item.nombre,
        descripcion: item.descripcion,
        precio: item.precio,
        stock: 1000, 
        stockMinimo: 10,
        categoriaId: cat.id,
        sucursalId: sucursal.id,
        activo: true,
        enMenu: true
      }
    });

    console.log(`Agregado: ${item.nombre}`);
  }

  console.log('Importación de productos completada exitosamente.');
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
