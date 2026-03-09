// ─── Tipos compartidos PandaPoss ───────────────────────────────

export type Rol =
  | "ADMIN_GENERAL"
  | "ADMIN_SUCURSAL"
  | "SECRETARY"
  | "CASHIER"
  | "WAITER"
  | "CHEF"
  | "BAR"
  | "PASTRY"
  | "DELIVERY";

export type EstadoMesa = "LIBRE" | "OCUPADA" | "RESERVADA";
export type EstadoPedido = "PENDIENTE" | "EN_PROCESO" | "LISTO" | "ENTREGADO" | "CANCELADO";
export type TipoPedido = "COCINA" | "BAR" | "REPOSTERIA" | "DELIVERY" | "MOSTRADOR";
export type MetodoPago = "EFECTIVO" | "TARJETA" | "TRANSFERENCIA" | "CREDITO" | "MIXTO";
export type EstadoVenta = "PENDIENTE" | "PAGADA" | "ANULADA";

export interface SessionUser {
  id: number;
  nombre: string;
  usuario: string;
  rol: Rol;
  sucursalId: number | null;
  simbolo: string;
}

// Carrito POS
export interface CartItem {
  id: number;
  tipo: "producto" | "combo";
  codigo: string;
  nombre: string;
  precio: number;
  cantidad: number;
  observacion?: string;
  imagen?: string;
}

// Pagos
export interface PagoItem {
  metodoPago: MetodoPago;
  monto: number;
  referencia?: string;
}

// APIs
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

// Productos
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

// Mesas
export interface MesaConEstado {
  id: number;
  nombre: string;
  estado: EstadoMesa;
  capacidad: number;
  salaId: number;
  sala: { nombre: string };
  pedidoActivo?: {
    id: number;
    creadoEn: string;
    _count: { detalles: number };
  } | null;
}

// Pedidos
export interface PedidoConDetalles {
  id: number;
  numero: number;
  tipo: TipoPedido;
  estado: EstadoPedido;
  observacion: string | null;
  creadoEn: string;
  mesa?: { nombre: string } | null;
  usuario: { nombre: string };
  detalles: {
    id: number;
    cantidad: number;
    observacion: string | null;
    producto?: { nombre: string } | null;
    combo?: { nombre: string } | null;
  }[];
}

// Dashboard stats
export interface DashboardStats {
  ventasHoy: number;
  totalHoy: number;
  pedidosActivos: number;
  mesasOcupadas: number;
  alertasStock: number;
  ventasChart: { fecha: string; total: number }[];
}
