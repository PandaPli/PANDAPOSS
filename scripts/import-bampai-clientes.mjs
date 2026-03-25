import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SUCURSAL_ID = 6; // BamPai

const CLIENTES = [
  ["Alvaro Hernandez", "a.r.hernandez44@gmail.com", "+56979704788"],
  ["Maria Loyola", "abigail.loyola@gmail.com", "+56981216655"],
  ["Amaro Diaz", "adsamaro16@gmail.com", "+56945411699"],
  ["Ailin Vidal", "ailin.vidal@ug.uchile.cl", "+56985182277"],
  ["Nicolas Shaw", "aktiscn@gmail.com", "+56999160871"],
  ["Yerko Becerra", "yerkoandresbecerra1995@gmail.com", "+56932206802"],
  ["Diana Zuñiga", "diana.zuniga.n@gmail.com", "+56964140904"],
  ["Aldo Moreno", "aldo.moreno.gomez@gmail.com", "+56997696288"],
  ["Alejandro Silva", "alejandrosilvawrt23@gmail.com", "+56981540366"],
  ["Alexis Badilla", "alexisbadilla314@gmail.com", "+56993886112"],
  ["Daniela Pardo", "pardodiazdanielacarolina@gmail.com", "+56986577181"],
  ["Maritza Ur", "anexosaum@gmail.com", "+56948979565"],
  ["Camila Gonzalez Fajardo", "camila_rna17@hotmail.com", "+56992494117"],
  ["Andres Ponce", "and96ponce@gmail.com", "+56956035685"],
  ["Dorita Vicencio", "vicenciodoralisa@gmail.com", "+56986004670"],
  ["Maria Paz Olivares", "olivaresalvarezmariapaz@gmail.com", "+56999573904"],
  ["Gonzalo Garcia", "ggarcia@tactech.cl", "+56986534563"],
  ["Allison Loyola", "alyloyolasoto@gmail.com", "+56984607674"],
  ["Maximiliano Lohse", "maximilianolohse24@gmail.com", "+56936891416"],
  ["Ana Campos", "ana683096@gmail.com", "+56981965472"],
  ["Ignacio Folch", "ifolch@tactech.cl", "+56990468972"],
  ["Josefina Valenzuela", "jvalenzuela@tactech.cl", "+56994343632"],
  ["Andrea Belmar", "andreabelmar@gmail.com", "+56995990388"],
  ["Angela Perez Canales", "angelillaperez@gmail.com", "+56989937321"],
  ["Camila Acuña", "camila4595@gmail.com", "+56942397324"],
  ["Sebastian Araya Quiroga", "sebastianarayaquiroga1989@gmail.com", "+56948450591"],
  ["Francisco Bastidas", "fbastidasj@gmail.com", "+56931756890"],
  ["Mauricio Peña Verdugo", "mauricio.pena.tens@gmail.com", "+56998199296"],
  ["Antonia Flores", "antoniafh1d@gmail.com", "+56997078227"],
  ["Armando Vera", "armando.soluciones.energia87@gmail.com", "+56995302629"],
  ["Bastian Fuentes", "bastianf.villablanca@gmail.com", "+56940716636"],
  ["Bernardita Casanova", "benycasanova@hotmail.com", "+56961386915"],
  ["Betzabet", "betzabetlg@gmail.com", "+56959094811"],
  ["Magaly Cabello", "cabelloabarcamagaly@hotmail.com", "+56984232185"],
  ["Camila Santis", "camilasantisa@gmail.com", "+56966235216"],
  ["Carla Sanchez", "carlaroasanchez@gmail.com", "+56987492913"],
  ["Carolina Rojas", "carlinarojas292@gmail.com", "+56989180545"],
  ["Carlos Altamirano", "carlos.altamirano@outlook.com", "+56942659606"],
  ["Cecilia", "ceciimg16@gmail.com", "+56957850848"],
  ["Rachel Milessi", "chileanstyle@live.com", "+56978075072"],
  ["Claudio Orrego", "claudiohoe@gmail.com", "+56957235303"],
  ["Claudia Melendez", "cmelendezlobos@gmail.com", "+56981279294"],
  ["Cristian", "cristiango898@gmail.com", "+56973023145"],
  ["Cristian Uribe", "curibe@dellorto.cl", "+56975886063"],
  ["Daniela Sepulveda", "danielasepulveda539@gmail.com", "+56983408449"],
  ["Diego Fierro", "dfierro1609@gmail.com", "+56961000334"],
  ["Elena", "elenamr1404@gmail.com", "+56942985417"],
  ["Erick", "erickjv95@gmail.com", "+56962372930"],
  ["Estefany Vega", "estefany.e.vega@gmail.com", "+56973441151"],
  ["Fernanda Quezada", "f.quezadanoriega@gmail.com", "+56941800669"],
  ["Felipe Barrera", "felipebarreraparedes@gmail.com", "+56976190052"],
  ["Francisca Alvarez", "fcaalvarezf@gmail.com", "+56944035405"],
  ["Gabriela Bardones", "gabriela.bardones@hotmail.com", "+56989704251"],
  ["Gerson Toro", "gersonignacio.toro.leon@gmail.com", "+56956219116"],
  ["Ivonne Machuca", "i.ignacia1@gmail.com", "+56945952595"],
  ["Israel Canales", "israel.canales08@gmail.com", "+56957720097"],
  ["Jaime Torres Olave", "jaimetorresolave@gmail.com", "+56974533658"],
  ["Constanza Duran", "cony.patin.duran@gmail.com", "+56978042619"],
  ["Escarleth Riquelme", "escarleththibaut@gmail.com", "+56937192920"],
  ["Francisco Muñoz", "franciscobluedefinitivo@gmail.com", "+56985187513"],
  ["Camila Lopez Mix", "camila.lmix@gmail.com", "+56993051550"],
  ["Catalina Toledo", "catitapia2000@gmail.com", "+56961895617"],
  ["Fabian Acuña Velasquez", "fabian91@outlook.cl", "+56942087623"],
  ["Jenniffer Sanhueza", "jenny22sanhueza@gmail.com", "+56966590115"],
  ["Jose Maria Donoso", "jmdl2000@hotmail.com", "+56998895780"],
  ["Joaquin Matamala", "joaquincampos0172@gmail.com", "+56998776715"],
  ["Juan Loyola", "juanmanuelloyolap@gmail.com", "+56967082954"],
  ["Karla Vasquez", "k.valentinavasquez@gmail.com", "+56967218994"],
  ["Karen Zapata", "karenb.zapata99@gmail.com", "+56966023500"],
  ["Khris Walsh", "khrisalondrawalshreyes@gmail.com", "+56945422716"],
  ["Nancy Sepulveda", "nansepu33@hotmail.com", "+56946151551"],
  ["Luis Duran", "luisantonio251297@gmail.com", "+56966897990"],
  ["Maria Alvarez", "maria.alvarez.barraza80@gmail.com", "+56941651658"],
  ["Maria Jose Guzman", "mariajose.guzman.cerda@gmail.com", "+56981875128"],
  ["Matias Pereira", "matixr88@gmail.com", "+56933791389"],
  ["Macarena Diaz", "mdiazimsa@gmail.com", "+56981643830"],
  ["Natasha Cabezas", "nataliaelisacabezas@gmail.com", "+56931162934"],
  ["Pablo", "pabloanto17@gmail.com", "+56984189743"],
  ["Pamela Berrios", "pamepaz.b@gmail.com", "+56991578424"],
  ["Judith Valdes", "judithvaldes.a@gmail.com", "+56950145861"],
  ["Pia Amestica", "pia.a.amestica.t@hotmail.com", "+56954974501"],
  ["Natalia Vasquez", "nataliajh54@gmail.com", "+56978671354"],
  ["Nicol Ugalde", "nicol.ugalde.valladares@gmail.com", "+56985509140"],
  ["Romina Diaz", "romi.diaz.montenegro14@gmail.com", "+56921610296"],
  ["Sebastian Ahumada", "sebasahumada@outlook.com", "+56955263848"],
  ["Sofia Cornejo", "sofialauracornejos@gmail.com", "+56993210369"],
  ["Tomas Vera", "tomas2vera5navarro4@gmail.com", "+56964655919"],
  ["Valeria Rojas", "vapazrojasg@gmail.com", "+56945748683"],
  ["Vicente Medina", "vimedinasep12@gmail.com", "+56982637673"],
  ["Yasna Zambrano", "flakita_1992_perez@hotmail.com", "+56961562682"],
];

function normalizarTel(tel) {
  return tel.replace(/^\+?56\s*9?\s*/, "").replace(/\s/g, "").trim();
}

async function main() {
  let insertados = 0;
  let omitidos = 0;

  for (const [nombre, email, telefono] of CLIENTES) {
    const telLimpio = normalizarTel(telefono);

    // Buscar duplicado por email o teléfono en la misma sucursal
    const existente = await prisma.cliente.findFirst({
      where: {
        sucursalId: SUCURSAL_ID,
        OR: [
          { email: email.toLowerCase().trim() },
          { telefono: { contains: telLimpio } },
        ],
      },
      select: { id: true, nombre: true },
    });

    if (existente) {
      console.log(`⏭  Omitido (ya existe): ${nombre} → ${existente.nombre}`);
      omitidos++;
      continue;
    }

    await prisma.cliente.create({
      data: {
        nombre: nombre.trim(),
        email: email.toLowerCase().trim(),
        telefono: telLimpio,
        sucursalId: SUCURSAL_ID,
        activo: true,
      },
    });

    console.log(`✓ Importado: ${nombre}`);
    insertados++;
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Insertados:  ${insertados}`);
  console.log(`⏭  Omitidos:   ${omitidos}`);
  console.log(`📋 Total lista: ${CLIENTES.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
