"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import {
  LayoutGrid, Search, Bell, ChevronDown, LogOut, User,
  LayoutDashboard, UtensilsCrossed, ShoppingCart, ClipboardList,
  Package, Users, BarChart3, Settings, Wallet, UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Rol } from "@/types";

interface AppModule {
  label: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  roles: Rol[];
}

const modules: AppModule[] = [
  { label: "Panel", href: "/panel", icon: <LayoutDashboard size={24} />, color: "bg-blue-500", roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL", "SECRETARY", "CASHIER", "WAITER", "CHEF", "BAR", "PASTRY", "DELIVERY"] },
  { label: "Mesas", href: "/mesas", icon: <UtensilsCrossed size={24} />, color: "bg-orange-500", roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL", "SECRETARY", "CASHIER", "WAITER"] },
  { label: "Pedidos", href: "/pedidos", icon: <ClipboardList size={24} />, color: "bg-amber-500", roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL", "SECRETARY", "CASHIER", "WAITER", "CHEF", "BAR", "PASTRY", "DELIVERY"] },
  { label: "Punto de Venta", href: "/ventas/nueva", icon: <ShoppingCart size={24} />, color: "bg-emerald-500", roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL", "SECRETARY", "CASHIER"] },
  { label: "Ventas", href: "/ventas", icon: <BarChart3 size={24} />, color: "bg-teal-500", roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL", "SECRETARY", "CASHIER"] },
  { label: "Productos", href: "/productos", icon: <Package size={24} />, color: "bg-indigo-500", roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL", "SECRETARY"] },
  { label: "Clientes", href: "/clientes", icon: <Users size={24} />, color: "bg-cyan-500", roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL", "SECRETARY", "CASHIER"] },
{ label: "Cajas", href: "/cajas", icon: <Wallet size={24} />, color: "bg-yellow-500", roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL", "CASHIER"] },
  { label: "Usuarios", href: "/usuarios", icon: <UserCog size={24} />, color: "bg-violet-500", roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL"] },
  { label: "Configuración", href: "/configuracion", icon: <Settings size={24} />, color: "bg-gray-500", roles: ["ADMIN_GENERAL"] },
];

const roleLabels: Record<Rol, string> = {
  ADMIN_GENERAL: "Administrador",
  ADMIN_SUCURSAL: "Admin Sucursal",
  SECRETARY: "Secretaria",
  CASHIER: "Cajero/a",
  WAITER: "Mesero/a",
  CHEF: "Cocinero/a",
  BAR: "Bar",
  PASTRY: "Repostería",
  DELIVERY: "Repartidor/a",
};

export function OdooNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showApps, setShowApps] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [searchApp, setSearchApp] = useState("");
  const appsRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const rol = (session?.user as { rol?: Rol })?.rol;
  const nombre = session?.user?.name ?? "Usuario";

  const visible = modules.filter((m) => !rol || m.roles.includes(rol));

  // Current module
  const current = modules.find((m) => pathname === m.href || pathname.startsWith(m.href + "/"));

  // Filtered apps
  const filtered = searchApp
    ? visible.filter((m) => m.label.toLowerCase().includes(searchApp.toLowerCase()))
    : visible;

  // Close dropdowns on click outside
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (appsRef.current && !appsRef.current.contains(e.target as Node)) setShowApps(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUser(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <nav className="h-[46px] bg-odoo-purple flex items-center px-2 sticky top-0 z-50 shadow-md">
      {/* App Grid Button */}
      <div className="relative" ref={appsRef}>
        <button
          onClick={() => { setShowApps(!showApps); setShowUser(false); setSearchApp(""); }}
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded transition-colors",
            showApps ? "bg-white/20" : "hover:bg-white/10"
          )}
        >
          <LayoutGrid size={20} className="text-white" />
        </button>

        {/* App Switcher Dropdown */}
        {showApps && (
          <div className="absolute left-0 top-[42px] w-[320px] bg-white rounded-lg shadow-xl border border-odoo-border animate-drop-in z-50">
            {/* Search */}
            <div className="p-2 border-b border-odoo-border">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-odoo-text-muted" />
                <input
                  type="text"
                  placeholder="Buscar módulo..."
                  value={searchApp}
                  onChange={(e) => setSearchApp(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-odoo-border rounded focus:outline-none focus:border-odoo-purple"
                  autoFocus
                />
              </div>
            </div>

            {/* App Grid */}
            <div className="p-3 grid grid-cols-4 gap-1 max-h-[320px] overflow-y-auto">
              {filtered.map((mod) => {
                const active = pathname === mod.href || pathname.startsWith(mod.href + "/");
                return (
                  <Link
                    key={mod.href}
                    href={mod.href}
                    onClick={() => setShowApps(false)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-2.5 rounded-lg text-center transition-all hover:bg-gray-50",
                      active && "bg-purple-50"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm", mod.color)}>
                      {mod.icon}
                    </div>
                    <span className={cn("text-[11px] font-medium leading-tight", active ? "text-odoo-purple" : "text-odoo-text")}>
                      {mod.label}
                    </span>
                  </Link>
                );
              })}
              {filtered.length === 0 && (
                <p className="col-span-4 text-center text-odoo-text-muted text-sm py-6">Sin resultados</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Logo + Current Module */}
      <Link href="/panel" className="flex items-center gap-2 ml-2 mr-4">
        <img src="/logo.png" alt="PandaPoss" className="h-7 rounded" />
        <span className="text-white font-bold text-sm tracking-tight">
          Panda<span className="text-purple-200">Poss</span>
        </span>
      </Link>

      {/* Module nav links - quick access to current section */}
      {current && (
        <div className="hidden md:flex items-center">
          <span className="text-white/40 text-sm mr-2">|</span>
          <span className="text-white/90 text-sm font-medium">{current.label}</span>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Global Search */}
      <div className="hidden md:flex items-center mr-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/50" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-48 pl-8 pr-3 py-1 text-sm bg-white/10 border border-white/20 rounded text-white placeholder:text-white/40 focus:outline-none focus:bg-white/20 focus:border-white/30 transition"
          />
        </div>
      </div>

      {/* Notifications */}
      <button className="relative flex items-center justify-center w-9 h-9 rounded hover:bg-white/10 transition-colors mr-1">
        <Bell size={18} className="text-white" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full border border-odoo-purple" />
      </button>

      {/* User Menu */}
      <div className="relative" ref={userRef}>
        <button
          onClick={() => { setShowUser(!showUser); setShowApps(false); }}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded transition-colors",
            showUser ? "bg-white/20" : "hover:bg-white/10"
          )}
        >
          <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">{nombre.charAt(0).toUpperCase()}</span>
          </div>
          <span className="text-white text-sm font-medium hidden lg:block max-w-24 truncate">{nombre}</span>
          <ChevronDown size={14} className="text-white/70" />
        </button>

        {showUser && (
          <div className="absolute right-0 top-[42px] w-56 bg-white rounded-lg shadow-xl border border-odoo-border animate-drop-in z-50">
            <div className="p-3 border-b border-odoo-border">
              <p className="font-semibold text-odoo-text text-sm">{nombre}</p>
              {rol && <p className="text-xs text-odoo-text-muted">{roleLabels[rol]}</p>}
            </div>
            <div className="py-1">
              <Link
                href="/configuracion"
                onClick={() => setShowUser(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-odoo-text hover:bg-odoo-hover transition-colors"
              >
                <Settings size={15} className="text-odoo-text-muted" />
                Configuración
              </Link>
              <Link
                href="/usuarios"
                onClick={() => setShowUser(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-odoo-text hover:bg-odoo-hover transition-colors"
              >
                <User size={15} className="text-odoo-text-muted" />
                Mi perfil
              </Link>
            </div>
            <div className="border-t border-odoo-border py-1">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
              >
                <LogOut size={15} />
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
