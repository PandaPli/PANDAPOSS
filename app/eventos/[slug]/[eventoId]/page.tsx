import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { CalendarDays, MapPin } from "lucide-react";
import { CompraTicketClient } from "./CompraTicketClient";

export default async function CompraTicketPage({ params }: { params: Promise<{ slug: string; eventoId: string }> }) {
  const { eventoId: eventoIdStr } = await params;
  const eventoId = parseInt(eventoIdStr);
  if (isNaN(eventoId)) notFound();

  const evento = await prisma.evento.findUnique({
    where: { id: eventoId, activo: true },
    include: {
      sucursal: { select: { id: true, nombre: true } },
      _count: { select: { tickets: true } },
    },
  });

  if (!evento) notFound();

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  const disponibles = evento.capacidad > 0 ? evento.capacidad - evento._count.tickets : null;
  const agotado = disponibles !== null && disponibles <= 0;

  const eventoPlain = {
    id: evento.id,
    nombre: evento.nombre,
    descripcion: evento.descripcion,
    fecha: evento.fecha.toISOString(),
    lugar: evento.lugar,
    precio: Number(evento.precio),
    imagenUrl: evento.imagenUrl,
    sucursalId: evento.sucursalId,
    fechaFormateada: formatDate(evento.fecha),
    disponibles,
    agotado,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-700 to-indigo-700 px-6 py-10">
        <div className="mx-auto max-w-xl">
          <p className="text-sm font-semibold text-violet-200">{evento.sucursal?.nombre}</p>
          <h1 className="mt-1 text-2xl font-extrabold text-white">{evento.nombre}</h1>
          <div className="mt-3 space-y-1 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <CalendarDays size={14} />
              <span>{eventoPlain.fechaFormateada}</span>
            </div>
            {evento.lugar && (
              <div className="flex items-center gap-2">
                <MapPin size={14} />
                <span>{evento.lugar}</span>
              </div>
            )}
          </div>
          <div className="mt-4 text-3xl font-extrabold text-white">
            {evento.precio.toString() === "0" ? "Gratis" : formatCurrency(Number(evento.precio))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-xl px-4 py-8">
        {agotado ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-md">
            <p className="text-xl font-bold text-slate-500">Este evento está agotado</p>
          </div>
        ) : (
          <CompraTicketClient evento={eventoPlain} />
        )}
      </div>
    </div>
  );
}
