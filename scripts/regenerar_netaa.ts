import { PrismaClient, EstadoCaja } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Regenerando datos de NETAA...");

  // Crear sucursal NETAA
  const sucursal = await prisma.sucursal.upsert({
    where: { id: 2 }, // Assuming it might be ID 2 or just creating a new one
    update: {
      nombre: "Netaa Mx",
      plan: "PRO",
      menuQR: true,
      delivery: true,
      correoActivo: true
    },
    create: {
      nombre: "Netaa Mx",
      simbolo: "$",
      plan: "PRO",
      menuQR: true,
      delivery: true,
      correoActivo: true
    },
  });

  console.log(`✅ Sucursal creada: ${sucursal.nombre} (ID: ${sucursal.id})`);

  // Crear usuario NETAA
  const hash = await bcrypt.hash("12345", 10);
  const usuario = await prisma.usuario.upsert({
    where: { usuario: "NETAA" },
    update: {
      sucursalId: sucursal.id,
      rol: "RESTAURANTE", // Using the new role!
      password: hash,
      status: "ACTIVO"
    },
    create: {
      nombre: "Netaa Mx",
      usuario: "NETAA",
      email: "netaa@pandaposs.com",
      password: hash,
      rol: "RESTAURANTE", // Using the new role!
      sucursalId: sucursal.id,
      status: "ACTIVO"
    },
  });

  console.log(`✅ Usuario creado: ${usuario.usuario} (Rol: ${usuario.rol})`);

    // Caja NETAA
    await prisma.caja.create({
      data: {
        nombre: "Caja Principal NETAA",
        estado: EstadoCaja.CERRADA,
        sucursalId: sucursal.id,
      },
    });
    
    console.log(`✅ Caja creada para NETAA`);

  console.log("✅ Proceso completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
