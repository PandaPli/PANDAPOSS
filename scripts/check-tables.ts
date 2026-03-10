import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  // Verificar que todas las tablas existen con un count
  const results = await Promise.allSettled([
    prisma.venta.count().then(n => `ventas: ${n}`),
    prisma.detalleVenta.count().then(n => `detalles_ventas: ${n}`),
    prisma.kardex.count().then(n => `kardex: ${n}`),
    prisma.producto.count().then(n => `productos: ${n}`),
  ]);
  results.forEach(r => {
    if (r.status === "fulfilled") console.log("✅", r.value);
    else console.log("❌", r.reason?.message);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
