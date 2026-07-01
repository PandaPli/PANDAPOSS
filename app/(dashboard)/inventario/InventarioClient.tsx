"use client";

import { useState } from "react";
import {
  ArrowDownCircle, ArrowUpCircle, RefreshCw, Package,
  AlertTriangle, Plus, Loader2, X,
} from "lucide-react";

type TipoKardex = "ENTRADA" | "SALIDA" | "AJUSTE";

interface Movimiento {
  id: number;
  productoId: number;
  productoNombre: string;
  productoCodigo: string;
  stockActual: number;
  tipo: TipoKardex;
  cantidad: number;
  motivo: string;
  ventaId: number | null;
  creadoEn: string;
}

interface ProductoStockBajo {
  id: number;
  nombre: string;
  stock: number;
  stockMinimo: number;
}

interface Producto {
  id: number;
  nombre: string;
  codigo: string;
  stock: number;
}

interface Props {
  movimientos: Movimiento[];
  stockBajoProductos: ProductoStockBajo[];
  stockBajoIngredientes: (ProductoStockBajo & { unidad: string })[];
  productos: Producto[];
}

const TIPO_CONFIG: Record<TipoKardex, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  ENTRADA: { label: "Entrada",  icon: <ArrowDownCircle size={14} />, color: "text-emerald-700", bg: "bg-emerald-50" },
  SALIDA:  { label: "Salida",   icon: <ArrowUpCircle size={14} />,   color: "text-red-700",     bg: "bg-red-50"     },
  AJUSTE:  { label: "Ajuste",   icon: <RefreshCw size={14} />,       color: "text-blue-700",    bg: "bg-blue-50"    },
};

export function InventarioClient({ movimientos: initial, stockBajoProductos, stockBajoIngredientes, productos }: Props) {
  const [tab, setTab] = useState<"movimientos" | "stock-bajo">("movimientos");
  const [movimientos, setMovimientos] = useState(initial);
  const [filtroTipo, setFiltroTipo] = useState<TipoKardex | "">("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ productoId: "", tipo: "ENTRADA" as TipoKardex, cantidad: "", motivo: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filtered = filtroTipo ? movimientos.filter((m) => m.tipo === filtroTipo) : movimientos;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.productoId || !form.cantidad || !form.motivo.trim()) {
      setError("Completa todos los campos");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/kardex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productoId: Number(form.productoId),
          tipo: form.tipo,
          cantidad: Number(form.cantidad),
          motivo: form.motivo.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al registrar");

      // Recargar movimientos
      const res2 = await fetch("/api/kardex?take=100");
      if (res2.ok) setMovimientos(await res2.json());

      setForm({ productoId: "", tipo: "ENTRADA", cantidad: "", motivo: "" });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  const totalAlerta = stockBajoProductos.length + stockBajoIngredientes.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-text">Inventario</h1>
          <p className="text-sm text-surface-muted mt-0.5">Movimientos de stock y alertas de reposición</p>
        </div>
        <button onClick={() => { setShowForm(true); setError(""); }} className="btn-primary">
          <Plus size={16} /> Registrar movimiento
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-border">
        {[
          { key: "movimientos",  label: "Movimientos" },
          { key: "stock-bajo",   label: `Stock bajo${totalAlerta > 0 ? ` (${totalAlerta})` : ""}` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-surface-muted hover:text-surface-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Movimientos */}
      {tab === "movimientos" && (
        <div className="space-y-3">
          {/* Filtro tipo */}
          <div className="flex gap-2">
            {(["", "ENTRADA", "SALIDA", "AJUSTE"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFiltroTipo(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  filtroTipo === t
                    ? "bg-brand-500 text-white border-brand-500"
                    : "border-surface-border text-surface-text hover:bg-surface-bg"
                }`}
              >
                {t === "" ? "Todos" : TIPO_CONFIG[t].label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-surface-muted">
              <Package size={40} className="mx-auto mb-2 opacity-30" />
              <p>Sin movimientos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-surface-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-bg border-b border-surface-border">
                    <th className="text-left px-4 py-2.5 font-medium text-surface-muted">Fecha</th>
                    <th className="text-left px-4 py-2.5 font-medium text-surface-muted">Producto</th>
                    <th className="text-left px-4 py-2.5 font-medium text-surface-muted">Tipo</th>
                    <th className="text-right px-4 py-2.5 font-medium text-surface-muted">Cantidad</th>
                    <th className="text-left px-4 py-2.5 font-medium text-surface-muted">Motivo</th>
                    <th className="text-right px-4 py-2.5 font-medium text-surface-muted">Stock actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {filtered.map((m) => {
                    const cfg = TIPO_CONFIG[m.tipo];
                    return (
                      <tr key={m.id} className="hover:bg-surface-bg/50 transition-colors">
                        <td className="px-4 py-2.5 text-surface-muted whitespace-nowrap">
                          {new Date(m.creadoEn).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-surface-text">{m.productoNombre}</p>
                          <p className="text-xs text-surface-muted">{m.productoCodigo}</p>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                            {cfg.icon}{cfg.label}
                          </span>
                        </td>
                        <td className={`px-4 py-2.5 text-right font-bold ${cfg.color}`}>
                          {m.tipo === "SALIDA" ? "-" : "+"}{m.cantidad}
                        </td>
                        <td className="px-4 py-2.5 text-surface-text max-w-[200px] truncate">{m.motivo}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-surface-text">{m.stockActual}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Stock Bajo */}
      {tab === "stock-bajo" && (
        <div className="space-y-4">
          {totalAlerta === 0 ? (
            <div className="text-center py-12 text-emerald-600">
              <Package size={40} className="mx-auto mb-2 opacity-40" />
              <p className="font-medium">Sin alertas de stock — todo en niveles normales</p>
            </div>
          ) : (
            <>
              {stockBajoProductos.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-surface-text mb-2">Productos</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {stockBajoProductos.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50">
                        <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-surface-text truncate">{p.nombre}</p>
                          <p className="text-xs text-amber-700">
                            Stock: <strong>{p.stock}</strong> · Mínimo: {p.stockMinimo}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {stockBajoIngredientes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-surface-text mb-2">Ingredientes</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {stockBajoIngredientes.map((i) => (
                      <div key={i.id} className="flex items-center gap-3 p-3 rounded-xl border border-orange-200 bg-orange-50">
                        <AlertTriangle size={16} className="text-orange-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-surface-text truncate">{i.nombre}</p>
                          <p className="text-xs text-orange-700">
                            Stock: <strong>{i.stock} {i.unidad}</strong> · Mínimo: {i.stockMinimo} {i.unidad}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal: Registrar movimiento */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="font-semibold text-surface-text">Registrar movimiento de stock</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-surface-bg">
                <X size={18} className="text-surface-muted" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
              )}
              <div>
                <label className="label">Producto</label>
                <select
                  value={form.productoId}
                  onChange={(e) => setForm({ ...form, productoId: e.target.value })}
                  required
                  className="input"
                >
                  <option value="">Selecciona un producto…</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoKardex })}
                    className="input"
                  >
                    <option value="ENTRADA">Entrada (compra)</option>
                    <option value="SALIDA">Salida (merma)</option>
                    <option value="AJUSTE">Ajuste (inventario)</option>
                  </select>
                </div>
                <div>
                  <label className="label">
                    {form.tipo === "AJUSTE" ? "Nuevo stock" : "Cantidad"}
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.cantidad}
                    onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                    required
                    className="input"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="label">Motivo</label>
                <input
                  type="text"
                  value={form.motivo}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  required
                  placeholder="Ej: Compra a proveedor, merma por vencimiento…"
                  className="input"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
