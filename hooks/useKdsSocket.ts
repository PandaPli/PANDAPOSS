"use client";

import { useEffect, useRef, useState } from "react";
import { io as ioClient, Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Escucha eventos del KDS en tiempo real.
 * Se conecta al room `sucursal_${sucursalId}_kds` y llama `onRefresh`
 * cuando llegan eventos de pedido nuevo o actualizado.
 * Retorna `connected` para que la UI pueda mostrar estado de conexión.
 *
 * IMPORTANTE: cuando `sucursalId` cambia, abandona la room anterior antes de
 * unirse a la nueva para evitar que eventos de otra sucursal lleguen al KDS.
 */
export function useKdsSocket(sucursalId: number | null, onRefresh: () => void) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const [connected, setConnected] = useState(false);
  // Tracking de la sala a la que está unido actualmente para poder abandonarla
  const joinedRoomRef = useRef<number | null>(null);

  useEffect(() => {
    if (!sucursalId) return;

    if (!socket || socket.disconnected) {
      socket = ioClient({ path: "/api/socket/io", reconnectionAttempts: 10 });
    }

    // Si ya estábamos en una room distinta, abandonarla primero
    if (joinedRoomRef.current !== null && joinedRoomRef.current !== sucursalId) {
      socket.emit("kds:leave", joinedRoomRef.current);
    }
    socket.emit("kds:join", sucursalId);
    joinedRoomRef.current = sucursalId;

    if (socket.connected) setConnected(true);

    function handleUpdate() {
      onRefreshRef.current();
    }
    function handleConnect() {
      setConnected(true);
      // Re-join al reconectar: el server pierde las rooms al desconectar
      socket?.emit("kds:join", sucursalId!);
      joinedRoomRef.current = sucursalId;
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
      // Al desmontar, abandonar la room limpiamente
      socket?.emit("kds:leave", sucursalId);
      joinedRoomRef.current = null;
    };
  }, [sucursalId]);

  return { connected };
}
