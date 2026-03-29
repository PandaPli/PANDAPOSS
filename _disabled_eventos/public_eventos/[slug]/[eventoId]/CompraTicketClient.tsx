"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Ticket, Download } from "lucide-react";

interface EventoInfo {
  id: number;
  nombre: string;
  precio: number;
  fechaFormateada: string;
  lugar: string | null;
}

interface Props {
  evento: EventoInfo;
}

const METODOS_PAGO = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TARJETA", label: "Tarjeta" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
];

interface TicketResult {
  id: number;
  clienteNombre: string;
  clienteEmail: string;
  estado: string;
  monto: number;
  qrDataUrl: string;
  creadoEn: string;
}

export function CompraTicketClient({ evento }: Props) {
  const [form, setForm] = useState({
    clienteNombre: "",
    clienteEmail: "",
    clienteTelefono: "",
    clienteRut: "",
    metodoPago: "EFECTIVO",
    referenciaPago: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState<TicketResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/eventos/${evento.id}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteNombre: form.clienteNombre,
          clienteEmail: form.clienteEmail,
          clienteTelefono: form.clienteTelefono || null,
          clienteRut: form.clienteRut || null,
          metodoPago: form.metodoPago,
          referenciaPago: form.referenciaPago || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al comprar ticket");
        return;
      }

      const data = await res.json();
      setTicket(data);
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  function downloadQR() {
    if (!ticket) return;
    const link = document.createElement("a");
    link.href = ticket.qrDataUrl;
    link.download = `ticket-${ticket.id}-${evento.nombre.replace(/\s+/g, "-")}.png`;
    link.click();
  }

  if (ticket) {
    return (
      <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-8 text-center text-white">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
            <Ticket size={32} className="text-white" />
          </div>
          <h2 className="mt-3 text-xl font-extrabold">Ticket Confirmado</h2>
          <p className="mt-1 text-sm text-emerald-100">{ticket.clienteNombre}</p>
        </div>

        <div className="p-6 text-center">
          <div className="mb-4 text-sm text-slate-500">
            <p className="font-semibold text-slate-700">{evento.nombre}</p>
            <p className="mt-0.5">{evento.fechaFormateada}</p>
            {evento.lugar && <p className="mt-0.5">{evento.lugar}</p>}
          </div>

          {/* QR Code */}
          <div className="mx-auto mb-4 flex w-fit justify-center rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <img src={ticket.qrDataUrl} alt="QR Ticket" className="h-48 w-48" />
          </div>

          <p className="text-xs text-slate-400">Muestra este código en la entrada del evento</p>

          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Email:</span>
              <span className="font-medium">{ticket.clienteEmail}</span>
            </div>
            <div className="mt-1 flex justify-between text-slate-600">
              <span>Total:</span>
              <span className="font-bold text-violet-700">{formatCurrency(Number(ticket.monto))}</span>
            </div>
            <div className="mt-1 flex justify-between text-slate-600">
              <span>Estado:</span>
              <span className={`font-bold ${ticket.estado === "PAGADO" ? "text-blue-600" : "text-amber-600"}`}>
                {ticket.estado === "PAGADO" ? "Pagado" : "Pendiente de pago"}
              </span>
            </div>
          </div>

          <button
            onClick={downloadQR}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-700 transition-colors"
          >
            <Download size={16} />
            Descargar QR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="font-bold text-slate-800">Comprar Ticket</h2>
        <p className="mt-0.5 text-sm text-slate-500">Completa tus datos para adquirir tu entrada.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Nombre completo *</label>
          <input
            value={form.clienteNombre}
            onChange={(e) => setForm({ ...form, clienteNombre: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
            placeholder="Tu nombre"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Email *</label>
          <input
            type="email"
            value={form.clienteEmail}
            onChange={(e) => setForm({ ...form, clienteEmail: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
            placeholder="tu@email.com"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Teléfono</label>
            <input
              type="tel"
              value={form.clienteTelefono}
              onChange={(e) => setForm({ ...form, clienteTelefono: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
              placeholder="+56 9 ..."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">RUT (opcional)</label>
            <input
              value={form.clienteRut}
              onChange={(e) => setForm({ ...form, clienteRut: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
              placeholder="12.345.678-9"
            />
          </div>
        </div>

        {/* Metodo de pago */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-slate-600">Método de pago *</label>
          <div className="grid grid-cols-3 gap-2">
            {METODOS_PAGO.map((mp) => (
              <label key={mp.value} className={`flex cursor-pointer items-center justify-center rounded-xl border-2 py-2.5 text-sm font-semibold transition-all ${form.metodoPago === mp.value ? "border-violet-500 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-500 hover:border-violet-300"}`}>
                <input
                  type="radio"
                  className="sr-only"
                  value={mp.value}
                  checked={form.metodoPago === mp.value}
                  onChange={() => setForm({ ...form, metodoPago: mp.value })}
                />
                {mp.label}
              </label>
            ))}
          </div>
        </div>

        {form.metodoPago === "TRANSFERENCIA" && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Referencia / comprobante</label>
            <input
              value={form.referenciaPago}
              onChange={(e) => setForm({ ...form, referenciaPago: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
              placeholder="Número de comprobante..."
            />
          </div>
        )}

        {/* Price summary */}
        <div className="rounded-xl bg-violet-50 px-4 py-3">
          <div className="flex justify-between text-sm font-bold text-violet-800">
            <span>Total a pagar</span>
            <span className="text-lg">{formatCurrency(evento.precio)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white shadow hover:bg-violet-700 disabled:opacity-60 transition-colors"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Procesando..." : "Confirmar compra"}
        </button>
      </form>
    </div>
  );
}
