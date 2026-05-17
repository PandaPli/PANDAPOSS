"use client";

import { useEffect, useState } from "react";
import { io as ioClient, Socket } from "socket.io-client";

export interface StockAlerta {
  nombre: string;
  stock: number;
}

let socket: Socket | null = null;

export function useStockAlerta(sucursalId: number | null) {
  const [alertas, setAlertas] = useState<StockAlerta[]>([]);

  useEffect(() => {
    if (!sucursalId) return;

    if (!socket) {
      socket = ioClient({ path: "/api/socket/io", reconnectionAttempts: 5 });
    }

    socket.emit("alertas:join", sucursalId);

    function onStockBajo(data: { alertas: StockAlerta[] }) {
      setAlertas(data.alertas);
      // Auto-limpiar después de 15 segundos
      setTimeout(() => setAlertas([]), 15_000);
    }
    function onConnect() {
      // Re-suscribir al room en cada reconexión
      socket?.emit("alertas:join", sucursalId!);
    }
    function onError(err: Error) {
      console.warn("[useStockAlerta] connect_error:", err.message);
    }

    socket.on("stock:bajo", onStockBajo);
    socket.on("connect", onConnect);
    socket.on("connect_error", onError);

    return () => {
      socket?.off("stock:bajo", onStockBajo);
      socket?.off("connect", onConnect);
      socket?.off("connect_error", onError);
    };
  }, [sucursalId]);

  return { alertas, dismiss: () => setAlertas([]) };
}
