export type Rol =
  | "ADMIN_GENERAL"
  | "RESTAURANTE"
  | "SECRETARY"
  | "CASHIER"
  | "WAITER"
  | "CHEF"
  | "BAR"
  | "PASTRY"
  | "DELIVERY";

export type EstadoMesa = "LIBRE" | "OCUPADA" | "CUENTA" | "RESERVADA";
export type EstadoPedido = "PENDIENTE" | "EN_PROCESO" | "LISTO" | "ENTREGADO" | "CANCELADO";
export type TipoPedido = "COCINA" | "BAR" | "REPOSTERIA" | "DELIVERY" | "MOSTRADOR";
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
  /** Grupo de pago asignado: "A", "B", "C", etc. */
  grupo?: string;
}

export interface GrupoPago {
  nombre: string;
  items: CartItem[];
  subtotal: number;
  pagado: boolean;
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

export interface ProductoCard {
  id: number;
  codigo: string;
  nombre: string;
  precio: number;
  imagen: string | null;
  stock: number;
  categoriaId: number | null;
  categoria?: { nombre: string };
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
  } | null;
}

export interface PedidoConDetalles {
  id: number;
  numero: number;
  tipo: TipoPedido;
  estado: EstadoPedido;
  observacion: string | null;
  meseroLlamado: boolean;
  direccionEntrega: string | null;
  telefonoCliente: string | null;
  repartidorId: number | null;
  creadoEn: string;
  mesa?: { nombre: string } | null;
  usuario: { nombre: string };
  repartidor?: { nombre: string } | null;
  detalles: {
    id: number;
    cantidad: number;
    observacion: string | null;
    cancelado?: boolean;
    producto?: { nombre: string } | null;
    combo?: { nombre: string } | null;
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

