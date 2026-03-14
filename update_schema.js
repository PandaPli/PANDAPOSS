const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Enums
content = content.replace(
  'enum PlanTipo {\n  BASICO\n  PRO\n}',
  'enum PlanTipo {\n  BASICO\n  PRO\n}\n\nenum EstadoDelivery {\n  CREADO\n  CONFIRMADO\n  PREPARANDO\n  LISTO\n  EN_CAMINO\n  ENTREGADO\n  CANCELADO\n}\n\nenum EstadoRepartidor {\n  DISPONIBLE\n  EN_RUTA\n  INACTIVO\n}'
);

content = content.replace(
  'enum PlanTipo {\r\n  BASICO\r\n  PRO\r\n}',
  'enum PlanTipo {\r\n  BASICO\r\n  PRO\r\n}\r\n\r\nenum EstadoDelivery {\r\n  CREADO\r\n  CONFIRMADO\r\n  PREPARANDO\r\n  LISTO\r\n  EN_CAMINO\r\n  ENTREGADO\r\n  CANCELADO\r\n}\r\n\r\nenum EstadoRepartidor {\r\n  DISPONIBLE\r\n  EN_RUTA\r\n  INACTIVO\r\n}'
);

// Cliente
content = content.replace(
  '  ventas     Venta[]\n\n  @@map("clientes")',
  '  ventas     Venta[]\n  direcciones DireccionCliente[]\n  pedidosDelivery PedidoDelivery[]\n\n  @@map("clientes")'
);

content = content.replace(
  '  ventas     Venta[]\r\n\r\n  @@map("clientes")',
  '  ventas     Venta[]\r\n  direcciones DireccionCliente[]\r\n  pedidosDelivery PedidoDelivery[]\r\n\r\n  @@map("clientes")'
);

// Pedido
content = content.replace(
  '  venta       Venta?\n\n  @@map("pedidos")',
  '  venta       Venta?\n  delivery    PedidoDelivery?\n\n  @@map("pedidos")'
);
content = content.replace(
  '  venta       Venta?\r\n\r\n  @@map("pedidos")',
  '  venta       Venta?\r\n  delivery    PedidoDelivery?\r\n\r\n  @@map("pedidos")'
);

fs.writeFileSync('prisma/schema.prisma', content);
console.log("Schema updated successfully.");
