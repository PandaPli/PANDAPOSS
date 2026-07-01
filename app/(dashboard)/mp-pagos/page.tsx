import type { Metadata } from "next";
import { MpPagosClient } from "./MpPagosClient";

export const metadata: Metadata = { title: "PP — Pagos MercadoPago" };
export const dynamic = "force-dynamic";

export default function MpPagosPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <MpPagosClient />
    </div>
  );
}
