# Manual de Usuario PandaPoss

## Descripción General del Sistema

PandaPoss es un sistema de gestión para restaurantes, bares y negocios gastronómicos. Integra punto de venta, atención de mesas, pantalla de cocina, gestión de delivery, clientes, cupones, cajas, carta QR, kiosco de autoservicio, reportes, asistencia de personal y algunas integraciones en una sola plataforma.

El sistema está pensado para operaciones con una o más sucursales.

### Objetivo Principal

PandaPoss permite al negocio:

- Administrar sucursales, usuarios, roles y planes.
- Vender productos desde POS, mesas, carta QR, delivery, kiosco y canales externos.
- Enviar pedidos a cocina, barra u otras estaciones.
- Hacer seguimiento del estado de cada pedido.
- Controlar cajas, movimientos de efectivo y cierres diarios.
- Mantener clientes, puntos, cumpleaños y cupones.
- Gestionar pedidos delivery, zonas y repartidores.
- Revisar ventas, reportes y desempeño operativo.
- Registrar empleados y asistencia.

### Flujo General

1. El administrador configura sucursales, usuarios, productos, categorías, mesas, cajas, zonas de delivery y menús públicos.
2. Los pedidos se crean desde distintos canales:
   - POS o caja.
   - Atención de mesas.
   - Carta QR o menú público.
   - Página de delivery.
   - Kiosco de autoservicio.
   - Ingreso manual de delivery.
   - Comportamiento inferido: el agente de WhatsApp puede crear pedidos cuando está activo.
3. Los pedidos nuevos aparecen en el módulo **Pedidos / KDS**.
4. Cocina, barra o la estación correspondiente actualiza el estado del pedido.
5. Cajero, mesero, delivery o repartidor completa la operación según el tipo de pedido.
6. El pago se registra en POS o en el flujo de delivery.
7. El sistema actualiza ventas, stock, puntos, caja, reportes e historial del cliente.

## Roles de Usuario

PandaPoss usa permisos por rol. Los módulos visibles dependen del rol del usuario y, en algunos casos, del rubro o sector de la sucursal.

### Administrador / Dueño

Incluye los roles `ADMIN_GENERAL` y `RESTAURANTE`.

El administrador configura el negocio y supervisa la operación diaria.

Puede:

- Ver el panel de control.
- Administrar sucursales, planes, sectores, logos y estado de cada local.
- Crear usuarios y asignar roles.
- Configurar productos, categorías, precios, fotos, variantes y visibilidad en menús.
- Gestionar mesas, pedidos, ventas, clientes, cajas, cupones, delivery, carta QR, kiosco, reportes, fotos y agente de WhatsApp.
- Revisar información de ventas y desempeño por sucursal.

### Cajero / Usuario POS

Rol: `CASHIER`.

El cajero opera ventas, pagos, clientes y cajas.

Puede:

- Usar el panel de control.
- Abrir mesas y crear pedidos.
- Crear nuevas ventas en POS.
- Ver historial de ventas.
- Administrar clientes.
- Abrir, cerrar y gestionar cajas.
- Acceder al módulo de Apps Delivery.
- Acceder a su perfil.

### Mesero

Rol: `WAITER`.

El mesero atiende mesas y registra pedidos.

Puede:

- Ver el panel de control.
- Abrir y administrar mesas.
- Crear y actualizar pedidos de mesa.
- Enviar pedidos a cocina o barra.
- Solicitar o revisar precuenta.
- Acceder a pedidos y a su perfil.

### Cocina

Rol: `CHEF`.

El usuario de cocina trabaja con la pantalla de pedidos / KDS.

Puede:

- Ver pedidos asignados a cocina.
- Revisar pedidos pendientes y en preparación.
- Cambiar el estado de los pedidos.
- Marcar pedidos como listos.
- Acceder a su perfil.

### Barra

Rol: `BAR`.

El usuario de barra usa la misma pantalla de pedidos, filtrada por productos de barra.

Puede:

- Ver ítems de barra.
- Cambiar estados de preparación.
- Marcar productos o pedidos como listos.
- Acceder a su perfil.

### Delivery / Repartidor

Rol: `DELIVERY`.

El usuario delivery participa en la gestión de pedidos de despacho.

Puede:

- Ver paneles relacionados con delivery.
- Revisar pedidos delivery activos.
- Aceptar o actualizar pedidos desde la interfaz de repartidor, cuando corresponda.
- Actualizar el avance del despacho.
- Acceder a su perfil.

### Secretaria / Back Office

Rol: `SECRETARY`.

Este rol apoya la operación administrativa con permisos limitados.

Puede:

- Usar el panel.
- Acceder a mesas, pedidos, ventas, productos, clientes, RRHH, cupones y perfil.
- Crear o apoyar registros operativos sin tener acceso completo a la configuración del sistema.

### Cliente Final

El cliente no usa el dashboard privado. Interactúa con páginas públicas.

Puede:

- Ver carta pública o carta QR.
- Hacer pedidos para delivery o retiro.
- Usar un kiosco de autoservicio si está disponible.
- Hacer seguimiento de pedidos.
- Registrar sus datos como cliente.
- Comportamiento inferido: comprar tickets de eventos cuando el módulo esté habilitado.

## Módulos del Sistema

## Panel de Control

### Propósito

El panel entrega una vista rápida de la actividad del negocio y accesos a los módulos disponibles para cada rol.

### Quién lo Usa

Administradores, cajeros, meseros, secretarias y usuarios delivery.

### Cómo Funciona

1. El usuario inicia sesión.
2. El sistema valida su rol.
3. El usuario entra a una pantalla permitida.
4. El panel muestra información de la sucursal o del negocio, como ventas, pedidos activos, mesas ocupadas, clientes, funciones habilitadas y gráficos.
5. El usuario abre el módulo que necesita desde el menú lateral.

### Entradas

- Credenciales de acceso.
- Contexto de sucursal, cuando aplica.
- Navegación seleccionada por el usuario.

### Salidas

- Panel según rol.
- Resumen de sucursal o negocio.
- Acceso a módulos operativos.

## Administración de Sucursales

### Propósito

Permite crear y mantener restaurantes, locales o puntos de servicio.

### Quién lo Usa

Administrador / Dueño.

### Cómo Funciona

1. Abrir **Sucursales**.
2. Crear una nueva sucursal o editar una existente.
3. Ingresar nombre, dirección, teléfono, email, plan, sector y logo.
4. Elegir sector gastronómico:
   - Restaurante / Bar.
   - Delivery.
   - Discoteca.
5. Activar o desactivar la sucursal.
6. Reordenar sucursales si es necesario.

### Entradas

- Nombre de sucursal.
- Dirección y datos de contacto.
- Logo.
- Tipo de plan.
- Tipo de sector.
- Estado activo o inactivo.

### Salidas

- Registro de sucursal.
- Configuración específica de la sucursal.
- Branding usado en menús, paneles y comprobantes.

## Usuarios y Roles

### Propósito

Controla quién puede entrar al sistema y qué puede hacer.

### Quién lo Usa

Administrador / Dueño y algunos administradores de sucursal.

### Cómo Funciona

1. Abrir **Usuarios**.
2. Buscar o filtrar usuarios.
3. Crear un nuevo usuario.
4. Ingresar nombre, usuario, contraseña, email, rol, sucursal y estado.
5. Editar usuarios existentes si el rol lo permite.
6. Dejar usuarios activos o inactivos.

### Entradas

- Nombre.
- Usuario de acceso.
- Contraseña.
- Email.
- Rol.
- Sucursal.
- Estado.

### Salidas

- Cuenta de usuario.
- Permisos según rol.
- Asignación a sucursal.

## Productos y Menú

### Propósito

Administra productos, categorías, precios, fotos, visibilidad, variantes y estaciones de preparación.

### Quién lo Usa

Administradores y secretarias.

### Cómo Funciona

1. Abrir **Productos**.
2. Crear o editar categorías.
3. Asignar cada categoría a una estación, como cocina, barra, cuarto caliente o mostrador.
4. Crear o editar productos.
5. Ingresar código, nombre, descripción, precio, imagen, categoría, IVA y visibilidad.
6. Definir si el producto aparece en:
   - Menú POS.
   - Carta QR / menú público.
   - Kiosco.
7. Agregar variantes cuando corresponda, por ejemplo tamaño, extras u opciones obligatorias.
8. Subir o seleccionar fotos.
9. Opcionalmente importar una carta desde texto o una URL compatible.
10. Guardar cambios.

### Entradas

- Código.
- Nombre.
- Descripción.
- Precio.
- Categoría.
- Imagen.
- Configuración de IVA.
- Visibilidad.
- Grupos de variantes y opciones.

### Salidas

- Catálogo de productos.
- Menú POS.
- Carta QR / menú público.
- Menú de kiosco.
- Enrutamiento a estaciones de preparación.

## Mesas y Atención

### Propósito

Muestra el estado de las mesas o puntos de atención, y permite abrir, reservar, liberar o revisar actividad.

### Quién lo Usa

Administradores, cajeros, meseros y secretarias.

### Cómo Funciona

1. Abrir **Atención** o **Mesas**.
2. Ver mesas agrupadas por salón o área.
3. Seleccionar una mesa.
4. Si está libre, entrar a la mesa para crear un pedido o marcarla como reservada.
5. Si tiene pedido activo, entrar para agregar productos o continuar la atención.
6. Usar precuenta o pago desde el flujo POS.
7. Si corresponde, liberar la mesa confirmando que se eliminarán los productos activos.
8. Revisar ventas recientes de la mesa y reimprimir boletas cuando esté disponible.

### Entradas

- Mesa seleccionada.
- Cambio de estado de mesa.
- Productos del pedido.
- Confirmación para liberar mesa.

### Salidas

- Estado de mesa: libre, ocupada, cuenta solicitada o reservada.
- Pedido activo asociado.
- Historial de ventas de la mesa.
- Reimpresión de comprobante.

## POS / Nueva Venta

### Propósito

El POS permite crear pedidos, enviar ítems a preparación, imprimir comandas, registrar pagos, dividir cuentas y cerrar ventas.

### Quién lo Usa

Cajeros, meseros, administradores y secretarias. Los roles de cocina y barra pueden ver productos filtrados por estación cuando aplica.

### Cómo Funciona

1. Abrir **Nueva Venta** o entrar desde una mesa.
2. Buscar productos por categoría.
3. Agregar productos al carrito.
4. Seleccionar variantes u opciones cuando el producto lo requiera.
5. Ajustar cantidad.
6. Agregar notas por ítem, como instrucciones de preparación.
7. Enviar la orden a cocina o barra.
8. El sistema crea o actualiza el pedido.
9. Se pueden imprimir comandas por estación.
10. Opcionalmente abrir la precuenta.
11. Abrir el pago cuando el cliente esté listo.
12. Agregar uno o más pagos.
13. Confirmar el pago y completar la venta.
14. Imprimir la boleta o comprobante si se necesita.

### Entradas

- Productos.
- Cantidades.
- Variantes.
- Notas.
- Mesa, si corresponde.
- Cliente, si corresponde.
- Método y monto de pago.

### Salidas

- Pedido.
- Comanda de cocina o barra.
- Precuenta.
- Venta registrada.
- Comprobante.
- Actualización de stock y ventas.
- Actualización de puntos del cliente cuando esté configurado.

## División de Cuenta y Pago por Grupos

### Propósito

Permite dividir una mesa en grupos y cobrar por separado.

### Quién lo Usa

Cajeros y meseros.

### Cómo Funciona

1. Abrir el pedido de una mesa en POS.
2. Activar el modo de cuentas o grupos.
3. Asignar productos a grupos como A1, A2, A3, A4 o A5.
4. Marcar productos compartidos entre grupos cuando corresponda.
5. Dividir cantidades de un producto entre grupos si la cantidad es mayor a uno.
6. Cobrar un grupo específico.
7. El sistema marca los productos de ese grupo como pagados.
8. Repetir el proceso con los otros grupos o cerrar la cuenta completa.

### Entradas

- Asignación de grupo.
- Participantes de productos compartidos.
- Cantidades divididas.
- Método y monto de pago del grupo.

### Salidas

- Control de grupos pagados y pendientes.
- Comprobantes separados por grupo.
- Registros de venta.

## Pagos

### Propósito

Registra cómo paga el cliente y cierra la venta.

### Quién lo Usa

Cajeros, meseros y administradores.

### Cómo Funciona

1. Abrir el pago desde el carrito POS.
2. Revisar subtotal, descuentos, impuestos y total.
3. Seleccionar método de pago:
   - Efectivo.
   - Tarjeta.
   - Transferencia.
   - Pago mixto cuando se agregan varios pagos.
   - Crédito está soportado en el modelo de datos y reportes de caja; su disponibilidad en pantalla puede depender del flujo activo.
4. Ingresar monto.
5. Agregar el pago.
6. Repetir si el cliente paga con más de un método.
7. Confirmar cuando el total esté cubierto.
8. Si el pago en efectivo supera el total, el sistema calcula vuelto.
9. Imprimir comprobante si corresponde.

### Entradas

- Método de pago.
- Monto.
- Referencia opcional.

### Salidas

- Venta pagada.
- Desglose de pagos.
- Vuelto cuando corresponde.
- Comprobante.
- Totales de caja.

## Pedidos / KDS

### Propósito

Muestra pedidos activos para preparación y entrega.

### Quién lo Usa

Cocina, barra, cajeros, meseros, administradores y usuarios delivery.

### Cómo Funciona

1. Abrir **Pedidos**.
2. Ver pedidos en estados activos:
   - Pendiente.
   - En proceso.
   - Listo.
3. Filtrar por tipo:
   - Todos.
   - Cocina.
   - Barra.
   - Delivery.
   - Mostrador / kiosco.
4. Cocina ve ítems de cocina y cuarto caliente.
5. Barra ve ítems de barra.
6. Iniciar o avanzar un pedido.
7. Marcarlo como listo.
8. Llamar a mesero, cajero o rider cuando esté listo.
9. Marcar como entregado cuando termine.
10. Cancelar si es necesario y el usuario tiene permisos.

### Entradas

- Acción de estado del pedido.
- Filtro por tipo de pedido.
- Filtro de estación según rol.

### Salidas

- Estado actualizado.
- Aviso de pedido listo.
- Actualización de pantalla KDS.
- Refresco en tiempo real o periódico de pedidos activos.

## Gestión de Delivery

### Propósito

Controla pedidos delivery y retiro desde su creación hasta el despacho o entrega.

### Quién lo Usa

Administradores, cajeros y usuarios delivery.

### Cómo Funciona

1. Abrir **Delivery**.
2. Ver pedidos activos de delivery y retiro.
3. Filtrar por estado:
   - Pendiente.
   - En proceso.
   - Listo.
4. Abrir un pedido para revisar cliente, dirección, pago, productos, notas y total.
5. Confirmar o rechazar pedidos pendientes.
6. Pasar pedidos confirmados a preparación.
7. Marcar como listos.
8. Asignar repartidor cuando sea delivery.
9. Confirmar entrega cuando el repartidor termina.
10. Para retiro en tienda, confirmar retiro sin asignar repartidor.
11. Ver pedidos entregados del día.

### Entradas

- Cambios de estado.
- Asignación de repartidor.
- Datos de pedido manual.
- Confirmación de retiro.

### Salidas

- Pedido actualizado.
- Etapa de seguimiento para el cliente.
- Repartidor asignado.
- Totales de ventas delivery.
- Precuenta de delivery impresa si se solicita.

## Zonas de Delivery

### Propósito

Define zonas de despacho y costos asociados.

### Quién lo Usa

Administradores.

### Cómo Funciona

1. Abrir **Delivery > Zonas**.
2. Agregar una zona.
3. Ingresar nombre.
4. Ingresar costo que paga el cliente.
5. Ingresar pago al rider.
6. Guardar.
7. El flujo de delivery usa la zona seleccionada para calcular despacho y pago al repartidor.

### Entradas

- Nombre de zona.
- Costo al cliente.
- Pago al rider.

### Salidas

- Opciones de despacho para clientes y equipo interno.
- Información de pago al repartidor.
- Margen de delivery.

## Pedido Público de Delivery / Retiro

### Propósito

Permite que el cliente haga pedidos sin iniciar sesión.

### Quién lo Usa

Cliente final.

### Cómo Funciona

1. El cliente abre el link público de la sucursal.
2. Revisa categorías y productos.
3. Selecciona opciones si el producto las requiere.
4. Agrega productos al carrito.
5. Elige delivery o retiro.
6. Para delivery, ingresa nombre, teléfono, dirección, departamento o referencia, y zona.
7. Para retiro, ingresa sus datos y ve la información del local.
8. Selecciona método de pago:
   - Efectivo.
   - Transferencia.
   - Mercado Pago, cuando está habilitado.
9. Confirma el pedido.
10. Si elige Mercado Pago, es redirigido al checkout online.
11. El sistema crea el pedido y muestra confirmación con link de seguimiento.
12. Si hay teléfono configurado, el cliente puede abrir un mensaje de WhatsApp al local.

### Entradas

- Nombre del cliente.
- Teléfono.
- Dirección y referencia para delivery.
- Productos y notas.
- Zona o modo retiro.
- Método de pago.

### Salidas

- Pedido delivery o retiro.
- Total con despacho cuando corresponde.
- Link de seguimiento.
- Mensaje opcional por WhatsApp.
- Redirección a Mercado Pago cuando aplica.

## Seguimiento de Delivery

### Propósito

Permite que el cliente revise el avance de su pedido.

### Quién lo Usa

Cliente final y equipo delivery.

### Cómo Funciona

1. El cliente abre el link de seguimiento.
2. La página muestra la etapa actual del pedido.
3. La etapa cambia cuando el equipo actualiza el pedido en Delivery o KDS.
4. Para delivery, el avance puede ser confirmado, preparando, en camino y entregado.
5. Para retiro, el seguimiento se adapta al estado de retiro.

### Entradas

- Link de seguimiento.
- Actualizaciones de estado realizadas por el equipo.

### Salidas

- Progreso visible para el cliente.
- Estado final de entrega o retiro.

## Carta QR / Menú Digital

### Propósito

Permite que el cliente escanee un QR en la mesa y vea la carta digital de la sucursal.

### Quién lo Usa

El administrador lo configura. El cliente lo visualiza.

### Cómo Funciona

1. El administrador abre **Carta QR**.
2. Selecciona una mesa.
3. Genera un código QR para esa mesa.
4. Descarga la imagen PNG.
5. Pone el QR en la mesa física.
6. El cliente escanea el código.
7. El cliente ve la carta pública de la sucursal.

### Entradas

- Mesa seleccionada.
- Configuración de carta pública.
- Productos y categorías visibles en QR.

### Salidas

- Código QR en PNG.
- Link de menú público.
- Vista de carta para el cliente.

### Comportamiento Inferido

El sistema genera links de menú por mesa. El código muestra páginas públicas de menú y pedido, pero la acción exacta después de escanear puede depender de la configuración de la sucursal. En algunos casos el cliente solo verá la carta; en otros, podría acceder a flujos relacionados de pedido.

## Menú Público

### Propósito

Muestra productos de la sucursal fuera del dashboard privado.

### Quién lo Usa

Cliente final.

### Cómo Funciona

1. El cliente abre el link del menú.
2. Revisa categorías y productos.
3. Solo se muestran productos habilitados para menú público o QR.
4. Puede aparecer branding de la sucursal, como logo, fondo, frase, saludo y redes sociales.

### Entradas

- Link público.
- Visibilidad de productos y categorías.
- Branding de la sucursal.

### Salidas

- Carta digital visible para clientes.

## Kiosco de Autoservicio

### Propósito

Permite que clientes hagan pedidos de mostrador desde una pantalla táctil.

### Quién lo Usa

El administrador lo configura. El cliente lo usa en el kiosco. Cocina y caja reciben los pedidos.

### Cómo Funciona

1. El administrador abre **Kiosco de Autoservicio**.
2. Abre el link de kiosco de la sucursal en una pantalla táctil.
3. El cliente navega el menú.
4. Agrega productos.
5. Confirma el pedido.
6. El pedido aparece automáticamente en KDS como pedido de mostrador.
7. El equipo prepara y completa el pedido con el flujo normal.

### Entradas

- Link de kiosco.
- Productos seleccionados.
- Opciones de productos.

### Salidas

- Pedido de mostrador.
- Tarjeta de pedido en KDS.

## Apps Delivery

### Propósito

El módulo Apps Delivery está orientado a apoyar pedidos de plataformas externas de delivery.

### Quién lo Usa

Administradores, cajeros y posiblemente operadores delivery.

### Cómo Funciona

1. El usuario abre **Apps Delivery**.
2. Revisa o gestiona flujos relacionados con apps de delivery.
3. Comportamiento inferido: el módulo está pensado para canales externos tipo marketplaces de delivery, pero las acciones exactas deben confirmarse en el sistema en ejecución.

### Entradas

- Información o configuración de pedidos externos.

### Salidas

- Gestión o visualización de pedidos de apps externas.

### Comportamiento Inferido

La navegación y el código incluyen el módulo Apps Delivery, disponible para administradores, restaurante y cajeros. No queda completamente claro, desde los archivos revisados, qué acciones específicas ofrece la interfaz.

## Cajas

### Propósito

Controla apertura de caja, movimientos de efectivo, cierre, arqueos y reportes.

### Quién lo Usa

Administradores y cajeros.

### Cómo Funciona

1. Abrir **Cajas**.
2. Crear una caja si el usuario tiene permisos.
3. Abrir una caja cerrada ingresando saldo inicial.
4. Registrar ventas desde POS asociadas a la caja.
5. Agregar movimientos extras si entra o sale dinero.
6. Cerrar la caja.
7. Revisar el resumen antes de confirmar.
8. Ingresar efectivo contado.
9. El sistema calcula ventas y diferencia.
10. Revisar historial de arqueos cuando sea necesario.

### Entradas

- Nombre de caja.
- Saldo inicial.
- Tipo de movimiento: ingreso o retiro.
- Monto y motivo.
- Saldo final contado.

### Salidas

- Estado de caja abierta o cerrada.
- Registro de movimientos.
- Reporte de cierre.
- Ventas por método de pago.
- Diferencia entre efectivo esperado y contado.
- Historial de arqueos.

## Historial de Ventas

### Propósito

Permite revisar ventas completadas y datos operativos de venta.

### Quién lo Usa

Administradores, cajeros y secretarias.

### Cómo Funciona

1. Abrir **Ventas**.
2. Ver registros de ventas.
3. Filtrar o revisar información.
4. Consultar métodos de pago, totales, cliente, mesa y pedido cuando existan.
5. Usar la pantalla de análisis para revisar desempeño con más detalle.

### Entradas

- Filtros de fecha o búsqueda.
- Venta seleccionada.

### Salidas

- Listado de ventas.
- Detalle de venta.
- Resúmenes de ventas.

## Análisis de Ventas

### Propósito

Entrega información operativa para administradores y encargados.

### Quién lo Usa

Administradores y jefaturas.

### Cómo Funciona

1. Abrir **Ventas > Análisis**.
2. Seleccionar fecha o rango.
3. Filtrar por turno, usuario o categoría si se requiere.
4. Revisar:
   - Total de ventas.
   - Cantidad de ventas.
   - Ticket promedio.
   - Ventas por turno.
   - Ventas por hora.
   - Ventas por categoría.
   - Productos más vendidos.
   - Productos de baja rotación.
   - Productos sin venta reciente.

### Entradas

- Fecha o rango.
- Turno.
- Usuario.
- Categoría.

### Salidas

- Gráficos y tarjetas de análisis.
- Listados de desempeño de productos.
- Alertas operativas de productos con baja venta.

## Reportes

### Propósito

Entrega resúmenes estructurados de caja diaria, ventas y tiempos de pedido.

### Quién lo Usa

Administradores y jefaturas.

### Cómo Funciona

1. Abrir **Reportes**.
2. Elegir reporte de caja diaria o tiempos.
3. Seleccionar fecha o cantidad de días.
4. Cargar el reporte.
5. Revisar totales, ventas, métodos de pago y eventos operativos.

### Entradas

- Fecha del reporte.
- Cantidad de días para análisis de tiempos.

### Salidas

- Reporte de caja diaria.
- Totales de venta.
- Desglose por método de pago.
- Reporte de tiempos y eventos de pedido.

## Clientes

### Propósito

Administra datos de clientes, puntos, cumpleaños e historial.

### Quién lo Usa

Administradores, cajeros y secretarias.

### Cómo Funciona

1. Abrir **Clientes**.
2. Buscar por nombre, email o teléfono.
3. Filtrar o agrupar clientes.
4. Crear o editar un cliente.
5. Ingresar nombre, email, teléfono, dirección, género y fecha de nacimiento.
6. Ver indicadores de cumpleaños de hoy o próximos días.
7. Bloquear o desbloquear clientes.
8. Abrir perfil de cliente para ver historial cuando esté disponible.
9. Eliminar un cliente solo si corresponde, ya que el sistema advierte que también se eliminará su historial de compras.

### Entradas

- Nombre.
- Email.
- Teléfono.
- Dirección.
- Género.
- Fecha de nacimiento.
- Estado activo o bloqueado.

### Salidas

- Registro de cliente.
- Indicadores de cumpleaños.
- Saldo de puntos.
- Historial de compras o pedidos.

## Puntos / Fidelización

### Propósito

Premia a clientes y permite controlar saldos de puntos.

### Quién lo Usa

Administradores, cajeros y clientes de forma indirecta.

### Cómo Funciona

1. El administrador activa y configura puntos para una sucursal.
2. El cliente se asocia a una venta.
3. Al completar la venta, el sistema calcula puntos según la configuración.
4. Los puntos quedan guardados en el perfil del cliente.
5. Los puntos pueden ajustarse o canjearse donde el flujo de venta lo permita.

### Entradas

- Configuración de puntos de la sucursal.
- Cliente vinculado a la venta.
- Total de venta.
- Puntos canjeados, si se usan.

### Salidas

- Puntos ganados.
- Puntos canjeados.
- Historial de movimientos de puntos.

### Comportamiento Inferido

El modelo de datos y las pantallas de cliente soportan puntos y movimientos. Los pasos exactos para canjear puntos en caja pueden depender de la configuración activa del checkout.

## Cupones

### Propósito

Permite crear descuentos por código y apoyar campañas como cumpleaños.

### Quién lo Usa

Administradores y secretarias.

### Cómo Funciona

1. Abrir **Cupones**.
2. Crear un cupón.
3. Elegir tipo:
   - Porcentaje.
   - Monto fijo.
4. Ingresar valor, límite de uso, vencimiento y descripción.
5. Activar o desactivar el cupón.
6. Copiar el código cuando sea necesario.
7. Buscar información de cupón de cumpleaños por código.
8. Aplicar el cupón en flujos de venta compatibles.

### Entradas

- Código.
- Descripción.
- Tipo de descuento.
- Valor.
- Usos máximos.
- Fecha de vencimiento.
- Estado activo.

### Salidas

- Cupón registrado.
- Conteo de usos.
- Estado activo, vencido o agotado.
- Descuento aplicado a ventas elegibles.

## Fotos / Galería

### Propósito

Apoya la gestión de imágenes para productos y presentación del negocio.

### Quién lo Usa

Administradores.

### Cómo Funciona

1. Abrir **Fotos**.
2. Subir o administrar imágenes.
3. Usar imágenes en productos o presentación del menú público cuando corresponda.

### Entradas

- Archivos de imagen.

### Salidas

- Imágenes cargadas.
- Visuales para productos o menús.

### Comportamiento Inferido

El módulo de productos permite subir, recortar y seleccionar imágenes desde galería. La página Fotos existe para gestión más amplia, pero sus operaciones exactas deben confirmarse en la interfaz en ejecución.

## Configuración

### Propósito

Guarda ajustes generales del negocio o del sistema.

### Quién lo Usa

Administrador / Dueño.

### Cómo Funciona

1. Abrir **Configuración**.
2. Editar datos como nombre de empresa, RUT, dirección, teléfono, email, logo, moneda, símbolo, IVA y otras opciones disponibles.
3. Guardar cambios.

### Entradas

- Nombre de empresa.
- RUT o identificador tributario.
- Dirección.
- Datos de contacto.
- Logo.
- Moneda y símbolo.
- Porcentaje de IVA.

### Salidas

- Configuración actualizada.
- Datos usados en recibos y visualización.

## Perfil

### Propósito

Permite al usuario revisar o administrar datos de su propia cuenta.

### Quién lo Usa

Todos los roles autenticados.

### Cómo Funciona

1. Abrir **Perfil**.
2. Revisar datos de cuenta.
3. Actualizar campos disponibles cuando el sistema lo permita.

### Entradas

- Información de perfil.

### Salidas

- Perfil de usuario actualizado.

## RRHH / Asistencia

### Propósito

Gestiona empleados y asistencia por sucursal.

### Quién lo Usa

Administradores y secretarias.

### Cómo Funciona

1. Abrir **RRHH**.
2. Seleccionar una sucursal si hay varias.
3. Usar la pestaña **Empleados** para ver personal.
4. Crear un empleado o importar usuarios activos como empleados.
5. Ingresar información personal y laboral.
6. Usar la pestaña **Asistencias** para ver registros.
7. Registrar asistencia seleccionando sucursal, empleado, fecha, estado y horarios.
8. Los estados pueden ser presente, tarde, ausente o permiso.

### Entradas

- Nombre del empleado.
- Documento.
- Email.
- Teléfono.
- Sucursal.
- Departamento o cargo cuando esté disponible.
- Fecha de asistencia.
- Hora de entrada y salida.
- Estado.
- Observación.

### Salidas

- Registro de empleado.
- Registro de asistencia.
- Totales de personal y asistencia por sucursal.

## Agente de WhatsApp

### Propósito

Conecta una sucursal con un flujo automatizado de WhatsApp para atención o pedidos.

### Quién lo Usa

Administradores.

### Cómo Funciona

1. Abrir **Agente**.
2. Ver el estado del agente por sucursal.
3. Activar o desactivar el agente.
4. Si el agente espera QR, escanearlo con WhatsApp para conectar.
5. Monitorear el estado:
   - Desconectado.
   - Esperando QR.
   - Conectado.
   - Error.
6. Revisar clientes o sesiones del agente cuando esté disponible.

### Entradas

- Sucursal.
- Activación del agente.
- Escaneo de QR de WhatsApp.

### Salidas

- Agente conectado o desconectado.
- Clientes y sesiones de WhatsApp almacenados.
- Comportamiento inferido: conversaciones y pedidos por WhatsApp.

## Registro de Clientes

### Propósito

Permite que clientes registren sus datos desde una página pública.

### Quién lo Usa

Cliente final.

### Cómo Funciona

1. El cliente abre un link de registro.
2. Ingresa datos personales y de contacto.
3. El sistema crea o encuentra el registro de cliente.
4. Opcionalmente se puede enviar un cupón de bienvenida o cumpleaños si está configurado.

### Entradas

- Nombre.
- Teléfono.
- Email.
- Dirección.
- Fecha de nacimiento u otros datos de campaña.

### Salidas

- Cliente registrado.
- Cupón opcional o código de cumpleaños.

## Eventos y Tickets

### Propósito

El código incluye pantallas de eventos y tickets para crear eventos, vender tickets y validarlos.

### Quién lo Usa

Administradores y clientes finales, cuando el módulo está habilitado.

### Cómo Funciona

1. El administrador crea un evento con nombre, descripción, fecha, lugar, precio, capacidad e imagen.
2. El cliente abre la página pública del evento.
3. Ingresa datos de comprador y compra o reserva un ticket.
4. El sistema crea un ticket con token y estado de pago.
5. El equipo valida el ticket en el ingreso usando la pantalla de validación.

### Entradas

- Datos del evento.
- Nombre, email y teléfono del cliente.
- Método de pago.
- Token de ticket para validar.

### Salidas

- Evento registrado.
- Ticket registrado.
- Estado de ticket: pendiente de pago, pagado, validado o expirado.

### Comportamiento Inferido

Las rutas y modelos de eventos existen en la aplicación activa. Sin embargo, el menú lateral revisado no muestra Eventos, por lo que su disponibilidad puede depender de permisos, plan o configuración de despliegue.

## Visor de Cliente

### Propósito

Muestra información de venta o pedido en una pantalla separada orientada al cliente.

### Quién lo Usa

Cajeros y clientes que miran la pantalla.

### Cómo Funciona

1. El cajero abre o configura una pantalla de visor.
2. El POS actualiza el estado del visor durante la venta.
3. El cliente ve información de productos o pedido.

### Entradas

- Estado de venta o pedido desde POS.
- Caja o URL de visor seleccionada.

### Salidas

- Información visible para el cliente.

### Comportamiento Inferido

El código incluye rutas de visor y APIs de actualización en tiempo real. El diseño exacto y el flujo del cajero deben confirmarse en la aplicación en ejecución.

## Impresión

### Propósito

Soporta impresión de boletas, comandas de cocina, comandas de barra, precuentas y precuentas de delivery.

### Quién lo Usa

Cajeros, meseros, cocina, barra y administradores.

### Cómo Funciona

1. El usuario envía una orden, abre una precuenta, completa una venta o solicita reimpresión.
2. El sistema genera el documento imprimible correspondiente.
3. El documento se abre en una ventana de impresión o se envía a un endpoint configurado.
4. El equipo imprime la comanda, precuenta o comprobante.

### Entradas

- Detalle de pedido.
- Detalle de venta.
- Configuración de impresora de la sucursal.
- Acción de impresión seleccionada.

### Salidas

- Comanda de cocina.
- Comanda de barra.
- Precuenta.
- Boleta o comprobante.
- Precuenta de delivery.
- Reimpresión.

## Planes y Acceso a Funciones

### Propósito

Los planes controlan qué funciones están disponibles para cada sucursal.

### Quién lo Usa

Administradores.

### Cómo Funciona

1. El administrador asigna un plan a una sucursal.
2. El sistema valida límites del plan antes de habilitar funciones.
3. Funciones como delivery, carta QR o kiosco pueden depender del plan.
4. El panel muestra si las funciones están habilitadas.

### Entradas

- Tipo de plan: Básico, Pro, Prime o Demo.
- Activación de funciones.

### Salidas

- Acceso habilitado o bloqueado a funciones.
- Indicadores de funciones según plan.

## Flujos de Usuario

## Cliente Hace un Pedido Delivery

1. El cliente abre la página pública de pedido.
2. Selecciona productos y opciones.
3. Elige delivery.
4. Ingresa nombre, teléfono, dirección, referencia y zona.
5. Selecciona método de pago.
6. Confirma el pedido.
7. El sistema crea el pedido delivery.
8. El cliente ve una confirmación con link de seguimiento.
9. El equipo ve el pedido en Delivery y/o KDS.
10. El equipo confirma y prepara el pedido.
11. Se asigna repartidor cuando está listo.
12. El cliente sigue el avance hasta la entrega.

## Cliente Hace un Pedido para Retiro

1. El cliente abre la página pública de pedido.
2. Selecciona productos y opciones.
3. Elige retiro en tienda.
4. Ingresa datos de contacto.
5. Selecciona método de pago.
6. Confirma el pedido.
7. El pedido entra al sistema como retiro.
8. El equipo lo prepara.
9. El equipo confirma el retiro cuando el cliente lo pasa a buscar.

## Mesero Crea un Pedido de Mesa

1. El mesero abre **Mesas**.
2. Selecciona una mesa libre u ocupada.
3. Entra a la mesa.
4. Agrega productos y notas.
5. Envía la orden a cocina o barra.
6. La mesa queda ocupada.
7. Cocina o barra prepara los productos.
8. El mesero es avisado cuando están listos.
9. El mesero entrega los productos a la mesa.
10. El mesero o cajero abre precuenta o pago cuando el cliente lo solicita.

## Cocina Gestiona un Pedido

1. Cocina abre **Pedidos**.
2. Revisa pedidos pendientes de cocina.
3. Inicia o avanza la preparación.
4. Marca el pedido como listo.
5. El sistema deja el pedido listo y puede llamar a mesero, cajero o rider.
6. Luego el pedido se marca como entregado o completado por el rol correspondiente.

## Barra Gestiona un Pedido

1. Barra abre **Pedidos**.
2. Ve solo ítems de estación barra.
3. Prepara tragos o productos de barra.
4. Marca como listo.
5. Mesero o cajero completa la entrega al cliente.

## Cajero Completa un Pago

1. El cajero abre el pedido en POS.
2. Revisa productos, descuentos, impuestos y total.
3. Abre el pago.
4. Selecciona método de pago.
5. Ingresa monto.
6. Agrega el pago.
7. Si el pago es mixto, agrega otros métodos.
8. Confirma el pago.
9. El sistema crea una venta pagada.
10. El cajero imprime comprobante si corresponde.

## División de Mesa

1. Mesero o cajero abre el pedido de mesa.
2. Activa modo grupos o cuentas.
3. Asigna productos a grupos.
4. Marca productos compartidos si corresponde.
5. Divide cantidades entre grupos si corresponde.
6. Cobra un grupo.
7. El sistema marca esos productos como pagados.
8. Repite hasta que todos los grupos estén pagados.
9. La mesa puede cerrarse cuando todos los ítems estén resueltos.

## Apertura y Cierre de Caja

1. El cajero abre **Cajas**.
2. Selecciona una caja cerrada.
3. Ingresa efectivo inicial.
4. El sistema marca la caja como abierta.
5. Durante el turno se registran ventas.
6. El cajero registra movimientos extras si corresponde.
7. Al cierre, solicita el reporte de caja.
8. El sistema muestra ventas y desglose de pagos.
9. El cajero ingresa efectivo contado.
10. El sistema calcula diferencia.
11. La caja se cierra y queda guardado el arqueo.

## Administrador Configura Carta QR

1. El administrador crea o revisa productos y categorías.
2. Marca productos y categorías visibles en QR.
3. Abre **Carta QR**.
4. Selecciona una mesa.
5. El sistema genera el QR.
6. Descarga el PNG.
7. Imprime y coloca el QR en la mesa.
8. El cliente escanea y ve la carta pública.

## Administrador Configura Delivery

1. El administrador activa delivery para la sucursal.
2. Abre zonas de delivery.
3. Crea zonas y tarifas.
4. Crea usuarios repartidores si es necesario.
5. Revisa productos visibles en menú público.
6. Los clientes hacen pedidos delivery.
7. El equipo gestiona los pedidos desde el módulo Delivery.

## Notas Técnicas Simples

Estas notas ayudan a entender el comportamiento del producto sin entrar en detalles de código.

- PandaPoss es una aplicación web con dashboard privado y páginas públicas para clientes.
- El acceso está controlado por rol de usuario.
- Algunas páginas públicas no requieren inicio de sesión, como pedido, menú, kiosco, seguimiento, registro, eventos y resultado de pago.
- Los pedidos usan estados comunes: pendiente, en proceso, listo, entregado y cancelado.
- Delivery usa etapas visibles para el cliente: confirmado, preparando, en camino, entregado y cancelado.
- Los productos pueden enviarse a estaciones de preparación mediante su categoría.
- El sector de la sucursal afecta etiquetas y navegación. Por ejemplo, una sucursal enfocada en delivery puede ocultar atención de mesas.
- Algunas funciones dependen del plan o configuración de la sucursal, como delivery, carta QR, kiosco y pago online.
