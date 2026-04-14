import { create } from "zustand";
import { persist } from "zustand/middleware";

export type KdsFilter = "EN_CURSO" | "LISTOS";

interface KdsUIState {
  filter: KdsFilter;
  nightMode: boolean;
  setFilter: (f: KdsFilter) => void;
  toggleNightMode: () => void;
}

export const useKdsUI = create<KdsUIState>()(
  persist(
    (set) => ({
      filter: "EN_CURSO",
      nightMode: false,
      setFilter: (f) => set({ filter: f }),
      toggleNightMode: () => set((s) => ({ nightMode: !s.nightMode })),
    }),
    { name: "kds-ui" }
  )
);
