import type { Metadata } from "next";
import { getFreshSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { FeatureGate } from "@/components/FeatureGate";
import { QRPageClient } from "./QRPageClient";
import { PLAN_LIMITS } from "@/core/billing/planConfig";

export const metadata: Metadata = { title: "PP — QR" };

export default async function QRPage() {
  const user = await getFreshSessionUser();
  if (!user) return null;

  const rol = user.rol;
  const sucursalId = user.sucursalId;

  if (rol !== "ADMIN_GENERAL" && rol !== "RESTAURANTE") redirect("/panel");

  let liveMenuQR = false;
  if (sucursalId && rol !== "ADMIN_GENERAL") {
    const sucursal = await prisma.sucursal.findUnique({
      where: { id: sucursalId },
      select: { menuQR: true, plan: true },
    });
    if (sucursal) {
      liveMenuQR = sucursal.menuQR || PLAN_LIMITS[sucursal.plan]?.menuQR === true;
    }
  }

  const isAdmin = rol === "ADMIN_GENERAL";
  const whereClause = isAdmin ? { activa: true } : { activa: true, sucursalId: sucursalId! };

  const [salas, estacionamientos, sucursales] = await Promise.all([
    prisma.sala.findMany({
      where: whereClause,
      include: {
        mesas: {
          orderBy: { nombre: "asc" },
          select: { id: true, nombre: true, capacidad: true, salaId: true },
        },
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.estacionamiento.findMany({
      where: {
        activo: true,
        ...(isAdmin ? {} : { sucursalId: sucursalId! }),
      },
      include: { sucursal: { select: { id: true, nombre: true } } },
      orderBy: { numero: "asc" },
    }),
    isAdmin
      ? prisma.sucursal.findMany({
          where: { activa: true },
          select: { id: true, nombre: true },
          orderBy: { nombre: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const salaGroups = salas.map((sala) => ({
    nombre: sala.nombre,
    mesas: sala.mesas.map((m) => ({
      ...m,
      sala: { nombre: sala.nombre, sucursalId: sala.sucursalId },
    })),
  }));

  const estacionamientosData = estacionamientos.map((e) => ({
    id: e.id,
    numero: e.numero,
    sucursalId: e.sucursalId,
    sucursalNombre: e.sucursal.nombre,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-text">QR</h1>
        <p className="text-surface-muted text-sm mt-1">
          Genera codigos QR descargables listos para imprimir
        </p>
      </div>

      <FeatureGate enabled={liveMenuQR || isAdmin} feature="QR">
        <QRPageClient
          salas={salaGroups}
          estacionamientos={estacionamientosData}
          sucursales={sucursales}
          isAdmin={isAdmin}
          sucursalId={sucursalId}
        />
      </FeatureGate>
    </div>
  );
}
