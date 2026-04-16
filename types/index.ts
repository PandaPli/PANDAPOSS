export type SectorTipo = "DELIVERY" | "RESTAURANTE_BAR" | "DISCOTECA";

export type Rol =
  | "ADMIN_GENERAL"
  | "RESTAURANTE"
  | "SECRETARY"
  | "CASHIER"
  | "WAITER"
  | "CHEF"
  | "BAR"
  | "DELIVERY";

export type EstadoMesa = "LIBRE" | "OCUPADA" | "CUENTA" | "RESERVADA";
export type EstadoPedido = "PENDIENTE" | "EN_PROCESO" | "LISTO" | "ENTREGADO" | "CANCELADO";
export type TipoPedido = "COCINA" | "BAR" | "DELIVERY" | "MOSTRADOR";
export type MetodoPago = "EFECTIVO" | "TARJETA" | "TRANSFERENCIA" | "CREDITO" | "MIXTO";
export type EstadoVenta = "PENDIENTE" | "PAGADA" | "ANULADA";
export type DeliveryTrackingStage = "CONFIRMADO" | "PREPARANDO" | "EN_CAMINO" | "ENTREGADO" | "CANCELADO";

export interface SessionUser {
  id: number;
  nombre: string;
  usuario: string;
  rol: Rol;
  sucursalId: number | null;
  simbolo: string;
}

export interface CartItem {
  id: number;
  tipo: "producto" | "combo";
  codigo: string;
  nombre: string;
  precio: number;
  cantidad: number;
  observacion?: string;
  imagen?: string;
  guardado?: boolean;
  cancelado?: boolean;
  pagado?: boolean;
  /** ID del DetallePedido en DB (presente cuando guardado: true) */
  detalleId?: number;
  /** Grupo de pago asignado: "A1", "A2", etc. */
  grupo?: string;
  /** Ítem compartido entre varios grupos */
  compartido?: boolean;
  /** Grupos que comparten este ítem (proporcional) */
  participantes?: string[];
  /** Variantes seleccionadas (Gyozas: langostino, tamaño grande, etc.) */
  opciones?: OpcionSeleccionada[];
}

export interface GrupoPago {
  nombre: string;
  items: CartItem[];
  subtotal: number;
  pagado: boolean;
}

export interface RondaDetalle {
  nombre: string;
  cantidad: number;
  observacion?: string | null;
  cancelado: boolean;
}

export interface RondaPedido {
  pedidoId: number;
  numero: number; // 1-based
  creadoEn: string; // ISO date string
  items: RondaDetalle[];
}

export interface PagoItem {
  metodoPago: MetodoPago;
  monto: number;
  referencia?: string;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface OpcionSeleccionada {
  grupoId: number;
  grupoNombre: string;
  opcionId: number;
  opcionNombre: string;
  precio: number;
}

export interface VarianteGrupoCard {
  id: number;
  nombre: string;
  requerido: boolean;
  tipo: string; // "radio" | "checkbox"
  opciones: { id: number; nombre: string; precio: number }[];
}

export interface ProductoCard {
  id: number;
  codigo: string;
  nombre: string;
  precio: number;
  imagen: string | null;
  stock: number;
  categoriaId: number | null;
  categoria?: { nombre: string; estacion?: string };
  variantes?: VarianteGrupoCard[];
}

export interface MesaConEstado {
  id: number;
  nombre: string;
  estado: EstadoMesa;
  capacidad: number;
  salaId: number;
  sala: { nombre: string; esQR: boolean };
  pedidoActivo?: {
    id: number;
    creadoEn: string;
    total: number;
    _count: { detalles: number };
    grupos?: { grupo: string; total: number }[];
  } | null;
}

export interface PedidoConDetalles {
  id: number;
  numero: number;
  tipo: TipoPedido;
  estado: EstadoPedido;
  observacion: string | null;
  meseroLlamado: boolean;
  llamadoTipo: string | null;
  direccionEntrega: string | null;
  telefonoCliente: string | null;
  repartidorId: number | null;
  creadoEn: string;
  // Estado del pago de Mercado Pago (null si no fue por MP).
  // Valores comunes: "approved" | "pending" | "rejected" | "pending_payment"
  mpStatus?: string | null;
  mpPaymentId?: string | null;
  mesa?: { nombre: string } | null;
  usuario: { nombre: string };
  repartidor?: { nombre: string } | null;
  delivery?: { zonaDelivery?: string | null } | null;
  detalles: {
    id: number;
    cantidad: number;
    observacion: string | null;
    cancelado?: boolean;
    opciones?: OpcionSeleccionada[] | null;
    producto?: { nombre: string; categoria?: { estacion: string } | null } | null;
    combo?: { nombre: string; categoria?: { estacion: string } | null } | null;
  }[];
}

export interface DeliveryCustomerInput {
  nombre: string;
  telefono: string;
  direccion: string;
  referencia?: string;
  departamento?: string;
}

export interface DeliveryPedidoPublico {
  id: number;
  estado: EstadoPedido;
  trackingStage: DeliveryTrackingStage;
  clienteNombre: string;
  telefonoCliente: string;
  direccionEntrega: string;
  referencia?: string;
  departamento?: string;
  metodoPago: MetodoPago;
  subtotal: number;
  cargoEnvio: number;
  total: number;
  repartidorNombre?: string | null;
  codigoEntrega?: string | null;
  creadoEn: string;
  estimadoMinutos: number;
  detalles: {
    nombre: string;
    cantidad: number;
    precio: number;
    subtotal: number;
  }[];
}

export interface DashboardStats {
  ventasHoy: number;
  totalHoy: number;
  pedidosActivos: number;
  mesasOcupadas: number;
  alertasStock: number;
  ventasChart: { fecha: string; total: number }[];
}

