# ENTITIES

## ENTITY: Tenant

FIELDS:
- id: string
- nombre: string
- plan: PlanTipo
- creadoEn: datetime

RELATIONS:
- sucursales: Sucursal[]
- usuarios: Usuario[]
- productos: Producto[]
- clientes: Cliente[]
- pedidos: Pedido[]
- eventos: Evento[]

## ENTITY: Sucursal

FIELDS:
- id: integer
- nombre: string
- direccion: string | null
- telefono: string | null
- email: string | null
- simbolo: string
- activa: boolean
- plan: PlanTipo
- sector: SectorTipo
- delivery: boolean
- menuQR: boolean
- correoActivo: boolean
- kioskActivo: boolean
- logoUrl: string | null
- cartaBg: string | null
- cartaTagline: string | null
- cartaSaludo: string | null
- flayerUrl: string | null
- flayerActivo: boolean
- printerPath: string | null
- printerIp: string | null
- rut: string | null
- giroComercial: string | null
- zonasDelivery: json | null
- mpAccessToken: string | null
- puntosActivo: boolean
- puntosPorMil: decimal
- valorPunto: decimal
- notifAviso: boolean
- tenantId: string | null

RELATIONS:
- tenant: Tenant | null
- usuarios: Usuario[]
- productos: Producto[]
- clientes: Cliente[]
- cajas: Caja[]
- salas: Sala[]
- cupones: Cupon[]
- empleados: Empleado[]
- agente: AgenteWsp | null

## ENTITY: Usuario

FIELDS:
- id: integer
- nombre: string
- usuario: string
- password: string
- email: string | null
- rol: Rol
- status: EstadoUsuario
- sucursalId: integer | null
- tenantId: string | null
- creadoEn: datetime
- actualizadoEn: datetime

RELATIONS:
- sucursal: Sucursal | null
- tenant: Tenant | null
- ventas: Venta[]
- pedidos: Pedido[]
- cajas: Caja[]
- repartidor: Repartidor | null

## ENTITY: Sala

FIELDS:
- id: integer
- nombre: string
- sucursalId: integer
- activa: boolean
- esQR: boolean
- creadoEn: datetime

RELATIONS:
- sucursal: Sucursal
- mesas: Mesa[]

## ENTITY: Mesa

FIELDS:
- id: integer
- nombre: string
- capacidad: integer
- estado: EstadoMesa
- salaId: integer
- creadoEn: datetime

RELATIONS:
- sala: Sala
- pedidos: Pedido[]

## ENTITY: Categoria

FIELDS:
- id: integer
- nombre: string
- icono: string | null
- activa: boolean
- enMenu: boolean
- enMenuQR: boolean
- estacion: Estacion
- orden: integer

RELATIONS:
- productos: Producto[]
- combos: Combo[]

## ENTITY: Producto

FIELDS:
- id: integer
- codigo: string
- nombre: string
- descripcion: string | null
- precio: decimal
- costo: decimal | null
- stock: decimal
- stockMinimo: decimal
- imagen: string | null
- ivaActivo: boolean
- ivaPorc: decimal
- activo: boolean
- enMenu: boolean
- enMenuQR: boolean
- enKiosko: boolean
- categoriaId: integer | null
- sucursalId: integer | null
- tenantId: string | null
- creadoEn: datetime
- actualizadoEn: datetime

RELATIONS:
- categoria: Categoria | null
- sucursal: Sucursal | null
- variantes: VarianteGrupo[]

## ENTITY: VarianteGrupo

FIELDS:
- id: integer
- productoId: integer
- nombre: string
- requerido: boolean
- tipo: string
- orden: integer

RELATIONS:
- producto: Producto
- opciones: VarianteOpcion[]

## ENTITY: VarianteOpcion

FIELDS:
- id: integer
- grupoId: integer
- nombre: string
- precio: decimal
- orden: integer

RELATIONS:
- grupo: VarianteGrupo

## ENTITY: Cliente

FIELDS:
- id: integer
- rut: string | null
- nombre: string
- email: string | null
- telefono: string | null
- direccion: string | null
- genero: string | null
- fechaNacimiento: datetime | null
- codigoCumple: string | null
- activo: boolean
- sucursalId: integer | null
- tenantId: string | null
- puntos: integer
- creadoEn: datetime

RELATIONS:
- sucursal: Sucursal | null
- direcciones: DireccionCliente[]
- ventas: Venta[]
- pedidosDelivery: PedidoDelivery[]
- movimientosPuntos: MovimientoPuntos[]

## ENTITY: Caja

FIELDS:
- id: integer
- nombre: string
- estado: EstadoCaja
- saldoInicio: decimal
- sucursalId: integer
- usuarioId: integer | null
- abiertaEn: datetime | null
- cerradaEn: datetime | null
- visorEstado: string | null
- creadoEn: datetime

RELATIONS:
- sucursal: Sucursal
- usuario: Usuario | null
- ventas: Venta[]
- pedidos: Pedido[]
- movimientos: MovimientoCaja[]
- arqueos: Arqueo[]

## ENTITY: MovimientoCaja

FIELDS:
- id: integer
- tipo: TipoMovimientoCaja
- monto: decimal
- motivo: string
- cajaId: integer
- usuarioId: integer
- creadoEn: datetime

RELATIONS:
- caja: Caja
- usuario: Usuario

## ENTITY: Arqueo

FIELDS:
- id: integer
- cajaId: integer
- usuarioId: integer
- saldoInicio: decimal
- saldoFinal: decimal | null
- totalVentas: decimal | null
- diferencia: decimal | null
- observacion: string | null
- abiertaEn: datetime
- cerradaEn: datetime | null

RELATIONS:
- caja: Caja
- usuario: Usuario

## ENTITY: Pedido

FIELDS:
- id: integer
- numero: integer
- mesaId: integer | null
- cajaId: integer | null
- usuarioId: integer
- repartidorId: integer | null
- tipo: TipoPedido
- estado: EstadoPedido
- observacion: string | null
- meseroLlamado: boolean
- llamadoTipo: string | null
- direccionEntrega: string | null
- telefonoCliente: string | null
- iniciadoEn: datetime | null
- listoEn: datetime | null
- tenantId: string | null
- mpPreferenceId: string | null
- mpPaymentId: string | null
- mpStatus: string | null
- creadoEn: datetime
- actualizadoEn: datetime

RELATIONS:
- usuario: Usuario
- mesa: Mesa | null
- caja: Caja | null
- detalles: DetallePedido[]
- venta: Venta | null
- delivery: PedidoDelivery | null
- eventos: EventoPedido[]

## ENTITY: DetallePedido

FIELDS:
- id: integer
- pedidoId: integer
- productoId: integer | null
- comboId: integer | null
- cantidad: integer
- observacion: string | null
- cancelado: boolean
- grupo: string | null
- pagado: boolean
- precio: decimal | null
- compartido: boolean
- participantes: json | null
- opciones: json | null

RELATIONS:
- pedido: Pedido
- producto: Producto | null
- combo: Combo | null

## ENTITY: Venta

FIELDS:
- id: integer
- numero: string
- cajaId: integer | null
- clienteId: integer | null
- usuarioId: integer
- pedidoId: integer | null
- subtotal: decimal
- descuento: decimal
- impuesto: decimal
- total: decimal
- metodoPago: MetodoPago
- estado: EstadoVenta
- boletaEmitida: boolean
- observacion: string | null
- cuponId: integer | null
- cuponCodigo: string | null
- puntosGanados: integer
- puntosCanjeados: integer
- creadoEn: datetime

RELATIONS:
- caja: Caja | null
- cliente: Cliente | null
- usuario: Usuario
- pedido: Pedido | null
- detalles: DetalleVenta[]
- pagos: PagoVenta[]

## ENTITY: PagoVenta

FIELDS:
- id: integer
- ventaId: integer
- metodoPago: MetodoPago
- monto: decimal
- referencia: string | null
- creadoEn: datetime

RELATIONS:
- venta: Venta

## ENTITY: PedidoDelivery

FIELDS:
- id: integer
- pedidoId: integer
- clienteId: integer
- repartidorId: integer | null
- direccionId: integer
- referencia: string | null
- lat: float | null
- lng: float | null
- costoEnvio: decimal
- pagoRider: decimal | null
- zonaDelivery: string | null
- tiempoEstimado: integer
- codigoEntrega: string | null
- estado: EstadoDelivery
- creadoEn: datetime

RELATIONS:
- pedido: Pedido
- cliente: Cliente
- direccion: DireccionCliente
- repartidor: Repartidor | null
- eventos: EventoDelivery[]

## ENTITY: DireccionCliente

FIELDS:
- id: integer
- clienteId: integer
- calle: string
- numero: string | null
- referencia: string | null
- lat: float | null
- lng: float | null

RELATIONS:
- cliente: Cliente
- pedidos: PedidoDelivery[]

## ENTITY: Repartidor

FIELDS:
- id: integer
- usuarioId: integer
- vehiculo: string
- estado: EstadoRepartidor
- lat: float | null
- lng: float | null
- pedidosActivos: integer

RELATIONS:
- usuario: Usuario
- entregas: PedidoDelivery[]

## ENTITY: Cupon

FIELDS:
- id: integer
- sucursalId: integer
- codigo: string
- descripcion: string | null
- tipo: TipoCupon
- valor: decimal
- usoMax: integer | null
- usoActual: integer
- activo: boolean
- venceEn: datetime | null
- creadoEn: datetime

RELATIONS:
- sucursal: Sucursal
- ventas: Venta[]

## ENTITY: Empleado

FIELDS:
- id: integer
- sucursalId: integer
- usuarioId: integer | null
- departamentoId: integer | null
- cargoId: integer | null
- nombres: string
- apellidos: string
- documento: string | null
- email: string | null
- telefono: string | null
- fechaIngreso: datetime | null
- salarioBase: decimal | null
- activo: boolean
- creadoEn: datetime
- actualizadoEn: datetime

RELATIONS:
- sucursal: Sucursal
- usuario: Usuario | null
- asistencias: Asistencia[]
- turnos: Turno[]
- permisos: PermisoRrhh[]
- vacaciones: Vacacion[]

## ENTITY: Asistencia

FIELDS:
- id: integer
- sucursalId: integer
- empleadoId: integer
- fecha: datetime
- horaEntrada: datetime | null
- horaSalida: datetime | null
- estado: string
- observacion: string | null
- creadoEn: datetime
- actualizadoEn: datetime

RELATIONS:
- sucursal: Sucursal
- empleado: Empleado

## ENTITY: AgenteWsp

FIELDS:
- id: integer
- sucursalId: integer
- activo: boolean
- estado: EstadoAgente
- telefono: string | null
- qrBase64: string | null
- qrExpiresAt: datetime | null
- ultimaConex: datetime | null
- creadoEn: datetime

RELATIONS:
- sucursal: Sucursal
- clientes: AgenteCliente[]
- eventos: AgenteEvento[]

## ENTITY: Evento

FIELDS:
- id: integer
- nombre: string
- descripcion: string | null
- fecha: datetime
- lugar: string | null
- precio: decimal
- capacidad: integer
- imagenUrl: string | null
- activo: boolean
- sucursalId: integer
- tenantId: string
- creadoEn: datetime

RELATIONS:
- sucursal: Sucursal
- tenant: Tenant
- tickets: TicketEvento[]

## ENTITY: TicketEvento

FIELDS:
- id: integer
- token: string
- eventoId: integer
- clienteId: integer | null
- clienteNombre: string
- clienteEmail: string
- clienteTelefono: string | null
- metodoPago: MetodoPago
- estado: EstadoTicket
- usosMax: integer
- usosRealizados: integer
- monto: decimal
- referenciaPago: string | null
- creadoEn: datetime
- validadoEn: datetime | null

RELATIONS:
- evento: Evento
- cliente: Cliente | null

# STATES

## STATE_SET: PlanTipo

VALUES:
- BASICO
- PRO
- PRIME
- DEMO

## STATE_SET: SectorTipo

VALUES:
- DELIVERY
- RESTAURANTE_BAR
- DISCOTECA

## STATE_SET: Rol

VALUES:
- ADMIN_GENERAL
- RESTAURANTE
- SECRETARY
- CASHIER
- WAITER
- CHEF
- BAR
- DELIVERY

## STATE_SET: EstadoUsuario

VALUES:
- ACTIVO
- INACTIVO

ALLOWED_TRANSITIONS:
- ACTIVO -> INACTIVO
- INACTIVO -> ACTIVO

## STATE_SET: EstadoMesa

VALUES:
- LIBRE
- OCUPADA
- CUENTA
- RESERVADA

ALLOWED_TRANSITIONS:
- LIBRE -> OCUPADA
- LIBRE -> RESERVADA
- RESERVADA -> LIBRE
- RESERVADA -> OCUPADA
- OCUPADA -> CUENTA
- CUENTA -> OCUPADA
- CUENTA -> LIBRE
- OCUPADA -> LIBRE

INFERRED:
- OCUPADA -> LIBRE requiere cerrar venta o borrar/liberar pedido activo.
- CUENTA indica precuenta solicitada.

## STATE_SET: EstadoCaja

VALUES:
- ABIERTA
- CERRADA

ALLOWED_TRANSITIONS:
- CERRADA -> ABIERTA
- ABIERTA -> CERRADA

TRANSITION_RULES:
- CERRADA -> ABIERTA requiere saldoInicio.
- ABIERTA -> CERRADA requiere resumen, saldoFinal y cálculo de diferencia.

## STATE_SET: TipoMovimientoCaja

VALUES:
- INGRESO
- RETIRO

## STATE_SET: TipoPedido

VALUES:
- COCINA
- BAR
- DELIVERY
- MOSTRADOR

## STATE_SET: EstadoPedido

VALUES:
- PENDIENTE
- EN_PROCESO
- LISTO
- ENTREGADO
- CANCELADO

ALLOWED_TRANSITIONS:
- PENDIENTE -> EN_PROCESO
- PENDIENTE -> CANCELADO
- EN_PROCESO -> LISTO
- EN_PROCESO -> CANCELADO
- LISTO -> EN_PROCESO
- LISTO -> ENTREGADO
- LISTO -> CANCELADO

TRANSITION_RULES:
- LISTO puede activar meseroLlamado.
- ENTREGADO limpia meseroLlamado.
- DELIVERY en LISTO requiere repartidor asignado para confirmar entrega, excepto retiro en tienda.

## STATE_SET: EstadoVenta

VALUES:
- PENDIENTE
- PAGADA
- ANULADA

ALLOWED_TRANSITIONS:
- PENDIENTE -> PAGADA
- PENDIENTE -> ANULADA
- PAGADA -> ANULADA

INFERRED:
- PAGADA se crea al completar checkout.
- ANULADA representa reversa/cancelación de venta.

## STATE_SET: MetodoPago

VALUES:
- EFECTIVO
- TARJETA
- TRANSFERENCIA
- CREDITO
- MIXTO

RULES:
- MIXTO se usa cuando una venta tiene más de un PagoVenta.
- EFECTIVO puede generar vuelto si monto pagado > total.

## STATE_SET: Estacion

VALUES:
- COCINA
- BARRA
- CUARTO_CALIENTE
- MOSTRADOR

ROUTING_RULES:
- CHEF ve COCINA y CUARTO_CALIENTE.
- BAR ve BARRA.
- Sin estación definida: INFERRED default COCINA.

## STATE_SET: EstadoDelivery

VALUES:
- CREADO
- CONFIRMADO
- PREPARANDO
- LISTO
- EN_CAMINO
- ENTREGADO
- CANCELADO

ALLOWED_TRANSITIONS:
- CREADO -> CONFIRMADO
- CREADO -> CANCELADO
- CONFIRMADO -> PREPARANDO
- CONFIRMADO -> CANCELADO
- PREPARANDO -> LISTO
- PREPARANDO -> CANCELADO
- LISTO -> EN_CAMINO
- LISTO -> ENTREGADO
- EN_CAMINO -> ENTREGADO
- ANY_ACTIVE -> CANCELADO

INFERRED:
- EstadoDelivery se sincroniza conceptualmente con EstadoPedido.
- Pedido retiro puede pasar de LISTO a ENTREGADO sin EN_CAMINO.

## STATE_SET: EstadoRepartidor

VALUES:
- DISPONIBLE
- EN_RUTA
- INACTIVO

ALLOWED_TRANSITIONS:
- INACTIVO -> DISPONIBLE
- DISPONIBLE -> EN_RUTA
- EN_RUTA -> DISPONIBLE
- DISPONIBLE -> INACTIVO
- EN_RUTA -> INACTIVO

## STATE_SET: TipoCupon

VALUES:
- PORCENTAJE
- MONTO_FIJO

## STATE_SET: EstadoAgente

VALUES:
- DESCONECTADO
- ESPERANDO_QR
- CONECTADO
- ERROR

ALLOWED_TRANSITIONS:
- DESCONECTADO -> ESPERANDO_QR
- ESPERANDO_QR -> CONECTADO
- ESPERANDO_QR -> ERROR
- CONECTADO -> DESCONECTADO
- ERROR -> DESCONECTADO
- ERROR -> ESPERANDO_QR

## STATE_SET: EstadoTicket

VALUES:
- PENDIENTE_PAGO
- PAGADO
- VALIDADO
- EXPIRADO

ALLOWED_TRANSITIONS:
- PENDIENTE_PAGO -> PAGADO
- PENDIENTE_PAGO -> EXPIRADO
- PAGADO -> VALIDADO
- PAGADO -> EXPIRADO

# ROLES

## ROLE: ADMIN_GENERAL

DESCRIPTION:
- Administrador global.

PERMISSIONS:
- ACCESS_ALL: true
- MODULES:
  - Panel
  - Sucursales
  - Mesas
  - Pedidos
  - Nueva Venta
  - Ventas
  - Productos
  - Fotos
  - Clientes
  - Cajas
  - Usuarios
  - Apps Delivery
  - Configuracion
  - Delivery
  - Carta QR
  - Kiosko Admin
  - Cupones
  - Planes
  - Agente
  - Reportes
  - RRHH
  - Perfil

## ROLE: RESTAURANTE

DESCRIPTION:
- Administrador de sucursal/restaurante.

PERMISSIONS:
- MODULES:
  - Panel
  - Mesas
  - Pedidos
  - Nueva Venta
  - Ventas
  - Productos
  - Fotos
  - Clientes
  - Cajas
  - Usuarios
  - RRHH
  - Reportes
  - Configuracion limitada por sucursal
  - Perfil
  - Delivery
  - Carta QR
  - Kiosko Admin
  - Cupones
  - Planes
  - Agente
  - Apps Delivery

## ROLE: SECRETARY

DESCRIPTION:
- Usuario administrativo limitado.

PERMISSIONS:
- MODULES:
  - Panel
  - Mesas
  - Pedidos
  - Ventas
  - Nueva Venta
  - Productos
  - Clientes
  - RRHH
  - Cupones
  - Perfil

## ROLE: CASHIER

DESCRIPTION:
- Cajero POS.

PERMISSIONS:
- MODULES:
  - Panel
  - Mesas
  - Pedidos
  - Ventas
  - Nueva Venta
  - Clientes
  - Cajas
  - Apps Delivery
  - Perfil

## ROLE: WAITER

DESCRIPTION:
- Mesero.

PERMISSIONS:
- MODULES:
  - Panel
  - Mesas
  - Pedidos
  - Ventas
  - Perfil

## ROLE: CHEF

DESCRIPTION:
- Cocina.

PERMISSIONS:
- MODULES:
  - Pedidos
  - Perfil

DATA_FILTERS:
- Pedidos filtrados por estaciones COCINA y CUARTO_CALIENTE.

## ROLE: BAR

DESCRIPTION:
- Barra.

PERMISSIONS:
- MODULES:
  - Pedidos
  - Perfil

DATA_FILTERS:
- Pedidos filtrados por estación BARRA.

## ROLE: DELIVERY

DESCRIPTION:
- Delivery/repartidor.

PERMISSIONS:
- MODULES:
  - Panel
  - Pedidos
  - Delivery
  - Driver
  - Perfil

# MODULES

## MODULE: Panel

DESCRIPTION:
- Vista inicial de control operativo.

USERS:
- ADMIN_GENERAL
- RESTAURANTE
- SECRETARY
- CASHIER
- WAITER
- DELIVERY

INPUTS:
- Usuario autenticado
- Rol
- Sucursal

OUTPUTS:
- Métricas operativas
- Accesos a módulos
- Estado de funciones

ACTIONS:
- Ver ventas del día
- Ver pedidos activos
- Ver mesas ocupadas
- Acceder a módulos permitidos

FLOW:
1. Validar sesión.
2. Identificar rol.
3. Cargar datos según rol y sucursal.
4. Renderizar panel permitido.

DEPENDENCIES:
- Usuario
- Sucursal
- Venta
- Pedido
- Mesa
- Cliente

## MODULE: Sucursales

DESCRIPTION:
- Gestión de locales y configuración base por sucursal.

USERS:
- ADMIN_GENERAL

INPUTS:
- Nombre
- Dirección
- Teléfono
- Email
- Logo
- Plan
- Sector
- Estado activa

OUTPUTS:
- Sucursal creada o actualizada
- Orden de sucursales
- Configuración de marca

ACTIONS:
- Crear sucursal
- Editar sucursal
- Activar sucursal
- Desactivar sucursal
- Subir logo
- Reordenar sucursales

FLOW:
1. Abrir módulo Sucursales.
2. Crear o seleccionar sucursal.
3. Ingresar campos.
4. Guardar.
5. Actualizar listado.

DEPENDENCIES:
- Sucursal
- Tenant
- PlanTipo
- SectorTipo

## MODULE: Usuarios

DESCRIPTION:
- Gestión de cuentas, roles y acceso.

USERS:
- ADMIN_GENERAL
- RESTAURANTE
- SECRETARY

INPUTS:
- Nombre
- Usuario
- Password
- Email
- Rol
- Sucursal
- Estado

OUTPUTS:
- Usuario creado o actualizado
- Permisos aplicados

ACTIONS:
- Crear usuario
- Editar usuario
- Activar usuario
- Desactivar usuario
- Filtrar usuarios por sucursal
- Buscar usuario

FLOW:
1. Abrir Usuarios.
2. Buscar o filtrar.
3. Abrir formulario.
4. Ingresar datos.
5. Guardar.
6. Refrescar listado.

DEPENDENCIES:
- Usuario
- Rol
- Sucursal

## MODULE: Productos

DESCRIPTION:
- Catálogo, menú, categorías, fotos y variantes.

USERS:
- ADMIN_GENERAL
- RESTAURANTE
- SECRETARY

INPUTS:
- Código
- Nombre
- Descripción
- Precio
- Costo
- Stock
- Stock mínimo
- Categoría
- Imagen
- IVA
- Visibilidad POS
- Visibilidad QR
- Visibilidad Kiosko
- Variantes

OUTPUTS:
- Producto creado o actualizado
- Categoría creada o actualizada
- Menú POS
- Menú QR
- Menú Kiosko

ACTIONS:
- Crear producto
- Editar producto
- Eliminar producto
- Crear categoría
- Renombrar categoría
- Reordenar categorías
- Cambiar estación de categoría
- Activar/desactivar visibilidad POS
- Activar/desactivar visibilidad QR
- Subir imagen
- Recortar imagen
- Seleccionar imagen desde galería
- Importar carta desde URL
- Importar carta desde texto
- Crear variantes
- Editar variantes

FLOW:
1. Abrir Productos.
2. Crear o seleccionar categoría.
3. Crear o editar producto.
4. Configurar precio, visibilidad e imagen.
5. Configurar variantes si aplica.
6. Guardar.
7. Actualizar catálogo.

DEPENDENCIES:
- Producto
- Categoria
- VarianteGrupo
- VarianteOpcion
- Sucursal

## MODULE: Mesas

DESCRIPTION:
- Gestión visual de mesas y estados de atención.

USERS:
- ADMIN_GENERAL
- RESTAURANTE
- SECRETARY
- CASHIER
- WAITER

INPUTS:
- Mesa seleccionada
- Estado de mesa
- Pedido activo

OUTPUTS:
- Estado de mesa actualizado
- Acceso a POS con mesa
- Historial de ventas de mesa

ACTIONS:
- Ver mesas
- Entrar a mesa
- Marcar mesa reservada
- Liberar mesa
- Borrar pedido activo de mesa
- Ver historial de mesa
- Reimprimir boleta
- Pantalla completa

FLOW:
1. Abrir Mesas.
2. Seleccionar mesa.
3. Si mesa LIBRE: permitir entrar o reservar.
4. Si mesa OCUPADA/CUENTA: mostrar pedido activo.
5. Usuario entra a POS o libera mesa.
6. Sistema actualiza estado.

DEPENDENCIES:
- Mesa
- Sala
- Pedido
- Venta

## MODULE: POS

DESCRIPTION:
- Creación de órdenes, venta y cobro.

USERS:
- ADMIN_GENERAL
- RESTAURANTE
- SECRETARY
- CASHIER
- WAITER

INPUTS:
- Productos
- Variantes
- Cantidad
- Notas
- Mesa
- Cliente
- Pagos
- Cupones
- Puntos

OUTPUTS:
- Pedido
- DetallePedido
- Venta
- PagoVenta
- Comanda
- Boleta
- Precuenta

ACTIONS:
- Agregar producto
- Quitar producto
- Cambiar cantidad
- Agregar nota
- Enviar orden
- Imprimir comanda por estación
- Abrir precuenta
- Cobrar venta
- Cobrar grupo
- Imprimir boleta
- Cancelar ítem guardado
- Reactivar ítem cancelado
- Asignar ítem a grupo
- Compartir ítem entre grupos
- Dividir cantidad entre grupos

FLOW:
1. Abrir POS.
2. Cargar productos visibles.
3. Agregar ítems al carrito.
4. Configurar variantes y notas.
5. Enviar orden.
6. Crear o actualizar Pedido.
7. Imprimir comandas por estación si corresponde.
8. Abrir checkout.
9. Registrar pagos.
10. Crear Venta.
11. Marcar ítems/pedido según pago.

DEPENDENCIES:
- Producto
- Categoria
- Pedido
- DetallePedido
- Venta
- PagoVenta
- Caja
- Cliente
- Cupon
- MovimientoPuntos

## MODULE: Checkout

DESCRIPTION:
- Registro de pagos y cierre de venta.

USERS:
- ADMIN_GENERAL
- RESTAURANTE
- SECRETARY
- CASHIER
- WAITER

INPUTS:
- Total
- Método de pago
- Monto
- Cliente
- Pedido
- Grupo
- Detalles pagados

OUTPUTS:
- Venta pagada
- PagoVenta[]
- Vuelto
- Boleta
- Detalles marcados como pagados

ACTIONS:
- Seleccionar método de pago
- Agregar pago parcial
- Agregar pago total pendiente
- Eliminar pago
- Confirmar cobro
- Imprimir boleta

FLOW:
1. Calcular total.
2. Usuario agrega uno o más pagos.
3. Validar sumaPagos >= total.
4. Definir metodoPago final.
5. Crear Venta.
6. Crear PagoVenta.
7. Si modo grupo: marcar detalles del grupo como pagados.
8. Si efectivo con sobrepago: calcular vuelto.

DEPENDENCIES:
- Venta
- PagoVenta
- Pedido
- DetallePedido
- Caja
- Cliente

## MODULE: Pedidos_KDS

DESCRIPTION:
- Pantalla de pedidos para cocina, barra, delivery y operación.

USERS:
- ADMIN_GENERAL
- RESTAURANTE
- SECRETARY
- CASHIER
- WAITER
- CHEF
- BAR
- DELIVERY

INPUTS:
- EstadoPedido
- TipoPedido
- Estación
- Rol

OUTPUTS:
- Pedido actualizado
- Pedido filtrado por estación
- Notificación de pedido listo

ACTIONS:
- Ver pedidos pendientes
- Ver pedidos en proceso
- Ver pedidos listos
- Filtrar por tipo
- Cambiar estado
- Devolver a proceso
- Llamar mesero/cajero/rider
- Cancelar pedido
- Actualizar listado
- Activar modo nocturno

FLOW:
1. Cargar pedidos PENDIENTE, EN_PROCESO y LISTO.
2. Aplicar filtro por rol.
3. Aplicar filtro por tipo.
4. Mostrar pedidos activos o listos.
5. Usuario actualiza estado.
6. Sistema guarda estado y refresca pantalla.

DEPENDENCIES:
- Pedido
- DetallePedido
- Producto
- Categoria
- Usuario

## MODULE: Delivery

DESCRIPTION:
- Gestión de pedidos delivery y retiro.

USERS:
- ADMIN_GENERAL
- RESTAURANTE
- CASHIER
- DELIVERY

INPUTS:
- Pedido delivery
- Cliente
- Dirección
- Zona
- Repartidor
- EstadoPedido

OUTPUTS:
- Pedido actualizado
- Tracking actualizado
- Repartidor asignado
- Venta delivery
- Precuenta delivery

ACTIONS:
- Ver pedidos activos
- Filtrar por estado
- Confirmar pedido
- Rechazar/cancelar pedido
- Pasar a preparación
- Marcar listo
- Asignar repartidor
- Confirmar entrega
- Confirmar retiro
- Imprimir precuenta
- Crear ingreso manual
- Ver repartidores
- Ver finalizados

FLOW:
1. Abrir Delivery.
2. Cargar pedidos activos.
3. Usuario selecciona filtro.
4. Usuario abre pedido.
5. Usuario actualiza estado.
6. Si delivery y estado LISTO: asignar repartidor antes de entrega.
7. Si retiro: permitir confirmar retiro sin repartidor.
8. Sistema actualiza tracking.

DEPENDENCIES:
- Pedido
- PedidoDelivery
- Cliente
- DireccionCliente
- Repartidor
- Usuario
- ZonaDelivery

## MODULE: Zonas_Delivery

DESCRIPTION:
- Configuración de zonas y tarifas de despacho.

USERS:
- ADMIN_GENERAL
- RESTAURANTE

INPUTS:
- Nombre de zona
- Costo cliente
- Pago rider

OUTPUTS:
- Zonas guardadas
- Tarifas disponibles

ACTIONS:
- Agregar zona
- Editar zona
- Eliminar zona
- Guardar zonas

FLOW:
1. Abrir Zonas Delivery.
2. Agregar o editar zona.
3. Validar nombre.
4. Validar costos no negativos.
5. Validar pagoRider <= costoCliente.
6. Guardar en sucursal.

DEPENDENCIES:
- Sucursal
- PedidoDelivery

## MODULE: Pedido_Publico

DESCRIPTION:
- Pedido público para delivery o retiro.

USERS:
- ClienteFinal

INPUTS:
- Slug sucursal
- Productos
- Variantes
- Cantidades
- Notas
- Nombre cliente
- Teléfono
- Dirección
- Referencia
- Zona
- Método de pago
- Modo retiro/delivery

OUTPUTS:
- Pedido
- PedidoDelivery
- Cliente
- DirecciónCliente
- Link tracking
- Link WhatsApp
- Preferencia Mercado Pago si aplica

ACTIONS:
- Ver categorías
- Ver productos
- Seleccionar variantes
- Agregar al carrito
- Quitar del carrito
- Escribir nota
- Elegir delivery
- Elegir retiro
- Ingresar datos
- Seleccionar pago
- Confirmar pedido
- Abrir seguimiento
- Abrir WhatsApp

FLOW:
1. Cliente abre link público.
2. Sistema carga sucursal, categorías y productos visibles.
3. Cliente agrega productos.
4. Cliente elige delivery o retiro.
5. Cliente ingresa datos obligatorios.
6. Cliente selecciona método de pago.
7. Sistema valida carrito y datos.
8. Sistema crea pedido.
9. Si Mercado Pago: crear preferencia y redirigir.
10. Mostrar confirmación y tracking.

DEPENDENCIES:
- Sucursal
- Producto
- Categoria
- VarianteGrupo
- VarianteOpcion
- Cliente
- DireccionCliente
- Pedido
- PedidoDelivery
- MercadoPago

## MODULE: Tracking_Delivery

DESCRIPTION:
- Seguimiento público de pedido.

USERS:
- ClienteFinal
- DELIVERY
- CASHIER
- RESTAURANTE

INPUTS:
- ID pedido
- EstadoPedido
- EstadoDelivery

OUTPUTS:
- Estado visible para cliente
- Progreso de entrega/retiro

ACTIONS:
- Ver estado
- Refrescar estado

FLOW:
1. Cliente abre URL de tracking.
2. Sistema busca pedido.
3. Sistema muestra etapa actual.
4. Cambios internos actualizan etapa visible.

DEPENDENCIES:
- Pedido
- PedidoDelivery

## MODULE: Carta_QR

DESCRIPTION:
- Generación de QR por mesa para carta digital.

USERS:
- ADMIN_GENERAL
- RESTAURANTE

INPUTS:
- Mesa
- Sucursal
- Base URL

OUTPUTS:
- QR PNG
- URL de carta

ACTIONS:
- Seleccionar mesa
- Generar QR
- Descargar QR
- Abrir URL

FLOW:
1. Abrir Carta QR.
2. Seleccionar mesa.
3. Sistema genera URL pública.
4. Sistema genera QR.
5. Usuario descarga PNG.

DEPENDENCIES:
- Mesa
- Sala
- Sucursal
- Producto
- Categoria

## MODULE: Menu_Publico

DESCRIPTION:
- Carta pública visible por clientes.

USERS:
- ClienteFinal

INPUTS:
- Slug sucursal
- Productos visibles
- Categorías visibles

OUTPUTS:
- Menú público

ACTIONS:
- Ver categorías
- Ver productos
- Ver información de sucursal

FLOW:
1. Cliente abre URL de menú.
2. Sistema resuelve sucursal.
3. Sistema carga productos enMenuQR.
4. Cliente visualiza carta.

DEPENDENCIES:
- Sucursal
- Producto
- Categoria

## MODULE: Kiosko

DESCRIPTION:
- Autoservicio para pedidos de mostrador.

USERS:
- ClienteFinal
- ADMIN_GENERAL
- RESTAURANTE

INPUTS:
- Slug sucursal
- Productos enKiosko
- Carrito

OUTPUTS:
- Pedido tipo MOSTRADOR
- Pedido visible en KDS

ACTIONS:
- Abrir kiosko
- Ver productos
- Agregar productos
- Confirmar pedido

FLOW:
1. Administrador abre URL kiosko en pantalla táctil.
2. Cliente selecciona productos.
3. Cliente confirma pedido.
4. Sistema crea Pedido tipo MOSTRADOR.
5. KDS muestra pedido.

DEPENDENCIES:
- Sucursal
- Producto
- Categoria
- Pedido
- DetallePedido

## MODULE: Cajas

DESCRIPTION:
- Apertura, cierre, movimientos y arqueos.

USERS:
- ADMIN_GENERAL
- RESTAURANTE
- CASHIER

INPUTS:
- Caja
- Saldo inicial
- Saldo final
- Movimiento
- Motivo

OUTPUTS:
- Caja abierta/cerrada
- MovimientoCaja
- Arqueo
- Resumen de cierre

ACTIONS:
- Crear caja
- Abrir caja
- Cerrar caja
- Registrar ingreso de efectivo
- Registrar retiro de efectivo
- Ver historial de arqueos
- Ver resumen Z

FLOW:
1. Abrir Cajas.
2. Seleccionar caja.
3. Si CERRADA: ingresar saldo inicial y abrir.
4. Si ABIERTA: permitir movimientos o cierre.
5. Para cierre: cargar resumen.
6. Ingresar saldo final.
7. Calcular totalVentas y diferencia.
8. Guardar arqueo.

DEPENDENCIES:
- Caja
- MovimientoCaja
- Arqueo
- Venta
- Usuario

## MODULE: Ventas

DESCRIPTION:
- Historial y administración de ventas.

USERS:
- ADMIN_GENERAL
- RESTAURANTE
- SECRETARY
- CASHIER
- WAITER

INPUTS:
- Filtros
- Venta seleccionada

OUTPUTS:
- Listado ventas
- Detalle venta
- Totales

ACTIONS:
- Ver ventas
- Filtrar ventas
- Ver detalle
- Reimprimir comprobante
- INFERRED: anular venta según permisos

FLOW:
1. Abrir Ventas.
2. Cargar ventas según rol/sucursal.
3. Aplicar filtros.
4. Mostrar resultados.

DEPENDENCIES:
- Venta
- DetalleVenta
- PagoVenta
- Caja
- Cliente
- Pedido

## MODULE: Analisis_Ventas

DESCRIPTION:
- Métricas de ventas y productos.

USERS:
- ADMIN_GENERAL
- RESTAURANTE

INPUTS:
- Fecha
- Rango
- Turno
- Usuario
- Categoría

OUTPUTS:
- Total ventas
- Total pedidos
- Ticket promedio
- Ventas por turno
- Ventas por hora
- Ventas por categoría
- Top productos
- Baja rotación
- Alertas sin venta

ACTIONS:
- Filtrar por fecha
- Filtrar por turno
- Filtrar por usuario
- Filtrar por categoría
- Limpiar filtros

FLOW:
1. Abrir Análisis.
2. Definir filtros.
3. Sistema consulta ventas.
4. Sistema calcula métricas.
5. Mostrar gráficos y tablas.

DEPENDENCIES:
- Venta
- DetalleVenta
- Producto
- Categoria
- Usuario

## MODULE: Reportes

DESCRIPTION:
- Reportes de caja diaria y tiempos.

USERS:
- ADMIN_GENERAL
- RESTAURANTE

INPUTS:
- Fecha
- Días

OUTPUTS:
- Reporte caja diaria
- Reporte tiempos
- Eventos de pedido

ACTIONS:
- Consultar caja diaria
- Consultar tiempos
- Cambiar fecha
- Cambiar rango de días

FLOW:
1. Abrir Reportes.
2. Seleccionar reporte.
3. Ingresar fecha o días.
4. Consultar API.
5. Mostrar resultados.

DEPENDENCIES:
- Venta
- Pedido
- EventoPedido
- Caja

## MODULE: Clientes

DESCRIPTION:
- Registro, búsqueda, bloqueo y seguimiento de clientes.

USERS:
- ADMIN_GENERAL
- RESTAURANTE
- SECRETARY
- CASHIER

INPUTS:
- Nombre
- Email
- Teléfono
- Dirección
- Género
- Fecha nacimiento
- Estado activo

OUTPUTS:
- Cliente creado/actualizado
- Indicador cumpleaños
- Saldo puntos
- Perfil cliente

ACTIONS:
- Crear cliente
- Editar cliente
- Buscar cliente
- Filtrar cliente
- Bloquear cliente
- Desbloquear cliente
- Eliminar cliente
- Ver perfil

FLOW:
1. Abrir Clientes.
2. Buscar o filtrar.
3. Crear o editar cliente.
4. Guardar.
5. Sistema actualiza estadísticas.

DEPENDENCIES:
- Cliente
- Venta
- PedidoDelivery
- MovimientoPuntos

## MODULE: Cupones

DESCRIPTION:
- Administración de descuentos por código.

USERS:
- ADMIN_GENERAL
- RESTAURANTE
- SECRETARY

INPUTS:
- Código
- Descripción
- Tipo
- Valor
- Uso máximo
- Vencimiento
- Estado activo

OUTPUTS:
- Cupón creado/actualizado
- Estado de cupón
- Descuento aplicable

ACTIONS:
- Crear cupón
- Editar cupón
- Activar cupón
- Desactivar cupón
- Eliminar cupón
- Copiar código
- Buscar cupón cumpleaños

FLOW:
1. Abrir Cupones.
2. Crear o seleccionar cupón.
3. Ingresar reglas.
4. Guardar.
5. Sistema actualiza listado.

DEPENDENCIES:
- Cupon
- Sucursal
- Venta
- Cliente

## MODULE: Puntos

DESCRIPTION:
- Fidelización por acumulación y canje de puntos.

USERS:
- ADMIN_GENERAL
- RESTAURANTE
- CASHIER

INPUTS:
- Configuración puntos
- Cliente
- Venta
- Puntos canjeados

OUTPUTS:
- Puntos ganados
- Puntos canjeados
- MovimientoPuntos
- Saldo cliente

ACTIONS:
- Activar puntos por sucursal
- Configurar puntosPorMil
- Configurar valorPunto
- Acumular puntos
- Canjear puntos
- INFERRED: ajustar puntos manualmente

FLOW:
1. Configurar puntos en sucursal.
2. Asociar cliente a venta.
3. Completar venta.
4. Calcular puntos ganados.
5. Registrar MovimientoPuntos.
6. Actualizar saldo cliente.

DEPENDENCIES:
- Sucursal
- Cliente
- Venta
- MovimientoPuntos

## MODULE: RRHH

DESCRIPTION:
- Empleados y asistencia por sucursal.

USERS:
- ADMIN_GENERAL
- RESTAURANTE
- SECRETARY

INPUTS:
- Sucursal
- Empleado
- Documento
- Email
- Teléfono
- Fecha ingreso
- Asistencia
- Estado asistencia
- Hora entrada
- Hora salida

OUTPUTS:
- Empleado creado
- Asistencia creada
- Listados RRHH

ACTIONS:
- Seleccionar sucursal
- Crear empleado
- Importar usuarios activos como empleados
- Buscar empleados
- Ver asistencias
- Registrar asistencia

FLOW:
1. Abrir RRHH.
2. Seleccionar sucursal.
3. Cargar empleados y asistencias.
4. Crear empleado o importar usuarios.
5. Registrar asistencia.
6. Actualizar tablas.

DEPENDENCIES:
- Sucursal
- Usuario
- Empleado
- Asistencia
- Cargo
- Departamento

## MODULE: Agente_WhatsApp

DESCRIPTION:
- Conexión de agente WhatsApp por sucursal.

USERS:
- ADMIN_GENERAL
- RESTAURANTE

INPUTS:
- Sucursal
- Activación
- QR WhatsApp

OUTPUTS:
- Estado agente
- QR conexión
- Cliente agente
- Sesión agente

ACTIONS:
- Activar agente
- Desactivar agente
- Refrescar estado
- Escanear QR
- Ver estado conexión

FLOW:
1. Abrir Agente.
2. Seleccionar sucursal.
3. Activar agente.
4. Sistema genera QR si requiere conexión.
5. Usuario escanea QR.
6. Sistema cambia estado a CONECTADO.

DEPENDENCIES:
- Sucursal
- AgenteWsp
- AgenteCliente
- AgenteSesion

## MODULE: Registro_Publico_Cliente

DESCRIPTION:
- Registro público de clientes.

USERS:
- ClienteFinal

INPUTS:
- Nombre
- Teléfono
- Email
- Dirección
- Fecha nacimiento
- Sucursal

OUTPUTS:
- Cliente creado o encontrado
- Cupón o código opcional

ACTIONS:
- Buscar cliente
- Registrar cliente
- Enviar cupón

FLOW:
1. Cliente abre registro público.
2. Ingresa datos.
3. Sistema busca cliente existente.
4. Sistema crea o actualiza cliente.
5. Sistema puede enviar cupón.

DEPENDENCIES:
- Cliente
- Sucursal
- Cupon

## MODULE: Eventos

DESCRIPTION:
- Eventos, tickets y validación.

USERS:
- ADMIN_GENERAL
- RESTAURANTE
- ClienteFinal

INPUTS:
- Evento
- Cliente comprador
- Pago
- Token ticket

OUTPUTS:
- Evento creado
- Ticket creado
- Ticket validado

ACTIONS:
- Crear evento
- Editar evento
- Comprar ticket
- Consultar ticket
- Validar ticket

FLOW:
1. Administrador crea evento.
2. Cliente abre evento público.
3. Cliente ingresa datos.
4. Sistema crea TicketEvento.
5. Staff valida token.
6. Sistema marca ticket VALIDADO.

DEPENDENCIES:
- Evento
- TicketEvento
- Cliente
- MetodoPago

INFERRED:
- Módulo existe en rutas/modelos.
- Visibilidad en navegación puede depender de configuración.

## MODULE: Visor_Cliente

DESCRIPTION:
- Pantalla externa para mostrar información al cliente.

USERS:
- CASHIER
- ClienteFinal

INPUTS:
- Caja
- Estado visor
- Venta/Pedido actual

OUTPUTS:
- Pantalla cliente actualizada

ACTIONS:
- Abrir visor
- Actualizar visor desde POS
- Ver estado de compra

FLOW:
1. Usuario abre visor.
2. POS actualiza visorEstado.
3. Cliente ve información.

DEPENDENCIES:
- Caja
- Pedido
- Venta

INFERRED:
- Flujo exacto depende de uso operativo del visor.

# FLOWS

## FLOW: Crear_Pedido_Mesa

ACTOR:
- WAITER

STEPS:
1. Abrir Mesas.
2. Seleccionar Mesa con estado LIBRE u OCUPADA.
3. Entrar a POS con mesaId.
4. Agregar productos.
5. Agregar variantes si aplica.
6. Agregar notas si aplica.
7. Enviar orden.
8. Sistema crea Pedido con mesaId.
9. Sistema crea DetallePedido.
10. Sistema marca Mesa como OCUPADA.
11. KDS muestra Pedido.

RESULT:
- Pedido estado PENDIENTE o EN_PROCESO según lógica.
- Mesa estado OCUPADA.
- Detalles visibles en KDS.

## FLOW: Preparar_Pedido_Cocina

ACTOR:
- CHEF

STEPS:
1. Abrir Pedidos.
2. Sistema filtra estaciones COCINA y CUARTO_CALIENTE.
3. Seleccionar pedido PENDIENTE.
4. Cambiar estado a EN_PROCESO.
5. Preparar productos.
6. Cambiar estado a LISTO.
7. Sistema marca meseroLlamado true.

RESULT:
- Pedido estado LISTO.
- Mesero/cajero puede retirar pedido.

## FLOW: Preparar_Pedido_Barra

ACTOR:
- BAR

STEPS:
1. Abrir Pedidos.
2. Sistema filtra estación BARRA.
3. Seleccionar pedido.
4. Cambiar estado a EN_PROCESO.
5. Preparar ítems.
6. Cambiar estado a LISTO.

RESULT:
- Ítems/pedido de barra quedan listos.

## FLOW: Cobrar_Venta_POS

ACTOR:
- CASHIER

STEPS:
1. Abrir POS o pedido de mesa.
2. Ver carrito.
3. Abrir checkout.
4. Seleccionar método de pago.
5. Ingresar monto.
6. Agregar pago.
7. Repetir si requiere pago mixto.
8. Confirmar cuando sumaPagos >= total.
9. Sistema crea Venta.
10. Sistema crea PagoVenta.
11. Sistema marca venta PAGADA.
12. Sistema imprime boleta si usuario lo solicita.

RESULT:
- Venta PAGADA.
- Caja actualiza totales.
- Pedido queda asociado a venta si aplica.

## FLOW: Cobrar_Cuenta_Dividida

ACTOR:
- CASHIER

STEPS:
1. Abrir pedido de mesa.
2. Activar modo grupos.
3. Asignar DetallePedido a grupo.
4. Dividir o compartir ítems si aplica.
5. Abrir cobro de grupo.
6. Registrar pago.
7. Confirmar cobro.
8. Sistema crea Venta modoGrupo.
9. Sistema marca detalles del grupo como pagados.
10. Repetir para grupos pendientes.

RESULT:
- Detalles del grupo quedan pagados.
- Grupos restantes permanecen pendientes.

## FLOW: Abrir_Caja

ACTOR:
- CASHIER

STEPS:
1. Abrir Cajas.
2. Seleccionar Caja estado CERRADA.
3. Ingresar saldoInicio.
4. Confirmar apertura.
5. Sistema cambia Caja a ABIERTA.
6. Sistema registra usuarioId y abiertaEn.

RESULT:
- Caja ABIERTA.
- Ventas pueden asociarse a Caja.

## FLOW: Cerrar_Caja

ACTOR:
- CASHIER

STEPS:
1. Abrir Cajas.
2. Seleccionar Caja estado ABIERTA.
3. Solicitar cierre/reporte.
4. Sistema calcula resumen.
5. Usuario ingresa saldoFinal.
6. Confirmar cierre.
7. Sistema calcula totalVentas.
8. Sistema calcula diferencia.
9. Sistema crea Arqueo.
10. Sistema cambia Caja a CERRADA.

RESULT:
- Caja CERRADA.
- Arqueo guardado.

## FLOW: Pedido_Delivery_Publico

ACTOR:
- ClienteFinal

STEPS:
1. Abrir página pública /pedir/[slug].
2. Seleccionar productos.
3. Configurar variantes.
4. Agregar notas.
5. Elegir modo Delivery.
6. Ingresar nombre.
7. Ingresar teléfono.
8. Ingresar dirección.
9. Seleccionar zona.
10. Elegir método de pago.
11. Confirmar pedido.
12. Sistema crea Cliente o reutiliza existente.
13. Sistema crea DireccionCliente.
14. Sistema crea Pedido tipo DELIVERY.
15. Sistema crea PedidoDelivery.
16. Sistema genera trackingUrl.

RESULT:
- Pedido delivery activo.
- Cliente recibe confirmación y tracking.

## FLOW: Pedido_Retiro_Publico

ACTOR:
- ClienteFinal

STEPS:
1. Abrir página pública /pedir/[slug].
2. Seleccionar productos.
3. Elegir modo Retiro en tienda.
4. Ingresar nombre.
5. Ingresar teléfono.
6. Elegir método de pago.
7. Confirmar pedido.
8. Sistema crea Pedido.
9. Sistema marca zonaDelivery como Retiro en tienda.
10. Sistema genera trackingUrl.

RESULT:
- Pedido retiro activo.
- No requiere repartidor.

## FLOW: Gestionar_Delivery

ACTOR:
- CASHIER

STEPS:
1. Abrir Delivery.
2. Seleccionar pedido PENDIENTE.
3. Confirmar pedido.
4. Sistema cambia estado a EN_PROCESO.
5. Preparación finaliza.
6. Usuario marca LISTO.
7. Si pedido es delivery: asignar repartidor.
8. Confirmar entrega.
9. Si pedido es retiro: confirmar retiro.

RESULT:
- Pedido ENTREGADO.
- Tracking muestra finalizado.

## FLOW: Generar_QR_Mesa

ACTOR:
- RESTAURANTE

STEPS:
1. Abrir Carta QR.
2. Seleccionar Mesa.
3. Solicitar generar QR.
4. Sistema crea URL pública con sucursal y mesa.
5. Sistema genera imagen QR.
6. Usuario descarga PNG.

RESULT:
- QR disponible para impresión.

## FLOW: Pedido_Kiosko

ACTOR:
- ClienteFinal

STEPS:
1. Abrir kiosko de sucursal.
2. Seleccionar productos visibles enKiosko.
3. Confirmar pedido.
4. Sistema crea Pedido tipo MOSTRADOR.
5. Sistema crea DetallePedido.
6. KDS muestra pedido.

RESULT:
- Pedido mostrador activo en KDS.

## FLOW: Registrar_Cliente

ACTOR:
- CASHIER

STEPS:
1. Abrir Clientes.
2. Abrir Nuevo Cliente.
3. Ingresar datos.
4. Guardar.
5. Sistema crea Cliente.
6. Sistema recalcula estadísticas.

RESULT:
- Cliente activo disponible para ventas.

## FLOW: Crear_Cupon

ACTOR:
- RESTAURANTE

STEPS:
1. Abrir Cupones.
2. Crear cupón.
3. Ingresar código.
4. Seleccionar tipo.
5. Ingresar valor.
6. Configurar usoMax y venceEn si aplica.
7. Guardar.

RESULT:
- Cupón activo o inactivo según configuración.

## FLOW: Registrar_Asistencia

ACTOR:
- SECRETARY

STEPS:
1. Abrir RRHH.
2. Seleccionar sucursal.
3. Abrir Registrar asistencia.
4. Seleccionar empleado.
5. Seleccionar estado.
6. Ingresar fecha y horas.
7. Guardar.

RESULT:
- Asistencia registrada.

## FLOW: Conectar_Agente_WhatsApp

ACTOR:
- RESTAURANTE

STEPS:
1. Abrir Agente.
2. Seleccionar sucursal.
3. Activar agente.
4. Sistema muestra QR si estado ESPERANDO_QR.
5. Usuario escanea QR con WhatsApp.
6. Sistema cambia estado a CONECTADO.

RESULT:
- Agente WhatsApp conectado.

# RULES

## ACCESS_RULES

- ADMIN_GENERAL puede acceder a todos los módulos.
- RESTAURANTE accede a módulos operativos y administrativos de sucursal.
- SECRETARY no accede a configuración global ni cajas según middleware.
- CASHIER accede a ventas, mesas, pedidos, clientes, cajas y Apps Delivery.
- WAITER accede a panel, mesas, pedidos, ventas y perfil.
- CHEF accede solo a pedidos y perfil.
- BAR accede solo a pedidos y perfil.
- DELIVERY accede a panel, pedidos, delivery, driver y perfil.
- Si un usuario intenta acceder a ruta no permitida, el sistema redirige a su home permitido.
- CHEF y BAR tienen home por defecto en /pedidos.

## PRODUCT_RULES

- Producto activo puede mostrarse y venderse.
- Producto enMenu controla visibilidad POS.
- Producto enMenuQR controla visibilidad en carta QR/pública.
- Producto enKiosko controla visibilidad en kiosko.
- Categoría enMenu controla visibilidad POS de la categoría.
- Categoría enMenuQR controla visibilidad QR de la categoría.
- Categoría estacion define enrutamiento KDS.
- VarianteGrupo requerido obliga selección antes de agregar producto. INFERRED desde UI.
- VarianteOpcion precio suma al precio base del producto.

## ORDER_RULES

- Pedido contiene DetallePedido.
- Pedido puede pertenecer a Mesa.
- Pedido puede pertenecer a Caja.
- Pedido tipo DELIVERY puede tener PedidoDelivery.
- Pedido tipo MOSTRADOR se crea desde kiosko.
- Pedido PENDIENTE aparece en KDS.
- Pedido EN_PROCESO aparece en KDS.
- Pedido LISTO aparece en lista de listos.
- Pedido ENTREGADO sale de activos.
- Pedido CANCELADO sale de activos.
- meseroLlamado indica que un pedido listo requiere retiro por mesero/cajero/rider.
- llamadoTipo puede ser MESERO, CAJERO o RIDER.

## KDS_RULES

- KDS carga PENDIENTE, EN_PROCESO y LISTO.
- CHEF ve ítems con estación COCINA o CUARTO_CALIENTE.
- BAR ve ítems con estación BARRA.
- Roles no filtrados ven pedido completo.
- Si un pedido no contiene ítems visibles para el rol, no se muestra a ese rol.
- Pedidos se ordenan con PENDIENTE antes que EN_PROCESO y más antiguos primero. INFERRED desde UI.

## TABLE_RULES

- Mesa LIBRE puede abrir POS.
- Mesa LIBRE puede marcarse RESERVADA.
- Mesa con pedido activo muestra detalle de pedido.
- Entrar a mesa abre POS con mesaId.
- Abrir precuenta cambia Mesa a CUENTA.
- Borrar y liberar mesa elimina pedido activo. INFERRED desde texto de confirmación.
- Liberar mesa deja Mesa en LIBRE.

## CHECKOUT_RULES

- Checkout requiere al menos un pago.
- Checkout requiere sumaPagos >= total.
- Si hay más de un pago, metodoPago final = MIXTO.
- Si hay un solo pago, metodoPago final = método de ese pago.
- Si pago efectivo supera total, sistema calcula vuelto.
- En modo grupo, checkout usa solo ítems del grupo.
- En modo grupo, los detalles cobrados quedan pagados.
- Ítems cancelados no se cobran.
- Ítems pagados no se vuelven a cobrar.

## SPLIT_BILL_RULES

- Grupos disponibles: A1, A2, A3, A4, A5.
- Un DetallePedido puede tener grupo.
- Un DetallePedido puede ser compartido.
- Un DetallePedido compartido tiene participantes.
- Un DetallePedido con cantidad > 1 puede dividirse en nuevos detalles por grupo.
- Para dividir, debe haber al menos dos grupos con cantidad > 0.
- Solo ítems guardados pueden compartirse o dividirse. INFERRED desde UI.

## CASH_RULES

- Caja CERRADA debe abrirse antes de operar como caja activa. INFERRED.
- Abrir caja requiere saldoInicio.
- Cerrar caja requiere saldoFinal.
- MovimientoCaja requiere tipo, monto y motivo.
- RETIRO disminuye efectivo esperado.
- INGRESO aumenta efectivo esperado.
- Cierre calcula totalVentas.
- Cierre calcula diferencia.
- Arqueo guarda apertura y cierre.

## DELIVERY_RULES

- Pedido delivery público requiere carrito no vacío.
- Delivery requiere dirección.
- Retiro no requiere dirección.
- Delivery usa cargoEnvio según zona.
- Retiro usa cargoEnvio 0.
- Mercado Pago solo aparece si mpEnabled.
- Si método Mercado Pago, sistema intenta crear preferencia.
- Pedido LISTO delivery requiere repartidor asignado para confirmar entrega.
- Pedido retiro LISTO puede confirmarse como retirado sin repartidor.
- Delivery finalizado tiene estado ENTREGADO.
- Cancelado no aparece como activo.

## CUSTOMER_RULES

- Cliente puede buscarse por teléfono en pedido público.
- Si cliente existente tiene dirección, puede autocompletar dirección. INFERRED desde UI.
- Cliente puede estar activo o bloqueado.
- Eliminar cliente elimina historial de compras según advertencia UI.
- Fecha nacimiento permite detectar cumpleaños hoy o próximos 7 días.
- Cliente tiene saldo de puntos.

## COUPON_RULES

- Cupon codigo es único por sucursal.
- Cupón puede ser PORCENTAJE o MONTO_FIJO.
- Cupón vencido no debe aplicarse. INFERRED.
- Cupón agotado no debe aplicarse. INFERRED.
- Cupón inactivo no debe aplicarse. INFERRED.
- usoActual aumenta cuando se usa. INFERRED.

## POINTS_RULES

- Sucursal puntosActivo habilita puntos.
- puntosPorMil define acumulación.
- valorPunto define valor de canje.
- Venta puede registrar puntosGanados.
- Venta puede registrar puntosCanjeados.
- MovimientoPuntos registra GANADO, CANJEADO, AJUSTE o ANULADO.

## QR_MENU_RULES

- Generar QR requiere mesa.
- QR contiene URL pública asociada a sucursal y mesa.
- Carta pública usa productos visibles en QR.
- Generación puede fallar por plan/permisos según mensaje UI.

## KIOSK_RULES

- Kiosko usa link /kiosko/[slug].
- Kiosko crea pedidos tipo MOSTRADOR.
- Pedidos MOSTRADOR aparecen en KDS.
- Recomendación UI: usar pantalla completa.

## REPORTING_RULES

- Reporte caja diaria usa fecha.
- Reporte tiempos usa cantidad de días.
- Análisis de ventas puede filtrar por fecha, turno, usuario y categoría.
- Productos sin venta reciente generan alerta en análisis.

## RRHH_RULES

- Empleado pertenece a sucursal.
- Usuario puede importarse como empleado si está activo. INFERRED.
- Asistencia es única por empleado y fecha.
- Estados de asistencia UI: PRESENTE, TARDE, AUSENTE, PERMISO.

## WHATSAPP_AGENT_RULES

- Agente pertenece a una sucursal.
- Un agente activo puede requerir QR.
- QR tiene expiración.
- Estado CONECTADO implica conexión activa.
- Estado ERROR requiere reconexión o refresco.
- Conversaciones/pedidos por WhatsApp: INFERRED.

## EVENT_RULES

- Evento pertenece a sucursal y tenant.
- Ticket pertenece a evento.
- Ticket tiene token único.
- Ticket PAGADO puede validarse.
- Ticket VALIDADO registra validadoEn.
- Eventos visibles en navegación: INFERRED según configuración.

