import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { Rol } from "@/types";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // 8 horas
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        usuario: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.usuario || !credentials?.password) return null;

        const user = await prisma.usuario.findUnique({
          where: { usuario: credentials.usuario.toUpperCase() },
          include: { sucursal: { select: { simbolo: true, plan: true, delivery: true, menuQR: true, logoUrl: true } } },
        });

        if (!user || user.status !== "ACTIVO") return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return {
          id: String(user.id),
          name: user.nombre,
          email: user.email ?? "",
          rol: user.rol as Rol,
          usuario: user.usuario,
          sucursalId: user.sucursalId,
          simbolo: user.sucursal?.simbolo ?? "$",
          plan: user.sucursal?.plan ?? "BASICO",
          delivery: user.sucursal ? user.sucursal.delivery : true,
          menuQR:   user.sucursal ? user.sucursal.menuQR   : true,
          logoUrl:  user.sucursal?.logoUrl ?? null,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as unknown as { id: string; rol: Rol; usuario: string; sucursalId: number | null; simbolo: string; plan: string; delivery: boolean; menuQR: boolean; logoUrl: string | null };
        token.id = Number(u.id);
        token.rol = u.rol;
        token.usuario = u.usuario;
        token.sucursalId = u.sucursalId;
        token.simbolo = u.simbolo;
        token.plan     = u.plan;
        token.delivery = u.delivery;
        token.menuQR   = u.menuQR;
        token.logoUrl  = u.logoUrl;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { id: number }).id = token.id as number;
        (session.user as { rol: Rol }).rol = token.rol as Rol;
        (session.user as { usuario: string }).usuario = token.usuario as string;
        (session.user as { sucursalId: number | null }).sucursalId = token.sucursalId as number | null;
        (session.user as { simbolo: string }).simbolo = token.simbolo as string;
        (session.user as { plan: string }).plan         = token.plan     as string;
        (session.user as { delivery: boolean }).delivery = token.delivery as boolean;
        (session.user as { menuQR: boolean }).menuQR     = token.menuQR   as boolean;
        (session.user as { logoUrl: string | null }).logoUrl = token.logoUrl as string | null;
      }
      return session;
    },
  },
};

// Mapa de roles y sus rutas permitidas
export const ROLE_ROUTES: Record<Rol, string[]> = {
  ADMIN_GENERAL: ["*"],
  ADMIN_SUCURSAL: ["/panel", "/mesas", "/pedidos", "/ventas", "/productos", "/clientes", "/compras", "/reportes", "/delivery", "/carta-qr", "/planes", "/configuracion"],
  SECRETARY: ["/panel", "/mesas", "/pedidos", "/ventas", "/productos", "/clientes", "/cotizaciones"],
  CASHIER: ["/panel", "/mesas", "/pedidos", "/ventas", "/cajas"],
  WAITER: ["/panel", "/mesas", "/pedidos"],
  // Roles de cocina/barra: solo pantalla de preparación, sin dashboard
  CHEF: ["/pedidos"],
  BAR: ["/pedidos"],
  PASTRY: ["/pedidos"],
  DELIVERY: ["/panel", "/pedidos", "/delivery"],
};

export function canAccess(rol: Rol, path: string): boolean {
  const allowed = ROLE_ROUTES[rol];
  if (allowed.includes("*")) return true;
  return allowed.some((r) => path.startsWith(r));
}
