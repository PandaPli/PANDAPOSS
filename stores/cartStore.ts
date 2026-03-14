import { create } from "zustand";
import type { CartItem } from "@/types";

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

  // Calculados
  subtotal: () => number;
  totalDescuento: () => number;
  totalIva: () => number;
  total: () => number;
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
      const existing = state.items.find(
        (i) => i.id === item.id && i.tipo === item.tipo
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id && i.tipo === item.tipo
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

  subtotal: () =>
    get().items.reduce((acc, i) => (i.cancelado ? acc : acc + i.precio * i.cantidad), 0),

  totalDescuento: () => {
    const sub = get().subtotal();
    return (sub * get().descuento) / 100;
  },

  totalIva: () => {
    const sub = get().subtotal() - get().totalDescuento();
    return (sub * get().ivaPorc) / 100;
  },

  total: () => get().subtotal() - get().totalDescuento() + get().totalIva(),
}));
