"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet, DoorOpen, DoorClosed, Plus, Loader2, X,
  TrendingUp, TrendingDown, Minus, Clock, Banknote, CreditCard, Receipt, FileWarning, ArrowLeftRight, History, Shuffle
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

interface ArqueoHistorial {
  id: number;
  abiertaEn: string;
  cerradaEn: string | null;
  saldoInicio: number;
  saldoFinal: number | null;
  totalVentas: number | null;
  diferencia: number | null;
  observacion: string | null;
  cajero: string;
}

interface Props {
  cajas: Caja[];
  simbolo: string;
  meseroNombre: string;
  canCreate: boolean;
}

export function CajasClient({ cajas: initial, simbolo, meseroNombre, canCreate }: Props) {
  const router = useRouter();
  const [cajas, setCajas] = useState(initial);
  const [loading, setLoading] = useState<number | null>(null);
  const [modal, setModal] = useState<{ type: "abrir" | "cerrar" | "nueva" | "movimiento" | "historial"; cajaId?: number } | null>(null);
  const [resumenZ, setResumenZ] = useState<any>(null);
  const [saldoInicio, setSaldoInicio] = useState("");
  const [saldoFinal, setSaldoFinal] = useState("");
  const [observacion, setObservacion] = useState("");
  const [nombreNueva, setNombreNueva] = useState("");
  const [result, setResult] = useState<{ totalVentas: number; diferencia: number } | null>(null);
  const [error, setError] = useState("");

  // Estado para movimientos
  const [tipoMovimiento, setTipoMovimiento] = useState<"INGRESO" | "RETIRO">("RETIRO");
  const [montoMovimiento, setMontoMovimiento] = useState("");
  const [motivoMovimiento, setMotivoMovimiento] = useState("");

  // Bug 6: Historial de arqueos
  const [historialData, setHistorialData] = useState<ArqueoHistorial[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // Bug 8: Confirmación antes de cerrar
  const [confirmCierre, setConfirmCierre] = useState(false);

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
      // Bug 5 fix: incluir nombre del cajero en el optimistic update
      setCajas((prev) =>
        prev.map((c) =>
          c.id === cajaId
            ? { ...c, estado: "ABIERTA", saldoInicio: Number(saldoInicio) || 0, abiertaEn: cajaActualizada.abiertaEn, usuario: { nombre: meseroNombre } }
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

  async function clickCerrar(cajaId: number) {
    setError("");
    setLoading(cajaId);
    try {
      const res = await fetch(`/api/cajas/${cajaId}/resumen`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "No se pudo obtener el reporte la caja");
      }
      const data = await res.json();
      setResumenZ(data);
      setConfirmCierre(false);
      setModal({ type: "cerrar", cajaId });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  async function crearMovimiento() {
    if (!modal?.cajaId || !montoMovimiento || !motivoMovimiento) return;
    setLoading(modal.cajaId);
    setError("");
    try {
      const res = await fetch(`/api/cajas/${modal.cajaId}/movimiento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: tipoMovimiento,
          monto: Number(montoMovimiento),
          motivo: motivoMovimiento
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Error al registrar el movimiento");
      }
      cerrarModal();
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  // Bug 6: cargar historial de arqueos
  async function clickHistorial(cajaId: number) {
    setError("");
    setLoadingHistorial(true);
    setHistorialData([]);
    setModal({ type: "historial", cajaId });
    try {
      const res = await fetch(`/api/cajas/${cajaId}/arqueos`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "No se pudo obtener el historial");
      }
      const data = await res.json();
      setHistorialData(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingHistorial(false);
    }
  }

  function cerrarModal() {
    setModal(null);
    setResumenZ(null);
    setSaldoInicio("");
    setSaldoFinal("");
    setObservacion("");
    setMontoMovimiento("");
    setMotivoMovimiento("");
    setResult(null);
    setError("");
    setConfirmCierre(false);
    setHistorialData([]);
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-text">Cajas</h1>
          <p className="text-surface-muted text-sm mt-1">Gestión de cajas y arqueos</p>
        </div>
        {/* Bug 9: solo ADMIN_GENERAL y RESTAURANTE pueden crear cajas */}
        {canCreate && (
          <button onClick={() => setModal({ type: "nueva" })} className="btn-primary">
            <Plus size={16} />
            Nueva Caja
          </button>
        )}
      </div>

      {/* Grid de cajas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cajas.map((caja) => (
          <div key={caja.id} className={`card p-5 ${caja.estado === "ABIERTA" ? "border-emerald-200 bg-emerald-50/30" : ""}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-surface-text">{caja.nombre}</h3>
                <p className="text-xs text-surface-muted">{caja.sucursal?.nombre}</p>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                  caja.estado === "ABIERTA"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-surface-bg text-surface-muted border-surface-border"
                }`}
              >
                {caja.estado === "ABIERTA" ? <DoorOpen size={12} /> : <DoorClosed size={12} />}
                {caja.estado === "ABIERTA" ? "Abierta" : "Cerrada"}
              </span>
            </div>

            {caja.estado === "ABIERTA" && (
              <div className="space-y-1 mb-3 text-sm">
                <p className="text-surface-text">
                  <span className="text-surface-muted">Cajero:</span> {caja.usuario?.nombre ?? "—"}
                </p>
                <p className="text-surface-text flex items-center gap-1">
                  <Clock size={12} className="text-surface-muted" />
                  Abierta: {caja.abiertaEn ? new Date(caja.abiertaEn).toLocaleString("es-CL") : "—"}
                </p>
                <p className="text-surface-text">
                  <span className="text-surface-muted">Saldo inicio:</span>{" "}
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
                  clickCerrar(caja.id);
                }
              }}
              disabled={loading === caja.id}
              className={`w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                caja.estado === "CERRADA"
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              {caja.estado === "CERRADA" ? (
                <><DoorOpen size={15} /> Abrir Caja</>
              ) : (
                <><DoorClosed size={15} /> Cerrar Caja / Reporte</>
              )}
            </button>
            {caja.estado === "ABIERTA" && (
              <button
                onClick={() => {
                  setError("");
                  setModal({ type: "movimiento", cajaId: caja.id });
                }}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium bg-surface-bg text-surface-text border border-surface-border hover:bg-surface-hover transition-colors"
                title="Añadir o retirar dinero de esta caja"
              >
                <ArrowLeftRight size={14} /> Movimientos Extras
              </button>
            )}
            {/* Bug 6: Ver historial de turnos */}
            <button
              onClick={() => clickHistorial(caja.id)}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium bg-surface-bg text-surface-muted border border-surface-border hover:bg-surface-hover hover:text-surface-text transition-colors"
              title="Ver historial de turnos anteriores"
            >
              <History size={14} /> Ver Historial
            </button>
          </div>
        ))}
      </div>

      {/* Modales */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[95vh]">
            <div className="flex items-center justify-between p-5 border-b border-surface-border shrink-0">
              <h2 className="font-bold text-surface-text flex items-center gap-2">
                <Wallet size={18} className="text-brand-600" />
                {modal.type === "abrir" && "Abrir Caja"}
                {modal.type === "cerrar" && (result ? "Resumen de Cierre" : "Cerrar Caja")}
                {modal.type === "nueva" && "Nueva Caja"}
                {modal.type === "movimiento" && "Registrar Movimiento"}
                {modal.type === "historial" && "Historial de Turnos"}
              </h2>
              <button onClick={cerrarModal} className="p-2 text-surface-muted hover:text-surface-text hover:bg-surface-bg rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
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
                    <p className="text-xs text-surface-muted mt-1">Dinero en efectivo al momento de abrir</p>
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

              {modal.type === "movimiento" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 bg-surface-bg p-1 rounded-lg">
                    <button
                      onClick={() => setTipoMovimiento("RETIRO")}
                      className={`py-2 text-sm font-medium rounded-md transition-all ${
                        tipoMovimiento === "RETIRO"
                          ? "bg-white shadow-sm text-surface-text border border-surface-border"
                          : "text-surface-muted hover:text-surface-text"
                      }`}
                    >
                      Sacar Dinero
                    </button>
                    <button
                      onClick={() => setTipoMovimiento("INGRESO")}
                      className={`py-2 text-sm font-medium rounded-md transition-all ${
                        tipoMovimiento === "INGRESO"
                          ? "bg-white shadow-sm text-surface-text border border-surface-border"
                          : "text-surface-muted hover:text-surface-text"
                      }`}
                    >
                      Añadir Efectivo
                    </button>
                  </div>

                  <div>
                    <label className="label">Monto ({simbolo})</label>
                    <input
                      type="number"
                      className="input"
                      value={montoMovimiento}
                      onChange={(e) => setMontoMovimiento(e.target.value)}
                      placeholder="0"
                      min={1}
                      step={0.01}
                    />
                  </div>

                  <div>
                    <label className="label">Motivo u Observación</label>
                    <input
                      type="text"
                      className="input"
                      value={motivoMovimiento}
                      onChange={(e) => setMotivoMovimiento(e.target.value)}
                      placeholder={tipoMovimiento === "RETIRO" ? "Ej: Pago de hielo, proveedor..." : "Ej: Sencillo prestado"}
                    />
                  </div>

                  <button
                    onClick={crearMovimiento}
                    disabled={loading !== null || !montoMovimiento || !motivoMovimiento}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors disabled:opacity-60 mt-2"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowLeftRight size={16} />}
                    Grabar Transacción
                  </button>
                </div>
              )}

              {/* Bug 6: Modal historial de arqueos */}
              {modal.type === "historial" && (
                <div className="space-y-3">
                  {loadingHistorial ? (
                    <div className="flex items-center justify-center py-10 text-surface-muted">
                      <Loader2 size={20} className="animate-spin mr-2" /> Cargando turnos...
                    </div>
                  ) : historialData.length === 0 ? (
                    <div className="text-center py-10 text-surface-muted text-sm">
                      <History size={32} className="mx-auto mb-2 opacity-30" />
                      No hay turnos registrados aún
                    </div>
                  ) : (
                    historialData.map((a) => (
                      <div key={a.id} className="border border-surface-border rounded-xl p-3 bg-surface-bg space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-surface-text">{a.cajero}</span>
                          {a.cerradaEn ? (
                            <span className="text-[10px] bg-surface-border text-surface-muted px-2 py-0.5 rounded-full">Cerrado</span>
                          ) : (
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Abierto</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-surface-muted">
                          <span>
                            <Clock size={11} className="inline mr-0.5" />
                            {new Date(a.abiertaEn).toLocaleString("es-CL")}
                          </span>
                          {a.cerradaEn && (
                            <span>→ {new Date(a.cerradaEn).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <div>
                            <p className="text-[10px] text-surface-muted">Fondo inicio</p>
                            <p className="font-semibold text-surface-text">{formatCurrency(a.saldoInicio, simbolo)}</p>
                          </div>
                          {a.totalVentas !== null && (
                            <div>
                              <p className="text-[10px] text-surface-muted">Total ventas</p>
                              <p className="font-semibold text-emerald-600">{formatCurrency(a.totalVentas, simbolo)}</p>
                            </div>
                          )}
                          {a.diferencia !== null && (
                            <div>
                              <p className="text-[10px] text-surface-muted">Diferencia</p>
                              <p className={`font-semibold ${a.diferencia > 0 ? "text-emerald-600" : a.diferencia < 0 ? "text-red-600" : "text-surface-muted"}`}>
                                {a.diferencia > 0 ? "+" : ""}{formatCurrency(a.diferencia, simbolo)}
                              </p>
                            </div>
                          )}
                        </div>
                        {a.observacion && (
                          <p className="text-xs text-surface-muted italic border-t border-surface-border pt-1.5">"{a.observacion}"</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {modal.type === "cerrar" && !result && resumenZ && (
                <>
                  <div className="bg-surface-bg p-4 rounded-xl space-y-3 mb-4 text-sm border border-surface-border">
                     <h3 className="font-semibold text-surface-text flex items-center gap-2 border-b border-surface-border pb-2">
                       <Receipt size={16} className="text-brand-500" /> Reporte de Turno (Z-Out)
                     </h3>

                     <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="p-2 bg-white rounded-lg border border-surface-border">
                           <p className="text-xs text-surface-muted">Ventas Globales</p>
                           <p className="font-bold text-brand-600">{formatCurrency(resumenZ.ventasTotales, simbolo)}</p>
                           <p className="text-[10px] text-surface-muted mt-0.5">{resumenZ.transaccionesTotales} Tx</p>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-surface-border flex flex-col justify-between">
                           <p className="text-xs text-surface-muted">Efectivo Ingresado</p>
                           <p className="font-bold text-emerald-600">{formatCurrency(resumenZ.desgloseMediosDePago.EFECTIVO.dinero, simbolo)}</p>
                        </div>
                     </div>

                     <div className="space-y-1.5 pt-2">
                        <div className="flex items-center justify-between text-xs text-surface-text">
                           <span className="flex items-center gap-1.5"><CreditCard size={13} className="text-indigo-500"/> Tarjeta / Banco</span>
                           <span className="font-medium">{formatCurrency(resumenZ.desgloseMediosDePago.TARJETA.dinero + resumenZ.desgloseMediosDePago.TRANSFERENCIA.dinero, simbolo)}</span>
                        </div>
                        {/* Bug 7: mostrar CRÉDITO si hubo ventas con ese método */}
                        {resumenZ.desgloseMediosDePago.CREDITO?.dinero > 0 && (
                          <div className="flex items-center justify-between text-xs text-surface-text">
                            <span className="flex items-center gap-1.5"><Receipt size={13} className="text-purple-500"/> Crédito / Cuenta</span>
                            <span className="font-medium">{formatCurrency(resumenZ.desgloseMediosDePago.CREDITO.dinero, simbolo)}</span>
                          </div>
                        )}
                        {/* Bug 7: mostrar MIXTO si hubo ventas con ese método */}
                        {resumenZ.desgloseMediosDePago.MIXTO?.dinero > 0 && (
                          <div className="flex items-center justify-between text-xs text-surface-text">
                            <span className="flex items-center gap-1.5"><Shuffle size={13} className="text-orange-500"/> Pago Mixto</span>
                            <span className="font-medium">{formatCurrency(resumenZ.desgloseMediosDePago.MIXTO.dinero, simbolo)}</span>
                          </div>
                        )}
                        {resumenZ.anulaciones.cantidad > 0 && (
                          <div className="flex items-center justify-between text-xs text-red-500">
                             <span className="flex items-center gap-1.5"><FileWarning size={13} /> Anulaciones ({resumenZ.anulaciones.cantidad})</span>
                             <span className="font-medium">{formatCurrency(resumenZ.anulaciones.dinero, simbolo)}</span>
                          </div>
                        )}
                        {resumenZ.movimientos.retirosCantidad > 0 && (
                          <div className="flex items-center justify-between text-xs text-red-600 font-medium">
                             <span className="flex items-center gap-1.5"><ArrowLeftRight size={13}/> Dinero Extraído ({resumenZ.movimientos.retirosCantidad})</span>
                             <span>- {formatCurrency(resumenZ.movimientos.retiros, simbolo)}</span>
                          </div>
                        )}
                        {resumenZ.movimientos.ingresosCantidad > 0 && (
                          <div className="flex items-center justify-between text-xs text-emerald-600 font-medium">
                             <span className="flex items-center gap-1.5"><ArrowLeftRight size={13}/> Efectivo Agregado ({resumenZ.movimientos.ingresosCantidad})</span>
                             <span>+ {formatCurrency(resumenZ.movimientos.ingresos, simbolo)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-surface-text pt-1.5 border-t border-surface-border">
                           <span className="flex items-center gap-1.5 font-medium text-surface-text-muted"><Wallet size={13}/> Fondo de Apertura</span>
                           <span className="font-medium text-surface-text">{formatCurrency(resumenZ.saldoApertura, simbolo)}</span>
                        </div>
                     </div>
                  </div>

                  <div className="bg-emerald-50 p-4 border border-emerald-200 rounded-xl mb-4">
                     <p className="text-xs text-emerald-800 font-medium mb-1 flex items-center gap-1">
                       <Banknote size={14} /> Efectivo Teórico en Gaveta
                     </p>
                     <p className="text-2xl font-black text-emerald-700 tracking-tight">
                       {formatCurrency(resumenZ.fisicoTeorico, simbolo)}
                     </p>
                     <p className="text-[11px] text-emerald-600 mt-1">Este monto incluye el fondo de apertura + efectivo recibido. No incluye Tarjetas ni Transferencias.</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="label text-surface-text">¿Cuánto Dinero Físico Hay?</label>
                      <input
                        type="number"
                        className="input text-lg font-semibold bg-white"
                        value={saldoFinal}
                        onChange={(e) => setSaldoFinal(e.target.value)}
                        placeholder="Ingresa la cantidad billetes contados..."
                        min={0}
                        step={0.01}
                      />
                    </div>
                    <div>
                      <label className="label">Observaciones de Cierre</label>
                      <textarea
                        className="input min-h-20"
                        value={observacion}
                        onChange={(e) => setObservacion(e.target.value)}
                        placeholder="Justificación de gastos, faltantes, etc..."
                      />
                    </div>
                  </div>

                  {/* Bug 8: Confirmación antes de liquidar el turno */}
                  <label className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer select-none mt-2">
                    <input
                      type="checkbox"
                      checked={confirmCierre}
                      onChange={(e) => setConfirmCierre(e.target.checked)}
                      className="mt-0.5 accent-amber-600 w-4 h-4 shrink-0"
                    />
                    <span className="text-xs text-amber-800 font-medium leading-relaxed">
                      Confirmo que ya conté el dinero físico y que esta acción cerrará el turno de forma definitiva.
                    </span>
                  </label>

                  <button
                    onClick={cerrarCaja}
                    disabled={loading !== null || !saldoFinal || !confirmCierre}
                    className="w-full flex items-center justify-center gap-2 py-3 mt-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <DoorClosed size={16} />}
                    Liquidación de Turno
                  </button>
                </>
              )}

              {modal.type === "cerrar" && result && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-surface-border">
                    <span className="text-surface-muted text-sm">Total Ventas</span>
                    <span className="font-semibold text-surface-text flex items-center gap-1">
                      <TrendingUp size={14} className="text-emerald-500" />
                      {formatCurrency(result.totalVentas, simbolo)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-surface-border">
                    <span className="text-surface-muted text-sm">Saldo Final</span>
                    <span className="font-semibold text-surface-text">
                      {formatCurrency(Number(saldoFinal), simbolo)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-surface-muted text-sm">Diferencia</span>
                    <span
                      className={`font-bold flex items-center gap-1 ${
                        result.diferencia > 0 ? "text-emerald-600" : result.diferencia < 0 ? "text-red-600" : "text-surface-muted"
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
