import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { CalendarDays, MapPin, Users, Ticket } from "lucide-react";

export default async function EventosPublicosPage({ params }: { params: Promise<{ slug: string }> }) {
  // Find sucursal by id or nombre slug
  const { slug } = await params;
  const slugOrId = slug;
  const numId = parseInt(slugOrId);

  const sucursal = isNaN(numId)
    ? await prisma.sucursal.findFirst({
        where: { nombre: { contains: slugOrId }, activa: true },
      })
    : await prisma.sucursal.findFirst({
        where: { id: numId, activa: true },
      });

  if (!sucursal) notFound();

  const now = new Date();
  const eventos = await prisma.evento.findMany({
    where: {
      sucursalId: sucursal.id,
      activo: true,
      fecha: { gte: now },
    },
    include: {
      _count: { select: { tickets: true } },
    },
    orderBy: { fecha: "asc" },
  });

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-violet-700 to-indigo-700 px-6 py-12 text-center text-white">
        <h1 className="text-3xl font-extrabold">{sucursal.nombre}</h1>
        <p className="mt-2 text-lg text-white/80">Próximos eventos</p>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10">
        {eventos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CalendarDays size={64} className="text-violet-200" />
            <p className="mt-4 text-xl font-bold text-slate-400">Sin eventos próximos</p>
            <p className="mt-1 text-sm text-slate-300">Vuelve pronto para conocer los próximos eventos.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {eventos.map((ev) => {
              const vendidos = ev._count.tickets;
              const disponibles = ev.capacidad > 0 ? ev.capacidad - vendidos : null;
              const agotado = disponibles !== null && disponibles <= 0;

              return (
                <div key={ev.id} className={`overflow-hidden rounded-2xl bg-white shadow-md transition-all ${agotado ? "opacity-70" : "hover:shadow-lg hover:-translate-y-0.5"}`}>
                  <div className="flex flex-col sm:flex-row">
                    {ev.imagenUrl && (
                      <div className="sm:w-48 sm:shrink-0">
                        <img src={ev.imagenUrl} alt={ev.nombre} className="h-48 w-full object-cover sm:h-full" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        <h2 className="text-lg font-bold text-slate-800">{ev.nombre}</h2>
                        {ev.descripcion && <p className="mt-1 text-sm text-slate-500">{ev.descripcion}</p>}
                        <div className="mt-3 space-y-1 text-sm text-slate-500">
                          <div className="flex items-center gap-2">
                            <CalendarDays size={14} className="text-violet-500" />
                            <span>{formatDate(ev.fecha)}</span>
                          </div>
                          {ev.lugar && (
                            <div className="flex items-center gap-2">
                              <MapPin size={14} className="text-violet-500" />
                              <span>{ev.lugar}</span>
                            </div>
                          )}
                          {disponibles !== null && (
                            <div className="flex items-center gap-2">
                              <Users size={14} className="text-violet-500" />
                              <span>{agotado ? "Agotado" : `${disponibles} lugares disponibles`}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-2xl font-extrabold text-violet-700">
                          {Number(ev.precio) === 0 ? "Gratis" : formatCurrency(Number(ev.precio))}
                        </p>
                        {agotado ? (
                          <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-400">Agotado</span>
                        ) : (
                          <Link
                            href={`/eventos/${sucursal.id}/${ev.id}`}
                            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-violet-700 transition-colors"
                          >
                            <Ticket size={14} />
                            Comprar ticket
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
