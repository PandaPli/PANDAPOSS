"use client";

import { useEffect, useRef } from "react";
import { io as ioClient, Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Escucha eventos del KDS en tiempo real.
 * Se conecta al room `sucursal_${sucursalId}_kds` y llama `onRefresh`
 * cuando llegan eventos de pedido nuevo o actualizado.
 */
export function useKdsSocket(sucursalId: number | null, onRefresh: () => void) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (!sucursalId) return;

    if (!socket || socket.disconnected) {
      socket = ioClient({ path: "/api/socket/io", reconnectionAttempts: 10 });
    }

    socket.emit("kds:join", sucursalId);

    function handleUpdate() {
      onRefreshRef.current();
    }

    socket.on("pedido:nuevo", handleUpdate);
    socket.on("pedido:update", handleUpdate);

    return () => {
      socket?.off("pedido:nuevo", handleUpdate);
      socket?.off("pedido:update", handleUpdate);
    };
  }, [sucursalId]);
}
