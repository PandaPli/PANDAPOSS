// scripts/asignar-genero.mjs
// Asigna género a clientes basándose en el primer nombre

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ── Diccionario de nombres conocidos ──────────────────────────────────────────
const FEMENINOS = new Set([
  "adriana","ailin","aileen","aisling","alejandra","alexa","alexandra","alexia",
  "alicia","allison","allyson","amanda","amaya","amelia","ana","anais","anaís",
  "andrea","angela","ángela","angelyn","anggy","anny","antonia","araceli",
  "arency","ariana","bárbara","barbara","beatriz","belén","belen","bernardita",
  "betzabet","betzabeth","brenda","camila","camilla","carla","carmen","carol",
  "carolina","catalina","cecilia","celeste","cinthya","cindy","claudia",
  "constanza","cristina","cynthia","dailu","daleth","daniela","daniele","denise",
  "denisse","diana","dorita","elena","eliana","elisa","elizabeth","elsa","ely",
  "emanuela","emilia","erica","escarlet","escarleth","estefania","estefanía",
  "estefany","estela","eugenia","fernanda","flavia","florencia","fran",
  "francesca","francisca","frida","gabriela","genesis","génesis","gerty",
  "gloria","grisel","ignacia","ingrid","isidora","ivone","ivonne","jacqueline",
  "jacquelne","jannis","jasmine","javiera","jennifer","jenniffer","josefa",
  "josefina","jovita","judith","julieta","karen","karla","kassandra","katerinne",
  "katherine","katherines","katty","kelly","karem","leonor","leslie","liss",
  "lorena","loreto","lucía","lucia","luisa","luz","macarena","magaly","maite",
  "marcela","margarita","maria","maría","mariana","marina","marion","marisol",
  "maritza","marta","martina","mary","maureen","melanie","melisa","melissa",
  "michelle","mireya","miriam","monica","mónica","nancy","natalia","natasha",
  "nicol","nicole","nicolle","ninoska","norma","olivia","paloma","pamela",
  "paola","patricia","paula","paulina","paz","pia","pía","purisima","rachel",
  "romina","rosa","ruth","sabina","sabrina","sandra","sara","sarita","scarlett",
  "silvia","sofia","sofía","sol","soledad","stefanny","stephanie","susan","suimei",
  "tania","tatiana","valentina","valeria","vanessa","vania","vannia","verónica",
  "veronica","vivi","viviana","yasna","yessica","yohana","yushani",
]);

const MASCULINOS = new Set([
  "aaron","aarón","abraham","adolfo","agustin","agustín","alberto","alejandro",
  "alex","alexis","alfonso","allen","alvaro","álvaro","amaro","andres","andrés",
  "angel","ángel","ariel","armando","arturo","bastian","bastián","benjamin",
  "benjamín","bryan","camilo","carlos","cesar","césar","claudio","cristian",
  "cristiano","damian","damián","daniel","danilo","david","diego","dionisio",
  "eduardo","emilio","erick","esteban","fabian","fabián","felipe","fernando",
  "francisco","franco","gabriel","gerson","gonzalo","gregory","gustavo","hector",
  "héctor","hugo","ignacio","igor","israel","ivan","iván","jaime","jairo",
  "javier","joacim","joacin","joaquin","joaquín","jorge","jose","josefi",
  "juan","julio","kevin","leandro","leonel","lorenzo","luciano","luis","manuel",
  "marco","marcos","mario","mateo","matias","matías","mauricio","mauro",
  "maximiliano","miguel","nicolas","nicolás","pablo","patricio","paulo",
  "pedro","phillip","rafael","raimundo","raul","raúl","renato","richard",
  "robert","roberto","rodrigo","samuel","sebastian","sebastián","sergio",
  "tito","tomas","tomás","victor","víctor","vicente","yerko","israel",
  "inti","gerardson","gerson",
]);

function normalizar(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function inferirGenero(nombre) {
  if (!nombre) return null;
  // Tomar solo el primer nombre
  const primerNombre = normalizar(nombre.split(/\s+/)[0]);

  if (FEMENINOS.has(primerNombre)) return "F";
  if (MASCULINOS.has(primerNombre)) return "M";

  // Heurística por terminación si no está en diccionario
  if (primerNombre.endsWith("a") && !["luca","josua","andria"].includes(primerNombre)) return "F";
  if (primerNombre.endsWith("o")) return "M";
  if (primerNombre.endsWith("us")) return "M";
  if (primerNombre.endsWith("on")) return "M";
  if (primerNombre.endsWith("el") && !["rachel","isabel","ariel"].includes(primerNombre)) return "M";
  if (primerNombre.endsWith("na")) return "F";
  if (primerNombre.endsWith("ia")) return "F";

  return null; // no determinado
}

async function main() {
  const clientes = await prisma.cliente.findMany({
    where: { genero: null },
    select: { id: true, nombre: true },
  });

  console.log(`\n📋 Total sin género: ${clientes.length}\n`);

  let asignados = 0;
  let noDetectados = [];

  for (const c of clientes) {
    const genero = inferirGenero(c.nombre);
    if (genero) {
      await prisma.cliente.update({ where: { id: c.id }, data: { genero } });
      console.log(`✅ ${genero === "F" ? "👩 F" : "👨 M"}  ${c.nombre}`);
      asignados++;
    } else {
      noDetectados.push(c);
      console.log(`❓     ${c.nombre}`);
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Asignados: ${asignados}`);
  console.log(`❓ Sin detectar: ${noDetectados.length}`);
  if (noDetectados.length) {
    console.log(`\nLista sin detectar:`);
    noDetectados.forEach(c => console.log(`  - [${c.id}] ${c.nombre}`));
  }

  // Stats finales
  const stats = await prisma.cliente.groupBy({
    by: ["genero"],
    _count: { id: true },
  });
  console.log(`\n📊 Distribución final:`);
  stats.forEach(s => console.log(`  ${s.genero ?? "null"}: ${s._count.id}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
