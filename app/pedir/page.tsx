import Link from "next/link";
import { prisma } from "@/lib/db";
import { createSlug } from "@/lib/slug";

interface Props {
  searchParams: Promise<{ sucursal?: string }>;
}

export default async function PedirPage({ searchParams }: Props) {
  const { sucursal } = await searchParams;
  const sucursalId = sucursal ? Number(sucursal) : undefined;

  const sucursales = await prisma.sucursal.findMany({
    where: { activa: true },
    select: {
      id: true,
      nombre: true,
      direccion: true,
      telefono: true,
      logoUrl: true,
      delivery: true,
      menuQR: true,
    },
    orderBy: [{ orden: "asc" }, { nombre: "asc" }],
  });

  const actual =
    sucursales.find((item) => item.id === sucursalId) ??
    sucursales.find((item) => item.delivery) ??
    sucursales[0] ??
    null;

  if (!actual) {
    return (
      <main className="min-h-screen bg-[#f6f1e8] px-4 py-16 text-center">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-black/10 bg-white p-10 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">PandaPoss Delivery</p>
          <h1 className="mt-4 text-3xl font-black text-stone-900">No hay sucursales publicadas</h1>
          <p className="mt-3 text-sm text-stone-600">Activa al menos una sucursal para mostrar el canal de pedido desde casa.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f8e7cc_0%,#f4efe7_36%,#ebe8e1_100%)] px-4 py-8 text-stone-900">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="overflow-hidden rounded-[2rem] border border-black/10 bg-[#111111] text-white shadow-[0_40px_120px_-55px_rgba(0,0,0,0.65)]">
            <div className="relative isolate overflow-hidden px-8 py-10 sm:px-10 sm:py-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,179,8,0.3),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.05),transparent_60%)]" />
              <div className="relative z-10 max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300">Pedir desde casa</p>
                <h1 className="mt-4 text-4xl font-black leading-none sm:text-5xl">{actual.nombre}</h1>
                <div className="mt-5 space-y-2 text-sm text-white/75">
                  {actual.direccion ? <p>Direccion: {actual.direccion}</p> : null}
                  {actual.telefono ? <p>Telefono: {actual.telefono}</p> : null}
                  <p>Horario: canal abierto para pedidos delivery y carta online.</p>
                </div>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={`/menu?sucursal=${actual.id}`}
                    className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-stone-900 transition hover:translate-y-[-1px]"
                  >
                    Ver menu
                  </Link>
                  <Link
                    href={`/pedir/${createSlug(actual.nombre)}`}
                    className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-amber-400 px-5 py-3 text-sm font-bold text-stone-900 transition hover:translate-y-[-1px] hover:bg-amber-300"
                  >
                    Pedir delivery
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_35px_100px_-60px_rgba(0,0,0,0.4)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">Sucursales</p>
            <div className="mt-4 space-y-3">
              {sucursales.map((item) => {
                const active = item.id === actual.id;
                return (
                  <Link
                    key={item.id}
                    href={`/pedir?sucursal=${item.id}`}
                    className={`block rounded-2xl border px-4 py-4 transition ${
                      active
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-200 bg-stone-50 text-stone-800 hover:border-stone-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{item.nombre}</p>
                        <p className={`mt-1 text-xs ${active ? "text-white/70" : "text-stone-500"}`}>{item.direccion ?? "Direccion por definir"}</p>
                      </div>
                      <div className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${item.delivery ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-500"}`}>
                        {item.delivery ? "Delivery" : "Sin delivery"}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

