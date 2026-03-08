import { prisma } from "@/lib/db";
import Link from "next/link";
import { Plus, Eye } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function getVentas() {
  return prisma.venta.findMany({
    take: 50,
    orderBy: { creadoEn: "desc" },
    include: {
      cliente: { select: { nombre: true } },
      usuario: { select: { nombre: true } },
      _count: { select: { detalles: true } },
    },
  });
}

const estadoBadge = {
  PAGADA: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDIENTE: "bg-amber-50 text-amber-700 border-amber-200",
  ANULADA: "bg-red-50 text-red-700 border-red-200",
};

const metodoPagoLabel: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
  CREDITO: "Crédito",
  MIXTO: "Mixto",
};

export default async function VentasPage() {
  const session = await getServerSession(authOptions);
  const simbolo = (session?.user as { simbolo?: string })?.simbolo ?? "$";
  const ventas = await getVentas();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Ventas</h1>
          <p className="text-zinc-500 text-sm mt-1">Historial de transacciones</p>
        </div>
        <Link href="/ventas/nueva" className="btn-primary">
          <Plus size={16} />
          Nueva Venta
        </Link>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left px-4 py-3 font-medium text-zinc-500">N°</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Vendedor</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Método</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Items</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-500">Total</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {ventas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-zinc-400">
                    Sin ventas registradas
                  </td>
                </tr>
              ) : (
                ventas.map((v) => (
                  <tr key={v.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-zinc-700">
                      {v.numero}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {formatDateTime(v.creadoEn)}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {v.cliente?.nombre ?? "Consumidor Final"}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{v.usuario.nombre}</td>
                    <td className="px-4 py-3 text-zinc-500">
                      {metodoPagoLabel[v.metodoPago] ?? v.metodoPago}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{v._count.detalles}</td>
                    <td className="px-4 py-3 text-right font-bold text-zinc-900">
                      {formatCurrency(Number(v.total), simbolo)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                          estadoBadge[v.estado] ?? ""
                        }`}
                      >
                        {v.estado === "PAGADA" ? "Pagada" : v.estado === "ANULADA" ? "Anulada" : "Pendiente"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
