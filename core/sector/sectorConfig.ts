import type { SectorTipo, Rol } from "@/types";

export interface SectorConfig {
  label: string;
  descripcion: string;
  emoji: string;
  /** Etiquetas específicas del sector para el sidebar */
  nav: {
    atencion: string;       // "Atención" / "Pedidos" / "Mesas/VIP"
    pedidos: string;        // "Pedidos" / "Órdenes" / "Comandas"
    productos: string;      // "Productos" / "Menú" / "Carta/Bebidas"
    mostrarAtencion: boolean;  // false en DELIVERY
  };
  /** Roles disponibles para creación de usuarios en este sector */
  rolesDisponibles: Rol[];
  /** Color de acento para el UI */
  color: string;
}

export const SECTOR_CONFIG: Record<SectorTipo, SectorConfig> = {
  DELIVERY: {
    label: "Delivery",
    descripcion: "Dark kitchen, locales al paso, pedidos online",
    emoji: "🛵",
    nav: {
      atencion: "Órdenes",
      pedidos: "Órdenes",
      productos: "Menú",
      mostrarAtencion: false,
    },
    rolesDisponibles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER", "CHEF", "DELIVERY"],
    color: "#f97316", // orange
  },
  RESTAURANTE_BAR: {
    label: "Restaurante & Bar",
    descripcion: "Restaurantes, bares, cafeterías, pubs",
    emoji: "🍽️",
    nav: {
      atencion: "Atención",
      pedidos: "Pedidos",
      productos: "Productos",
      mostrarAtencion: true,
    },
    rolesDisponibles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER", "WAITER", "CHEF", "BAR", "DELIVERY"],
    color: "#6366f1", // indigo (brand)
  },
  DISCOTECA: {
    label: "Discoteca",
    descripcion: "Discotecas, boliches, clubs nocturnos",
    emoji: "🎧",
    nav: {
      atencion: "Mesas/VIP",
      pedidos: "Comandas",
      productos: "Carta/Bebidas",
      mostrarAtencion: true,
    },
    rolesDisponibles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER", "BAR", "DELIVERY"],
    color: "#a855f7", // purple
  },
};

export function getSectorConfig(sector: SectorTipo | string | null | undefined): SectorConfig {
  return SECTOR_CONFIG[(sector as SectorTipo) ?? "RESTAURANTE_BAR"] ?? SECTOR_CONFIG.RESTAURANTE_BAR;
}
