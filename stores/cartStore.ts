import { create } from "zustand";
import type { CartItem } from "@/types";

const GRUPO_COLORS: Record<string, string> = {
  A1: "#3b82f6", // blue-500
  A2: "#22c55e", // green-500
  A3: "#f97316", // orange-500
  A4: "#a855f7", // purple-500
  A5: "#ec4899", // pink-500
  A6: "#06b6d4", // cyan-500
  A7: "#f59e0b", // amber-500
  A8: "#6366f1", // indigo-500
};

export function getGrupoColor(grupo: string): string {
  return GRUPO_COLORS[grupo] ?? "#6b7280";
}

interface CartState {
  items: CartItem[];
  mesaId: number | null;
  clienteId: number | null;
  pedidoId: number | null;
  descuento: number;
  ivaPorc: number;
  /** Puntos a canjear en la venta actual */
  puntosCanjeados: number;
  /** Nombres personalizados para cada grupo: { A1: "Roro", A2: "María", ... } */
  grupoNombres: Record<string, string>;

  addItem: (item: Omit<CartItem, "cantidad"> & { cantidad?: number }) => void;
  removeItem: (id: number, tipo: "producto" | "combo", detalleId?: number) => void;
  updateCantidad: (id: number, tipo: "producto" | "combo", cantidad: number, detalleId?: number) => void;
  updateObservacion: (id: number, tipo: "producto" | "combo", obs: string, detalleId?: number) => void;
  setMesa: (id: number | null) => void;
  setMesaFresh: (id: number) => void; // limpia carrito y asigna nueva mesa
  setCliente: (id: number | null) => void;
  setPedido: (id: number | null) => void;
  setDescuento: (v: number) => void;
  setIva: (v: number) => void;
  setPuntosCanjeados: (v: number) => void;
  cancelItem: (id: number, tipo: "producto" | "combo", detalleId?: number) => void;
  clear: () => void;
  setInitialState: (items: CartItem[], pedidoId: number, mesaId?: number | null) => void;
  markAsSaved: () => void;
  /** Marca los ítems recién guardados como guardado:true y les asigna su detalleId del servidor */
  markAsSavedWithIds: (detalleIds: number[]) => void;

  /** Asigna un grupo de pago a un ítem (null = sin grupo) */
  setItemGrupo: (detalleId: number, grupo: string | null) => void;
  /** Marca los ítems del grupo como pagados */
  markGrupoPagado: (grupo: string) => void;
  /** Divide un ítem (por detalleId) en múltiples grupos con sus cantidades */
  splitItemGrupos: (
    originalDetalleId: number,
    splits: { grupo: string; cantidad: number; newDetalleId?: number }[]
  ) => void;
  /** Marca un ítem como compartido entre varios grupos */
  setItemCompartido: (detalleId: number, compartido: boolean, participantes: string[]) => void;
  /** Asigna nombre personalizado a un grupo */
  setGrupoNombre: (grupo: string, nombre: string) => void;

  // Calculados
  subtotal: () => number;
  totalDescuento: () => number;
  totalIva: () => number;
  total: () => number;

  /** Lista de grupos únicos activos (con ítems asignados no pagados) */
  getGrupos: () => string[];
  /** Ítems asignados a un grupo específico (no pagados, no compartidos) */
  getItemsByGrupo: (grupo: string) => CartItem[];
  /** Ítems compartidos activos (no pagados, no cancelados) */
  getItemsCompartidos: () => CartItem[];
  /** Subtotal de un grupo (incluye proporción de ítems compartidos) */
  getSubtotalGrupo: (grupo: string) => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  mesaId: null,
  clienteId: null,
  pedidoId: null,
  descuento: 0,
  ivaPorc: 0,
  puntosCanjeados: 0,
  grupoNombres: {},

  addItem(item) {
    set((state) => {
      // Solo fusionar si el ítem existe Y aún no fue guardado (enviado a KDS).
      // Si ya fue guardado, se agrega como entrada nueva (no-guardado) para que
      // handleOrden lo detecte como ítem nuevo y genere un segundo pedido en KDS.
      // Items con opciones distintas NUNCA se fusionan (son variantes diferentes).
      const opcionesKey = JSON.stringify(item.opciones ?? []);
      const existing = state.items.find(
        (i) =>
          i.id === item.id &&
          i.tipo === item.tipo &&
          !i.cancelado &&
          !i.guardado &&
          (i.grupo ?? null) === (item.grupo ?? null) &&
          JSON.stringify(i.opciones ?? []) === opcionesKey
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id &&
            i.tipo === item.tipo &&
            !i.cancelado &&
            !i.guardado &&
            (i.grupo ?? null) === (item.grupo ?? null) &&
            JSON.stringify(i.opciones ?? []) === opcionesKey
              ? { ...i, cantidad: i.cantidad + (item.cantidad ?? 1) }
              : i
          ),
        };
      }
      return { items: [...state.items, { ...item, cantidad: item.cantidad ?? 1, guardado: false }] };
    });
  },

  removeItem(id, tipo, detalleId?) {
    set((s) => {
      if (detalleId !== undefined) {
        // Eliminar por detalleId exacto (ítems guardados de rondas anteriores)
        return { items: s.items.filter((i) => i.detalleId !== detalleId) };
      }
      // Solo eliminar el PRIMER ítem no-guardado con ese id+tipo
      // Evita borrar ítems de otras rondas del mismo producto
      let removed = false;
      return {
        items: s.items.filter((i) => {
          if (!removed && i.id === id && i.tipo === tipo && !i.guardado) {
            removed = true;
            return false;
          }
          return true;
        }),
      };
    });
  },

  updateCantidad(id, tipo, cantidad, detalleId?) {
    if (cantidad <= 0) {
      get().removeItem(id, tipo, detalleId);
      return;
    }
    set((s) => ({
      items: s.items.map((i) => {
        const match = detalleId !== undefined
          ? i.detalleId === detalleId
          : i.id === id && i.tipo === tipo && !i.guardado;
        return match ? { ...i, cantidad } : i;
      }),
    }));
  },

  updateObservacion(id, tipo, obs, detalleId?) {
    set((s) => ({
      items: s.items.map((i) => {
        const match = detalleId !== undefined
          ? i.detalleId === detalleId
          : i.id === id && i.tipo === tipo && !i.guardado;
        return match ? { ...i, observacion: obs } : i;
      }),
    }));
  },

  cancelItem: (id, tipo, detalleId?) =>
    set((s) => ({
      items: s.items.map((i) => {
        const match = detalleId !== undefined
          ? i.detalleId === detalleId
          : i.id === id && i.tipo === tipo;
        return match ? { ...i, cancelado: !i.cancelado } : i;
      }),
    })),

  setMesa: (id) => set({ mesaId: id }),
  setMesaFresh: (id) => set({ items: [], mesaId: id, pedidoId: null, clienteId: null, descuento: 0, puntosCanjeados: 0, grupoNombres: {} }),
  setCliente: (id) => set({ clienteId: id }),
  setPedido: (id) => set({ pedidoId: id }),
  setDescuento: (v) => set({ descuento: v }),
  setIva: (v) => set({ ivaPorc: v }),
  setPuntosCanjeados: (v) => set({ puntosCanjeados: v }),
  clear: () => set({ items: [], mesaId: null, clienteId: null, pedidoId: null, descuento: 0, ivaPorc: 0, puntosCanjeados: 0, grupoNombres: {} }),
  setInitialState: (items, pedidoId, mesaId) => set({ items, pedidoId, mesaId: mesaId ?? null }),
  // Solo marca como guardados los ítems que aún no lo estaban (los recién enviados al KDS)
  markAsSaved: () => set((s) => ({ items: s.items.map((i) => i.guardado ? i : { ...i, guardado: true }) })),

  // Marca los ítems recién guardados como guardado:true y les asigna su detalleId del servidor.
  // detalleIds debe estar en el mismo orden que los ítems no-guardados y no-cancelados del estado actual.
  markAsSavedWithIds: (detalleIds) => set((s) => {
    let idx = 0;
    return {
      items: s.items.map((i) => {
        if (!i.guardado && !i.cancelado) {
          const detalleId = detalleIds[idx++];
          return { ...i, guardado: true, detalleId: detalleId ?? i.detalleId };
        }
        return i;
      }),
    };
  }),

  setItemGrupo: (detalleId, grupo) => {
    set((s) => ({
      items: s.items.map((i) =>
        i.detalleId === detalleId ? { ...i, grupo: grupo ?? undefined } : i
      ),
    }));
  },

  markGrupoPagado: (grupo) =>
    set((s) => ({
      items: s.items.map((i) => {
        // Marcar ítems del grupo como pagados
        if (i.grupo === grupo && !i.compartido) return { ...i, pagado: true };
        // Marcar ítems compartidos como pagados si este era el ÚNICO grupo restante no pagado
        if (i.compartido && i.participantes?.includes(grupo)) {
          const otrosActivos = (i.participantes ?? []).filter(
            (p) => p !== grupo && s.items.some((x) => x.grupo === p && !x.pagado)
          );
          // Si todos los demás grupos ya pagaron, marcar como pagado
          if (otrosActivos.length === 0) return { ...i, pagado: true };
        }
        return i;
      }),
    })),

  setItemCompartido: (detalleId, compartido, participantes) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.detalleId === detalleId ? { ...i, compartido, participantes } : i
      ),
    })),

  setGrupoNombre: (grupo, nombre) =>
    set((s) => ({
      grupoNombres: { ...s.grupoNombres, [grupo]: nombre },
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
        // Los splits son ítems activos independientes del estado del original
        pagado: false,
        cancelado: false,
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
      if (!i.cancelado && !i.pagado) {
        if (i.grupo && !i.compartido) grupos.add(i.grupo);
        // Grupos que participan en ítems compartidos también cuentan
        if (i.compartido && i.participantes) {
          i.participantes.forEach((p) => grupos.add(p));
        }
      }
    });
    return Array.from(grupos).sort();
  },

  getItemsByGrupo: (grupo) =>
    get().items.filter((i) => i.grupo === grupo && !i.compartido && !i.cancelado && !i.pagado),

  getItemsCompartidos: () =>
    get().items.filter((i) => i.compartido && !i.cancelado && !i.pagado),

  getSubtotalGrupo: (grupo) => {
    const items = get().items;
    // Ítems directos del grupo
    const directTotal = items
      .filter((i) => i.grupo === grupo && !i.compartido && !i.cancelado && !i.pagado)
      .reduce((acc, i) => acc + i.precio * i.cantidad, 0);
    // Ítems compartidos: proporción del grupo
    const sharedTotal = items
      .filter((i) => i.compartido && i.participantes?.includes(grupo) && !i.cancelado && !i.pagado)
      .reduce((acc, i) => acc + (i.precio * i.cantidad) / (i.participantes!.length), 0);
    return directTotal + sharedTotal;
  },
}));
