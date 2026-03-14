import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ArrowLeft, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { createSlug } from "@/lib/slug";

interface Props {
  searchParams: Promise<{ sucursal?: string }>;
}

export default async function VerCartaPage({ searchParams }: Props) {
  const { sucursal } = await searchParams;

  // 1. Fetch available branches
  const sucursales = await prisma.sucursal.findMany({
    where: { activa: true },
    select: {
      id: true,
      nombre: true,
      direccion: true,
      telefono: true,
      logoUrl: true,
      simbolo: true,
      delivery: true, // Only show delivery active menus here per context
    },
    orderBy: [{ orden: "asc" }, { nombre: "asc" }],
  });

  if (sucursales.length === 0) {
    return (
      <main className="min-h-screen bg-[#f6f1e8] px-4 py-16 text-center">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-black/10 bg-white p-10 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Carta Online</p>
          <h1 className="mt-4 text-3xl font-black text-stone-900">No hay menús disponibles</h1>
        </div>
      </main>
    );
  }

  // 2. Determine which branch's menu to show
  // If no param is provided and there are multiple, show a selector.
  // If only 1 exists, auto-select it.
  const sucursalId = sucursal ? Number(sucursal) : (sucursales.length === 1 ? sucursales[0].id : null);

  if (!sucursalId) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f8e7cc_0%,#f4efe7_36%,#ebe8e1_100%)] px-4 py-16 text-stone-900">
        <div className="mx-auto max-w-xl">
          <div className="rounded-[2rem] border border-black/10 bg-white/90 p-8 shadow-[0_35px_100px_-60px_rgba(0,0,0,0.4)] backdrop-blur text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">Ver Carta</p>
            <h1 className="mt-4 text-3xl font-black text-stone-900">Selecciona el local</h1>
            <p className="mt-2 text-sm text-stone-600">Revisa los productos disponibles de cada una de nuestras sucursales.</p>
            <div className="mt-8 space-y-3 text-left">
              {sucursales.map((item) => (
                <Link
                  key={item.id}
                  href={`/pedir/vercarta?sucursal=${item.id}`}
                  className="block rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 transition hover:border-amber-300 hover:bg-white"
                >
                  <p className="font-bold text-stone-900">{item.nombre}</p>
                  <p className="mt-1 text-xs text-stone-500">{item.direccion ?? "Dirección por definir"}</p>
                </Link>
              ))}
            </div>
            <div className="mt-8">
              <Link href="/pedir" className="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 hover:text-stone-900 transition">
                <ArrowLeft size={16} /> Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const branch = sucursales.find((s) => s.id === sucursalId);
  if (!branch) notFound();

  // 3. Fetch products for the branch
  const categorias = await prisma.categoria.findMany({
    where: { activa: true },
    include: {
      productos: {
        where: {
          activo: true,
          enMenuQR: true, // Only items meant for digital sharing
          OR: [{ sucursalId }, { sucursalId: null }],
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
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Catálogo Online</p>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">{branch.nombre}</h1>
            <p className="mx-auto mt-4 max-w-md text-sm text-white/75">
              Revisa todos los productos que tenemos disponibles para ti. 
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/pedir" className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
                <ArrowLeft size={16} />
                Volver
              </Link>
              {branch.delivery && (
                <Link href={`/pedir/${createSlug(branch.nombre)}`} className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-5 py-3 text-sm font-bold text-stone-900 transition hover:bg-amber-300">
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
                  {categoria.productos.map((producto: any) => (
                    <article key={producto.id} className="flex gap-4 rounded-[1.5rem] border border-stone-200 bg-white p-4 shadow-sm transition hover:border-stone-300 hover:shadow-md">
                      {producto.imagen ? (
                        <img src={producto.imagen} alt={producto.nombre} className="h-24 w-24 rounded-2xl object-cover" />
                      ) : (
                        <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                          Sin foto
                        </div>
                      )}
                      <div className="min-w-0 flex-1 py-1">
                        <div className="flex flex-col justify-between h-full">
                          <div>
                            <p className="font-bold leading-tight text-stone-900">{producto.nombre}</p>
                            <p className="mt-1 line-clamp-2 text-xs text-stone-500 leading-relaxed">{producto.descripcion}</p>
                          </div>
                          <p className="mt-2 font-black text-stone-950">{formatCurrency(Number(producto.precio), branch.simbolo)}</p>
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
