"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import {
  LayoutGrid, Search, ChevronDown, LogOut, User,
  LayoutDashboard, UtensilsCrossed, ShoppingCart, ClipboardList,
  Package, Users, BarChart3, Settings, Wallet, UserCog, Building2, Truck, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Plan, Rol } from "@/types";

interface AppModule {
  label: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  roles: Rol[];
  plan?: Plan; // si se indica, solo visible cuando plan coincide (o ADMIN_GENERAL)
}

const modules: AppModule[] = [
  { label: "Panel", href: "/panel", icon: <LayoutDashboard size={22} />, color: "bg-brand-500", roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL", "SECRETARY", "CASHIER", "WAITER", "CHEF", "BAR", "PASTRY", "DELIVERY"] },
  { label: "Mesas", href: "/mesas", icon: <UtensilsCrossed size={22} />, color: "bg-orange-500", roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL", "SECRETARY", "CASHIER", "WAITER"] },
  { label: "Pedidos", href: "/pedidos", icon: <ClipboardList size={22} />, color: "bg-amber-500", roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL", "SECRETARY", "CASHIER", "WAITER", "CHEF", "BAR", "PASTRY", "DELIVERY"] },
  { label: "Punto de Venta", href: "/ventas/nueva", icon: <ShoppingCart size={22} />, color: "bg-emerald-500", roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL", "SECRETARY", "CASHIER"] },
  { label: "Ventas", href: "/ventas", icon: <BarChart3 size={22} />, color: "bg-teal-500", roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL", "SECRETARY", "CASHIER"] },
  { label: "Productos", href: "/productos", icon: <Package size={22} />, color: "bg-indigo-500", roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL", "SECRETARY", "CASHIER"] },
  { label: "Clientes", href: "/clientes", icon: <Users size={22} />, color: "bg-cyan-500", roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL", "SECRETARY", "CASHIER"] },
  { label: "Delivery", href: "/delivery", icon: <Truck size={22} />, color: "bg-violet-500", roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL", "SECRETARY", "CASHIER", "DELIVERY"], plan: "PRO" },
  { label: "Cajas", href: "/cajas", icon: <Wallet size={22} />, color: "bg-yellow-500", roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL", "CASHIER"] },
  { label: "Usuarios", href: "/usuarios", icon: <UserCog size={22} />, color: "bg-violet-500", roles: ["ADMIN_GENERAL", "ADMIN_SUCURSAL"] },
  { label: "Sucursales", href: "/sucursales", icon: <Building2 size={22} />, color: "bg-rose-500", roles: ["ADMIN_GENERAL"] },
  { label: "Configuracion", href: "/configuracion", icon: <Settings size={22} />, color: "bg-gray-500", roles: ["ADMIN_GENERAL"] },
];

const roleLabels: Record<Rol, string> = {
  ADMIN_GENERAL: "Administrador",
  ADMIN_SUCURSAL: "Admin Sucursal",
  SECRETARY: "Secretaria",
  CASHIER: "Cajero/a",
  WAITER: "Mesero/a",
  CHEF: "Cocinero/a",
  BAR: "Bar",
  PASTRY: "Reposteria",
  DELIVERY: "Repartidor/a",
};

export function PandaNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showApps, setShowApps] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [searchApp, setSearchApp] = useState("");
  const appsRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const rol = (session?.user as { rol?: Rol })?.rol;
  const plan = (session?.user as { plan?: Plan })?.plan ?? "BASIC";
  const nombre = session?.user?.name ?? "Usuario";

  // Módulos visibles por rol; los que tienen `plan: "PRO"` se muestran siempre
  // (bloqueados si no es PRO) para que el usuario sepa que existen
  const visible = modules.filter((m) => !rol || m.roles.includes(rol));
  const current = modules.find((m) => pathname === m.href || pathname.startsWith(m.href + "/"));

  const filtered = searchApp
    ? visible.filter((m) => m.label.toLowerCase().includes(searchApp.toLowerCase()))
    : visible;

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (appsRef.current && !appsRef.current.contains(e.target as Node)) setShowApps(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUser(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <nav className="h-[52px] bg-gradient-to-r from-brand-700 to-brand-600 flex items-center px-3 sticky top-0 z-50 shadow-lg">
      {/* App Grid Button */}
      <div className="relative" ref={appsRef}>
        <button
          onClick={() => { setShowApps(!showApps); setShowUser(false); setSearchApp(""); }}
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded-xl transition-all",
            showApps ? "bg-white/25 scale-95" : "hover:bg-white/15"
          )}
        >
          <LayoutGrid size={20} className="text-white" />
        </button>

        {showApps && (
          <div className="absolute left-0 top-[48px] w-[340px] bg-white rounded-2xl shadow-elevated border border-surface-border animate-drop-in z-50 overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-surface-border bg-surface-bg">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted" />
                <input
                  type="text"
                  placeholder="Buscar modulo..."
                  value={searchApp}
                  onChange={(e) => setSearchApp(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-surface-border rounded-xl focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white"
                  autoFocus
                />
              </div>
            </div>

            {/* App Grid */}
            <div className="p-3 grid grid-cols-4 gap-1 max-h-[340px] overflow-y-auto">
              {filtered.map((mod) => {
                const active = pathname === mod.href || pathname.startsWith(mod.href + "/");
                const locked = !!mod.plan && mod.plan !== plan && rol !== "ADMIN_GENERAL";
                if (locked) {
                  return (
                    <div
                      key={mod.href}
                      title="Disponible en plan PRO"
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-center opacity-60 cursor-not-allowed relative"
                    >
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm grayscale", mod.color)}>
                        {mod.icon}
                      </div>
                      <span className="text-[11px] font-semibold leading-tight text-surface-muted">{mod.label}</span>
                      <span className="absolute top-1 right-1 bg-amber-400 text-white rounded-full p-0.5">
                        <Lock size={8} />
                      </span>
                    </div>
                  );
                }
                return (
                  <Link
                    key={mod.href}
                    href={mod.href}
                    onClick={() => setShowApps(false)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl text-center transition-all",
                      active ? "bg-brand-50 ring-1 ring-brand-200" : "hover:bg-gray-50"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm", mod.color)}>
                      {mod.icon}
                    </div>
                    <span className={cn("text-[11px] font-semibold leading-tight", active ? "text-brand-600" : "text-surface-text")}>
                      {mod.label}
                    </span>
                  </Link>
                );
              })}
              {filtered.length === 0 && (
                <p className="col-span-4 text-center text-surface-muted text-sm py-8">Sin resultados</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Logo + Current Module */}
      <Link href="/panel" className="flex items-center gap-2.5 ml-3 mr-4">
        <img src="/logo.png" alt="PandaPoss" className="w-8 h-8 rounded-xl" />
        <span className="text-white font-bold text-sm tracking-tight">
          Panda<span className="text-brand-200">Poss</span>
        </span>
      </Link>

      {current && (
        <div className="hidden md:flex items-center">
          <span className="text-white/30 text-sm mr-3">|</span>
          <span className="text-white/90 text-sm font-medium">{current.label}</span>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Global Search */}
      <div className="hidden md:flex items-center mr-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-48 pl-9 pr-3 py-1.5 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:bg-white/20 focus:border-white/30 transition-all"
          />
        </div>
      </div>

      {/* User Menu */}
      <div className="relative" ref={userRef}>
        <button
          onClick={() => { setShowUser(!showUser); setShowApps(false); }}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all",
            showUser ? "bg-white/25" : "hover:bg-white/15"
          )}
        >
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">{nombre.charAt(0).toUpperCase()}</span>
          </div>
          <div className="hidden lg:flex flex-col items-start">
            <span className="text-white text-sm font-medium max-w-24 truncate leading-tight">{nombre}</span>
            {rol && <span className="text-white/60 text-[10px] leading-tight">{roleLabels[rol]}</span>}
          </div>
          <ChevronDown size={14} className="text-white/70" />
        </button>

        {showUser && (
          <div className="absolute right-0 top-[48px] w-60 bg-white rounded-2xl shadow-elevated border border-surface-border animate-drop-in z-50 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-brand-50 to-brand-100/50 border-b border-surface-border">
              <p className="font-bold text-surface-text text-sm">{nombre}</p>
              {rol && <p className="text-xs text-surface-muted mt-0.5">{roleLabels[rol]}</p>}
            </div>
            <div className="py-1">
              <Link
                href="/configuracion"
                onClick={() => setShowUser(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-text hover:bg-brand-50 transition-colors"
              >
                <Settings size={16} className="text-surface-muted" />
                Configuracion
              </Link>
              <Link
                href="/usuarios"
                onClick={() => setShowUser(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-text hover:bg-brand-50 transition-colors"
              >
                <User size={16} className="text-surface-muted" />
                Mi perfil
              </Link>
            </div>
            <div className="border-t border-surface-border py-1">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
              >
                <LogOut size={16} />
                Cerrar sesion
              </button>
            </div>
            {/* Zap Zapp Food SpA subtle branding */}
            <div className="px-4 py-2 border-t border-surface-border">
              <p className="text-[10px] text-surface-muted text-center">Zap Zapp Food SpA</p>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
