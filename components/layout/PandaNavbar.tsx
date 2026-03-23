"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bike,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  ClipboardList,
  GripVertical,
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
  Monitor,
  Tag,
  User,
  UserCog,
  Users,
  UtensilsCrossed,
  Wallet,
  X,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn, normalize } from "@/lib/utils";
import type { Rol } from "@/types";
import { StockAlertaBanner } from "@/components/layout/StockAlertaBanner";

type FeatureKey = "delivery" | "menuQR" | "kiosko" | "cupones";
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
  { label: "Panel", href: "/panel", icon: LayoutDashboard, color: "bg-gradient-to-br from-violet-500 to-indigo-600", roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER", "WAITER", "CHEF", "BAR", "DELIVERY"], category: "operacion", description: "Resumen y accesos clave." },
  { label: "Punto de Venta", href: "/ventas/nueva", icon: ShoppingCart, color: "bg-gradient-to-br from-emerald-400 to-teal-600", roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER"], category: "operacion", description: "Cobro rapido en caja.", featured: true },
  { label: "Atencion", href: "/mesas", icon: UtensilsCrossed, color: "bg-gradient-to-br from-orange-400 to-rose-500", roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER", "WAITER"], category: "operacion", description: "Mesas, sala y servicio.", featured: true },
  { label: "Delivery", href: "/delivery", icon: Bike, color: "bg-gradient-to-br from-amber-400 to-orange-500", roles: ["ADMIN_GENERAL", "RESTAURANTE", "DELIVERY"], category: "operacion", description: "Despachos y repartos.", featureKey: "delivery", featured: true },
  { label: "Pedidos", href: "/pedidos", icon: ClipboardList, color: "bg-gradient-to-br from-yellow-400 to-amber-500", roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER", "WAITER", "CHEF", "BAR", "DELIVERY"], category: "operacion", description: "Flujo activo de comandas.", featured: true },
  { label: "Ventas", href: "/ventas", icon: BarChart3, color: "bg-gradient-to-br from-cyan-400 to-blue-500", roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER"], category: "gestion", description: "Historial y rendimiento." },
  { label: "Productos", href: "/productos", icon: Package, color: "bg-gradient-to-br from-indigo-500 to-purple-600", roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY"], category: "gestion", description: "Carta, stock y precios." },
  { label: "Clientes", href: "/clientes", icon: Users, color: "bg-gradient-to-br from-sky-400 to-cyan-500", roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER"], category: "gestion", description: "Base de clientes." },
  { label: "Cajas", href: "/cajas", icon: Wallet, color: "bg-gradient-to-br from-yellow-400 to-yellow-500", roles: ["ADMIN_GENERAL", "RESTAURANTE", "CASHIER"], category: "gestion", description: "Aperturas y arqueos." },
  { label: "Cupones", href: "/cupones", icon: Tag, color: "bg-gradient-to-br from-pink-400 to-rose-500", roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY"], category: "gestion", description: "Descuentos y promociones.", featureKey: "cupones" },
  { label: "Recursos Humanos", href: "/rrhh", icon: BriefcaseBusiness, color: "bg-gradient-to-br from-blue-500 to-indigo-700", roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY"], category: "gestion", description: "Personal, asistencia y sedes." },
  { label: "Usuarios", href: "/usuarios", icon: UserCog, color: "bg-gradient-to-br from-violet-500 to-purple-700", roles: ["ADMIN_GENERAL", "RESTAURANTE"], category: "configuracion", description: "Accesos del sistema." },
  { label: "Sucursales", href: "/sucursales", icon: Building2, color: "bg-gradient-to-br from-rose-400 to-pink-600", roles: ["ADMIN_GENERAL"], category: "configuracion", description: "Sedes y orden visual." },
  { label: "Configuracion", href: "/configuracion", icon: Settings, color: "bg-gradient-to-br from-slate-500 to-gray-700", roles: ["ADMIN_GENERAL"], category: "configuracion", description: "Parametros globales." },
  { label: "Kiosko", href: "/kiosko-admin", icon: Monitor, color: "bg-gradient-to-br from-teal-500 to-emerald-700", roles: ["ADMIN_GENERAL", "RESTAURANTE"], category: "configuracion", description: "Terminal de autoservicio táctil.", featureKey: "kiosko" },
  { label: "Carta QR", href: "/carta-qr", icon: QrCode, color: "bg-gradient-to-br from-purple-500 to-violet-700", roles: ["ADMIN_GENERAL", "RESTAURANTE"], category: "configuracion", description: "Menu publico y QR.", featureKey: "menuQR" },
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

// ── Tarjeta sortable para modo reordenamiento ──────────────────────────────
function SortableAppCard({ mod }: { mod: AppModule }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: mod.href });
  const Icon = mod.icon;
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex flex-col items-center gap-2.5 rounded-2xl p-3 text-center select-none cursor-grab active:cursor-grabbing transition-all",
        isDragging
          ? "bg-white shadow-2xl z-50 opacity-90 scale-110 ring-2 ring-brand-300"
          : "bg-white/60 hover:bg-white hover:shadow-md"
      )}
      {...attributes}
      {...listeners}
    >
      <div className={cn("flex h-14 w-14 items-center justify-center rounded-[18px] text-white shadow-lg", mod.color)}>
        <Icon size={24} />
      </div>
      <p className="text-[11px] font-bold leading-tight text-surface-text">{mod.label}</p>
      <GripVertical size={12} className="text-surface-muted/50" />
    </div>
  );
}

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
  const canReorder = rol === "ADMIN_GENERAL" || rol === "RESTAURANTE";
  const [reordering, setReordering] = useState(false);
  const ORDER_KEY = "pp_apps_order";
  const features: Record<FeatureKey, boolean> = {
    delivery: (session?.user as { delivery?: boolean })?.delivery ?? false,
    menuQR:   (session?.user as { menuQR?: boolean })?.menuQR ?? false,
    kiosko:   (session?.user as { kioskActivo?: boolean })?.kioskActivo ?? false,
    cupones:  (session?.user as { cupones?: boolean })?.cupones ?? false,
  };

  const visibleBase = useMemo(() => modules.filter((mod) => !rol || mod.roles.includes(rol)), [rol]);

  // Orden persistido en localStorage
  const [orderedHrefs, setOrderedHrefs] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(ORDER_KEY) ?? "[]") as string[];
      return saved.length > 0 ? saved : [];
    } catch { return []; }
  });

  const visible = useMemo(() => {
    if (orderedHrefs.length === 0) return visibleBase;
    const ordered = orderedHrefs
      .map((href) => visibleBase.find((m) => m.href === href))
      .filter(Boolean) as AppModule[];
    const rest = visibleBase.filter((m) => !orderedHrefs.includes(m.href));
    return [...ordered, ...rest];
  }, [visibleBase, orderedHrefs]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrderedHrefs((prev) => {
      const hrefs = prev.length > 0 ? prev : visible.map((m) => m.href);
      const oldIdx = hrefs.indexOf(active.id as string);
      const newIdx = hrefs.indexOf(over.id as string);
      if (oldIdx === -1 || newIdx === -1) return prev;
      const next = arrayMove(hrefs, oldIdx, newIdx);
      localStorage.setItem(ORDER_KEY, JSON.stringify(next));
      return next;
    });
  }, [visible]);

  const current = modules.find((mod) => pathname === mod.href || pathname.startsWith(mod.href + "/"));
  const filtered = searchApp
    ? visible.filter((mod) => normalize(mod.label).includes(normalize(searchApp)))
    : visible;
  const featured = !searchApp && !reordering ? filtered.filter((mod) => mod.featured) : [];
  const grouped = !reordering
    ? (Object.keys(categoryMeta) as ModuleCategory[]).map((category) => ({
        category,
        meta: categoryMeta[category],
        items: (searchApp ? filtered : filtered.filter((mod) => !mod.featured)).filter((mod) => mod.category === category),
      }))
    : [];

  useEffect(() => {
    function handle(event: MouseEvent) {
      // El overlay de apps es pantalla completa; se cierra con el botón X.
      // Solo cerramos si se hace click fuera del botón toggle y no hay overlay abierto.
      if (!showApps && appsRef.current && !appsRef.current.contains(event.target as Node)) setShowApps(false);
      if (userRef.current && !userRef.current.contains(event.target as Node)) setShowUser(false);
    }

    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showApps]);

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
            "group relative overflow-hidden rounded-2xl p-4 transition-all",
            locked
              ? "bg-slate-100/80 opacity-70"
              : active
                ? "bg-white shadow-lg ring-2 ring-brand-300"
                : "bg-white shadow-sm hover:-translate-y-1 hover:shadow-lg"
          )}
        >
          {/* Glow de fondo sutil */}
          {!locked && (
            <div className={cn("absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-10 blur-2xl", mod.color)} />
          )}
          <div className="flex items-start justify-between gap-3">
            <div className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] text-white shadow-md",
              locked ? "bg-slate-400" : mod.color
            )}>
              <Icon size={26} />
            </div>
            {locked ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                <Lock size={9} /> Pro
              </span>
            ) : active ? (
              <span className="rounded-full bg-brand-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-700">
                Activo
              </span>
            ) : null}
          </div>
          <div className="relative mt-3 space-y-0.5">
            <p className={cn("text-sm font-bold", locked ? "text-slate-500" : "text-surface-text")}>{mod.label}</p>
            <p className={cn("text-[11px] leading-5", locked ? "text-slate-400" : "text-surface-muted")}>{locked ? "Disponible en plan Pro." : mod.description}</p>
          </div>
        </Link>
      );
    }

    // Compact — estilo iOS: icono grande centrado + etiqueta abajo
    return (
      <Link
        key={mod.href}
        href={locked ? "/planes" : mod.href}
        onClick={() => setShowApps(false)}
        title={locked ? "Disponible en plan PRO" : mod.description}
        className={cn(
          "group flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition-all",
          locked
            ? "bg-slate-100/80 opacity-70"
            : active
              ? "bg-white shadow-md ring-2 ring-brand-300"
              : "bg-white/60 hover:bg-white hover:shadow-md"
        )}
      >
        <div className={cn(
          "relative flex h-14 w-14 items-center justify-center rounded-[18px] text-white shadow-md",
          locked ? "bg-slate-400" : mod.color
        )}>
          <Icon size={24} />
          {locked && (
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm">
              <Lock size={9} className="text-slate-500" />
            </div>
          )}
        </div>
        <p className={cn(
          "text-[11px] font-bold leading-tight",
          locked ? "text-slate-400" : active ? "text-brand-700" : "text-surface-text"
        )}>{mod.label}</p>
      </Link>
    );
  }

  return (
    <>
    <nav className="sticky top-0 z-50 flex h-[52px] items-center border-b border-brand-800/50 bg-brand-900/90 px-3 shadow-sm backdrop-blur-md">
      {/* Botón del cajón — sin el overlay adentro para evitar que backdrop-blur-md lo contenga */}
      <div ref={appsRef}>
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

    {/* ── Overlay fullscreen del cajón de apps ─────────────────────────────────
        Renderizado FUERA del <nav> para que backdrop-blur-md no contenga los
        elementos con position:fixed (comportamiento conocido de Chrome/WebKit).  */}
    <AnimatePresence>
      {showApps && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="fixed inset-0 top-[52px] z-50 flex flex-col bg-gradient-to-br from-slate-50 via-white to-violet-50/40 backdrop-blur-xl"
        >
          {/* Header */}
          <div className="border-b border-surface-border bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 px-6 py-4">
            <div className="mx-auto flex max-w-6xl items-center gap-4">
              <div className="flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-200">Apps PandaPoss</p>
                <h2 className="mt-0.5 text-xl font-bold text-white">
                  {reordering ? "Arrastra para reordenar" : "¿A dónde vas?"}
                </h2>
              </div>
              {!reordering && (
                <div className="relative w-56">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                  <input
                    type="text"
                    placeholder="Buscar módulo..."
                    value={searchApp}
                    onChange={(e) => setSearchApp(e.target.value)}
                    className="w-full rounded-2xl border border-white/20 bg-white/10 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/40 focus:bg-white/15"
                    autoFocus
                  />
                </div>
              )}
              {canReorder && (
                <button
                  onClick={() => { setReordering(v => !v); setSearchApp(""); }}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition",
                    reordering
                      ? "bg-amber-400 text-stone-900 hover:bg-amber-300"
                      : "border border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <GripVertical size={14} />
                  {reordering ? "Listo" : "Reordenar"}
                </button>
              )}
              {canReorder && reordering && (
                <button
                  onClick={() => {
                    localStorage.removeItem(ORDER_KEY);
                    setOrderedHrefs([]);
                    setReordering(false);
                  }}
                  className="rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                  Restablecer
                </button>
              )}
              <button
                onClick={() => { setShowApps(false); setReordering(false); }}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Grid de apps */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-6xl px-6 py-8 space-y-10">

              {/* Modo reordenamiento */}
              {reordering && (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={visible.map(m => m.href)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                      {visible.map((mod) => (
                        <SortableAppCard key={mod.href} mod={mod} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {/* Modo normal */}
              {!reordering && (
                <>
                  {filtered.length === 0 && (
                    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl border border-dashed border-surface-border bg-slate-50 text-center">
                      <Search size={28} className="text-surface-muted" />
                      <p className="mt-3 text-sm font-semibold text-surface-text">No encontramos ese módulo</p>
                      <p className="mt-1 text-xs text-surface-muted">Prueba con otra palabra clave.</p>
                    </div>
                  )}

                  {featured.length > 0 && (
                    <section>
                      <div className="mb-4 flex items-center gap-3">
                        <h3 className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Accesos principales</h3>
                        <div className="h-px flex-1 bg-slate-200/70" />
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {featured.map((mod) => renderModuleCard(mod, "featured"))}
                      </div>
                    </section>
                  )}

                  {grouped.map(({ category, meta, items }) =>
                    items.length > 0 ? (
                      <section key={category}>
                        <div className="mb-4 flex items-center gap-3">
                          <h3 className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">{meta.title}</h3>
                          <div className="h-px flex-1 bg-slate-200/70" />
                          <span className="text-[10px] font-semibold text-slate-300">{items.length} módulo{items.length !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                          {items.map((mod) => renderModuleCard(mod, "compact"))}
                        </div>
                      </section>
                    ) : null
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    <StockAlertaBanner sucursalId={(session?.user as { sucursalId?: number })?.sucursalId ?? null} />
    </>
  );
}
