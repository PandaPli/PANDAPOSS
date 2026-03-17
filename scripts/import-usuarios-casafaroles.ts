/**
 * Script de importación de usuarios — CasaFaroles (sucursalId = 2)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const SUCURSAL_ID = 1; // CasaFaroles

const usuarios = [
  { nombre: "MARBELLA PAREDES MARQUEZ",    email: "paredesmarquez@gmail.com",    rol: "SECRETARY",      usuario: "MARBELLA", password: "12345" },
  { nombre: "CAROLINA CABRERA",            email: "secretariaebasica@gmail.com", rol: "RESTAURANTE", usuario: "ADMIN",    password: "12345" },
  { nombre: "LEIDA YARITZA RODRIGUEZ",     email: "leiday@gmail.com",            rol: "CASHIER",        usuario: "LEIDA",    password: "12345" },
  { nombre: "CARLOS JESUS GUTIERREZ",      email: "cjg@gmail.com",               rol: "WAITER",         usuario: "CARLOS",   password: "12345" },
  { nombre: "PEDRO JESUS CHIRINOS",        email: "jesusch@gmail.com",           rol: "CHEF",           usuario: "PEDRO",    password: "12345" },
  { nombre: "RAFAEL CLEMENTINO CONTRERAS", email: "clemen@gmail.com",            rol: "BAR",            usuario: "CLEMEN",   password: "12345" },
  { nombre: "SUSANA CAROLINA MORA DURAN",  email: "carlosduran@gmail.com",       rol: "WAITER",         usuario: "SUSANA",   password: "12345" },
  { nombre: "RAFAEL CHAVEZ RAMIREZ",       email: "rafaelchav@gmail.com",        rol: "DELIVERY",       usuario: "RAFA",     password: "12345" },
  { nombre: "KARLA",                       email: "karlafaroles@gmail.com",      rol: "WAITER",         usuario: "KARLA",    password: "12345" },
];

async function main() {
  console.log("👥 Importando usuarios para CasaFaroles...\n");

  let creados = 0;
  let actualizados = 0;
  let errores = 0;

  for (const u of usuarios) {
    const usuarioUpper = u.usuario.toUpperCase();
    const hash = await bcrypt.hash(u.password, 10);

    try {
      const existe = await prisma.usuario.findUnique({ where: { usuario: usuarioUpper } });

      if (existe) {
        // Nunca sobreescribir un ADMIN_GENERAL
        if (existe.rol === "ADMIN_GENERAL") {
          console.log(`  ⏭️  Omitido:     ${usuarioUpper} — es ADMIN_GENERAL, no se modifica`);
          continue;
        }
        await prisma.usuario.update({
          where: { usuario: usuarioUpper },
          data: {
            nombre: u.nombre,
            email: u.email,
            rol: u.rol as never,
            sucursalId: SUCURSAL_ID,
            password: hash,
            status: "ACTIVO",
          },
        });
        actualizados++;
        console.log(`  ✏️  Actualizado: ${usuarioUpper} — ${u.nombre} (${u.rol})`);
      } else {
        await prisma.usuario.create({
          data: {
            nombre: u.nombre,
            email: u.email,
            rol: u.rol as never,
            usuario: usuarioUpper,
            password: hash,
            sucursalId: SUCURSAL_ID,
            status: "ACTIVO",
          },
        });
        creados++;
        console.log(`  ✅ Creado:     ${usuarioUpper} — ${u.nombre} (${u.rol})`);
      }
    } catch (err) {
      console.error(`  ❌ Error en ${usuarioUpper}: ${err}`);
      errores++;
    }
  }

  console.log(`\n🎉 Importación completada:`);
  console.log(`   ✅ Creados:      ${creados}`);
  console.log(`   ✏️  Actualizados: ${actualizados}`);
  console.log(`   ❌ Errores:      ${errores}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
