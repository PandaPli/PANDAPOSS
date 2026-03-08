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
          include: { sucursal: { select: { simbolo: true } } },
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
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as unknown as { id: string; rol: Rol; usuario: string; sucursalId: number | null; simbolo: string };
        token.id = Number(u.id);
        token.rol = u.rol;
        token.usuario = u.usuario;
        token.sucursalId = u.sucursalId;
        token.simbolo = u.simbolo;
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
      }
      return session;
    },
  },
};

// Mapa de roles y sus rutas permitidas
export const ROLE_ROUTES: Record<Rol, string[]> = {
  ADMIN_GENERAL: ["*"],
  ADMIN_SUCURSAL: ["/panel", "/mesas", "/pedidos", "/ventas", "/productos", "/clientes", "/compras", "/reportes"],
  SECRETARY: ["/panel", "/mesas", "/pedidos", "/ventas", "/productos", "/clientes", "/cotizaciones"],
  CASHIER: ["/panel", "/mesas", "/pedidos", "/ventas", "/cajas"],
  WAITER: ["/panel", "/mesas", "/pedidos"],
  CHEF: ["/panel", "/pedidos"],
  BAR: ["/panel", "/pedidos"],
  PASTRY: ["/panel", "/pedidos"],
  DELIVERY: ["/panel", "/pedidos"],
};

export function canAccess(rol: Rol, path: string): boolean {
  const allowed = ROLE_ROUTES[rol];
  if (allowed.includes("*")) return true;
  return allowed.some((r) => path.startsWith(r));
}
