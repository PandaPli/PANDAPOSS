"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownCircle, ArrowUpCircle, RefreshCw, Package,
  AlertTriangle, Plus, Loader2, X, ShoppingBasket, Trash2, Truck,
} from "lucide-react";

type TipoKardex = "ENTRADA" | "SALIDA" | "AJUSTE";

interface Movimiento {
  id: number;
  itemId: number;
  itemNombre: string;
  itemCodigo: string;
  stockActual: number;
  unidad: string | null;
  tipo: TipoKardex;
  cantidad: number;
  motivo: string;
  creadoEn: string;
}

interface ItemStockBajo {
  id: number;
  nombre: string;
  stock: number;
  stockMinimo: number;
}

interface ItemSeleccionable {
  id: number;
  nombre: string;
  codigo: string;
  stock: number;
  unidad?: string;
}

interface CompraDetalleView {
  id: number;
  nombre: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
}

interface CompraView {
  id: number;
  numeroDocumento: string | null;
  observacion: string | null;
  total: number;
  creadoEn: string;
  proveedor: { id: number; nombre: string } | null;
  detalles: CompraDetalleView[];
}

interface Props {
  movimientos: Movimiento[];
  movimientosIngredientes: Movimiento[];
  stockBajoProductos: ItemStockBajo[];
  stockBajoIngredientes: (ItemStockBajo & { unidad: string })[];
  productos: ItemSeleccionable[];
  ingredientes: ItemSeleccionable[];
  compras: CompraView[];
  proveedores: { id: number; nombre: string }[];
}

interface ItemCompraForm {
  clase: "producto" | "ingrediente";
  itemId: string;
  cantidad: string;
  costoUnitario: string;
}

const TIPO_CONFIG: Record<TipoKardex, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  ENTRADA: { label: "Entrada",  icon: <ArrowDownCircle size={14} />, color: "text-emerald-700", bg: "bg-emerald-50" },
  SALIDA:  { label: "Salida",   icon: <ArrowUpCircle size={14} />,   color: "text-red-700",     bg: "bg-red-50"     },
  AJUSTE:  { label: "Ajuste",   icon: <RefreshCw size={14} />,       color: "text-blue-700",    bg: "bg-blue-50"    },
};

const money = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");

const emptyItem = (): ItemCompraForm => ({ clase: "producto", itemId: "", cantidad: "", costoUnitario: "" });

export function InventarioClient({
  movimientos, movimientosIngredientes,
  stockBajoProductos, stockBajoIngredientes,
  productos, ingredientes, compras, proveedores,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"movimientos" | "compras" | "stock-bajo">("movimientos");
  const [clase, setClase] = useState<"producto" | "ingrediente">("producto");
  const [filtroTipo, setFiltroTipo] = useState<TipoKardex | "">("");

  // Modal movimiento manual
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ clase: "producto" as "producto" | "ingrediente", itemId: "", tipo: "ENTRADA" as TipoKardex, cantidad: "", motivo: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Modal compra
  const [showCompra, setShowCompra] = useState(false);
  const [compraForm, setCompraForm] = useState({ proveedorId: "", numeroDocumento: "", observacion: "" });
  const [itemsCompra, setItemsCompra] = useState<ItemCompraForm[]>([emptyItem()]);
  const [savingCompra, setSavingCompra] = useState(false);
  const [errorCompra, setErrorCompra] = useState("");
  const [compraAbierta, setCompraAbierta] = useState<number | null>(null);

  const lista = clase === "producto" ? movimientos : movimientosIngredientes;
  const filtered = filtroTipo ? lista.filter((m) => m.tipo === filtroTipo) : lista;
  const itemsDisponibles = form.clase === "producto" ? productos : ingredientes;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.itemId || !form.cantidad || !form.motivo.trim()) {
      setError("Completa todos los campos");
      return;
    }
    setSaving(true);
    try {
      const url = form.clase === "producto" ? "/api/kardex" : "/api/kardex-ingredientes";
      const idKey = form.clase === "producto" ? "productoId" : "ingredienteId";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [idKey]: Number(form.itemId),
          tipo: form.tipo,
          cantidad: Number(form.cantidad),
          motivo: form.motivo.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al registrar");
      setForm({ clase: "producto", itemId: "", tipo: "ENTRADA", cantidad: "", motivo: "" });
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  const totalCompraForm = itemsCompra.reduce(
    (s, it) => s + (Number(it.cantidad) || 0) * (Number(it.costoUnitario) || 0), 0
  );

  async function handleSubmitCompra(e: React.FormEvent) {
    e.preventDefault();
    setErrorCompra("");
    const items = itemsCompra.filter((it) => it.itemId && Number(it.cantidad) > 0);
    if (items.length === 0) {
      setErrorCompra("Agrega al menos un ítem con cantidad");
      return;
    }
    setSavingCompra(true);
    try {
      const res = await fetch("/api/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proveedorId: compraForm.proveedorId ? Number(compraForm.proveedorId) : undefined,
          numeroDocumento: compraForm.numeroDocumento || undefined,
          observacion: compraForm.observacion || undefined,
          items: items.map((it) => ({
            [it.clase === "producto" ? "productoId" : "ingredienteId"]: Number(it.itemId),
            cantidad: Number(it.cantidad),
            costoUnitario: Number(it.costoUnitario) || 0,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al registrar la compra");
      setCompraForm({ proveedorId: "", numeroDocumento: "", observacion: "" });
      setItemsCompra([emptyItem()]);
      setShowCompra(false);
      router.refresh();
    } catch (err) {
      setErrorCompra(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSavingCompra(false);
    }
  }

  const totalAlerta = stockBajoProductos.length + stockBajoIngredientes.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-text">Inventario</h1>
          <p className="text-sm text-surface-muted mt-0.5">Movimientos de stock, compras y alertas de reposición</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowCompra(true); setErrorCompra(""); }} className="btn-secondary">
            <Truck size={16} /> Nueva compra
          </button>
          <button onClick={() => { setShowForm(true); setError(""); }} className="btn-primary">
            <Plus size={16} /> Registrar movimiento
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-border">
        {[
          { key: "movimientos", label: "Movimientos" },
          { key: "compras",     label: `Compras (${compras.length})` },
          { key: "stock-bajo",  label: `Stock bajo${totalAlerta > 0 ? ` (${totalAlerta})` : ""}` },
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
          <div className="flex items-center justify-between flex-wrap gap-2">
            {/* Toggle productos/insumos */}
            <div className="flex rounded-lg border border-surface-border overflow-hidden">
              {([
                { key: "producto",    label: "Productos" },
                { key: "ingrediente", label: "Insumos" },
              ] as const).map((c) => (
                <button
                  key={c.key}
                  onClick={() => setClase(c.key)}
                  className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
                    clase === c.key ? "bg-brand-500 text-white" : "bg-white text-surface-text hover:bg-surface-bg"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
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
                    <th className="text-left px-4 py-2.5 font-medium text-surface-muted">{clase === "producto" ? "Producto" : "Insumo"}</th>
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
                          <p className="font-medium text-surface-text">{m.itemNombre}</p>
                          <p className="text-xs text-surface-muted">{m.itemCodigo}</p>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                            {cfg.icon}{cfg.label}
                          </span>
                        </td>
                        <td className={`px-4 py-2.5 text-right font-bold ${cfg.color}`}>
                          {m.tipo === "SALIDA" ? "-" : "+"}{m.cantidad}{m.unidad ? ` ${m.unidad}` : ""}
                        </td>
                        <td className="px-4 py-2.5 text-surface-text max-w-[200px] truncate">{m.motivo}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-surface-text">
                          {m.stockActual}{m.unidad ? ` ${m.unidad}` : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Compras */}
      {tab === "compras" && (
        <div className="space-y-3">
          {compras.length === 0 ? (
            <div className="text-center py-12 text-surface-muted">
              <ShoppingBasket size={40} className="mx-auto mb-2 opacity-30" />
              <p>Sin compras registradas</p>
              <p className="text-xs mt-1">Usa &ldquo;Nueva compra&rdquo; para ingresar mercadería</p>
            </div>
          ) : (
            <div className="space-y-2">
              {compras.map((c) => (
                <div key={c.id} className="rounded-xl border border-surface-border bg-white overflow-hidden">
                  <button
                    onClick={() => setCompraAbierta(compraAbierta === c.id ? null : c.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-bg/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <Truck size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-surface-text">
                          Compra #{c.id}
                          {c.proveedor && <span className="font-normal text-surface-muted"> · {c.proveedor.nombre}</span>}
                          {c.numeroDocumento && <span className="font-normal text-surface-muted"> · doc {c.numeroDocumento}</span>}
                        </p>
                        <p className="text-xs text-surface-muted">
                          {new Date(c.creadoEn).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" })}
                          {" · "}{c.detalles.length} ítem{c.detalles.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-surface-text">{money(c.total)}</span>
                  </button>
                  {compraAbierta === c.id && (
                    <div className="border-t border-surface-border px-4 py-3 bg-surface-bg/30">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-surface-muted">
                            <th className="text-left py-1 font-medium">Ítem</th>
                            <th className="text-right py-1 font-medium">Cantidad</th>
                            <th className="text-right py-1 font-medium">Costo unit.</th>
                            <th className="text-right py-1 font-medium">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.detalles.map((d) => (
                            <tr key={d.id} className="text-surface-text">
                              <td className="py-1">{d.nombre}</td>
                              <td className="py-1 text-right">{d.cantidad}</td>
                              <td className="py-1 text-right">{money(d.costoUnitario)}</td>
                              <td className="py-1 text-right font-medium">{money(d.subtotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {c.observacion && (
                        <p className="mt-2 text-xs text-surface-muted italic">{c.observacion}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
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
                <label className="label">Clase</label>
                <div className="flex rounded-lg border border-surface-border overflow-hidden">
                  {([
                    { key: "producto",    label: "Producto" },
                    { key: "ingrediente", label: "Insumo" },
                  ] as const).map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setForm({ ...form, clase: c.key, itemId: "" })}
                      className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                        form.clase === c.key ? "bg-brand-500 text-white" : "bg-white text-surface-text hover:bg-surface-bg"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">{form.clase === "producto" ? "Producto" : "Insumo"}</label>
                <select
                  value={form.itemId}
                  onChange={(e) => setForm({ ...form, itemId: e.target.value })}
                  required
                  className="input"
                >
                  <option value="">Selecciona…</option>
                  {itemsDisponibles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (stock: {p.stock}{p.unidad ? ` ${p.unidad}` : ""})
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

      {/* Modal: Nueva compra */}
      {showCompra && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="font-semibold text-surface-text">Nueva compra — entrada de mercadería</h2>
              <button onClick={() => setShowCompra(false)} className="p-1 rounded hover:bg-surface-bg">
                <X size={18} className="text-surface-muted" />
              </button>
            </div>
            <form onSubmit={handleSubmitCompra} className="flex-1 overflow-y-auto p-5 space-y-4">
              {errorCompra && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{errorCompra}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Proveedor</label>
                  <select
                    value={compraForm.proveedorId}
                    onChange={(e) => setCompraForm({ ...compraForm, proveedorId: e.target.value })}
                    className="input"
                  >
                    <option value="">Sin proveedor</option>
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">N° documento (factura/guía)</label>
                  <input
                    type="text"
                    value={compraForm.numeroDocumento}
                    onChange={(e) => setCompraForm({ ...compraForm, numeroDocumento: e.target.value })}
                    placeholder="Opcional"
                    className="input"
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <label className="label">Ítems</label>
                <div className="space-y-2">
                  {itemsCompra.map((it, idx) => {
                    const opciones = it.clase === "producto" ? productos : ingredientes;
                    return (
                      <div key={idx} className="flex gap-2 items-start">
                        <select
                          value={it.clase}
                          onChange={(e) => {
                            const next = [...itemsCompra];
                            next[idx] = { ...it, clase: e.target.value as "producto" | "ingrediente", itemId: "" };
                            setItemsCompra(next);
                          }}
                          className="input w-28 shrink-0"
                        >
                          <option value="producto">Producto</option>
                          <option value="ingrediente">Insumo</option>
                        </select>
                        <select
                          value={it.itemId}
                          onChange={(e) => {
                            const next = [...itemsCompra];
                            next[idx] = { ...it, itemId: e.target.value };
                            setItemsCompra(next);
                          }}
                          className="input flex-1 min-w-0"
                        >
                          <option value="">Selecciona…</option>
                          {opciones.map((p) => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={it.cantidad}
                          onChange={(e) => {
                            const next = [...itemsCompra];
                            next[idx] = { ...it, cantidad: e.target.value };
                            setItemsCompra(next);
                          }}
                          placeholder="Cant."
                          className="input w-20 shrink-0"
                        />
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={it.costoUnitario}
                          onChange={(e) => {
                            const next = [...itemsCompra];
                            next[idx] = { ...it, costoUnitario: e.target.value };
                            setItemsCompra(next);
                          }}
                          placeholder="Costo $"
                          className="input w-24 shrink-0"
                        />
                        <button
                          type="button"
                          onClick={() => setItemsCompra(itemsCompra.filter((_, i) => i !== idx))}
                          disabled={itemsCompra.length === 1}
                          className="p-2 rounded-lg text-red-400 hover:bg-red-50 disabled:opacity-30 shrink-0"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setItemsCompra([...itemsCompra, emptyItem()])}
                  className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  <Plus size={13} /> Agregar ítem
                </button>
              </div>

              <div>
                <label className="label">Observación</label>
                <input
                  type="text"
                  value={compraForm.observacion}
                  onChange={(e) => setCompraForm({ ...compraForm, observacion: e.target.value })}
                  placeholder="Opcional"
                  className="input"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-surface-bg px-4 py-3">
                <span className="text-sm font-medium text-surface-muted">Total compra</span>
                <span className="text-lg font-bold text-surface-text">{money(totalCompraForm)}</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCompra(false)} className="btn-secondary flex-1 justify-center">
                  Cancelar
                </button>
                <button type="submit" disabled={savingCompra} className="btn-primary flex-1 justify-center">
                  {savingCompra && <Loader2 size={15} className="animate-spin" />}
                  Registrar compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
