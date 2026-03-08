"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, Bell, Search } from "lucide-react";
import { useState, useEffect } from "react";

export function Topbar() {
  const { data: session } = useSession();
  const [time, setTime] = useState("");
  const simbolo = (session?.user as { simbolo?: string })?.simbolo ?? "$";

  useEffect(() => {
    const update = () => {
      setTime(
        new Intl.DateTimeFormat("es-CL", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(new Date())
      );
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Búsqueda global */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar productos, clientes..."
            className="input pl-9 text-sm h-9 max-w-xs"
          />
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2">
        {/* Reloj */}
        <span className="text-sm text-zinc-500 font-mono hidden md:block">
          {time}
        </span>

        {/* Moneda */}
        <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-zinc-100 rounded-lg text-xs text-zinc-600 font-medium">
          {simbolo} CLP
        </div>

        {/* Notificaciones */}
        <button className="relative p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Cerrar sesión"
        >
          <LogOut size={16} />
          <span className="hidden md:block">Salir</span>
        </button>
      </div>
    </header>
  );
}
