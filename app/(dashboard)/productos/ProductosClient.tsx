"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Edit2, Package, X, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Categoria { id: number; nombre: string; }
interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  precio: number;
  imagen: string | null;
  activo: boolean;
  enMenu: boolean;
  ivaActivo: boolean;
  categoriaId: number | null;
  categoria?: { id: number; nombre: string } | undefined;
}

interface Props {
  productos: Producto[];
  categorias: Categoria[];
  simbolo: string;
}

const emptyForm = {
  codigo: "", nombre: "", precio: "", categoriaId: "",
  ivaActivo: false, ivaPorc: "0", enMenu: true,
};

export function ProductosClient({ productos: initial, categorias, simbolo }: Props) {
  const router = useRouter();
  const [productos] = useState(initial);
  const [search, setSearch] = useState("");
  const [catFiltro, setCatFiltro] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filtrados = useMemo(() => {
    return productos.filter((p) => {
      const matchSearch = !search
        || p.nombre.toLowerCase().includes(search.toLowerCase())
        || p.codigo.toLowerCase().includes(search.toLowerCase());
      const matchCat = !catFiltro || p.categoriaId === catFiltro;
      return matchSearch && matchCat;
    });
  }, [productos, search, catFiltro]);

  function abrirFormNuevo() {
    setEditando(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function abrirFormEditar(p: Producto) {
    setEditando(p);
    setForm({
      codigo: p.codigo, nombre: p.nombre, precio: String(p.precio),
      categoriaId: p.categoriaId ? String(p.categoriaId) : "",
      ivaActivo: p.ivaActivo, ivaPorc: "0", enMenu: p.enMenu,
    });
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body = {
      ...(editando ? { id: editando.id } : {}),
      codigo: form.codigo,
      nombre: form.nombre,
      precio: Number(form.precio),
      categoriaId: form.categoriaId ? Number(form.categoriaId) : null,
      ivaActivo: form.ivaActivo,
      ivaPorc: Number(form.ivaPorc),
      enMenu: form.enMenu,
    };

    try {
      const res = await fetch("/api/productos", {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Error");
      }
      setShowForm(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Productos</h1>
          <p className="text-zinc-500 text-sm mt-1">{filtrados.length} producto{filtrados.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={abrirFormNuevo} className="btn-primary">
          <Plus size={16} />
          Nuevo Producto
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" placeholder="Buscar por nombre o código..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <select value={catFiltro ?? ""} onChange={(e) => setCatFiltro(e.target.value ? Number(e.target.value) : null)} className="input w-auto">
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Código</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Producto</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Categoría</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-500">Precio</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Package size={32} className="mx-auto text-zinc-200 mb-2" />
                    <p className="text-zinc-400">Sin productos</p>
                  </td>
                </tr>
              ) : (
                filtrados.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">{p.codigo}</td>
                    <td className="px-4 py-3 font-medium text-zinc-800">{p.nombre}</td>
                    <td className="px-4 py-3 text-zinc-500">{p.categoria?.nombre ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-zinc-900">
                      {formatCurrency(p.precio, simbolo)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                        p.enMenu ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-zinc-100 text-zinc-500 border-zinc-200"
                      }`}>{p.enMenu ? "En menú" : "Oculto"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => abrirFormEditar(p)}
                        className="p-1.5 text-zinc-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                        <Edit2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-end">
          <div className="bg-white h-full sm:h-auto sm:rounded-l-2xl w-full max-w-md shadow-2xl flex flex-col animate-slide-in">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h2 className="font-bold text-zinc-900">{editando ? "Editar Producto" : "Nuevo Producto"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Código *</label>
                  <input className="input" value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                    required placeholder="P001" />
                </div>
                <div>
                  <label className="label">Categoría</label>
                  <select className="input" value={form.categoriaId}
                    onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}>
                    <option value="">Sin categoría</option>
                    {categorias.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Nombre *</label>
                <input className="input" value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required placeholder="Nombre del producto" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Precio Venta *</label>
                  <input type="number" className="input" value={form.precio}
                    onChange={(e) => setForm({ ...form, precio: e.target.value })}
                    required min={0} step={0.01} />
                </div>
                <div>
                  <label className="label">IVA (%)</label>
                  <input type="number" className="input" value={form.ivaPorc}
                    onChange={(e) => setForm({ ...form, ivaPorc: e.target.value })}
                    min={0} max={100} />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                  <input type="checkbox" checked={form.enMenu}
                    onChange={(e) => setForm({ ...form, enMenu: e.target.checked })} className="rounded" />
                  Visible en menú
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                  <input type="checkbox" checked={form.ivaActivo}
                    onChange={(e) => setForm({ ...form, ivaActivo: e.target.checked })} className="rounded" />
                  Aplica IVA
                </label>
              </div>
            </form>

            <div className="p-5 border-t border-zinc-100 flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
              <button onClick={handleSubmit as unknown as React.MouseEventHandler} disabled={loading} className="btn-primary flex-1 justify-center">
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {editando ? "Guardar cambios" : "Crear producto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
