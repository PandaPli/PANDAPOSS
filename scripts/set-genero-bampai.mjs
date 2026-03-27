import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Mapeo nombre (lowercase) → género
const GENERO_MAP = {
  // FEMENINO
  adriana: "F", ailin: "F", allison: "F", amanda: "F", amaya: "F",
  ana: "F", anais: "F", anaís: "F", andrea: "F", angela: "F", ángela: "F",
  angelina: "F", anggy: "F", anny: "F", antonia: "F", araceli: "F",
  arency: "F", belén: "F", belen: "F", bernardita: "F", betzabet: "F",
  brenda: "F", camila: "F", camilla: "F", carla: "F", carmen: "F",
  carol: "F", carolina: "F", catalina: "F", cecilia: "F", celeste: "F",
  cinthya: "F", claudia: "F", constanza: "F", cristina: "F", cynthia: "F",
  dailu: "F", daleth: "F", daniela: "F", denise: "F", denisse: "F",
  diana: "F", dorita: "F", elena: "F", eliana: "F", elizabeth: "F",
  ely: "F", erica: "F", escarlet: "F", escarleth: "F", estefanía: "F",
  estefania: "F", estefany: "F", fernanda: "F", flavia: "F", florencia: "F",
  fran: "F", francisca: "F", gabriela: "F", genesis: "F", génesis: "F",
  gerty: "F", gloria: "F", grisel: "F", ignacia: "F", ingrid: "F",
  isidora: "F", ivone: "F", ivonne: "F", jacqueline: "F", jannis: "F",
  jasmine: "F", javiera: "F", jennifer: "F", jenniffer: "F",
  josefa: "F", josefina: "F", jovita: "F", judith: "F", karem: "F",
  karen: "F", karla: "F", kassandra: "F", katerinne: "F", katherine: "F",
  katherines: "F", katty: "F", kelly: "F", leonor: "F", leslie: "F",
  liss: "F", lorena: "F", loreto: "F", lucía: "F", lucia: "F",
  macarena: "F", magaly: "F", maite: "F", maría: "F", maria: "F",
  mariana: "F", marina: "F", marion: "F", marisol: "F", maritza: "F",
  marta: "F", martina: "F", mary: "F", maureen: "F", melanie: "F",
  melisa: "F", michelle: "F", mireya: "F", miriam: "F", monica: "F",
  mónica: "F", nancy: "F", natalia: "F", natasha: "F", nicol: "F",
  nicole: "F", nicolle: "F", paloma: "F", pamela: "F", paola: "F",
  paula: "F", paulina: "F", paz: "F", pía: "F", pia: "F", pilar: "F",
  purísima: "F", purisima: "F", rachel: "F", romina: "F", ruth: "F",
  sabina: "F", sarita: "F", scarlett: "F", sofía: "F", sofia: "F",
  sol: "F", stefanny: "F", stephanie: "F", suimei: "F", susan: "F",
  tania: "F", valentina: "F", valeria: "F", vanessa: "F", vania: "F",
  vannia: "F", verónica: "F", veronica: "F", vivi: "F", yasna: "F",
  yessica: "F", yohana: "F", yushani: "F",

  // MASCULINO
  abraham: "M", agustín: "M", agustin: "M", aldo: "M", alejandro: "M",
  alex: "M", alexis: "M", alfonso: "M", allen: "M", álvaro: "M", alvaro: "M",
  amaro: "M", andrés: "M", andres: "M", ariel: "M", armando: "M",
  bastian: "M", bastián: "M", benjamín: "M", benjamin: "M", bryan: "M",
  carlos: "M", claudio: "M", cristian: "M", damián: "M", damian: "M",
  daniel: "M", diego: "M", dionisio: "M", eduardo: "M", erick: "M",
  esteban: "M", fabián: "M", fabian: "M", felipe: "M", francisco: "M",
  franco: "M", gerardson: "M", gerson: "M", gonzalo: "M", gregory: "M",
  gustavo: "M", ignacio: "M", igor: "M", inti: "M", israel: "M",
  jaime: "M", jairo: "M", javier: "M", joacim: "M", joacin: "M",
  joaquín: "M", joaquin: "M", jorge: "M", juan: "M", julio: "M",
  khris: "M", lorenzo: "M", luciano: "M", luis: "M", matías: "M",
  matias: "M", mauricio: "M", mauro: "M", maximiliano: "M", miguel: "M",
  nicolás: "M", nicolas: "M", pablo: "M", patricio: "M", phillip: "M",
  rafael: "M", raimundo: "M", raúl: "M", raul: "M", richard: "M",
  robert: "M", roberto: "M", rodrigo: "M", samuel: "M", sebastián: "M",
  sebastian: "M", tito: "M", tomás: "M", tomas: "M", vicente: "M",
  victor: "M", víctor: "M", yerko: "M",
};

function detectarGenero(nombre) {
  if (!nombre) return null;
  // Tomar la primera palabra del nombre (primer nombre)
  const primero = nombre.trim().split(/\s+/)[0].toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // quitar tildes para comparar

  // Buscar en el mapa (con y sin tildes)
  const primeroCon = nombre.trim().split(/\s+/)[0].toLowerCase();
  return GENERO_MAP[primeroCon] ?? GENERO_MAP[primero] ?? null;
}

async function main() {
  const clientes = await prisma.cliente.findMany({
    where: { sucursalId: 6 },
    select: { id: true, nombre: true, genero: true },
  });

  console.log(`Total clientes BamPai: ${clientes.length}`);

  let actualizados = 0;
  let sinDetectar = [];

  // Agrupar por género para hacer 2 updateMany en vez de 380 updates
  const idsFemenino = [];
  const idsMasculino = [];

  for (const c of clientes) {
    const genero = detectarGenero(c.nombre);
    if (genero === "F") idsFemenino.push(c.id);
    else if (genero === "M") idsMasculino.push(c.id);
    else sinDetectar.push(c.nombre);
  }

  await prisma.$transaction([
    prisma.cliente.updateMany({ where: { id: { in: idsFemenino } }, data: { genero: "F" } }),
    prisma.cliente.updateMany({ where: { id: { in: idsMasculino } }, data: { genero: "M" } }),
  ]);
  actualizados = idsFemenino.length + idsMasculino.length;

  console.log(`✅ Actualizados: ${actualizados}`);
  if (sinDetectar.length > 0) {
    console.log(`⚠️  Sin detectar (${sinDetectar.length}):`);
    sinDetectar.forEach(n => console.log("  -", n));
  }

  // Resumen final
  const [f, m] = await Promise.all([
    prisma.cliente.count({ where: { sucursalId: 6, genero: "F" } }),
    prisma.cliente.count({ where: { sucursalId: 6, genero: "M" } }),
  ]);
  console.log(`\nResumen: ${f} mujeres · ${m} hombres`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
