"use client";

import { useState } from "react";
import { Plus, Tag, Trash2, ToggleLeft, ToggleRight, Pencil, X, Check, Copy } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Cupon {
  id: number;
  codigo: string;
  descripcion: string | null;
  tipo: "PORCENTAJE" | "MONTO_FIJO";
  valor: number | string;
  usoMax: number | null;
  usoActual: number;
  activo: boolean;
  venceEn: Date | string | null;
  creadoEn: Date | string;
}

interface Props {
  cupones: Cupon[];
  sucursalId: number | null;
}

const emptyForm = {
  codigo: "",
  descripcion: "",
  tipo: "PORCENTAJE" as "PORCENTAJE" | "MONTO_FIJO",
  valor: "",
  usoMax: "",
  venceEn: "",
  activo: true,
};

export function CuponesClient({ cupones: initial, sucursalId }: Props) {
  const [cupones, setCupones] = useState<Cupon[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  function handleCopy(codigo: string) {
    navigator.clipboard.writeText(codigo);
    setCopied(codigo);
    setTimeout(() => setCopied(null), 1500);
  }

  function startEdit(c: Cupon) {
    setEditingId(c.id);
    setForm({
      codigo: c.codigo,
      descripcion: c.descripcion ?? "",
      tipo: c.tipo,
      valor: String(c.valor),
      usoMax: c.usoMax ? String(c.usoMax) : "",
      venceEn: c.venceEn ? new Date(c.venceEn).toISOString().slice(0, 10) : "",
      activo: c.activo,
    });
    setShowForm(true);
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setError("");
  }

  async function handleSubmit() {
    if (!form.codigo || !form.valor) {
      setError("Código y valor son requeridos");
      return;
    }
    setLoading(true);
    setError("");

    const payload = {
      codigo: form.codigo,
      descripcion: form.descripcion || null,
      tipo: form.tipo,
      valor: Number(form.valor),
      usoMax: form.usoMax ? Number(form.usoMax) : null,
      venceEn: form.venceEn || null,
      activo: form.activo,
      sucursalId,
    };

    try {
      const res = await fetch(
        editingId ? `/api/cupones/${editingId}` : "/api/cupones",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");

      if (editingId) {
        setCupones((prev) => prev.map((c) => (c.id === editingId ? data : c)));
      } else {
        setCupones((prev) => [data, ...prev]);
      }
      resetForm();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActivo(c: Cupon) {
    const res = await fetch(`/api/cupones/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !c.activo }),
    });
    if (res.ok) {
      const data = await res.json();
      setCupones((prev) => prev.map((x) => (x.id === c.id ? data : x)));
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar este cupón?")) return;
    const res = await fetch(`/api/cupones/${id}`, { method: "DELETE" });
    if (res.ok) setCupones((prev) => prev.filter((c) => c.id !== id));
  }

  const isExpired = (c: Cupon) => c.venceEn && new Date(c.venceEn) < new Date();
  const isExhausted = (c: Cupon) => c.usoMax !== null && c.usoActual >= c.usoMax;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-surface-text">Cupones de Descuento</h1>
          <p className="mt-0.5 text-sm text-surface-muted">Crea y gestiona códigos promocionales</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="btn-primary gap-2"
        >
          <Plus size={16} />
          Nuevo Cupón
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-surface-text">
              {editingId ? "Editar Cupón" : "Nuevo Cupón"}
            </h2>
            <button onClick={resetForm} className="rounded-lg p-1 text-surface-muted hover:bg-surface-bg">
              <X size={16} />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="label">Código *</label>
              <input
                className="input uppercase"
                placeholder="Ej: VERANO20"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label className="label">Tipo *</label>
              <select
                className="input"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value as "PORCENTAJE" | "MONTO_FIJO" })}
              >
                <option value="PORCENTAJE">Porcentaje (%)</option>
                <option value="MONTO_FIJO">Monto fijo ($)</option>
              </select>
            </div>
            <div>
              <label className="label">
                Valor * {form.tipo === "PORCENTAJE" ? "(%)" : "($)"}
              </label>
              <input
                className="input"
                type="number"
                min={0}
                max={form.tipo === "PORCENTAJE" ? 100 : undefined}
                placeholder={form.tipo === "PORCENTAJE" ? "Ej: 10" : "Ej: 5000"}
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Descripción</label>
              <input
                className="input"
                placeholder="Ej: Descuento verano"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Uso máximo (vacío = ilimitado)</label>
              <input
                className="input"
                type="number"
                min={1}
                placeholder="Ej: 100"
                value={form.usoMax}
                onChange={(e) => setForm({ ...form, usoMax: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Vence el (vacío = no expira)</label>
              <input
                className="input"
                type="date"
                value={form.venceEn}
                onChange={(e) => setForm({ ...form, venceEn: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              id="activo"
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              className="h-4 w-4 rounded border-surface-border accent-brand-500"
            />
            <label htmlFor="activo" className="text-sm text-surface-text">Activo</label>
          </div>

          {error && (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="mt-4 flex gap-2">
            <button onClick={handleSubmit} disabled={loading} className="btn-primary gap-2">
              <Check size={15} />
              {loading ? "Guardando..." : editingId ? "Guardar cambios" : "Crear Cupón"}
            </button>
            <button onClick={resetForm} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      )}

      {/* Lista */}
      {cupones.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-border py-16 text-surface-muted">
          <Tag size={32} className="mb-3 opacity-30" />
          <p className="text-sm font-semibold">Sin cupones creados</p>
          <p className="text-xs">Crea tu primer cupón de descuento</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cupones.map((c) => {
            const expired = isExpired(c);
            const exhausted = isExhausted(c);
            const inactive = !c.activo || expired || exhausted;

            return (
              <div
                key={c.id}
                className={`relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition-all ${
                  inactive ? "border-surface-border opacity-60" : "border-brand-200"
                }`}
              >
                {/* Badge estado */}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-black tracking-wider ${
                        inactive
                          ? "bg-surface-bg text-surface-muted"
                          : "bg-brand-100 text-brand-700"
                      }`}
                    >
                      {c.codigo}
                    </span>
                    {expired && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">Vencido</span>}
                    {exhausted && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">Agotado</span>}
                    {!c.activo && !expired && !exhausted && <span className="rounded-full bg-surface-bg px-2 py-0.5 text-[10px] font-bold text-surface-muted">Inactivo</span>}
                  </div>
                  <button
                    onClick={() => handleCopy(c.codigo)}
                    className="shrink-0 rounded-lg p-1.5 text-surface-muted hover:bg-surface-bg"
                    title="Copiar código"
                  >
                    {copied === c.codigo ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>

                {/* Valor destacado */}
                <p className="text-2xl font-black text-brand-500">
                  {c.tipo === "PORCENTAJE"
                    ? `${c.valor}% OFF`
                    : `${formatCurrency(Number(c.valor), "$")} OFF`}
                </p>
                {c.descripcion && (
                  <p className="mt-0.5 text-xs text-surface-muted">{c.descripcion}</p>
                )}

                {/* Stats */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-surface-muted">
                  <div>
                    <span className="font-semibold text-surface-text">{c.usoActual}</span>
                    {c.usoMax ? ` / ${c.usoMax}` : ""} usos
                  </div>
                  <div className="text-right">
                    {c.venceEn
                      ? `Vence: ${new Date(c.venceEn).toLocaleDateString("es-CL")}`
                      : "Sin vencimiento"}
                  </div>
                </div>

                {/* Acciones */}
                <div className="mt-3 flex items-center gap-1.5 border-t border-surface-border pt-3">
                  <button
                    onClick={() => toggleActivo(c)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-surface-muted hover:bg-surface-bg"
                  >
                    {c.activo
                      ? <ToggleRight size={16} className="text-brand-500" />
                      : <ToggleLeft size={16} />}
                    {c.activo ? "Activo" : "Inactivo"}
                  </button>
                  <button
                    onClick={() => startEdit(c)}
                    className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-surface-muted hover:bg-surface-bg"
                  >
                    <Pencil size={13} /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-50"
                  >
                    <Trash2 size={13} /> Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
