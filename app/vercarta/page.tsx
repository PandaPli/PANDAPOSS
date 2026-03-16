import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import { createSlug } from "@/lib/slug";

interface Props {
  searchParams: Promise<{ sucursal?: string }>;
}

/**
 * /vercarta
 *
 * - Con un solo local → redirige directo a /vercarta/[slug]
 * - Con múltiples locales → muestra selector
 * - ?sucursal=ID (legacy) → redirige a /vercarta/[slug]
 */
export default async function VerCartaPage({ searchParams }: Props) {
  const { sucursal } = await searchParams;

  const sucursales = await prisma.sucursal.findMany({
    where: { activa: true },
    select: { id: true, nombre: true, direccion: true },
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

  // Legacy: ?sucursal=ID → redirigir a slug
  if (sucursal) {
    const found = sucursales.find((s) => String(s.id) === sucursal);
    if (found) redirect(`/vercarta/${createSlug(found.nombre)}`);
    notFound();
  }

  // Un solo local → redirigir directo
  if (sucursales.length === 1) {
    redirect(`/vercarta/${createSlug(sucursales[0].nombre)}`);
  }

  // Múltiples locales → selector
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
                href={`/vercarta/${createSlug(item.nombre)}`}
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
