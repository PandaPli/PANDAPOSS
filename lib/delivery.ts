import type { DeliveryTrackingStage, EstadoPedido, MetodoPago } from "@/types";

interface DeliveryMetaInput {
  clienteNombre: string;
  referencia?: string | null;
  departamento?: string | null;
  metodoPago: MetodoPago;
  cargoEnvio?: number;
}

interface DeliveryMetaParsed {
  clienteNombre: string;
  referencia: string | null;
  departamento: string | null;
  metodoPago: MetodoPago;
  cargoEnvio: number;
}

const DELIVERY_PREFIX = "[DELIVERY]";

export function buildDeliveryObservation(input: DeliveryMetaInput) {
  const payload = {
    clienteNombre: input.clienteNombre,
    referencia: input.referencia ?? null,
    departamento: input.departamento ?? null,
    metodoPago: input.metodoPago,
    cargoEnvio: Number(input.cargoEnvio ?? 0),
  };

  return `${DELIVERY_PREFIX}${JSON.stringify(payload)}`;
}

export function parseDeliveryObservation(observacion: string | null | undefined): DeliveryMetaParsed {
  if (!observacion || !observacion.startsWith(DELIVERY_PREFIX)) {
    return {
      clienteNombre: "Cliente PandaPoss",
      referencia: null,
      departamento: null,
      metodoPago: "EFECTIVO",
      cargoEnvio: 0,
    };
  }

  try {
    const parsed = JSON.parse(observacion.slice(DELIVERY_PREFIX.length)) as Partial<DeliveryMetaParsed>;
    return {
      clienteNombre: parsed.clienteNombre?.trim() || "Cliente PandaPoss",
      referencia: parsed.referencia ?? null,
      departamento: parsed.departamento ?? null,
      metodoPago: (parsed.metodoPago as MetodoPago) ?? "EFECTIVO",
      cargoEnvio: Number(parsed.cargoEnvio ?? 0),
    };
  } catch {
    return {
      clienteNombre: "Cliente PandaPoss",
      referencia: null,
      departamento: null,
      metodoPago: "EFECTIVO",
      cargoEnvio: 0,
    };
  }
}

export function getDeliveryTrackingStage(estado: EstadoPedido, repartidorAsignado: boolean): DeliveryTrackingStage {
  if (estado === "CANCELADO") return "CANCELADO";
  if (estado === "ENTREGADO") return "ENTREGADO";
  if (estado === "LISTO" && repartidorAsignado) return "EN_CAMINO";
  if (estado === "EN_PROCESO" || estado === "LISTO") return "PREPARANDO";
  return "CONFIRMADO";
}

export function getDeliveryStageLabel(stage: DeliveryTrackingStage) {
  switch (stage) {
    case "CONFIRMADO":
      return "Pedido confirmado";
    case "PREPARANDO":
      return "Preparando";
    case "EN_CAMINO":
      return "En camino";
    case "ENTREGADO":
      return "Entregado";
    case "CANCELADO":
      return "Cancelado";
    default:
      return "Pedido confirmado";
  }
}

export function estimateDeliveryMinutes(activeOrders: number, activeDrivers: number) {
  const kitchenBase = 20;
  const queuePressure = Math.min(20, activeOrders * 3);
  const driverRelief = activeDrivers > 0 ? Math.min(8, activeDrivers * 2) : 0;
  return Math.max(20, kitchenBase + queuePressure - driverRelief);
}

export function getDeliveryProgressValue(stage: DeliveryTrackingStage) {
  switch (stage) {
    case "CONFIRMADO":
      return 25;
    case "PREPARANDO":
      return 55;
    case "EN_CAMINO":
      return 82;
    case "ENTREGADO":
      return 100;
    case "CANCELADO":
      return 100;
    default:
      return 25;
  }
}

