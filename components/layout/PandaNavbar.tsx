"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bike,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  LayoutGrid,
  Lock,
  LogOut,
  LucideIcon,
  Package,
  QrCode,
  Search,
  Settings,
  ShoppingCart,
  User,
  UserCog,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Rol } from "@/types";

type FeatureKey = "delivery" | "menuQR";
type ModuleCategory = "operacion" | "gestion" | "configuracion";

interface AppModule {
  label: string;
  href: string;
  icon: LucideIcon;
  color: string;
  roles: Rol[];
  category: ModuleCategory;
  description: string;
  featured?: boolean;
  featureKey?: FeatureKey;
}

const modules: AppModule[] = [
  { label: "Panel", href: "/panel", icon: LayoutDashboard, color: "bg-brand-500", roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER", "WAITER", "CHEF", "BAR", "DELIVERY"], category: "operacion", description: "Resumen y accesos clave.", featured: true },
  { label: "Atencion", href: "/mesas", icon: UtensilsCrossed, color: "bg-orange-500", roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER", "WAITER"], category: "operacion", description: "Mesas, sala y servicio." },
  { label: "Pedidos", href: "/pedidos", icon: ClipboardList, color: "bg-amber-500", roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER", "WAITER", "CHEF", "BAR", "DELIVERY"], category: "operacion", description: "Flujo activo de comandas.", featured: true },
  { label: "Punto de Venta", href: "/ventas/nueva", icon: ShoppingCart, color: "bg-emerald-500", roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER"], category: "operacion", description: "Cobro rapido en caja.", featured: true },
  { label: "Ventas", href: "/ventas", icon: BarChart3, color: "bg-teal-500", roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER"], category: "gestion", description: "Historial y rendimiento." },
  { label: "Productos", href: "/productos", icon: Package, color: "bg-indigo-500", roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY"], category: "gestion", description: "Carta, stock y precios." },
  { label: "Clientes", href: "/clientes", icon: Users, color: "bg-cyan-500", roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER"], category: "gestion", description: "Base de clientes." },
  { label: "Cajas", href: "/cajas", icon: Wallet, color: "bg-yellow-500", roles: ["ADMIN_GENERAL", "RESTAURANTE", "CASHIER"], category: "gestion", description: "Aperturas y arqueos." },
  { label: "Usuarios", href: "/usuarios", icon: UserCog, color: "bg-violet-500", roles: ["ADMIN_GENERAL", "RESTAURANTE"], category: "configuracion", description: "Accesos del sistema." },
  { label: "Sucursales", href: "/sucursales", icon: Building2, color: "bg-rose-500", roles: ["ADMIN_GENERAL"], category: "configuracion", description: "Sedes y orden visual." },
  { label: "Configuracion", href: "/configuracion", icon: Settings, color: "bg-gray-500", roles: ["ADMIN_GENERAL"], category: "configuracion", description: "Parametros globales." },
  { label: "Delivery", href: "/delivery", icon: Bike, color: "bg-orange-600", roles: ["ADMIN_GENERAL", "RESTAURANTE", "DELIVERY"], category: "operacion", description: "Despachos y repartos.", featureKey: "delivery" },
  { label: "Carta QR", href: "/carta-qr", icon: QrCode, color: "bg-purple-600", roles: ["ADMIN_GENERAL", "RESTAURANTE"], category: "configuracion", description: "Menu publico y QR.", featureKey: "menuQR" },
  { label: "Recursos Humanos", href: "/rrhh", icon: BriefcaseBusiness, color: "bg-slate-700", roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY"], category: "gestion", description: "Personal, asistencia y sedes.", featured: true },
];

const categoryMeta: Record<ModuleCategory, { title: string; subtitle: string }> = {
  operacion: { title: "Operacion diaria", subtitle: "Lo que se usa durante el servicio." },
  gestion: { title: "Gestion", subtitle: "Control comercial y administrativo." },
  configuracion: { title: "Configuracion", subtitle: "Estructura, permisos y extras." },
};

const roleLabels: Record<Rol, string> = {
  ADMIN_GENERAL: "Administrador",
  RESTAURANTE: "Admin Sucursal",
  SECRETARY: "Secretaria",
  CASHIER: "Cajero/a",
  WAITER: "Mesero/a",
  CHEF: "Cocinero/a",
  BAR: "Bar",
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
  const nombre = session?.user?.name ?? "Usuario";
  const isAdmin = rol === "ADMIN_GENERAL";
  const features: Record<FeatureKey, boolean> = {
    delivery: (session?.user as { delivery?: boolean })?.delivery ?? false,
    menuQR: (session?.user as { menuQR?: boolean })?.menuQR ?? false,
  };

  const visible = useMemo(() => modules.filter((mod) => !rol || mod.roles.includes(rol)), [rol]);
  const current = modules.find((mod) => pathname === mod.href || pathname.startsWith(mod.href + "/"));
  const filtered = searchApp
    ? visible.filter((mod) => mod.label.toLowerCase().includes(searchApp.toLowerCase()))
    : visible;
  const featured = !searchApp ? filtered.filter((mod) => mod.featured) : [];
  const grouped = (Object.keys(categoryMeta) as ModuleCategory[]).map((category) => ({
    category,
    meta: categoryMeta[category],
    items: (searchApp ? filtered : filtered.filter((mod) => !mod.featured)).filter((mod) => mod.category === category),
  }));

  useEffect(() => {
    function handle(event: MouseEvent) {
      if (appsRef.current && !appsRef.current.contains(event.target as Node)) setShowApps(false);
      if (userRef.current && !userRef.current.contains(event.target as Node)) setShowUser(false);
    }

    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function renderModuleCard(mod: AppModule, variant: "featured" | "compact") {
    const active = pathname === mod.href || pathname.startsWith(mod.href + "/");
    const locked = !!mod.featureKey && !features[mod.featureKey] && !isAdmin;
    const Icon = mod.icon;

    if (variant === "featured") {
      return (
        <Link
          key={mod.href}
          href={locked ? "/planes" : mod.href}
          onClick={() => setShowApps(false)}
          title={locked ? "Disponible en plan PRO" : mod.description}
          className={cn(
            "group rounded-2xl border p-4 transition-all",
            locked
              ? "border-slate-200 bg-slate-100/70 opacity-80"
              : active
                ? "border-brand-200 bg-brand-50 shadow-sm"
                : "border-surface-border bg-white hover:-translate-y-0.5 hover:border-brand-100 hover:bg-slate-50"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm", locked ? "bg-slate-400" : mod.color)}>
              <Icon size={22} />
            </div>
            {locked ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                <Lock size={10} /> Pro
              </span>
            ) : active ? (
              <span className="rounded-full bg-brand-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-700">
                Activo
              </span>
            ) : null}
          </div>
          <div className="mt-3 space-y-1">
            <p className={cn("text-sm font-semibold", locked ? "text-slate-500" : "text-surface-text")}>{mod.label}</p>
            <p className={cn("text-xs leading-5", locked ? "text-slate-400" : "text-surface-muted")}>{locked ? "Disponible al activar funciones Pro." : mod.description}</p>
          </div>
        </Link>
      );
    }

    return (
      <Link
        key={mod.href}
        href={locked ? "/planes" : mod.href}
        onClick={() => setShowApps(false)}
        title={locked ? "Disponible en plan PRO" : mod.description}
        className={cn(
          "group flex min-h-[112px] flex-col gap-2 rounded-2xl border p-3 text-left transition-all",
          locked
            ? "border-slate-200 bg-slate-100/70 opacity-75"
            : active
              ? "border-brand-200 bg-brand-50"
              : "border-surface-border bg-white hover:border-brand-100 hover:bg-slate-50"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm", locked ? "bg-slate-400" : mod.color)}>
            <Icon size={18} />
          </div>
          {locked ? <Lock size={12} className="mt-1 text-slate-400" /> : null}
        </div>
        <div className="space-y-1">
          <p className={cn("text-[12px] font-semibold leading-tight", locked ? "text-slate-500" : active ? "text-brand-700" : "text-surface-text")}>{mod.label}</p>
          <p className={cn("text-[10px] leading-4", locked ? "text-slate-400" : "text-surface-muted")}>{mod.description}</p>
        </div>
      </Link>
    );
  }

  return (
    <nav className="sticky top-0 z-50 flex h-[52px] items-center border-b border-brand-800/50 bg-brand-900/90 px-3 shadow-sm backdrop-blur-md">
      <div className="relative" ref={appsRef}>
        <button
          onClick={() => {
            setShowApps(!showApps);
            setShowUser(false);
            setSearchApp("");
          }}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
            showApps ? "scale-95 bg-white/20" : "hover:bg-white/10"
          )}
        >
          <LayoutGrid size={20} className="text-white" />
        </button>

        <AnimatePresence>
          {showApps && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute left-0 top-[48px] z-50 w-[420px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-[28px] border border-white/60 bg-white/95 shadow-elevated backdrop-blur-xl"
            >
              <div className="border-b border-surface-border bg-gradient-to-br from-white via-slate-50 to-brand-50/40 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">Apps PandaPoss</p>
                    <h2 className="mt-1 text-lg font-bold text-surface-text">Accesos por contexto</h2>
                    <p className="mt-1 text-xs text-surface-muted">Primero lo esencial, despues gestion y configuracion.</p>
                  </div>
                  {current ? (
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-surface-muted shadow-sm">
                      En {current.label}
                    </span>
                  ) : null}
                </div>
                <div className="relative mt-4">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted" />
                  <input
                    type="text"
                    placeholder="Buscar modulo..."
                    value={searchApp}
                    onChange={(event) => setSearchApp(event.target.value)}
                    className="w-full rounded-2xl border border-white/70 bg-white px-3 py-2 pl-9 text-sm shadow-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    autoFocus
                  />
                </div>
              </div>

              <div className="max-h-[68vh] space-y-5 overflow-y-auto p-4">
                {featured.length > 0 && (
                  <section>
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-surface-text">Accesos principales</h3>
                      <p className="text-xs text-surface-muted">Lo que mas se usa al abrir el sistema.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {featured.map((mod) => renderModuleCard(mod, "featured"))}
                    </div>
                  </section>
                )}

                {grouped.map(({ category, meta, items }) =>
                  items.length > 0 ? (
                    <section key={category}>
                      <div className="mb-3 flex items-end justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-semibold text-surface-text">{meta.title}</h3>
                          <p className="text-xs text-surface-muted">{meta.subtitle}</p>
                        </div>
                        <span className="text-[11px] font-medium text-surface-muted">{items.length} modulo{items.length !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2.5">
                        {items.map((mod) => renderModuleCard(mod, "compact"))}
                      </div>
                    </section>
                  ) : null
                )}

                {filtered.length === 0 && (
                  <div className="flex min-h-[180px] flex-col items-center justify-center rounded-3xl border border-dashed border-surface-border bg-slate-50 px-6 text-center">
                    <Search size={22} className="text-surface-muted" />
                    <p className="mt-3 text-sm font-semibold text-surface-text">No encontramos ese modulo</p>
                    <p className="mt-1 text-xs text-surface-muted">Prueba con otra palabra clave o revisa tus permisos actuales.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Link href="/panel" className="ml-3 mr-4 flex items-center gap-2.5">
        <img src={(session?.user as { logoUrl?: string | null })?.logoUrl || "/logo.png"} alt="PandaPoss" className="h-8 w-8 rounded-xl object-contain" />
        <span className="text-sm font-bold tracking-tight text-white">
          Panda<span className="text-brand-200">Poss</span>
        </span>
      </Link>

      {current && (
        <div className="hidden items-center md:flex">
          <span className="mr-3 text-sm text-white/30">|</span>
          <span className="text-sm font-medium text-white/90">{current.label}</span>
        </div>
      )}

      <div className="flex-1" />

      <div className="mr-3 hidden items-center md:flex">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-48 rounded-xl border border-white/20 bg-white/10 py-1.5 pl-9 pr-3 text-sm text-white placeholder:text-white/40 transition-all focus:border-white/30 focus:bg-white/20 focus:outline-none"
          />
        </div>
      </div>

      <div className="relative" ref={userRef}>
        <button
          onClick={() => {
            setShowUser(!showUser);
            setShowApps(false);
          }}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3 py-1.5 transition-all",
            showUser ? "bg-white/25" : "hover:bg-white/15"
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <span className="text-xs font-bold text-white">{nombre.charAt(0).toUpperCase()}</span>
          </div>
          <div className="hidden flex-col items-start lg:flex">
            <span className="max-w-24 truncate text-sm font-medium leading-tight text-white">{nombre}</span>
            {rol && <span className="text-[10px] leading-tight text-white/60">{roleLabels[rol]}</span>}
          </div>
          <ChevronDown size={14} className="text-white/70" />
        </button>

        <AnimatePresence>
          {showUser && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 top-[48px] z-50 w-60 overflow-hidden rounded-2xl border border-white/40 bg-white/95 shadow-elevated backdrop-blur-xl"
            >
              <div className="border-b border-surface-border bg-gradient-to-r from-brand-50 to-brand-100/50 p-4">
                <p className="text-sm font-bold text-surface-text">{nombre}</p>
                {rol && <p className="mt-0.5 text-xs text-surface-muted">{roleLabels[rol]}</p>}
              </div>
              <div className="py-1">
                <Link href="/configuracion" onClick={() => setShowUser(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-text transition-colors hover:bg-brand-50">
                  <Settings size={16} className="text-surface-muted" />
                  Configuracion
                </Link>
                <Link href="/perfil" onClick={() => setShowUser(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-text transition-colors hover:bg-brand-50">
                  <User size={16} className="text-surface-muted" />
                  Mi perfil
                </Link>
              </div>
              <div className="border-t border-surface-border py-1">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Cerrar sesion
                </button>
              </div>
              <div className="border-t border-surface-border px-4 py-2">
                <p className="text-center text-[10px] text-surface-muted">Zap Zapp Food SpA</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
