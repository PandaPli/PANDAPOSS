import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { CalendarDays, Lock } from "lucide-react";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "PP — Apps" };

export default async function AplicacionesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const sucursalId = (session.user as { sucursalId?: number | null })?.sucursalId ?? null;
  const plan = (session.user as { plan?: string })?.plan ?? "BASICO";

  let sucursalPlan = plan;
  if (sucursalId) {
    const suc = await prisma.sucursal.findUnique({
      where: { id: sucursalId },
      select: { plan: true },
    });
    if (suc) sucursalPlan = suc.plan;
  }

  const isPrime = sucursalPlan === "PRIME" || sucursalPlan === "DEMO";

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Caja de Aplicaciones</h1>
          <p className="mt-1 text-sm text-slate-500">Módulos premium disponibles para tu sucursal.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* EVENTOS Card */}
          <div className={`relative overflow-hidden rounded-2xl shadow-lg transition-all ${isPrime ? "hover:-translate-y-1 hover:shadow-xl" : "opacity-80"}`}>
            {isPrime ? (
              <Link href="/eventos" className="block">
                <div className="bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 p-6 text-white">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                      <CalendarDays size={26} className="text-white" />
                    </div>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                      PRIME
                    </span>
                  </div>
                  <h2 className="text-xl font-bold">Eventos</h2>
                  <p className="mt-2 text-sm text-white/80">
                    Crea y gestiona eventos con venta de tickets QR, check-in digital y control de aforo.
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-white/90">
                    <span>Ir a Eventos</span>
                    <span>→</span>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="bg-gradient-to-br from-violet-400 via-purple-500 to-indigo-600 p-6 text-white">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                    <CalendarDays size={26} className="text-white" />
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                    <Lock size={10} />
                    Requiere PRIME
                  </span>
                </div>
                <h2 className="text-xl font-bold">Eventos</h2>
                <p className="mt-2 text-sm text-white/80">
                  Crea y gestiona eventos con venta de tickets QR, check-in digital y control de aforo.
                </p>
                <div className="mt-4">
                  <Link
                    href="/planes"
                    className="inline-flex items-center gap-1 rounded-lg bg-white/20 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/30"
                  >
                    Actualizar plan
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
