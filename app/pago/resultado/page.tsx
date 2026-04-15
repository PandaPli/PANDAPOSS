import { prisma } from "@/lib/db";
import Link from "next/link";

// IMPORTANTE: NO usar notFound() aqui. MP valida back_urls haciendo un GET
// bare (sin query params) a la URL — si recibe 404 marca "back_urls invalid.
// Wrong format" y rechaza la preferencia. La pagina debe responder 200 siempre.

interface Props {
  // MP appendea: collection_id, collection_status, payment_id, status,
  // external_reference, payment_type, merchant_order_id, preference_id.
  // Tambien soportamos pedidoId como fallback por compatibilidad.
  searchParams: Promise<{
    pedidoId?: string;
    external_reference?: string;
    status?: string;
    collection_status?: string;
    payment_id?: string;
  }>;
}

// Pantalla generica cuando se accede a la URL sin params (ej: MP validando
// back_urls, o un bot). Devuelve 200 OK para no romper la validacion de MP.
function PaginaVacia() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center px-4 py-10">
      <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
        <div className="text-5xl">💳</div>
        <h1 className="mt-4 text-3xl font-black text-white">Pago Mercado Pago</h1>
        <p className="mt-2 text-sm text-white/70">
          Esta pagina muestra el resultado de tu pago. Debes llegar aqui
          despues de completar una transaccion en Mercado Pago.
        </p>
      </div>
    </main>
  );
}

export default async function PagoResultadoPage({ searchParams }: Props) {
  const params = await searchParams;
  // MP usa external_reference (seteado en create-preference). Fallback pedidoId.
  const pedidoId = Number(params.external_reference ?? params.pedidoId);
  const status = params.status ?? params.collection_status ?? "unknown";
  const paymentId = params.payment_id;

  // Sin pedidoId: renderizar pagina vacia con 200 OK (NO notFound, ver nota arriba)
  if (!pedidoId || isNaN(pedidoId)) return <PaginaVacia />;

  // Si MP nos devuelve payment_id, actualizar el pedido
  if (paymentId) {
    await prisma.pedido.update({
      where: { id: pedidoId },
      data: {
        mpPaymentId: paymentId,
        mpStatus: status === "approved" ? "approved" : status === "pending" ? "pending" : "rejected",
      },
    }).catch(() => {});
  }

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: {
      id: true,
      mpStatus: true,
      usuario: { select: { sucursal: { select: { nombre: true, telefono: true } } } },
    },
  });

  if (!pedido) return <PaginaVacia />;

  const finalStatus = pedido.mpStatus ?? status;
  const sucursalNombre = pedido.usuario?.sucursal?.nombre ?? "";
  const telefono = pedido.usuario?.sucursal?.telefono ?? "";

  const config = {
    approved: {
      bg: "from-emerald-900 to-emerald-950",
      icon: "✅",
      title: "Pago aprobado",
      subtitle: "Tu pedido esta confirmado y pagado. La cocina ya lo esta preparando.",
      accent: "text-emerald-300",
    },
    pending: {
      bg: "from-amber-900 to-amber-950",
      icon: "⏳",
      title: "Pago pendiente",
      subtitle: "Tu pago esta siendo procesado. Te notificaremos cuando se confirme.",
      accent: "text-amber-300",
    },
    rejected: {
      bg: "from-red-900 to-red-950",
      icon: "❌",
      title: "Pago rechazado",
      subtitle: "No se pudo procesar el pago. Puedes intentar de nuevo o elegir otro medio de pago.",
      accent: "text-red-300",
    },
  }[finalStatus as "approved" | "pending" | "rejected"] ?? {
    bg: "from-gray-900 to-gray-950",
    icon: "ℹ️",
    title: "Estado del pago",
    subtitle: "No pudimos determinar el estado de tu pago.",
    accent: "text-gray-300",
  };

  return (
    <main className={`min-h-screen bg-gradient-to-b ${config.bg} flex items-center justify-center px-4 py-10`}>
      <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
        <div className="text-5xl">{config.icon}</div>
        <h1 className={`mt-4 text-3xl font-black text-white`}>{config.title}</h1>
        <p className="mt-2 text-sm text-white/70">{config.subtitle}</p>

        <div className="mt-6 rounded-2xl bg-white/10 p-4">
          <p className="text-xs uppercase tracking-widest text-white/50">Pedido</p>
          <p className="text-2xl font-bold text-white">#{pedido.id}</p>
          {sucursalNombre && (
            <p className="mt-1 text-sm text-white/60">{sucursalNombre}</p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href={`/track/${pedido.id}`}
            className="rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Seguir mi pedido
          </Link>
          {telefono && (
            <a
              href={`https://wa.me/${telefono.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Contactar por WhatsApp
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
