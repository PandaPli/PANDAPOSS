"use client";

import { useState, useEffect, useRef, useCallback, useTransition, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, Store, BarChart3, Settings, RefreshCw,
  Users, FileText,
} from "lucide-react";

interface Tab {
  id: string;
  label: string;
  icon: ReactNode;
}

const TABS: Tab[] = [
  { id: "general",    label: "General",       icon: <LayoutDashboard size={15} /> },
  { id: "sucursales", label: "Sucursales",     icon: <Store size={15} /> },
  { id: "analitica",  label: "Analítica",      icon: <BarChart3 size={15} /> },
  { id: "usuarios",   label: "Usuarios",       icon: <Users size={15} /> },
  { id: "logs",       label: "Actividad",      icon: <FileText size={15} /> },
  { id: "config",     label: "Configuración",  icon: <Settings size={15} /> },
];

const VALID_IDS = new Set(TABS.map(t => t.id));
const REFRESH_INTERVAL_MS = 60_000; // Auto-refresh every 60s

// ── Skeleton components ──────────────────────────────────────────────────

function SkeletonPulse({ className }: { className?: string }) {
  return <div className={`rounded-2xl bg-white/40 animate-pulse ${className ?? ""}`} />;
}

function GeneralSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <SkeletonPulse className="col-span-2 lg:col-span-1 h-32" />
        <SkeletonPulse className="h-32" />
        <SkeletonPulse className="h-32" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <SkeletonPulse className="h-24" />
        <SkeletonPulse className="h-24" />
        <SkeletonPulse className="h-24" />
      </div>
      <SkeletonPulse className="h-16" />
    </div>
  );
}

function SucursalesSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <SkeletonPulse className="w-8 h-8 !rounded-xl" />
          <div className="space-y-1.5">
            <SkeletonPulse className="h-3 w-24 !rounded-lg" />
            <SkeletonPulse className="h-2 w-32 !rounded-lg" />
          </div>
        </div>
        <SkeletonPulse className="h-7 w-20 !rounded-xl" />
      </div>
      {[1, 2, 3].map(i => (
        <SkeletonPulse key={i} className="h-16" />
      ))}
    </div>
  );
}

function AnaliticaSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonPulse className="h-72" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SkeletonPulse className="h-40" />
        <SkeletonPulse className="h-40" />
      </div>
    </div>
  );
}

function UsuariosSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonPulse className="h-36" />
      {[1, 2, 3, 4].map(i => (
        <SkeletonPulse key={i} className="h-16" />
      ))}
    </div>
  );
}

function LogsSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonPulse className="h-16" />
      <SkeletonPulse className="h-80" />
    </div>
  );
}

function ConfigSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonPulse className="h-8 w-24 ml-auto !rounded-xl" />
      <SkeletonPulse className="h-64" />
      <SkeletonPulse className="h-32" />
      <SkeletonPulse className="h-12" />
    </div>
  );
}

const SKELETONS: Record<string, ReactNode> = {
  general:    <GeneralSkeleton />,
  sucursales: <SucursalesSkeleton />,
  analitica:  <AnaliticaSkeleton />,
  usuarios:   <UsuariosSkeleton />,
  logs:       <LogsSkeleton />,
  config:     <ConfigSkeleton />,
};

// ── Props ────────────────────────────────────────────────────────────────

interface Props {
  general: ReactNode;
  sucursales: ReactNode;
  analitica: ReactNode;
  usuarios: ReactNode;
  logs: ReactNode;
  config: ReactNode;
}

export function AdminPanelTabs({ general, sucursales, analitica, usuarios, logs, config }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const tabParam = searchParams.get("tab");
  const initialTab = tabParam && VALID_IDS.has(tabParam) ? tabParam : "general";
  const [active, setActive] = useState(initialTab);
  const [switching, setSwitching] = useState(false);

  // Sync with URL changes (back/forward navigation)
  useEffect(() => {
    const current = searchParams.get("tab");
    const resolved = current && VALID_IDS.has(current) ? current : "general";
    if (resolved !== active) setActive(resolved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ── Auto-refresh every 60s (only on General & Sucursales tabs) ────────
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const doRefresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  useEffect(() => {
    // Only auto-refresh on data-heavy tabs
    const shouldRefresh = active === "general" || active === "sucursales";

    if (shouldRefresh) {
      refreshTimer.current = setInterval(doRefresh, REFRESH_INTERVAL_MS);
    }

    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
        refreshTimer.current = null;
      }
    };
  }, [active, doRefresh]);

  // ── Tab change with skeleton transition ───────────────────────────────
  function handleTabChange(tabId: string) {
    if (tabId === active) return;
    setSwitching(true);
    setActive(tabId);

    const params = new URLSearchParams(searchParams.toString());
    if (tabId === "general") {
      params.delete("tab");
    } else {
      params.set("tab", tabId);
    }
    const qs = params.toString();
    router.replace(`/panel${qs ? `?${qs}` : ""}`, { scroll: false });

    // Brief skeleton flash for perceived responsiveness
    setTimeout(() => setSwitching(false), 150);
  }

  const panels: Record<string, ReactNode> = { general, sucursales, analitica, usuarios, logs, config };

  return (
    <div className="space-y-4">
      {/* ── Tab bar cristal ── */}
      <div className="relative">
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_2px_20px_rgba(0,0,0,0.06)] overflow-x-auto scrollbar-none">
          {TABS.map(tab => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold
                  transition-all duration-300 whitespace-nowrap flex-1 justify-center
                  ${isActive
                    ? "bg-white/90 text-brand-700 shadow-[0_2px_12px_rgba(79,70,229,0.15)] border border-brand-100/60"
                    : "text-surface-muted hover:text-brand-600 hover:bg-white/40"
                  }
                `}
              >
                <span className={`transition-colors duration-300 ${isActive ? "text-brand-600" : ""}`}>
                  {tab.icon}
                </span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}

          {/* Refresh indicator */}
          {isPending && (
            <div className="absolute -top-1 -right-1">
              <RefreshCw size={10} className="text-brand-500 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* ── Panel content ── */}
      <div className="animate-fade-in" key={active}>
        {switching ? SKELETONS[active] : panels[active]}
      </div>
    </div>
  );
}
