import { redirect } from "next/navigation";

/**
 * La ruta /ventas/caja fue fusionada dentro de /ventas/nueva.
 * Redirige permanentemente al modo Express del Punto de Venta.
 */
export default function CajaBasicaPage() {
  redirect("/ventas/nueva?modo=express");
}
