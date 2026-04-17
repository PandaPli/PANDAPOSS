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
  jose: "F", // "Jose Maria" → tratado en contexto

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

// Quitar "jose" genérico, tratar caso especial
delete GENERO_MAP.jose;

function detectarGenero(nombre) {
  if (!nombre) return null;
  const partes = nombre.trim().split(/\s+/).map(p => p.toLowerCase());
  const primero = partes[0];
  const primeroNorm = primero.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Caso "Jose Maria" → M
  if (primeroNorm === "jose") return "M";

  return GENERO_MAP[primero] ?? GENERO_MAP[primeroNorm] ?? null;
}

function normalizarNombre(nombre) {
  return nombre
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarTel(tel) {
  if (!tel) return null;
  return tel.replace(/[^0-9]/g, "").slice(-8); // últimos 8 dígitos
}

async function main() {
  const clientes = await prisma.cliente.findMany({
    where: { sucursalId: 6 },
    select: { id: true, nombre: true, email: true, telefono: true, genero: true, activo: true, creadoEn: true },
    orderBy: { creadoEn: "asc" },
  });

  console.log(`\n═══════════════════════════════════════════════`);
  console.log(`  REVISIÓN DE DUPLICADOS — BAMPAI (sucursal 6)`);
  console.log(`  Total clientes: ${clientes.length}`);
  console.log(`═══════════════════════════════════════════════\n`);

  // --- 1. Detectar duplicados por email ---
  const porEmail = new Map();
  for (const c of clientes) {
    if (!c.email) continue;
    const email = c.email.toLowerCase().trim();
    if (!porEmail.has(email)) porEmail.set(email, []);
    porEmail.get(email).push(c);
  }

  const dupsEmail = [...porEmail.entries()].filter(([, arr]) => arr.length > 1);

  // --- 2. Detectar duplicados por teléfono ---
  const porTel = new Map();
  for (const c of clientes) {
    const tel = normalizarTel(c.telefono);
    if (!tel) continue;
    if (!porTel.has(tel)) porTel.set(tel, []);
    porTel.get(tel).push(c);
  }

  const dupsTel = [...porTel.entries()].filter(([, arr]) => arr.length > 1);

  // --- 3. Detectar duplicados por nombre normalizado ---
  const porNombre = new Map();
  for (const c of clientes) {
    const nom = normalizarNombre(c.nombre);
    if (!porNombre.has(nom)) porNombre.set(nom, []);
    porNombre.get(nom).push(c);
  }

  const dupsNombre = [...porNombre.entries()].filter(([, arr]) => arr.length > 1);

  // --- Consolidar todos los grupos de duplicados ---
  // Usar sets de IDs para no repetir
  const gruposDups = new Map(); // key → [clientes]
  const idYaAgrupado = new Set();

  function agregarGrupo(key, arr) {
    for (const c of arr) {
      if (!gruposDups.has(key)) gruposDups.set(key, new Set());
      gruposDups.get(key).add(c.id);
    }
  }

  for (const [email, arr] of dupsEmail) agregarGrupo(`email:${email}`, arr);
  for (const [tel, arr] of dupsTel) agregarGrupo(`tel:${tel}`, arr);
  for (const [nom, arr] of dupsNombre) agregarGrupo(`nombre:${nom}`, arr);

  // Recopilar IDs únicos de duplicados
  const idsDuplicados = new Set();
  for (const [, ids] of gruposDups) {
    for (const id of ids) idsDuplicados.add(id);
  }

  // --- Mostrar duplicados ---
  if (dupsEmail.length > 0) {
    console.log(`📧 DUPLICADOS POR EMAIL (${dupsEmail.length} grupos):`);
    console.log(`─────────────────────────────────────────────`);
    for (const [email, arr] of dupsEmail) {
      console.log(`  Email: ${email}`);
      for (const c of arr) {
        console.log(`    ID ${c.id} | ${c.nombre} | Tel: ${c.telefono || "—"} | Género: ${c.genero || "?"}`);
      }
      console.log();
    }
  }

  if (dupsTel.length > 0) {
    console.log(`📱 DUPLICADOS POR TELÉFONO (${dupsTel.length} grupos):`);
    console.log(`─────────────────────────────────────────────`);
    for (const [tel, arr] of dupsTel) {
      console.log(`  Tel (últimos 8): ${tel}`);
      for (const c of arr) {
        console.log(`    ID ${c.id} | ${c.nombre} | Email: ${c.email || "—"} | Género: ${c.genero || "?"}`);
      }
      console.log();
    }
  }

  if (dupsNombre.length > 0) {
    console.log(`👤 DUPLICADOS POR NOMBRE (${dupsNombre.length} grupos):`);
    console.log(`─────────────────────────────────────────────`);
    for (const [nom, arr] of dupsNombre) {
      console.log(`  Nombre normalizado: "${nom}"`);
      for (const c of arr) {
        console.log(`    ID ${c.id} | ${c.nombre} | Email: ${c.email || "—"} | Tel: ${c.telefono || "—"} | Género: ${c.genero || "?"}`);
      }
      console.log();
    }
  }

  // --- 4. Separar por género (todos, no solo duplicados) ---
  console.log(`\n═══════════════════════════════════════════════`);
  console.log(`  CLIENTES POR GÉNERO`);
  console.log(`═══════════════════════════════════════════════\n`);

  const mujeres = [];
  const hombres = [];
  const sinGenero = [];

  for (const c of clientes) {
    const genero = c.genero || detectarGenero(c.nombre);
    if (genero === "F") mujeres.push(c);
    else if (genero === "M") hombres.push(c);
    else sinGenero.push(c);
  }

  console.log(`👩 MUJERES (${mujeres.length}):`);
  console.log(`─────────────────────────────────────────────`);
  for (const c of mujeres) {
    const dup = idsDuplicados.has(c.id) ? " ⚠️ DUP" : "";
    console.log(`  ID ${String(c.id).padStart(4)} | ${c.nombre.padEnd(35)} | ${(c.email || "—").padEnd(40)} | Tel: ${c.telefono || "—"}${dup}`);
  }

  console.log(`\n👨 HOMBRES (${hombres.length}):`);
  console.log(`─────────────────────────────────────────────`);
  for (const c of hombres) {
    const dup = idsDuplicados.has(c.id) ? " ⚠️ DUP" : "";
    console.log(`  ID ${String(c.id).padStart(4)} | ${c.nombre.padEnd(35)} | ${(c.email || "—").padEnd(40)} | Tel: ${c.telefono || "—"}${dup}`);
  }

  if (sinGenero.length > 0) {
    console.log(`\n❓ SIN GÉNERO DETECTADO (${sinGenero.length}):`);
    console.log(`─────────────────────────────────────────────`);
    for (const c of sinGenero) {
      console.log(`  ID ${String(c.id).padStart(4)} | ${c.nombre.padEnd(35)} | ${(c.email || "—").padEnd(40)} | Tel: ${c.telefono || "—"}`);
    }
  }

  // --- Resumen ---
  console.log(`\n═══════════════════════════════════════════════`);
  console.log(`  RESUMEN`);
  console.log(`═══════════════════════════════════════════════`);
  console.log(`  Total clientes BAMPAI: ${clientes.length}`);
  console.log(`  Mujeres:  ${mujeres.length}`);
  console.log(`  Hombres:  ${hombres.length}`);
  console.log(`  Sin género: ${sinGenero.length}`);
  console.log(`  Duplicados detectados: ${idsDuplicados.size} registros en ${gruposDups.size} grupos`);
  console.log(`  Duplicados por email: ${dupsEmail.length} grupos`);
  console.log(`  Duplicados por teléfono: ${dupsTel.length} grupos`);
  console.log(`  Duplicados por nombre: ${dupsNombre.length} grupos`);
  console.log(`═══════════════════════════════════════════════\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
