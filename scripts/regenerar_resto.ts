import { PrismaClient, EstadoCaja, Rol } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Asegurando sucursales Casa Faroles y KairoSushi...");

  // Casa Faroles (Actualizar ID 1 que es Casa Matriz por defecto)
  const casaFaroles = await prisma.sucursal.upsert({
    where: { id: 1 },
    update: { nombre: "Casa Faroles", plan: "PRO", menuQR: true, delivery: true },
    create: { id: 1, nombre: "Casa Faroles", simbolo: "$", plan: "PRO", menuQR: true, delivery: true },
  });
  console.log(`✅ Sucursal: ${casaFaroles.nombre} (ID: ${casaFaroles.id})`);

  // KairoSushi (Crear ID 3)
  const kairo = await prisma.sucursal.upsert({
     where: { id: 3 },
     update: { nombre: "KairoSushi Bollenar", plan: "PRO", menuQR: true, delivery: true },
     create: { id: 3, nombre: "KairoSushi Bollenar", simbolo: "$", plan: "PRO", menuQR: true, delivery: true },
  });
  console.log(`✅ Sucursal: ${kairo.nombre} (ID: ${kairo.id})`);

  const hash = await bcrypt.hash("12345", 10);
  
  // Usuario Kairosushi
  const usuarioKairo = await prisma.usuario.upsert({
    where: { usuario: "KAIRO" },
    update: { password: hash, rol: Rol.RESTAURANTE, sucursalId: kairo.id, status: "ACTIVO" },
    create: { nombre: "KairoSushi", usuario: "KAIRO", email: "kairo@pandaposs.com", password: hash, rol: Rol.RESTAURANTE, sucursalId: kairo.id, status: "ACTIVO" },
  });
  console.log(`✅ Usuario creado: ${usuarioKairo.usuario} (Rol: ${usuarioKairo.rol})`);

  // Asegurar caja Kairo
  await prisma.caja.upsert({
     where: { id: 3 },
     update: { estado: EstadoCaja.CERRADA, sucursalId: kairo.id },
     create: { id: 3, nombre: "Caja KairoSushi", estado: EstadoCaja.CERRADA, sucursalId: kairo.id },
  });

  console.log("✅ Configuración completada.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
