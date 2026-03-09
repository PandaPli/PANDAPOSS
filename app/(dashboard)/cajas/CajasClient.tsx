"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet, DoorOpen, DoorClosed, Plus, Loader2, X,
  TrendingUp, TrendingDown, Minus, Clock,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Caja {
  id: number;
  nombre: string;
  estado: "ABIERTA" | "CERRADA";
  saldoInicio: number;
  usuarioId: number | null;
  abiertaEn: string | null;
  cerradaEn: string | null;
  usuario: { nombre: string } | null;
  sucursal: { nombre: string } | null;
}

interface Props {
  cajas: Caja[];
  simbolo: string;
}

export function CajasClient({ cajas: initial, simbolo }: Props) {
  const router = useRouter();
  const [cajas, setCajas] = useState(initial);
  const [loading, setLoading] = useState<number | null>(null);
  const [modal, setModal] = useState<{ type: "abrir" | "cerrar" | "nueva"; cajaId?: number } | null>(null);
  const [saldoInicio, setSaldoInicio] = useState("");
  const [saldoFinal, setSaldoFinal] = useState("");
  const [observacion, setObservacion] = useState("");
  const [nombreNueva, setNombreNueva] = useState("");
  const [result, setResult] = useState<{ totalVentas: number; diferencia: number } | null>(null);
  const [error, setError] = useState("");

  async function abrirCaja() {
    if (!modal || modal.type !== "abrir" || !modal.cajaId) return;
    const cajaId = modal.cajaId;
    setLoading(cajaId);
    setError("");
    try {
      const res = await fetch(`/api/cajas/${cajaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "abrir", saldoInicio: Number(saldoInicio) || 0 }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Error al abrir la caja");
      }
      const cajaActualizada = await res.json();
      // Actualizar estado local inmediatamente (sin esperar router.refresh)
      setCajas((prev) =>
        prev.map((c) =>
          c.id === cajaId
            ? { ...c, estado: "ABIERTA", saldoInicio: Number(saldoInicio) || 0, abiertaEn: cajaActualizada.abiertaEn }
            : c
        )
      );
      setModal(null);
      setSaldoInicio("");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  async function cerrarCaja() {
    if (!modal || modal.type !== "cerrar" || !modal.cajaId) return;
    const cajaId = modal.cajaId;
    setLoading(cajaId);
    setError("");
    try {
      const res = await fetch(`/api/cajas/${cajaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cerrar",
          saldoFinal: Number(saldoFinal) || 0,
          observacion: observacion || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Error al cerrar la caja");
      }
      const data = await res.json();
      // Actualizar estado local inmediatamente
      setCajas((prev) =>
        prev.map((c) =>
          c.id === cajaId
            ? { ...c, estado: "CERRADA", cerradaEn: data.cerradaEn, usuario: null }
            : c
        )
      );
      setResult({ totalVentas: data.totalVentas, diferencia: data.diferencia });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  async function crearCaja() {
    if (!nombreNueva.trim()) return;
    setLoading(-1);
    setError("");
    try {
      const res = await fetch("/api/cajas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombreNueva }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Error al crear la caja");
      }
      const nueva = await res.json();
      setCajas((prev) => [...prev, { ...nueva, usuario: null, sucursal: null }]);
      setModal(null);
      setNombreNueva("");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  function cerrarModal() {
    setModal(null);
    setSaldoInicio("");
    setSaldoFinal("");
    setObservacion("");
    setResult(null);
    setError("");
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Cajas</h1>
          <p className="text-zinc-500 text-sm mt-1">Gestión de cajas y arqueos</p>
        </div>
        <button onClick={() => setModal({ type: "nueva" })} className="btn-primary">
          <Plus size={16} />
          Nueva Caja
        </button>
      </div>

      {/* Grid de cajas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cajas.map((caja) => (
          <div key={caja.id} className={`card p-5 ${caja.estado === "ABIERTA" ? "border-emerald-200 bg-emerald-50/30" : ""}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-zinc-900">{caja.nombre}</h3>
                <p className="text-xs text-zinc-400">{caja.sucursal?.nombre}</p>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                  caja.estado === "ABIERTA"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-zinc-100 text-zinc-500 border-zinc-200"
                }`}
              >
                {caja.estado === "ABIERTA" ? <DoorOpen size={12} /> : <DoorClosed size={12} />}
                {caja.estado === "ABIERTA" ? "Abierta" : "Cerrada"}
              </span>
            </div>

            {caja.estado === "ABIERTA" && (
              <div className="space-y-1 mb-3 text-sm">
                <p className="text-zinc-600">
                  <span className="text-zinc-400">Cajero:</span> {caja.usuario?.nombre ?? "—"}
                </p>
                <p className="text-zinc-600 flex items-center gap-1">
                  <Clock size={12} className="text-zinc-400" />
                  Abierta: {caja.abiertaEn ? new Date(caja.abiertaEn).toLocaleString("es-CL") : "—"}
                </p>
                <p className="text-zinc-600">
                  <span className="text-zinc-400">Saldo inicio:</span>{" "}
                  <span className="font-semibold">{formatCurrency(caja.saldoInicio, simbolo)}</span>
                </p>
              </div>
            )}

            <button
              onClick={() => {
                setError("");
                if (caja.estado === "CERRADA") {
                  setModal({ type: "abrir", cajaId: caja.id });
                } else {
                  setModal({ type: "cerrar", cajaId: caja.id });
                }
              }}
              className={`w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                caja.estado === "CERRADA"
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              {caja.estado === "CERRADA" ? (
                <><DoorOpen size={15} /> Abrir Caja</>
              ) : (
                <><DoorClosed size={15} /> Cerrar Caja</>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Modales */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h2 className="font-bold text-zinc-900 flex items-center gap-2">
                <Wallet size={18} className="text-brand-600" />
                {modal.type === "abrir" && "Abrir Caja"}
                {modal.type === "cerrar" && (result ? "Resumen de Cierre" : "Cerrar Caja")}
                {modal.type === "nueva" && "Nueva Caja"}
              </h2>
              <button onClick={cerrarModal} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
              )}

              {modal.type === "nueva" && (
                <>
                  <div>
                    <label className="label">Nombre de la Caja *</label>
                    <input
                      className="input"
                      value={nombreNueva}
                      onChange={(e) => setNombreNueva(e.target.value)}
                      placeholder="Ej: Caja 2"
                      required
                    />
                  </div>
                  <button onClick={crearCaja} disabled={loading === -1} className="btn-primary w-full justify-center">
                    {loading === -1 ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    Crear Caja
                  </button>
                </>
              )}

              {modal.type === "abrir" && (
                <>
                  <div>
                    <label className="label">Saldo Inicial</label>
                    <input
                      type="number"
                      className="input"
                      value={saldoInicio}
                      onChange={(e) => setSaldoInicio(e.target.value)}
                      placeholder="0"
                      min={0}
                      step={0.01}
                    />
                    <p className="text-xs text-zinc-400 mt-1">Dinero en efectivo al momento de abrir</p>
                  </div>
                  <button
                    onClick={abrirCaja}
                    disabled={loading !== null}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <DoorOpen size={16} />}
                    Confirmar Apertura
                  </button>
                </>
              )}

              {modal.type === "cerrar" && !result && (
                <>
                  <div>
                    <label className="label">Saldo Final (conteo en caja)</label>
                    <input
                      type="number"
                      className="input"
                      value={saldoFinal}
                      onChange={(e) => setSaldoFinal(e.target.value)}
                      placeholder="0"
                      min={0}
                      step={0.01}
                    />
                  </div>
                  <div>
                    <label className="label">Observaciones</label>
                    <textarea
                      className="input min-h-20"
                      value={observacion}
                      onChange={(e) => setObservacion(e.target.value)}
                      placeholder="Notas sobre el cierre..."
                    />
                  </div>
                  <button
                    onClick={cerrarCaja}
                    disabled={loading !== null}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <DoorClosed size={16} />}
                    Confirmar Cierre
                  </button>
                </>
              )}

              {modal.type === "cerrar" && result && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-zinc-100">
                    <span className="text-zinc-500 text-sm">Total Ventas</span>
                    <span className="font-semibold text-zinc-900 flex items-center gap-1">
                      <TrendingUp size={14} className="text-emerald-500" />
                      {formatCurrency(result.totalVentas, simbolo)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-zinc-100">
                    <span className="text-zinc-500 text-sm">Saldo Final</span>
                    <span className="font-semibold text-zinc-900">
                      {formatCurrency(Number(saldoFinal), simbolo)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-zinc-500 text-sm">Diferencia</span>
                    <span
                      className={`font-bold flex items-center gap-1 ${
                        result.diferencia > 0 ? "text-emerald-600" : result.diferencia < 0 ? "text-red-600" : "text-zinc-600"
                      }`}
                    >
                      {result.diferencia > 0 ? <TrendingUp size={14} /> : result.diferencia < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                      {formatCurrency(Math.abs(result.diferencia), simbolo)}
                      {result.diferencia > 0 ? " sobrante" : result.diferencia < 0 ? " faltante" : " exacto"}
                    </span>
                  </div>
                  <button onClick={() => { cerrarModal(); router.refresh(); }} className="btn-primary w-full justify-center mt-4">
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
