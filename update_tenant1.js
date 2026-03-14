const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Agregar modelo Tenant antes de Sucursal
content = content.replace(
  '// ─── MODELOS ──────────────────────────────────────────────────\n\nmodel Sucursal {',
  '// ─── MODELOS ──────────────────────────────────────────────────\n\nmodel Tenant {\n  id        String   @id @default(uuid())\n  nombre    String   @db.VarChar(100)\n  plan      PlanTipo @default(BASICO)\n  creadoEn  DateTime @default(now())\n\n  sucursales Sucursal[]\n  usuarios   Usuario[]\n  clientes   Cliente[]\n  pedidos    Pedido[]\n  productos  Producto[]\n\n  @@map("tenants")\n}\n\nmodel Sucursal {'
);

content = content.replace(
  '// ─── MODELOS ──────────────────────────────────────────────────\r\n\r\nmodel Sucursal {',
  '// ─── MODELOS ──────────────────────────────────────────────────\r\n\r\nmodel Tenant {\r\n  id        String   @id @default(uuid())\r\n  nombre    String   @db.VarChar(100)\r\n  plan      PlanTipo @default(BASICO)\r\n  creadoEn  DateTime @default(now())\r\n\r\n  sucursales Sucursal[]\r\n  usuarios   Usuario[]\r\n  clientes   Cliente[]\r\n  pedidos    Pedido[]\r\n  productos  Producto[]\r\n\r\n  @@map("tenants")\r\n}\r\n\r\nmodel Sucursal {'
);


// Modificar Sucursal
content = content.replace(
  '  nombre       String   @db.VarChar(100)',
  '  tenantId     String?\n  nombre       String   @db.VarChar(100)'
);

content = content.replace(
  '  vacaciones    Vacacion[]\n\n  @@map("sucursales")',
  '  vacaciones    Vacacion[]\n  tenant        Tenant?  @relation(fields: [tenantId], references: [id])\n\n  @@map("sucursales")'
);

// Modificar Usuario
content = content.replace(
  '  status        EstadoUsuario @default(ACTIVO)\n  sucursalId    Int?',
  '  status        EstadoUsuario @default(ACTIVO)\n  tenantId      String?\n  sucursalId    Int?'
);

content = content.replace(
  '  repartidor        Repartidor?\n\n  @@map("usuarios")',
  '  repartidor        Repartidor?\n  tenant            Tenant?    @relation(fields: [tenantId], references: [id])\n\n  @@map("usuarios")'
);


fs.writeFileSync('prisma/schema.prisma', content);
console.log("Tenant injected successfully.");
