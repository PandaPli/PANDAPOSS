import { create } from "zustand";
import type { CartItem } from "@/types";

const GRUPO_COLORS: Record<string, string> = {
  A: "#3b82f6", // blue-500
  B: "#22c55e", // green-500
  C: "#f97316", // orange-500
  D: "#a855f7", // purple-500
  E: "#ec4899", // pink-500
};

export function getGrupoColor(grupo: string): string {
  return GRUPO_COLORS[grupo.toUpperCase()] ?? "#6b7280";
}

interface CartState {
  items: CartItem[];
  mesaId: number | null;
  clienteId: number | null;
  pedidoId: number | null;
  descuento: number;
  ivaPorc: number;

  addItem: (item: Omit<CartItem, "cantidad"> & { cantidad?: number }) => void;
  removeItem: (id: number, tipo: "producto" | "combo") => void;
  updateCantidad: (id: number, tipo: "producto" | "combo", cantidad: number) => void;
  updateObservacion: (id: number, tipo: "producto" | "combo", obs: string) => void;
  setMesa: (id: number | null) => void;
  setCliente: (id: number | null) => void;
  setPedido: (id: number | null) => void;
  setDescuento: (v: number) => void;
  setIva: (v: number) => void;
  cancelItem: (id: number, tipo: "producto" | "combo") => void;
  clear: () => void;
  setInitialState: (items: CartItem[], pedidoId: number, mesaId?: number | null) => void;
  markAsSaved: () => void;

  /** Asigna un grupo de pago a un ítem (null = sin grupo) */
  setItemGrupo: (detalleId: number, grupo: string | null) => void;
  /** Marca los ítems del grupo como pagados */
  markGrupoPagado: (grupo: string) => void;
  /** Divide un ítem (por detalleId) en múltiples grupos con sus cantidades */
  splitItemGrupos: (
    originalDetalleId: number,
    splits: { grupo: string; cantidad: number; newDetalleId?: number }[]
  ) => void;

  // Calculados
  subtotal: () => number;
  totalDescuento: () => number;
  totalIva: () => number;
  total: () => number;

  /** Lista de grupos únicos activos (con ítems asignados no pagados) */
  getGrupos: () => string[];
  /** Ítems asignados a un grupo específico (no pagados) */
  getItemsByGrupo: (grupo: string) => CartItem[];
  /** Subtotal de un grupo */
  getSubtotalGrupo: (grupo: string) => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  mesaId: null,
  clienteId: null,
  pedidoId: null,
  descuento: 0,
  ivaPorc: 0,

  addItem(item) {
    set((state) => {
      // Ignorar ítems cancelados: si el mismo producto fue anulado,
      // se agrega como entrada nueva (no-guardado) en lugar de incrementar el cancelado
      const existing = state.items.find(
        (i) => i.id === item.id && i.tipo === item.tipo && !i.cancelado
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id && i.tipo === item.tipo && !i.cancelado
              ? { ...i, cantidad: i.cantidad + (item.cantidad ?? 1) }
              : i
          ),
        };
      }
      return { items: [...state.items, { ...item, cantidad: item.cantidad ?? 1 }] };
    });
  },

  removeItem(id, tipo) {
    set((s) => ({ items: s.items.filter((i) => !(i.id === id && i.tipo === tipo)) }));
  },

  updateCantidad(id, tipo, cantidad) {
    if (cantidad <= 0) {
      get().removeItem(id, tipo);
      return;
    }
    set((s) => ({
      items: s.items.map((i) =>
        i.id === id && i.tipo === tipo ? { ...i, cantidad } : i
      ),
    }));
  },

  updateObservacion(id, tipo, obs) {
    set((s) => ({
      items: s.items.map((i) =>
        i.id === id && i.tipo === tipo ? { ...i, observacion: obs } : i
      ),
    }));
  },

  cancelItem: (id, tipo) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.id === id && i.tipo === tipo ? { ...i, cancelado: !i.cancelado } : i
      ),
    })),

  setMesa: (id) => set({ mesaId: id }),
  setCliente: (id) => set({ clienteId: id }),
  setPedido: (id) => set({ pedidoId: id }),
  setDescuento: (v) => set({ descuento: v }),
  setIva: (v) => set({ ivaPorc: v }),
  clear: () => set({ items: [], mesaId: null, clienteId: null, pedidoId: null, descuento: 0 }),
  setInitialState: (items, pedidoId, mesaId) => set({ items, pedidoId, mesaId: mesaId ?? null }),
  markAsSaved: () => set((s) => ({ items: s.items.map((i) => ({ ...i, guardado: true })) })),

  setItemGrupo: (detalleId, grupo) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.detalleId === detalleId ? { ...i, grupo: grupo ?? undefined } : i
      ),
    })),

  markGrupoPagado: (grupo) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.grupo === grupo ? { ...i, pagado: true } : i
      ),
    })),

  splitItemGrupos: (originalDetalleId, splits) =>
    set((s) => {
      const original = s.items.find((i) => i.detalleId === originalDetalleId);
      if (!original) return s;

      // Reemplazar el ítem original con los splits
      const sinOriginal = s.items.filter((i) => i.detalleId !== originalDetalleId);
      const nuevos: CartItem[] = splits.map((split) => ({
        ...original,
        cantidad: split.cantidad,
        grupo: split.grupo,
        detalleId: split.newDetalleId ?? original.detalleId,
      }));

      return { items: [...sinOriginal, ...nuevos] };
    }),

  subtotal: () =>
    get().items.reduce((acc, i) => (i.cancelado || i.pagado ? acc : acc + i.precio * i.cantidad), 0),

  totalDescuento: () => {
    const sub = get().subtotal();
    return (sub * get().descuento) / 100;
  },

  totalIva: () => {
    const sub = get().subtotal() - get().totalDescuento();
    return (sub * get().ivaPorc) / 100;
  },

  total: () => get().subtotal() - get().totalDescuento() + get().totalIva(),

  getGrupos: () => {
    const grupos = new Set<string>();
    get().items.forEach((i) => {
      if (i.grupo && !i.cancelado && !i.pagado) grupos.add(i.grupo);
    });
    return Array.from(grupos).sort();
  },

  getItemsByGrupo: (grupo) =>
    get().items.filter((i) => i.grupo === grupo && !i.cancelado && !i.pagado),

  getSubtotalGrupo: (grupo) =>
    get()
      .getItemsByGrupo(grupo)
      .reduce((acc, i) => acc + i.precio * i.cantidad, 0),
}));
