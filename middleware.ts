import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { Rol } from "@/types";

// Lógica inline para evitar importar bcryptjs en Edge Runtime
const ROLE_ROUTES: Record<Rol, string[]> = {
  ADMIN_GENERAL: ["*"],
  ADMIN_SUCURSAL: ["/panel", "/mesas", "/pedidos", "/ventas", "/productos", "/clientes", "/cajas", "/usuarios", "/compras", "/reportes", "/configuracion"],
  SECRETARY: ["/panel", "/mesas", "/pedidos", "/ventas", "/productos", "/clientes", "/cotizaciones"],
  CASHIER: ["/panel", "/mesas", "/pedidos", "/ventas", "/clientes", "/cajas"],
  WAITER: ["/panel", "/mesas", "/pedidos"],
  // Roles de cocina/barra: solo pantalla de preparación, sin dashboard
  CHEF: ["/pedidos"],
  BAR: ["/pedidos"],
  PASTRY: ["/pedidos"],
  DELIVERY: ["/panel", "/pedidos"],
};

// Página de inicio por rol (default: /panel)
const ROLE_HOME: Partial<Record<Rol, string>> = {
  CHEF: "/pedidos",
  BAR: "/pedidos",
  PASTRY: "/pedidos",
};

function canAccess(rol: Rol, path: string): boolean {
  const allowed = ROLE_ROUTES[rol];
  if (!allowed) return false;
  if (allowed.includes("*")) return true;
  return allowed.some((r) => path === r || path.startsWith(r + "/"));
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (!token) return NextResponse.redirect(new URL("/login", req.url));

    const rol = token.rol as Rol;

    // Si no tiene acceso, redirigir a su página de inicio
    if (!canAccess(rol, pathname)) {
      const home = ROLE_HOME[rol] ?? "/panel";
      return NextResponse.redirect(new URL(home, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  // Solo proteger páginas — excluir TODAS las rutas /api/
  // (las rutas API manejan su propia auth con getServerSession)
  matcher: [
    "/((?!login|api/|_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
