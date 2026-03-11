import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Rol } from "@/types";

// Vistas
import { AdminGeneralView } from "./AdminGeneralView";
import { BranchAdminPanel } from "./BranchAdminPanel";
import { SecretaryPanel } from "./SecretaryPanel";
import { WaiterPanel } from "./WaiterPanel";

export default async function PanelPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  const rol = (session.user as { rol?: Rol })?.rol;
  const sucursalId = (session.user as { sucursalId?: number | null })?.sucursalId ?? null;
  const simbolo = (session.user as { simbolo?: string })?.simbolo ?? "$";
  const nombre = session.user.name?.split(" ")[0] ?? "Usuario";

  // Control de Acceso basado en Roles (RBAC)
  switch (rol) {
    case "ADMIN_GENERAL":
      return <AdminGeneralView />;
      
    case "ADMIN_SUCURSAL":
      // Validar que tenga sucursal asignada
      if (!sucursalId) return <div className="p-8 text-center text-red-500 font-bold">Error: Admin de Sucursal sin sucursal asignada.</div>;
      return <BranchAdminPanel sucursalId={sucursalId} simbolo={simbolo} nombre={nombre} />;
      
    case "SECRETARY":
      if (!sucursalId) return <div className="p-8 text-center text-red-500 font-bold">Error: Secretaria sin sucursal asignada.</div>;
      return <SecretaryPanel sucursalId={sucursalId} simbolo={simbolo} nombre={nombre} />;
      
    case "WAITER":
      return <WaiterPanel />;
      
    // Roles operativos sin dashboard financiero (KDS / Logistics)
    case "CHEF":
    case "BAR":
    case "PASTRY":
    case "DELIVERY":
      redirect("/pedidos");
      
    // Cajero (Vista por defecto similar al admin sucursal antiguo pero limitada)
    case "CASHIER":
    default:
      if (!sucursalId) return <div className="p-8 text-center text-red-500 font-bold">Error: Usuario local sin sucursal asignada.</div>;
      return <BranchAdminPanel sucursalId={sucursalId} simbolo={simbolo} nombre={nombre} />;
  }
}
