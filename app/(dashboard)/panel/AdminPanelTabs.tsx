"use client";

import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, Store, BarChart3, Settings,
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
  { id: "config",     label: "Configuración",  icon: <Settings size={15} /> },
];

interface Props {
  general: ReactNode;
  sucursales: ReactNode;
  analitica: ReactNode;
  config: ReactNode;
}

export function AdminPanelTabs({ general, sucursales, analitica, config }: Props) {
  const [active, setActive] = useState("general");

  const panels: Record<string, ReactNode> = { general, sucursales, analitica, config };

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
                onClick={() => setActive(tab.id)}
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
        </div>
      </div>

      {/* ── Panel content ── */}
      <div className="animate-fade-in" key={active}>
        {panels[active]}
      </div>
    </div>
  );
}
