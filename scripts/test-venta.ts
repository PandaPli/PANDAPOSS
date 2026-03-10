import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["query", "error", "warn"] });

async function main() {
  console.log("=== Diagnóstico de Ventas ===\n");

  // 1. Verificar conexión y tablas
  try {
    const ventasCount = await prisma.venta.count();
    console.log(`✅ Tabla ventas accesible. Registros: ${ventasCount}`);

    const detallesCount = await prisma.detalleVenta.count();
    console.log(`✅ Tabla detalles_ventas accesible. Registros: ${detallesCount}`);

    const kardexCount = await prisma.kardex.count();
    console.log(`✅ Tabla kardex accesible. Registros: ${kardexCount}`);
  } catch (e) {
    console.error("❌ Error accediendo a tablas:", e);
    return;
  }

  // 2. Verificar que existen registros referenciados
  const usuario = await prisma.usuario.findFirst({ where: { status: "ACTIVO" } });
  if (!usuario) {
    console.error("❌ No hay usuarios activos");
    return;
  }
  console.log(`\n✅ Usuario encontrado: id=${usuario.id} nombre=${usuario.nombre} rol=${usuario.rol}`);

  const caja = await prisma.caja.findFirst({ where: { estado: "ABIERTA" } });
  console.log(caja
    ? `✅ Caja abierta: id=${caja.id} nombre=${caja.nombre}`
    : `⚠️ No hay cajas abiertas (se usará cajaId: null)`
  );

  const producto = await prisma.producto.findFirst({ where: { activo: true, enMenu: true } });
  if (!producto) {
    console.error("❌ No hay productos activos en menú");
    return;
  }
  console.log(`✅ Producto encontrado: id=${producto.id} codigo=${producto.codigo} nombre=${producto.nombre} precio=${producto.precio}`);

  // 3. Verificar números de venta existentes
  const existingVentas = await prisma.venta.findMany({
    select: { id: true, numero: true },
    orderBy: { id: "desc" },
    take: 5,
  });
  console.log(`\n--- Últimas ventas (para verificar conflictos de número) ---`);
  if (existingVentas.length === 0) {
    console.log("(ninguna venta registrada)");
  } else {
    existingVentas.forEach((v) => console.log(`  id=${v.id} numero=${v.numero}`));
  }

  // 4. Generar número de venta (misma lógica que el API)
  const count = await prisma.venta.count();
  const numero = `VTA-${String(count + 1).padStart(6, "0")}`;
  console.log(`\nNúmero generado: ${numero} (basado en count=${count})`);

  // Verificar si ya existe
  const existing = await prisma.venta.findUnique({ where: { numero } });
  if (existing) {
    console.error(`❌ ¡CONFLICTO! Ya existe una venta con número ${numero} (id=${existing.id})`);
    console.error("   ESTE ES PROBABLEMENTE EL ERROR.");
    return;
  }
  console.log(`✅ Número ${numero} disponible`);

  // 5. Simular exactamente lo que envía el CheckoutModal
  const mockBody = {
    cajaId: caja?.id ?? undefined,
    clienteId: null,
    usuarioId: usuario.id,
    mesaId: null,
    metodoPago: "EFECTIVO" as const,
    subtotal: Number(producto.precio),
    descuento: 0,
    impuesto: 0,
    total: Number(producto.precio),
    items: [
      {
        productoId: producto.id,
        comboId: null,
        cantidad: 1,
        precio: Number(producto.precio),
        subtotal: Number(producto.precio),
      },
    ],
  };

  console.log("\n--- Body simulado (lo que envía CheckoutModal) ---");
  console.log(JSON.stringify(mockBody, null, 2));

  // 6. Intentar crear la venta (EXACTA misma lógica del API)
  console.log("\n--- Intentando crear venta con $transaction ---");
  try {
    const venta = await prisma.$transaction(async (tx) => {
      console.log("  [tx] Creando venta...");
      const v = await tx.venta.create({
        data: {
          numero,
          cajaId: mockBody.cajaId ? Number(mockBody.cajaId) : null,
          clienteId: mockBody.clienteId ? Number(mockBody.clienteId) : null,
          usuarioId: Number(mockBody.usuarioId),
          subtotal: Number(mockBody.subtotal),
          descuento: Number(mockBody.descuento || 0),
          impuesto: Number(mockBody.impuesto || 0),
          total: Number(mockBody.total),
          metodoPago: mockBody.metodoPago,
          estado: "PAGADA",
          detalles: {
            create: mockBody.items.map((item) => ({
              productoId: item.productoId ? Number(item.productoId) : null,
              comboId: item.comboId ? Number(item.comboId) : null,
              cantidad: Number(item.cantidad),
              precio: Number(item.precio),
              descuento: 0,
              subtotal: Number(item.subtotal),
            })),
          },
        },
      });
      console.log(`  [tx] ✅ Venta creada: id=${v.id} numero=${v.numero}`);

      // Actualizar stock y kardex
      for (const item of mockBody.items) {
        if (item.productoId) {
          console.log(`  [tx] Decrementando stock de producto ${item.productoId}...`);
          await tx.producto.update({
            where: { id: Number(item.productoId) },
            data: { stock: { decrement: Number(item.cantidad) } },
          });

          console.log(`  [tx] Creando kardex para producto ${item.productoId}...`);
          await tx.kardex.create({
            data: {
              productoId: Number(item.productoId),
              tipo: "SALIDA",
              cantidad: Number(item.cantidad),
              motivo: "Venta",
              ventaId: v.id,
            },
          });
        }
      }

      // Mesa (no aplica en este test)
      return v;
    });

    console.log("\n🎉 ¡VENTA CREADA EXITOSAMENTE!");
    console.log(`   ID: ${venta.id}`);
    console.log(`   Número: ${venta.numero}`);
    console.log(`   Total: ${venta.total}`);
    console.log(`   Estado: ${venta.estado}`);

    // Verificar que se creó correctamente
    const detalles = await prisma.detalleVenta.findMany({ where: { ventaId: venta.id } });
    console.log(`   Detalles creados: ${detalles.length}`);

    const kardexEntries = await prisma.kardex.findMany({ where: { ventaId: venta.id } });
    console.log(`   Entradas kardex: ${kardexEntries.length}`);

  } catch (error) {
    console.error("\n❌ ERROR AL CREAR VENTA:");
    console.error(error);

    if (error instanceof Error) {
      console.error("\n--- Detalles del error ---");
      console.error("Name:", error.name);
      console.error("Message:", error.message);
      console.error("Stack:", error.stack?.split("\n").slice(0, 5).join("\n"));
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
