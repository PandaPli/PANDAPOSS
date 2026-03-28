import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { CalendarDays, MapPin, ScanLine, ArrowLeft, Ticket } from "lucide-react";
import type { Rol } from "@/types";
import { TicketEstadoButton } from "./TicketEstadoButton";

export default async function EventoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const rol = (session.user as { rol: Rol }).rol;
  if (rol !== "ADMIN_GENERAL" && rol !== "RESTAURANTE") redirect("/panel");

  const { id } = await params;
  const eventoId = parseInt(id);
  if (isNaN(eventoId)) notFound();

  const evento = await prisma.evento.findUnique({
    where: { id: eventoId },
    include: {
      sucursal: { select: { id: true, nombre: true } },
      tickets: {
        include: {
          cliente: { select: { id: true, nombre: true, email: true } },
        },
        orderBy: { creadoEn: "desc" },
      },
    },
  });

  if (!evento) notFound();

  const estadoColors: Record<string, string> = {
    PENDIENTE_PAGO: "bg-amber-100 text-amber-700",
    PAGADO: "bg-blue-100 text-blue-700",
    VALIDADO: "bg-emerald-100 text-emerald-700",
    EXPIRADO: "bg-slate-100 text-slate-500",
  };

  const estadoLabels: Record<string, string> = {
    PENDIENTE_PAGO: "Pendiente",
    PAGADO: "Pagado",
    VALIDADO: "Validado",
    EXPIRADO: "Expirado",
  };

  const countByEstado = evento.tickets.reduce(
    (acc, t) => {
      acc[t.estado] = (acc[t.estado] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link href="/eventos" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm hover:bg-violet-50 transition-colors">
            <ArrowLeft size={18} className="text-slate-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-800">{evento.nombre}</h1>
            <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><CalendarDays size={12} />{formatDateTime(evento.fecha)}</span>
              {evento.lugar && <span className="flex items-center gap-1"><MapPin size={12} />{evento.lugar}</span>}
              <span className="font-semibold text-violet-600">{formatCurrency(Number(evento.precio))}</span>
            </div>
          </div>
          <Link
            href={`/eventos/${eventoId}/validar`}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <ScanLine size={16} />
            Escanear QR
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(estadoLabels).map(([estado, label]) => (
            <div key={estado} className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold text-slate-800">{countByEstado[estado] ?? 0}</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Tickets table */}
        {evento.tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-16 shadow-sm">
            <Ticket size={48} className="text-violet-200" />
            <p className="mt-4 text-lg font-bold text-slate-400">Sin tickets vendidos</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Pago</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3 text-left">Creado</th>
                  <th className="px-4 py-3 text-left">Validado</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {evento.tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-violet-50/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{ticket.clienteNombre}</td>
                    <td className="px-4 py-3 text-slate-500">{ticket.clienteEmail}</td>
                    <td className="px-4 py-3 text-slate-500 capitalize">{ticket.metodoPago.toLowerCase()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${estadoColors[ticket.estado] ?? "bg-slate-100 text-slate-500"}`}>
                        {estadoLabels[ticket.estado] ?? ticket.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(Number(ticket.monto))}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{formatDateTime(ticket.creadoEn)}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {ticket.validadoEn ? formatDateTime(ticket.validadoEn) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <TicketEstadoButton token={ticket.token} currentEstado={ticket.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
