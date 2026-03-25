import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PLAN_LIMITS } from "@/core/billing/planConfig";
import { Check, X, Zap, Crown } from "lucide-react";
import type { Rol } from "@/types";

export default async function PlanesPage() {
  const session = await getServerSession(authOptions);

  const planActual = (session?.user as { plan?: string })?.plan ?? "BASICO";
  const rol        = (session?.user as { rol?: Rol })?.rol;
  const isAdmin    = rol === "ADMIN_GENERAL" || rol === "RESTAURANTE";

  const basico = PLAN_LIMITS["BASICO"];
  const pro    = PLAN_LIMITS["PRO"];
  const prime  = PLAN_LIMITS["PRIME"];

  type Feature = { label: string; basico: string | boolean; pro: string | boolean; prime: string | boolean };

  const features: Feature[] = [
    { label: "Usuarios",             basico: `${basico.usuarios}`,  pro: `${pro.usuarios}`,  prime: `${prime.usuarios}` },
    { label: "Cajas",                basico: `${basico.cajas}`,     pro: `${pro.cajas}`,     prime: `${prime.cajas}` },
    { label: "Productos",            basico: `${basico.productos}`, pro: `${pro.productos}`, prime: `${prime.productos}` },
    { label: "Clientes",             basico: `${basico.clientes}`,  pro: `${pro.clientes}`,  prime: `${prime.clientes}` },
    { label: "Delivery integrado",   basico: false,                 pro: true,               prime: true },
    { label: "Carta Digital QR",     basico: false,                 pro: true,               prime: true },
    { label: "Correo a clientes",    basico: false,                 pro: true,               prime: true },
    { label: "Soporte prioritario",  basico: false,                 pro: true,               prime: true },
    { label: "RRHH y Turnos",        basico: false,                 pro: true,               prime: true },
    { label: "Contabilidad Propinas",basico: false,                 pro: false,              prime: true },
  ];

  function Cell({ value }: { value: string | boolean }) {
    if (typeof value === "boolean") {
      return value
        ? <Check size={18} className="text-emerald-500 mx-auto" />
        : <X     size={18} className="text-surface-muted mx-auto" />;
    }
    return <span className="text-sm font-semibold">{value}</span>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-surface-text">Planes</h1>
        <p className="text-surface-muted text-sm mt-1">
          Plan actual: <span className="font-semibold text-brand-600">
            {planActual === "BASICO" ? "INICIAL" : planActual}
          </span>
        </p>
      </div>

      {/* Tabla comparativa */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border">
              <th className="text-left p-4 text-surface-muted font-medium w-[40%]">Característica</th>
              <th className="text-center p-4 w-[20%]">
                <span className={planActual === "BASICO" ? "text-brand-600 font-bold" : "text-surface-text font-semibold"}>
                  INICIAL {planActual === "BASICO" && "✓"}
                </span>
                <span className="text-[11px] font-semibold text-surface-muted block mt-0.5">$8.990/mes</span>
              </th>
              <th className="text-center p-4 w-[20%] bg-amber-50">
                <span className={`font-bold flex items-center justify-center gap-1.5 ${planActual === "PRO" ? "text-amber-600" : "text-amber-500"}`}>
                  <Zap size={14} /> PRO {planActual === "PRO" && "✓"}
                </span>
                <span className="text-[11px] font-semibold text-amber-400 block mt-0.5">$12.990/mes</span>
              </th>
              <th className="text-center p-4 w-[20%] bg-violet-50">
                <span className={`font-bold flex items-center justify-center gap-1.5 ${planActual === "PRIME" ? "text-violet-700" : "text-violet-500"}`}>
                  <Crown size={14} /> PRIME {planActual === "PRIME" && "✓"}
                </span>
                <span className="text-[11px] font-semibold text-violet-400 block mt-0.5">$14.990/mes</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map((f, i) => (
              <tr key={f.label} className={i % 2 === 0 ? "bg-surface-bg/40" : ""}>
                <td className="p-4 text-surface-text">{f.label}</td>
                <td className="p-4 text-center text-surface-text"><Cell value={f.basico} /></td>
                <td className="p-4 text-center text-surface-text bg-amber-50/50"><Cell value={f.pro} /></td>
                <td className={`p-4 text-center text-surface-text bg-violet-50/50 ${f.label === "Contabilidad Propinas" ? "font-semibold text-violet-600" : ""}`}>
                  <Cell value={f.prime} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Banner DEMO */}
      {planActual === "DEMO" && (
        <div className="card p-6 bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 flex items-center gap-4">
          <span className="text-3xl">🧪</span>
          <div>
            <p className="font-bold text-violet-700">Estás en modo DEMO</p>
            <p className="text-surface-muted text-sm mt-0.5">
              Tienes acceso completo a todas las funciones con límites de 99.999. Los datos se reinician cada día automáticamente.
            </p>
          </div>
        </div>
      )}

      {/* CTA upgrade a PRO */}
      {isAdmin && planActual === "BASICO" && (
        <div className="card p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-surface-text">Estás en plan INICIAL — Actualiza a PRO</p>
            <p className="text-surface-muted text-sm mt-0.5">
              Desbloquea Delivery, Carta QR, correo automático, hasta 600 clientes y más.
            </p>
          </div>
          <a
            href="mailto:contacto@zapzappfood.com?subject=Upgrade%20a%20PRO"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors shadow-sm whitespace-nowrap"
          >
            <Zap size={16} />
            Contactar
          </a>
        </div>
      )}

      {/* CTA upgrade a PRIME */}
      {isAdmin && planActual !== "PRIME" && (
        <div className="card p-6 bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-surface-text flex items-center gap-2">
              <Crown size={16} className="text-violet-500" />
              Actualiza a PRIME — $14.990/mes
            </p>
            <p className="text-surface-muted text-sm mt-0.5">
              Incluye todo PRO + Contabilidad de Propinas para tu equipo.
            </p>
          </div>
          <a
            href="mailto:contacto@pandaposs.com?subject=Upgrade%20a%20PRIME"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-colors shadow-sm whitespace-nowrap"
          >
            <Crown size={16} />
            Contactar
          </a>
        </div>
      )}
    </div>
  );
}
