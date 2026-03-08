import { PrismaClient, Rol, EstadoCaja } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding PANDAPLI database...");

  // Configuración general
  await prisma.configuracion.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nombreEmpresa: "PANDAPLI",
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
      email: "admin@pandapli.com",
      rol: Rol.ADMIN_GENERAL,
      sucursalId: sucursal.id,
    },
  });

  // Sala y mesas de ejemplo
  const sala = await prisma.sala.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, nombre: "Salón Principal", sucursalId: sucursal.id },
  });

  const mesasData = ["Mesa 1", "Mesa 2", "Mesa 3", "Mesa 4", "Mesa 5", "Mesa 6"].map(
    (nombre) => ({ nombre, salaId: sala.id, capacidad: 4 })
  );
  for (const m of mesasData) {
    await prisma.mesa.create({ data: m }).catch(() => {});
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
