import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OdooNavbar } from "@/components/layout/OdooNavbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-odoo-bg">
      <OdooNavbar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-screen-2xl mx-auto p-4 space-y-4 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
