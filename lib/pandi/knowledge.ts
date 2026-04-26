import type { PandiKnowledgeItem } from "./types";

export const PANDI_KNOWLEDGE: PandiKnowledgeItem[] = [
  {
    id: "general-overview",
    topic: "general",
    title: "Que es PandaPoss",
    keywords: ["que es", "pandaposs", "programa", "sistema", "ayuda", "modulos"],
    answer:
      "PandaPoss es un sistema de gestion para restaurantes, bares y negocios gastronomicos. Integra ventas, mesas, cocina, delivery, clientes, cupones, cajas, carta QR, kiosko, reportes, usuarios y RRHH en una sola plataforma.",
    relatedModules: ["Panel", "Configuracion", "Reportes"],
  },
  {
    id: "sales-new",
    topic: "ventas",
    title: "Crear una venta",
    keywords: ["venta", "vender", "pos", "cobrar", "nueva venta", "pago"],
    answer:
      "Para crear una venta, entra a Ventas o Nueva venta, agrega productos al carrito, selecciona cantidades o variantes si corresponde, asocia un cliente si lo necesitas y finaliza registrando el metodo de pago. Si la venta pertenece a una caja abierta, quedara reflejada en el resumen de caja.",
    relatedModules: ["Ventas", "Cajas", "Clientes"],
  },
  {
    id: "products-manage",
    topic: "productos",
    title: "Gestionar productos",
    keywords: ["producto", "productos", "categoria", "precio", "stock", "variante", "foto"],
    answer:
      "En Productos puedes crear y editar productos, asignarlos a categorias, definir precios, fotos, variantes y disponibilidad. La visibilidad del producto afecta donde aparece: POS, carta QR, delivery o kiosko, segun la configuracion del negocio.",
    relatedModules: ["Productos", "Carta QR", "Kiosko"],
  },
  {
    id: "customers-manage",
    topic: "clientes",
    title: "Administrar clientes",
    keywords: ["cliente", "clientes", "puntos", "cumpleanos", "telefono", "historial"],
    answer:
      "En Clientes puedes buscar, crear y editar clientes. El perfil del cliente permite revisar historial, puntos, cupones y datos de contacto. Si los puntos estan activos para la sucursal, el sistema puede acumular beneficios segun la configuracion.",
    relatedModules: ["Clientes", "Cupones", "Ventas"],
  },
  {
    id: "orders-kds",
    topic: "pedidos",
    title: "Pedidos y cocina",
    keywords: ["pedido", "pedidos", "cocina", "kds", "preparacion", "listo", "estado"],
    answer:
      "Los pedidos nuevos aparecen en Pedidos/KDS. Desde ahi cocina o barra puede cambiar estados como recibido, en preparacion o listo. El seguimiento ayuda a coordinar mesas, retiro, delivery y despacho.",
    relatedModules: ["Pedidos", "Mesas", "Delivery"],
  },
  {
    id: "tables-service",
    topic: "mesas",
    title: "Atencion de mesas",
    keywords: ["mesa", "mesas", "mesero", "salon", "precuenta", "comanda"],
    answer:
      "En Mesas o Panel puedes abrir una mesa, cargar productos, enviar comandas y gestionar la atencion. Cuando el cliente termina, puedes emitir precuenta y cerrar la venta desde caja o el flujo configurado.",
    relatedModules: ["Mesas", "Panel", "Ventas"],
  },
  {
    id: "cash-register",
    topic: "cajas",
    title: "Abrir y cerrar caja",
    keywords: ["caja", "abrir caja", "cerrar caja", "arqueo", "movimiento", "efectivo"],
    answer:
      "En Cajas puedes abrir caja con monto inicial, registrar movimientos, revisar ventas asociadas y cerrar con arqueo. El cierre ayuda a comparar efectivo esperado, pagos y diferencias operativas.",
    relatedModules: ["Cajas", "Ventas", "Reportes"],
  },
  {
    id: "delivery-flow",
    topic: "delivery",
    title: "Gestionar delivery",
    keywords: ["delivery", "repartidor", "despacho", "zona", "retiro", "direccion"],
    answer:
      "El modulo Delivery permite revisar pedidos, asignar repartidores, controlar estados, configurar zonas y gestionar retiros o despachos. Las zonas ayudan a ordenar cobertura, costos y disponibilidad de entrega.",
    relatedModules: ["Delivery", "Pedidos", "Clientes"],
  },
  {
    id: "qr-menu",
    topic: "carta_qr",
    title: "Carta QR",
    keywords: ["qr", "carta", "menu", "menu publico", "ver carta"],
    answer:
      "La Carta QR muestra el menu publico de la sucursal. Para usarla, configura productos visibles, categorias, imagenes y datos de la sucursal. Luego puedes compartir el enlace o generar el QR para clientes.",
    relatedModules: ["Carta QR", "Productos", "Sucursales"],
  },
  {
    id: "kiosk",
    topic: "kiosko",
    title: "Kiosko de autoservicio",
    keywords: ["kiosko", "autoservicio", "totem", "pedido cliente"],
    answer:
      "El kiosko permite que el cliente arme su pedido desde una pantalla de autoservicio. Requiere productos visibles, sucursal configurada y el flujo de pedidos activo para recibir las ordenes.",
    relatedModules: ["Kiosko", "Productos", "Pedidos"],
  },
  {
    id: "reports",
    topic: "reportes",
    title: "Reportes y analisis",
    keywords: ["reporte", "reportes", "estadistica", "analisis", "ventas hoy", "caja diaria"],
    answer:
      "En Reportes puedes revisar ventas, desempeno, caja diaria y otros indicadores. Sirve para entender ingresos, volumen de pedidos, horarios fuertes y comportamiento operativo por sucursal.",
    relatedModules: ["Reportes", "Ventas", "Cajas"],
  },
  {
    id: "users-roles",
    topic: "usuarios",
    title: "Usuarios y roles",
    keywords: ["usuario", "usuarios", "rol", "permisos", "admin", "cajero", "mesero"],
    answer:
      "Los usuarios tienen roles que controlan que modulos pueden ver y usar. Administrador gestiona el negocio, Cajero opera ventas y cajas, Mesero atiende mesas, y otros roles pueden limitarse a delivery, cocina o gestion especifica.",
    relatedModules: ["Usuarios", "Configuracion"],
  },
  {
    id: "coupons",
    topic: "cupones",
    title: "Cupones",
    keywords: ["cupon", "cupones", "descuento", "cumpleanos", "promocion"],
    answer:
      "En Cupones puedes crear promociones, descuentos o beneficios para clientes. Algunos flujos permiten asociarlos a cumpleanos o busquedas de cliente, segun la configuracion activa.",
    relatedModules: ["Cupones", "Clientes", "Ventas"],
  },
  {
    id: "hr",
    topic: "rrhh",
    title: "RRHH y asistencia",
    keywords: ["rrhh", "empleado", "empleados", "asistencia", "cargo", "personal"],
    answer:
      "El modulo RRHH permite administrar empleados, cargos y asistencia. Sirve para ordenar el personal por sucursal y mantener registros operativos basicos.",
    relatedModules: ["RRHH", "Sucursales"],
  },
  {
    id: "settings",
    topic: "configuracion",
    title: "Configuracion de tienda",
    keywords: ["configuracion", "sucursal", "tienda", "logo", "impresora", "mercadopago", "plan"],
    answer:
      "En Configuracion y Sucursales puedes ajustar datos del negocio, logo, sector, planes, impresoras, delivery, carta QR, kiosko, puntos y otras opciones de operacion.",
    relatedModules: ["Configuracion", "Sucursales"],
  },
];

export const PANDI_QUICK_QUESTIONS = [
  "Como creo una venta?",
  "Como agrego productos?",
  "Como cierro una caja?",
  "Como funciona delivery?",
  "Como configuro la carta QR?",
  "Que puede hacer cada rol?",
];
