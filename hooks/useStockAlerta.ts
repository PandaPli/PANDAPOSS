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

    socket.on("stock:bajo", onStockBajo);
    return () => { socket?.off("stock:bajo", onStockBajo); };
  }, [sucursalId]);

  return { alertas, dismiss: () => setAlertas([]) };
}
