const fs = require('fs');

let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

if (!content.includes('model Tenant')) {
  content = content.replace(
    '// ─── MODELOS ──────────────────────────────────────────────────\r\n\r\nmodel Sucursal {',
    '// ─── MODELOS ──────────────────────────────────────────────────\r\n\r\nmodel Tenant {\r\n  id        String   @id @default(uuid())\r\n  nombre    String   @db.VarChar(100)\r\n  plan      PlanTipo @default(BASICO)\r\n  creadoEn  DateTime @default(now())\r\n\r\n  sucursales Sucursal[]\r\n  usuarios   Usuario[]\r\n  clientes   Cliente[]\r\n  pedidos    Pedido[]\r\n  productos  Producto[]\r\n\r\n  @@map("tenants")\r\n}\r\n\r\nmodel Sucursal {'
  );

  content = content.replace(
    '// ─── MODELOS ──────────────────────────────────────────────────\n\nmodel Sucursal {',
    '// ─── MODELOS ──────────────────────────────────────────────────\n\nmodel Tenant {\n  id        String   @id @default(uuid())\n  nombre    String   @db.VarChar(100)\n  plan      PlanTipo @default(BASICO)\n  creadoEn  DateTime @default(now())\n\n  sucursales Sucursal[]\n  usuarios   Usuario[]\n  clientes   Cliente[]\n  pedidos    Pedido[]\n  productos  Producto[]\n\n  @@map("tenants")\n}\n\nmodel Sucursal {'
  );
}

// Ensure Tenant is linked in global tables if not already done
if (!content.includes('  tenantId   ')) {
  // Sucursal
  content = content.replace(
    '  nombre       String   @db.VarChar(100)',
    '  tenantId     String?\n  nombre       String   @db.VarChar(100)'
  );
  content = content.replace(
    '  vacaciones    Vacacion[]',
    '  vacaciones    Vacacion[]\n  tenant        Tenant?  @relation(fields: [tenantId], references: [id])'
  );

  // Usuario
  content = content.replace(
    '  status        EstadoUsuario @default(ACTIVO)\n  sucursalId    Int?',
    '  status        EstadoUsuario @default(ACTIVO)\n  tenantId      String?\n  sucursalId    Int?'
  );
  content = content.replace(
    '  repartidor        Repartidor?',
    '  repartidor        Repartidor?\n  tenant            Tenant?    @relation(fields: [tenantId], references: [id])'
  );

  // Cliente
  content = content.replace(
    '  activo     Boolean  @default(true)\n  sucursalId Int?',
    '  activo     Boolean  @default(true)\n  tenantId   String?\n  sucursalId Int?'
  );
  content = content.replace(
    '  sucursal   Sucursal? @relation(fields: [sucursalId], references: [id])',
    '  tenant     Tenant?   @relation(fields: [tenantId], references: [id])\n  sucursal   Sucursal? @relation(fields: [sucursalId], references: [id])'
  );

  // Pedido
  content = content.replace(
    '  numero          Int          @default(0)\n  mesaId          Int?',
    '  tenantId        String?\n  numero          Int          @default(0)\n  mesaId          Int?'
  );
  content = content.replace(
    '  mesa        Mesa?        @relation(fields: [mesaId], references: [id])',
    '  tenant      Tenant?      @relation(fields: [tenantId], references: [id])\n  mesa        Mesa?        @relation(fields: [mesaId], references: [id])'
  );

  // Producto
  content = content.replace(
    '  enMenu       Boolean   @default(true)\n  categoriaId  Int?',
    '  enMenu       Boolean   @default(true)\n  tenantId     String?\n  categoriaId  Int?'
  );
  content = content.replace(
    '  categoria    Categoria?  @relation(fields: [categoriaId], references: [id])',
    '  tenant       Tenant?     @relation(fields: [tenantId], references: [id])\n  categoria    Categoria?  @relation(fields: [categoriaId], references: [id])'
  );
}

fs.writeFileSync('prisma/schema.prisma', content);
console.log("Tenant refactored into schema and associations established.");
