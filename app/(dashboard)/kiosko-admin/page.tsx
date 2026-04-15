import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSlug } from "@/lib/slug";
import Link from "next/link";
import { Monitor, ExternalLink } from "lucide-react";

export const metadata: Metadata = { title: "PP — Kiosko" };

export default async function KioskoAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const sucursalId = (session.user as { sucursalId: number | null }).sucursalId;

  const sucursales = await prisma.sucursal.findMany({
    where: sucursalId ? { id: sucursalId, activa: true } : { activa: true },
    select: { id: true, nombre: true, logoUrl: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-black text-surface-text">Kiosko de Autoservicio</h1>
        <p className="mt-0.5 text-sm text-surface-muted">
          Abre el link en el dispositivo táctil del kiosko. Los pedidos aparecen directamente en KDS como &ldquo;MOSTRADOR&rdquo;.
        </p>
      </div>

      <div className="rounded-2xl border border-brand-200 bg-brand-50/40 p-4 text-sm text-brand-700">
        <strong>¿Cómo usarlo?</strong> Abre el link en el dispositivo táctil → el cliente navega el menú → confirma su pedido → aparece en KDS automáticamente. Recomendamos modo pantalla completa (F11).
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sucursales.map((s) => {
          const slug = createSlug(s.nombre);
          const url = `/kiosko/${slug}`;
          return (
            <div key={s.id} className="rounded-2xl border border-surface-border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
                  <Monitor size={20} />
                </div>
                <div>
                  <p className="font-black text-surface-text">{s.nombre}</p>
                  <p className="text-xs text-surface-muted font-mono">/kiosko/{slug}</p>
                </div>
              </div>
              <Link
                href={url}
                target="_blank"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-zinc-900 py-3 text-sm font-bold text-white hover:bg-zinc-700 transition-all"
              >
                <ExternalLink size={15} />
                Abrir Kiosko
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
