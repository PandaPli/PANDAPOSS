"use client";

import { useEffect, useRef, useState } from "react";
import { io as ioClient, Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Escucha eventos del KDS en tiempo real.
 * Se conecta al room `sucursal_${sucursalId}_kds` y llama `onRefresh`
 * cuando llegan eventos de pedido nuevo o actualizado.
 * Retorna `connected` para que la UI pueda mostrar estado de conexión.
 */
export function useKdsSocket(sucursalId: number | null, onRefresh: () => void) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!sucursalId) return;

    if (!socket || socket.disconnected) {
      socket = ioClient({ path: "/api/socket/io", reconnectionAttempts: 10 });
    }

    socket.emit("kds:join", sucursalId);
    if (socket.connected) setConnected(true);

    function handleUpdate() {
      onRefreshRef.current();
    }
    function handleConnect() {
      setConnected(true);
      // Re-join al reconectar: el server pierde las rooms al desconectar
      socket?.emit("kds:join", sucursalId!);
      // Refrescar para recuperar eventos perdidos durante la desconexión
      onRefreshRef.current();
    }
    function handleDisconnect() {
      setConnected(false);
    }
    function handleError(err: Error) {
      setConnected(false);
      console.warn("[useKdsSocket] connect_error:", err.message);
    }

    socket.on("pedido:nuevo", handleUpdate);
    socket.on("pedido:update", handleUpdate);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleError);

    return () => {
      socket?.off("pedido:nuevo", handleUpdate);
      socket?.off("pedido:update", handleUpdate);
      socket?.off("connect", handleConnect);
      socket?.off("disconnect", handleDisconnect);
      socket?.off("connect_error", handleError);
    };
  }, [sucursalId]);

  return { connected };
}
