const { existsSync } = require("fs");
const { spawnSync } = require("child_process");

const command = process.platform === "win32" ? "npx prisma generate" : "npx prisma generate";
const result = spawnSync(command, {
  shell: true,
  env: process.env,
  encoding: "utf8",
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

if (result.status === 0) {
  process.exit(0);
}

const combined = `${result.stdout || ""}\n${result.stderr || ""}`;
const hasEperm = combined.includes("EPERM") || combined.includes("operation not permitted");
const hasExistingClient =
  existsSync("node_modules/@prisma/client") &&
  existsSync("node_modules/.prisma/client");

if (hasEperm && hasExistingClient) {
  console.warn(
    "\n[postinstall] Prisma generate fue bloqueado por Windows (EPERM), " +
      "pero el cliente ya existe. Continuando sin fallar.\n" +
      "Si necesitas regenerarlo desde cero, cierra procesos Node/Next y ejecuta: npx prisma generate"
  );
  process.exit(0);
}

process.exit(result.status || 1);
