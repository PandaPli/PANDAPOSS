import { PrismaClient, Rol, EstadoCaja } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding PandaPoss database...");

  // Configuración general
  await prisma.configuracion.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nombreEmpresa: "PandaPoss",
      moneda: "CLP",
      simbolo: "$",
      ivaPorc: 19,
    },
  });

  // Sucursal principal
  const sucursal = await prisma.sucursal.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nombre: "Casa Matriz",
      simbolo: "$",
    },
  });

  // Admin general
  const hash = await bcrypt.hash("admin123", 10);
  await prisma.usuario.upsert({
    where: { usuario: "ADMIN" },
    update: {},
    create: {
      nombre: "Administrador General",
      usuario: "ADMIN",
      password: hash,
      email: "admin@pandaposs.com",
      rol: Rol.ADMIN_GENERAL,
      sucursalId: sucursal.id,
    },
  });

  // Punto de atención principal + 30 mesas
  const sala = await prisma.sala.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, nombre: "Mesón", sucursalId: sucursal.id },
  });

  const mesasExistentes = await prisma.mesa.count({ where: { salaId: sala.id } });
  if (mesasExistentes === 0) {
    await prisma.mesa.createMany({
      data: Array.from({ length: 30 }, (_, i) => ({
        nombre: `Mesa ${i + 1}`,
        salaId: sala.id,
        capacidad: 4,
      })),
    });
  }

  // Categorías base
  const cats = ["Entradas", "Platos Principales", "Postres", "Bebidas", "Combos"];
  for (const nombre of cats) {
    await prisma.categoria.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  // Caja principal
  await prisma.caja.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nombre: "Caja Principal",
      estado: EstadoCaja.CERRADA,
      sucursalId: sucursal.id,
    },
  });

  console.log("✅ Seed completado.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
