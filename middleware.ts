import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { Rol } from "@/types";

const ROLE_ROUTES: Record<Rol, string[]> = {
  ADMIN_GENERAL: ["*"],
  RESTAURANTE: ["/panel", "/mesas", "/pedidos", "/ventas", "/productos", "/clientes", "/cajas", "/usuarios", "/rrhh", "/compras", "/reportes", "/configuracion", "/perfil", "/delivery", "/carta-qr", "/kiosko-admin", "/cupones", "/planes", "/fotos"],
  SECRETARY: ["/panel", "/mesas", "/pedidos", "/ventas", "/productos", "/clientes", "/rrhh", "/cupones", "/cotizaciones", "/perfil"],
  CASHIER: ["/panel", "/mesas", "/pedidos", "/ventas", "/clientes", "/cajas", "/perfil"],
  WAITER: ["/panel", "/mesas", "/pedidos", "/ventas", "/perfil"],
  CHEF: ["/pedidos", "/perfil"],
  BAR: ["/pedidos", "/perfil"],
  DELIVERY: ["/panel", "/pedidos", "/perfil", "/delivery"],
};

const ROLE_HOME: Partial<Record<Rol, string>> = {
  CHEF: "/pedidos",
  BAR: "/pedidos",
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
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/((?!login|home|menu|pedir|vercarta|kiosko|track|visor|registro|eventos|api/|_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)",
  ],
};

