import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { createSlug } from "@/lib/slug";
import Link from "next/link";

export const metadata = { title: "Evaluaciones" };

export default async function EvaluacionLanding() {
  const session = await getServerSession(authOptions);

  const user = session?.user as { sucursalId?: number } | undefined;
  if (user?.sucursalId) {
    const sucursal = await prisma.sucursal.findUnique({
      where: { id: user.sucursalId },
      select: { nombre: true },
    });
    if (sucursal) {
      redirect(`/evaluacion/${createSlug(sucursal.nombre)}`);
    }
  }

  const sucursales = await prisma.sucursal.findMany({
    where: { activa: true },
    select: { id: true, nombre: true, logoUrl: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(155deg, #F5EBFA 0%, #E7DBEF 48%, #F5EBFA 100%)",
        fontFamily: "'Outfit', system-ui, sans-serif",
        color: "#49225B",
      }}
    >
      <div style={{ margin: "0 auto", maxWidth: 520, padding: "48px 16px" }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: "-0.025em",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Evaluaciones
        </h1>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#A56ABD",
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          Selecciona un restaurante
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sucursales.map((s) => (
            <Link
              key={s.id}
              href={`/evaluacion/${createSlug(s.nombre)}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 20px",
                borderRadius: 20,
                border: "1px solid rgba(110,52,130,.14)",
                background: "white",
                boxShadow: "0 2px 12px rgba(73,34,91,.06)",
                textDecoration: "none",
                color: "#49225B",
                transition: "all .2s",
              }}
            >
              {s.logoUrl ? (
                <img
                  src={s.logoUrl}
                  alt={s.nombre}
                  width={40}
                  height={40}
                  style={{ borderRadius: 12, objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #6E3482, #49225B)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 900,
                    fontSize: 16,
                  }}
                >
                  {s.nombre.charAt(0)}
                </div>
              )}
              <span style={{ fontSize: 16, fontWeight: 800 }}>{s.nombre}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
