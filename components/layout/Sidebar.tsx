"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard, UtensilsCrossed, ShoppingCart, ClipboardList,
  Package, Users, BarChart3, Settings, ChefHat, Wine,
  Bike, ChevronLeft, ChevronRight, Wallet, UserCog, Music2, QrCode, Images,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Rol, SectorTipo } from "@/types";
import { getSectorConfig } from "@/core/sector/sectorConfig";
import { useState } from "react";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: Rol[];
  /** Si está definido, solo se muestra en estos sectores */
  sectors?: SectorTipo[];
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "panel",
    label: "Panel",
    href: "/panel",
    icon: <LayoutDashboard size={20} />,
    roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER", "WAITER"],
  },
  {
    id: "atencion",
    label: "Atención",           // sobreescrito dinámicamente por sector
    href: "/mesas",
    icon: <UtensilsCrossed size={20} />,
    roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER", "WAITER"],
    sectors: ["RESTAURANTE_BAR", "DISCOTECA"], // oculto en DELIVERY
  },
  {
    id: "pedidos",
    label: "Pedidos",            // sobreescrito dinámicamente por sector
    href: "/pedidos",
    icon: <ClipboardList size={20} />,
    roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER", "WAITER", "CHEF", "BAR", "DELIVERY"],
  },
  {
    id: "nueva-venta",
    label: "Nueva Venta",
    href: "/ventas/nueva",
    icon: <ShoppingCart size={20} />,
    roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER"],
  },
  {
    id: "ventas",
    label: "Ventas",
    href: "/ventas",
    icon: <BarChart3 size={20} />,
    roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER"],
  },
  {
    id: "productos",
    label: "Productos",          // sobreescrito dinámicamente por sector
    href: "/productos",
    icon: <Package size={20} />,
    roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY"],
  },
  {
    id: "fotos",
    label: "Fotos",
    href: "/fotos",
    icon: <Images size={20} />,
    roles: ["ADMIN_GENERAL", "RESTAURANTE"],
  },
  {
    id: "clientes",
    label: "Clientes",
    href: "/clientes",
    icon: <Users size={20} />,
    roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER"],
  },
  {
    id: "cajas",
    label: "Cajas",
    href: "/cajas",
    icon: <Wallet size={20} />,
    roles: ["ADMIN_GENERAL", "RESTAURANTE", "CASHIER"],
  },
  {
    id: "usuarios",
    label: "Usuarios",
    href: "/usuarios",
    icon: <UserCog size={20} />,
    roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY"],
  },
  {
    id: "configuracion",
    label: "Configuración",
    href: "/configuracion",
    icon: <Settings size={20} />,
    roles: ["ADMIN_GENERAL"],
  },
];

const roleIcons: Record<Rol, React.ReactNode> = {
  ADMIN_GENERAL: <Settings size={14} />,
  RESTAURANTE: <Settings size={14} />,
  SECRETARY: <Users size={14} />,
  CASHIER: <ShoppingCart size={14} />,
  WAITER: <UtensilsCrossed size={14} />,
  CHEF: <ChefHat size={14} />,
  BAR: <Wine size={14} />,
  DELIVERY: <Bike size={14} />,
};

const roleLabels: Record<Rol, string> = {
  ADMIN_GENERAL: "Admin General",
  RESTAURANTE: "Admin Sucursal",
  SECRETARY: "Secretaria",
  CASHIER: "Cajero/a",
  WAITER: "Mesero/a",
  CHEF: "Cocinero/a",
  BAR: "Bar",
  DELIVERY: "Repartidor/a",
};

const sectorIcons: Record<SectorTipo, React.ReactNode> = {
  DELIVERY: <Bike size={12} />,
  RESTAURANTE_BAR: <UtensilsCrossed size={12} />,
  DISCOTECA: <Music2 size={12} />,
};

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const rol = (session?.user as { rol?: Rol })?.rol;
  const nombre = session?.user?.name ?? "Usuario";
  const sector = (session?.user as { sector?: string })?.sector as SectorTipo | undefined;
  const sectorCfg = getSectorConfig(sector);

  // Filtrar por rol y sector
  const visible = NAV_ITEMS.filter((item) => {
    if (rol && !item.roles.includes(rol)) return false;
    if (item.sectors && sector && !item.sectors.includes(sector)) return false;
    return true;
  });

  // Etiquetas dinámicas por sector
  const labelOverrides: Record<string, string> = {
    atencion: sectorCfg.nav.atencion,
    pedidos: sectorCfg.nav.pedidos,
    productos: sectorCfg.nav.productos,
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col transition-all duration-300 z-30",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-zinc-800 min-h-[64px]">
        <img src={(session?.user as { logoUrl?: string | null })?.logoUrl || "/logo.png"} alt="PandaPoss" className="w-8 h-8 rounded-lg flex-shrink-0 object-contain" />
        {!collapsed && (
          <span className="text-white font-bold text-lg tracking-tight">
            Panda<span className="text-brand-400">Poss</span>
          </span>
        )}
      </div>

      {/* Badge de sector */}
      {!collapsed && sector && (
        <div className="px-4 pt-2 pb-1">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
            {sectorIcons[sector]}
            {sectorCfg.label}
          </span>
        </div>
      )}

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visible.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const label = labelOverrides[item.id] ?? item.label;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                active
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/10"
              )}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Usuario */}
      {!collapsed && (
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-700 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {nombre.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{nombre}</p>
              {rol && (
                <p className="text-zinc-400 text-xs flex items-center gap-1">
                  {roleIcons[rol]}
                  {roleLabels[rol]}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Colapsar */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 bg-zinc-900 border border-zinc-700 rounded-full p-1 text-zinc-400 hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
