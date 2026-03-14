import { create } from "zustand";

export type KdsFilter = "PENDIENTE" | "EN_PROCESO" | "LISTO";

interface KdsUIState {
  filter: KdsFilter;
  setFilter: (f: KdsFilter) => void;
}

export const useKdsUI = create<KdsUIState>((set) => ({
  filter: "PENDIENTE",
  setFilter: (f) => set({ filter: f }),
}));
