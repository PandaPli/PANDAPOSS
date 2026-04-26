import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PandaNavbar } from "@/components/layout/PandaNavbar";
import { SucursalNotifOverlay } from "@/components/layout/SucursalNotifOverlay";
import { PandiAssistant } from "@/components/pandi/PandiAssistant";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-surface-bg">
      <PandaNavbar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-screen-2xl mx-auto p-6 space-y-6 animate-fade-in">
          {children}
        </div>
      </main>
      <SucursalNotifOverlay />
      <PandiAssistant />
    </div>
  );
}
