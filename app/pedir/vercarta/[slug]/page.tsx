import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ArrowLeft, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { createSlug } from "@/lib/slug";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sucursales = await prisma.sucursal.findMany({
    where: { activa: true },
    select: { nombre: true },
  });
  const branch = sucursales.find((s) => createSlug(s.nombre) === slug);
  return { title: branch ? `Carta — ${branch.nombre}` : "Carta Digital" };
}

export default async function VerCartaSlugPage({ params }: Props) {
  const { slug } = await params;

  // Buscar todas las sucursales activas y encontrar la que coincide con el slug
  const sucursales = await prisma.sucursal.findMany({
    where: { activa: true },
    select: { id: true, nombre: true, direccion: true, logoUrl: true, simbolo: true, delivery: true },
  });

  const branch = sucursales.find((s) => createSlug(s.nombre) === slug);
  if (!branch) notFound();

  // Cargar categorías con productos visibles en menú QR de esta sucursal
  const categorias = await prisma.categoria.findMany({
    where: { activa: true },
    include: {
      productos: {
        where: {
          activo: true,
          enMenuQR: true,
          OR: [{ sucursalId: branch.id }, { sucursalId: null }],
        },
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          precio: true,
          imagen: true,
        },
        orderBy: { nombre: "asc" },
      },
    },
    orderBy: { nombre: "asc" },
  });

  const safeCategorias = categorias.filter((c) => c.productos.length > 0);

  return (
    <main className="min-h-screen bg-[#f4efe7] text-stone-900">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-[#111111] text-white shadow-[0_40px_120px_-65px_rgba(0,0,0,0.7)]">
          <div className="px-6 py-8 text-center sm:px-10 sm:py-12">
            {branch.logoUrl && (
              <img
                src={branch.logoUrl}
                alt={branch.nombre}
                className="mx-auto mb-4 h-16 w-16 rounded-2xl object-contain"
              />
            )}
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Catálogo Online</p>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">{branch.nombre}</h1>
            {branch.direccion && (
              <p className="mx-auto mt-2 max-w-md text-sm text-white/60">{branch.direccion}</p>
            )}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/pedir"
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                <ArrowLeft size={16} />
                Volver
              </Link>
              {branch.delivery && (
                <Link
                  href={`/pedir/${slug}`}
                  className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-5 py-3 text-sm font-bold text-stone-900 transition hover:bg-amber-300"
                >
                  Pedir Delivery
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-12 pb-12">
          {safeCategorias.length === 0 ? (
            <div className="py-12 text-center text-stone-500">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p>No hay productos disponibles en este menú actualmente.</p>
            </div>
          ) : (
            safeCategorias.map((categoria) => (
              <section key={categoria.id} className="scroll-mt-6">
                <h2 className="mb-6 text-2xl font-black text-stone-900">{categoria.nombre}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {categoria.productos.map((producto) => (
                    <article
                      key={producto.id}
                      className="flex gap-4 rounded-[1.5rem] border border-stone-200 bg-white p-4 shadow-sm transition hover:border-stone-300 hover:shadow-md"
                    >
                      {producto.imagen ? (
                        <img
                          src={producto.imagen}
                          alt={producto.nombre}
                          className="h-24 w-24 rounded-2xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                          Sin foto
                        </div>
                      )}
                      <div className="min-w-0 flex-1 py-1">
                        <div className="flex flex-col justify-between h-full">
                          <div>
                            <p className="font-bold leading-tight text-stone-900">{producto.nombre}</p>
                            {producto.descripcion && (
                              <p className="mt-1 line-clamp-2 text-xs text-stone-500 leading-relaxed">
                                {producto.descripcion}
                              </p>
                            )}
                          </div>
                          <p className="mt-2 font-black text-stone-950">
                            {formatCurrency(Number(producto.precio), branch.simbolo ?? "$")}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
