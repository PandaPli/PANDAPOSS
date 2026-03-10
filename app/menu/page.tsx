import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  searchParams: Promise<{ sucursal?: string; mesa?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { sucursal } = await searchParams;
  const suc = sucursal ? await prisma.sucursal.findUnique({ where: { id: Number(sucursal) }, select: { nombre: true } }) : null;
  return { title: suc ? `Carta — ${suc.nombre}` : "Carta Digital" };
}

export default async function MenuPage({ searchParams }: Props) {
  const { sucursal: sucursalParam, mesa: mesaParam } = await searchParams;

  const sucursalId = sucursalParam ? Number(sucursalParam) : NaN;
  const mesaId     = mesaParam     ? Number(mesaParam)     : NaN;

  if (isNaN(sucursalId)) notFound();

  const [sucursal, mesa, categorias] = await Promise.all([
    prisma.sucursal.findUnique({
      where: { id: sucursalId, activa: true },
      select: { id: true, nombre: true, menuQR: true },
    }),
    !isNaN(mesaId)
      ? prisma.mesa.findUnique({ where: { id: mesaId }, select: { id: true, nombre: true } })
      : Promise.resolve(null),
    prisma.categoria.findMany({
      where: { activa: true },
      include: {
        productos: {
          where: { sucursalId, activo: true, stock: { gt: 0 } },
          select: { id: true, nombre: true, precio: true, descripcion: true, imagen: true },
          orderBy: { nombre: "asc" },
        },
      },
      orderBy: { nombre: "asc" },
    }),
  ]);

  if (!sucursal || !sucursal.menuQR) notFound();

  // Filtrar categorías con al menos 1 producto
  const cats = categorias.filter((c) => c.productos.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{sucursal.nombre}</h1>
            {mesa && (
              <p className="text-sm text-gray-500">Mesa: <span className="font-semibold">{mesa.nombre}</span></p>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">{sucursal.nombre.charAt(0)}</span>
          </div>
        </div>
      </header>

      {/* Categorías */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {cats.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">No hay productos disponibles</p>
          </div>
        ) : (
          cats.map((cat) => (
            <section key={cat.id}>
              <h2 className="text-base font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                {cat.nombre}
              </h2>
              <div className="space-y-3">
                {cat.productos.map((prod) => (
                  <div key={prod.id} className="bg-white rounded-xl shadow-sm p-4 flex gap-4">
                    {prod.imagen && (
                      <img
                        src={prod.imagen}
                        alt={prod.nombre}
                        className="w-20 h-20 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{prod.nombre}</p>
                      {prod.descripcion && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{prod.descripcion}</p>
                      )}
                      <p className="text-indigo-600 font-bold mt-1.5">
                        ${Number(prod.precio).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-gray-400">
        Carta digital — {sucursal.nombre}
      </footer>
    </div>
  );
}
