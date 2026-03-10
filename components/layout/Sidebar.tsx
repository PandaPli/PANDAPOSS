"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard, UtensilsCrossed, ShoppingCart, ClipboardList,
  Package, Users, BarChart3, Settings, ChefHat, Wine,
  CakeSlice, Bike, ChevronLeft, ChevronRight, Wallet, UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Rol } from "@/types";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: Rol[];
  badge?: number;
}

const navItems: NavItem[] = [
  {
    label: "Panel",
    href: "/panel",
    icon: <LayoutDashboard size={20} />,
    roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL", "SECRETARY", "CASHIER", "WAITER", "CHEF", "BAR", "PASTRY", "DELIVERY"],
  },
  {
    label: "Mesas",
    href: "/mesas",
    icon: <UtensilsCrossed size={20} />,
    roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL", "SECRETARY", "CASHIER", "WAITER"],
  },
  {
    label: "Pedidos",
    href: "/pedidos",
    icon: <ClipboardList size={20} />,
    roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL", "SECRETARY", "CASHIER", "WAITER", "CHEF", "BAR", "PASTRY", "DELIVERY"],
  },
  {
    label: "Nueva Venta",
    href: "/ventas/nueva",
    icon: <ShoppingCart size={20} />,
    roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL", "SECRETARY", "CASHIER"],
  },
  {
    label: "Ventas",
    href: "/ventas",
    icon: <BarChart3 size={20} />,
    roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL", "SECRETARY", "CASHIER"],
  },
  {
    label: "Productos",
    href: "/productos",
    icon: <Package size={20} />,
    roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL", "SECRETARY"],
  },
  {
    label: "Clientes",
    href: "/clientes",
    icon: <Users size={20} />,
    roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL", "SECRETARY", "CASHIER"],
  },
  {
    label: "Cajas",
    href: "/cajas",
    icon: <Wallet size={20} />,
    roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL", "CASHIER"],
  },
  {
    label: "Usuarios",
    href: "/usuarios",
    icon: <UserCog size={20} />,
    roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL"],
  },
  {
    label: "Configuración",
    href: "/configuracion",
    icon: <Settings size={20} />,
    roles: ["ADMIN_GENERAL"],
  },
];

const roleIcons: Record<Rol, React.ReactNode> = {
  ADMIN_GENERAL: <Settings size={14} />,
  ADMIN_SUCURSAL: <Settings size={14} />,
  SECRETARY: <Users size={14} />,
  CASHIER: <ShoppingCart size={14} />,
  WAITER: <UtensilsCrossed size={14} />,
  CHEF: <ChefHat size={14} />,
  BAR: <Wine size={14} />,
  PASTRY: <CakeSlice size={14} />,
  DELIVERY: <Bike size={14} />,
};

const roleLabels: Record<Rol, string> = {
  ADMIN_GENERAL: "Admin General",
  ADMIN_SUCURSAL: "Admin Sucursal",
  SECRETARY: "Secretaria",
  CASHIER: "Cajero/a",
  WAITER: "Mesero/a",
  CHEF: "Cocinero/a",
  BAR: "Bar",
  PASTRY: "Repostería",
  DELIVERY: "Repartidor/a",
};

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const rol = (session?.user as { rol?: Rol })?.rol;
  const nombre = session?.user?.name ?? "Usuario";

  const visible = navItems.filter((item) => !rol || item.roles.includes(rol));

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

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {visible.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                active
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/10"
              )}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
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
