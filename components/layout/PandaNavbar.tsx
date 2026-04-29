"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bike,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  GripVertical,
  LayoutDashboard,
  LayoutGrid,
  Lock,
  LogOut,
  LucideIcon,
  Package,
  Printer,
  QrCode,
  Search,
  Settings,
  ShoppingCart,
  Monitor,
  Tag,
  Ticket,
  Navigation,
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

type FeatureKey = "delivery" | "menuQR" | "kiosko" | "cupones" | "eventos" | "agenteWsp";
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
  { label: "Panel", href: "/panel", icon: LayoutDashboard, color: "bg-gradient-to-br from-violet-500 to-indigo-600", roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER", "WAITER", "CHEF", "BAR"], category: "operacion", description: "Resumen y accesos clave." },
  { label: "Punto de Venta", href: "/ventas/nueva", icon: ShoppingCart, color: "bg-gradient-to-br from-emerald-400 to-teal-600", roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER"], category: "operacion", description: "Cobro rápido en caja. Incluye modo Express.", featured: true },
  { label: "Mesas", href: "/mesas", icon: UtensilsCrossed, color: "bg-gradient-to-br from-orange-400 to-rose-500", roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER", "WAITER"], category: "operacion", description: "Mesas, sala y servicio.", featured: true },
  { label: "Delivery", href: "/delivery", icon: Bike, color: "bg-gradient-to-br from-amber-400 to-orange-500", roles: ["ADMIN_GENERAL", "RESTAURANTE", "DELIVERY"], category: "operacion", description: "Despachos y repartos.", featureKey: "delivery", featured: true },
  { label: "Visor ODS", href: "/track", icon: Navigation, color: "bg-gradient-to-br from-cyan-500 to-sky-600", roles: ["ADMIN_GENERAL", "RESTAURANTE", "CASHIER", "DELIVERY"], category: "operacion", description: "Rastreo en vivo de pedidos delivery para clientes.", featureKey: "delivery" },
  { label: "Apps Delivery", href: "/apps-delivery", icon: Printer, color: "bg-gradient-to-br from-violet-500 to-purple-700", roles: ["ADMIN_GENERAL", "RESTAURANTE", "CASHIER"], category: "operacion", description: "Imprime ticket con QR para bolsas de Pedidos Ya / Uber Eats." },
  { label: "KDS", href: "/pedidos", icon: ClipboardList, color: "bg-gradient-to-br from-yellow-400 to-amber-500", roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER", "WAITER", "CHEF", "BAR"], category: "operacion", description: "Flujo activo de comandas.", featured: true },
  { label: "Agente", href: "/agente", icon: Bot, color: "bg-gradient-to-br from-emerald-400 to-teal-600", roles: ["ADMIN_GENERAL", "RESTAURANTE"], category: "operacion", description: "Bot WhatsApp con IA para pedidos.", featureKey: "agenteWsp", featured: true },
  { label: "Ventas", href: "/ventas", icon: BarChart3, color: "bg-gradient-to-br from-cyan-400 to-blue-500", roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY", "CASHIER"], category: "gestion", description: "Historial y rendimiento." },
  { label: "Reportes", href: "/reportes", icon: BarChart3, color: "bg-gradient-to-br from-violet-500 to-indigo-600", roles: ["ADMIN_GENERAL", "RESTAURANTE", "SECRETARY"], category: "gestion", description: "Cierre de caja, auditoría y tiempos KDS." },
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
  { label: "Eventos", href: "/eventos", icon: Ticket, color: "bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700", roles: ["ADMIN_GENERAL", "RESTAURANTE"], category: "operacion", description: "Gestion de eventos y venta de tickets QR.", featureKey: "eventos" },
];

const categoryMeta: Record<ModuleCategory, { title: string; subtitle: string; badge: string; badgeColor: string }> = {
  operacion:     { title: "Operacion diaria", subtitle: "Lo que se usa durante el servicio.", badge: "Operación", badgeColor: "bg-violet-100 text-violet-600" },
  gestion:       { title: "Gestion",          subtitle: "Control comercial y administrativo.", badge: "Gestión",   badgeColor: "bg-sky-100 text-sky-600" },
  configuracion: { title: "Configuracion",    subtitle: "Estructura, permisos y extras.",     badge: "Config",    badgeColor: "bg-slate-100 text-slate-500" },
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

// ── Tarjeta de app unificada (normal + sortable) ──────────────────────────
interface AppIconCardProps {
  mod: AppModule;
  active?: boolean;
  locked?: boolean;
  onClick?: () => void;
  // drag props (solo en modo reordenar)
  sortable?: boolean;
  showCategory?: boolean;
  dragRef?: (node: HTMLElement | null) => void;
  dragStyle?: React.CSSProperties;
  dragAttrs?: React.HTMLAttributes<HTMLElement>;
  dragListeners?: React.HTMLAttributes<HTMLElement>;
  isDragging?: boolean;
}

function AppIconCard({ mod, active, locked, onClick, sortable, showCategory, dragRef, dragStyle, dragAttrs, dragListeners, isDragging }: AppIconCardProps) {
  const Icon = mod.icon;
  const inner = (
    <div
      ref={dragRef as ((node: HTMLDivElement | null) => void) | undefined}
      style={dragStyle}
      className={cn(
        "flex flex-col items-center gap-2 text-center transition-all",
        sortable ? "cursor-grab active:cursor-grabbing select-none" : "group",
        isDragging && "z-50 scale-110 opacity-90"
      )}
      {...(dragAttrs as React.HTMLAttributes<HTMLDivElement>)}
      {...(dragListeners as React.HTMLAttributes<HTMLDivElement>)}
    >
      {/* Tarjeta cuadrada blanca */}
      <div className={cn(
        "flex h-[84px] w-[84px] items-center justify-center rounded-[22px] bg-white transition-all",
        isDragging
          ? "shadow-2xl ring-2 ring-violet-400"
          : active
            ? "shadow-lg ring-2 ring-brand-400"
            : "shadow-md group-hover:-translate-y-1 group-hover:shadow-xl"
      )}>
        {/* Ícono con gradiente */}
        <div className={cn(
          "flex h-[54px] w-[54px] items-center justify-center rounded-[14px] text-white shadow-sm",
          locked ? "bg-slate-300" : mod.color
        )}>
          <Icon size={26} />
          {locked && (
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow">
              <Lock size={8} className="text-slate-400" />
            </div>
          )}
        </div>
      </div>
      {/* Etiqueta */}
      <p className={cn(
        "w-[88px] text-center text-[12px] font-bold leading-tight drop-shadow-sm",
        locked ? "text-slate-400" : active ? "text-violet-900" : "text-slate-700"
      )}>{mod.label}</p>
      {showCategory && (
        <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-semibold", categoryMeta[mod.category].badgeColor)}>
          {categoryMeta[mod.category].badge}
        </span>
      )}
      {sortable && !showCategory && <GripVertical size={11} className="text-slate-400" />}
    </div>
  );

  if (sortable) return inner;
  return (
    <a href={locked ? "/planes" : mod.href} onClick={onClick} title={mod.description}>
      {inner}
    </a>
  );
}

// ── Wrapper sortable ────────────────────────────────────────────────────────
function SortableAppCard({ mod }: { mod: AppModule }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: mod.href });
  return (
    <AppIconCard
      mod={mod}
      sortable
      showCategory
      dragRef={setNodeRef}
      dragStyle={{ transform: CSS.Transform.toString(transform), transition }}
      dragAttrs={attributes}
      dragListeners={listeners}
      isDragging={isDragging}
    />
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
  const plan = (session?.user as { plan?: string })?.plan ?? "BASICO";
  const isPrime = plan === "PRIME" || plan === "DEMO";
  const features: Record<FeatureKey, boolean> = {
    delivery: (session?.user as { delivery?: boolean })?.delivery ?? false,
    menuQR:   (session?.user as { menuQR?: boolean })?.menuQR ?? false,
    kiosko:   (session?.user as { kioskActivo?: boolean })?.kioskActivo ?? false,
    cupones:   (session?.user as { cupones?: boolean })?.cupones ?? false,
    eventos:   isPrime,
    agenteWsp: isPrime,
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
        Fuera del <nav> para evitar contención por backdrop-filter en Chrome.   */}
    <AnimatePresence>
      {showApps && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 top-[52px] z-50 flex flex-col overflow-hidden"
          style={{ background: "linear-gradient(135deg,#ede9fe 0%,#f5f3ff 25%,#fdf4ff 50%,#fff7ed 75%,#f0fdf4 100%)" }}
        >
          {/* Bokeh decorativos */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-16 right-24 h-80 w-80 rounded-full bg-yellow-300/30 blur-3xl" />
            <div className="absolute top-32 -left-16 h-72 w-72 rounded-full bg-violet-400/25 blur-3xl" />
            <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-pink-300/20 blur-3xl" />
            <div className="absolute bottom-32 left-1/3 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="absolute top-1/2 right-1/3 h-48 w-48 rounded-full bg-emerald-300/20 blur-3xl" />
          </div>

          {/* Barra superior: búsqueda + controles */}
          <div className="relative z-10 flex items-center gap-3 border-b border-white/40 bg-white/30 px-6 py-3 backdrop-blur-sm">
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-700/70">
                {reordering ? "Arrastra para reordenar" : "Apps PandaPoss"}
              </p>
            </div>
            {!reordering && (
              <div className="relative w-52">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400" />
                <input
                  type="text"
                  placeholder="Buscar módulo..."
                  value={searchApp}
                  onChange={(e) => setSearchApp(e.target.value)}
                  className="w-full rounded-xl border border-violet-200/60 bg-white/70 py-1.5 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-violet-400 focus:bg-white"
                  autoFocus
                />
              </div>
            )}
            {canReorder && (
              <button
                onClick={() => { setReordering(v => !v); setSearchApp(""); }}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition",
                  reordering
                    ? "bg-amber-400 text-stone-900 shadow"
                    : "border border-violet-200/60 bg-white/60 text-violet-700 hover:bg-white"
                )}
              >
                <GripVertical size={13} />
                {reordering ? "✓ Listo" : "Reordenar"}
              </button>
            )}
            {canReorder && reordering && (
              <button
                onClick={() => { localStorage.removeItem(ORDER_KEY); setOrderedHrefs([]); setReordering(false); }}
                className="rounded-xl border border-violet-200/60 bg-white/60 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-white"
              >
                Restablecer
              </button>
            )}
            <button
              onClick={() => { setShowApps(false); setReordering(false); }}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/60 text-slate-500 transition hover:bg-white hover:text-slate-800"
            >
              <X size={16} />
            </button>
          </div>

          {/* Contenido scrollable */}
          <div className="relative z-10 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-5xl px-8 py-10 space-y-10">

              {/* ── Modo reordenamiento: grid plano libre (sin barreras por sección) ── */}
              {reordering && (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={visible.map(m => m.href)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-4 gap-6 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8">
                      {visible.map((mod) => (
                        <SortableAppCard key={mod.href} mod={mod} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {/* ── Modo normal: secciones por categoría ── */}
              {!reordering && (
                <>
                  {searchApp && filtered.length === 0 && (
                    <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                      <Search size={32} className="text-violet-300" />
                      <p className="mt-3 text-sm font-bold text-violet-900/60">Sin resultados</p>
                      <p className="text-xs text-violet-700/40">Prueba con otra palabra clave.</p>
                    </div>
                  )}

                  {/* Búsqueda activa: grid plano */}
                  {searchApp && filtered.length > 0 && (
                    <div className="grid grid-cols-4 gap-6 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8">
                      {filtered.map((mod) => {
                        const active = pathname === mod.href || pathname.startsWith(mod.href + "/");
                        const locked = !!mod.featureKey && !features[mod.featureKey] && !isAdmin;
                        return (
                          <AppIconCard key={mod.href} mod={mod} active={active} locked={locked}
                            onClick={() => setShowApps(false)} />
                        );
                      })}
                    </div>
                  )}

                  {/* Sin búsqueda: secciones agrupadas */}
                  {!searchApp && (Object.keys(categoryMeta) as ModuleCategory[]).map((cat) => {
                    const items = visible.filter(m => m.category === cat);
                    if (items.length === 0) return null;
                    return (
                      <section key={cat}>
                        <div className="mb-5 flex items-center gap-3">
                          <span className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-slate-500">
                            {categoryMeta[cat].title}
                          </span>
                          <div className="h-px flex-1 bg-violet-200/50" />
                        </div>
                        <div className="grid grid-cols-4 gap-6 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8">
                          {items.map((mod) => {
                            const active = pathname === mod.href || pathname.startsWith(mod.href + "/");
                            const locked = !!mod.featureKey && !features[mod.featureKey] && !isAdmin;
                            return (
                              <AppIconCard key={mod.href} mod={mod} active={active} locked={locked}
                                onClick={() => setShowApps(false)} />
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
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
