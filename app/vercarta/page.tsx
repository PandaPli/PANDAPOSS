import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ArrowLeft, ChevronRight, MapPin, UtensilsCrossed } from "lucide-react";
import { createSlug } from "@/lib/slug";

interface Props {
  searchParams: Promise<{ sucursal?: string }>;
}

/**
 * /vercarta
 * - 1 sucursal  → redirect directo a /vercarta/[slug]
 * - N sucursales → selector
 * - ?sucursal=ID (legacy) → redirect a /vercarta/[slug]
 */
export default async function VerCartaPage({ searchParams }: Props) {
  const { sucursal } = await searchParams;

  const sucursales = await prisma.sucursal.findMany({
    where: { activa: true },
    select: { id: true, nombre: true, direccion: true, logoUrl: true },
    orderBy: [{ orden: "asc" }, { nombre: "asc" }],
  });

  if (sucursales.length === 0) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "linear-gradient(160deg,#f5f7fa 0%,#eef0f5 100%)" }}
      >
        <div
          className="max-w-sm w-full text-center rounded-3xl p-10"
          style={{
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.88)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
          }}
        >
          <div
            className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg,#f3f4f6,#e5e7eb)" }}
          >
            <UtensilsCrossed size={26} className="text-gray-400" />
          </div>
          <p className="font-bold text-gray-700 text-lg">Sin menús disponibles</p>
          <p className="text-sm text-gray-400 mt-1">No hay locales activos en este momento.</p>
        </div>
      </main>
    );
  }

  /* Legacy: ?sucursal=ID → slug */
  if (sucursal) {
    const found = sucursales.find((s) => String(s.id) === sucursal);
    if (found) redirect(`/vercarta/${createSlug(found.nombre)}`);
    notFound();
  }

  /* Un solo local → directo */
  if (sucursales.length === 1) {
    redirect(`/vercarta/${createSlug(sucursales[0].nombre)}`);
  }

  /* Múltiples → selector */
  return (
    <main
      className="min-h-screen px-4 py-16 flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(160deg,#f5f7fa 0%,#eef0f5 100%)" }}
    >
      <div className="w-full max-w-md space-y-6">

        {/* Header */}
        <div className="text-center">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-3xl mb-4"
            style={{
              background: "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)",
              boxShadow: "0 8px 24px rgba(245,158,11,0.35)",
            }}
          >
            <UtensilsCrossed size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Elige tu local</h1>
          <p className="text-sm text-gray-400 mt-1">
            Selecciona la sucursal para ver su catálogo
          </p>
        </div>

        {/* Cards */}
        <div className="space-y-3">
          {sucursales.map((item) => {
            const s = createSlug(item.nombre);
            return (
              <Link
                key={item.id}
                href={`/vercarta/${s}`}
                className="group flex items-center gap-4 p-4 rounded-[1.4rem] transition-all duration-200
                  hover:-translate-y-0.5 hover:shadow-xl
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                style={{
                  background: "rgba(255,255,255,0.75)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.88)",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
                }}
              >
                {/* Logo */}
                {item.logoUrl ? (
                  <div
                    className="flex-shrink-0 w-11 h-11 rounded-2xl overflow-hidden"
                    style={{
                      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                      border: "2px solid rgba(255,255,255,0.9)",
                    }}
                  >
                    <img src={item.logoUrl} alt={item.nombre} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div
                    className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-base font-black text-white"
                    style={{ background: "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)" }}
                  >
                    {item.nombre.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate text-[14px]">{item.nombre}</p>
                  {item.direccion && (
                    <p className="text-[11px] text-gray-400 truncate flex items-center gap-1 mt-0.5">
                      <MapPin size={9} />
                      {item.direccion}
                    </p>
                  )}
                </div>

                <ChevronRight
                  size={16}
                  className="flex-shrink-0 text-gray-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-amber-400"
                />
              </Link>
            );
          })}
        </div>

        {/* Back */}
        <div className="text-center pt-2">
          <Link
            href="/pedir"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors duration-200 font-medium"
          >
            <ArrowLeft size={14} />
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
