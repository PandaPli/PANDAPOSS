const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const clientes = [
  { nombre: "Alvaro Hernandez", email: "a.r.hernandez44@gmail.com", telefono: "56979704788" },
  { nombre: "Maria Loyola", email: "abigail.loyola@gmail.com", telefono: "56981216655" },
  { nombre: "Amaro Diaz", email: "adsamaro16@gmail.com", telefono: "56945411699" },
  { nombre: "Ailin Vidal", email: "ailin.vidal@ug.uchile.cl", telefono: "56985182277" },
  { nombre: "Nicolas Shaw", email: "aktiscn@gmail.com", telefono: "56999160871" },
  { nombre: "Yerko Becerra", email: "yerkoandresbecerra1995@gmail.com", telefono: "56932206802" },
  { nombre: "Diana Zuñiga", email: "diana.zuniga.n@gmail.com", telefono: "56964140904" },
  { nombre: "Aldo Moreno", email: "aldo.moreno.gomez@gmail.com", telefono: "56997696288" },
  { nombre: "Alejandro Silva", email: "alejandrosilvawrt23@gmail.com", telefono: "56981540366" },
  { nombre: "Alexis Badilla", email: "alexisbadilla314@gmail.com", telefono: "56993886112" },
  { nombre: "Daniela Pardo", email: "pardodiazdanielacarolina@gmail.com", telefono: "56986577181" },
  { nombre: "Maritza Ur", email: "anexosaum@gmail.com", telefono: "56948979565" },
  { nombre: "Camila Gonzalez Fajardo", email: "camila_rna17@hotmail.com", telefono: "56992494117" },
  { nombre: "Andres Ponce", email: "and96ponce@gmail.com", telefono: "56956035685" },
  { nombre: "Dorita Vicencio", email: "vicenciodoralisa@gmail.com", telefono: "56986004670" },
  { nombre: "Maria Paz Olivares", email: "olivaresalvarezmariapaz@gmail.com", telefono: "56999573904" },
  { nombre: "Gonzalo Garcia", email: "ggarcia@tactech.cl", telefono: "56986534563" },
  { nombre: "Allison Loyola", email: "alyloyolasoto@gmail.com", telefono: "56984607674" },
  { nombre: "Maximiliano Lohse", email: "maximilianolohse24@gmail.com", telefono: "56936891416" },
  { nombre: "Ana Campos", email: "ana683096@gmail.com", telefono: "56981965472" },
  { nombre: "Ignacio Folch", email: "ifolch@tactech.cl", telefono: "56990468972" },
  { nombre: "Josefina Valenzuela", email: "jvalenzuela@tactech.cl", telefono: "56994343632" },
  { nombre: "Andrea Belmar", email: "andreabelmar@gmail.com", telefono: "56995990388" },
  { nombre: "Angela Perez Canales", email: "angelillaperez@gmail.com", telefono: "56989937321" },
  { nombre: "Camila Acuña", email: "camila4595@gmail.com", telefono: "56942397324" },
  { nombre: "Sebastian Araya Quiroga", email: "sebastianarayaquiroga1989@gmail.com", telefono: "56948450591" },
  { nombre: "Francisco Bastidas", email: "fbastidasj@gmail.com", telefono: "56931756890" },
  { nombre: "Mauricio Javier Peña Verdugo", email: "mauricio.pena.tens@gmail.com", telefono: "56998199296" },
  { nombre: "Antonia Flores", email: "antoniafh1d@gmail.com", telefono: "56997078227" },
  { nombre: "Armando Vera", email: "armando.soluciones.energia87@gmail.com", telefono: "56995302629" }
];

async function run() {
  const sucursal = await prisma.sucursal.findFirst({
    where: { nombre: { contains: 'NETAA' } }
  });

  if (!sucursal) {
    console.log('Sucursal NETAA no encontrada, abortando importación de clientes.');
    return;
  }

  console.log(`Sucursal encontrada: ${sucursal.nombre} (ID: ${sucursal.id})`);

  let added = 0;
  for (const c of clientes) {
    // Si queremos importar clientes directamente
    // con la direccion en el modelo de cliente o en DireccionCliente:
    // El modelo Cliente tiene "direccion String?". Lo usaremos
    // Asi como dice la instrucción: "direccion por defecto: Av Siempre Viva 1223"

    try {
      await prisma.cliente.create({
        data: {
          nombre: c.nombre,
          email: c.email,
          telefono: c.telefono,
          direccion: "Av Siempre Viva 1223",
          sucursalId: sucursal.id,
          activo: true
        }
      });
      added++;
      console.log(`Agregado: ${c.nombre}`);
    } catch (e) {
      console.error(`Error agregando a ${c.nombre}:`, e.message);
    }
  }

  console.log(`\n¡Importación lista! Se agregaron ${added} clientes.`);
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
