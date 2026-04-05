import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { AgenteClient } from "./AgenteClient";
import type { Rol } from "@/types";

export default async function AgentePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as { rol?: Rol; sucursalId?: number | null };

  // Check PRIME plan
  let isPrime = user.rol === "ADMIN_GENERAL";
  if (!isPrime && user.sucursalId) {
    const sucursal = await prisma.sucursal.findUnique({
      where: { id: user.sucursalId },
      select: { plan: true },
    });
    isPrime = sucursal?.plan === "PRIME" || sucursal?.plan === "DEMO";
  }

  if (!isPrime) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-6xl">🔒</div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-surface-text mb-2">Agente WhatsApp</h1>
          <p className="text-surface-muted max-w-md">
            Esta función está disponible exclusivamente para el plan <span className="font-bold text-brand-600">PRIME</span>.
            Activa tu plan para usar el agente de ventas por WhatsApp.
          </p>
        </div>
        <div className="card p-6 max-w-sm w-full text-center bg-gradient-to-br from-brand-50 to-brand-100 border-brand-200">
          <p className="text-sm font-semibold text-brand-700">✨ Plan PRIME incluye</p>
          <ul className="text-sm text-brand-600 mt-3 space-y-1 text-left">
            <li>✅ Agente WhatsApp con IA</li>
            <li>✅ Base de clientes automática</li>
            <li>✅ Pedidos directos desde chat</li>
            <li>✅ Historial y preferencias</li>
            <li>✅ Hasta 5 agentes simultáneos</li>
          </ul>
        </div>
      </div>
    );
  }

  // Load all sucursales with their agents (admin sees all, others see their own)
  const where = user.rol !== "ADMIN_GENERAL" && user.sucursalId
    ? { id: user.sucursalId }
    : {};

  const sucursales = await prisma.sucursal.findMany({
    where: { ...where, plan: { in: ["PRIME", "DEMO"] } },
    include: {
      agente: {
        include: { _count: { select: { clientes: true } } },
      },
    },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-text">Agente WhatsApp</h1>
        <p className="text-surface-muted text-sm mt-1">
          Bot de ventas con IA para cada sucursal — responde pedidos, consultas y aprende de tus clientes.
        </p>
      </div>
      <AgenteClient sucursales={sucursales as any} />
    </div>
  );
}
