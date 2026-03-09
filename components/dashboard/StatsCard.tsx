import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: "brand" | "emerald" | "amber" | "red" | "violet";
}

const colorMap = {
  brand: {
    bg: "bg-brand-50",
    icon: "bg-brand-100 text-brand-500",
    trend: "text-brand-600",
  },
  emerald: {
    bg: "bg-emerald-50",
    icon: "bg-emerald-100 text-emerald-600",
    trend: "text-emerald-600",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "bg-amber-100 text-amber-600",
    trend: "text-amber-600",
  },
  red: {
    bg: "bg-red-50",
    icon: "bg-red-100 text-red-600",
    trend: "text-red-600",
  },
  violet: {
    bg: "bg-violet-50",
    icon: "bg-violet-100 text-violet-600",
    trend: "text-violet-600",
  },
};

export function StatsCard({ title, value, subtitle, icon: Icon, trend, color = "brand" }: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div className={cn("rounded-xl p-5 border-0", colors.bg)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-surface-muted">{title}</p>
          <p className="text-2xl font-bold text-surface-text mt-1">{value}</p>
          {subtitle && <p className="text-xs text-surface-muted mt-0.5">{subtitle}</p>}
        </div>
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", colors.icon)}>
          <Icon size={22} />
        </div>
      </div>
      {trend && (
        <div className={cn("mt-3 text-xs font-medium flex items-center gap-1", colors.trend)}>
          <span>{trend.value > 0 ? "↑" : "↓"}</span>
          <span>{Math.abs(trend.value)}% {trend.label}</span>
        </div>
      )}
    </div>
  );
}
