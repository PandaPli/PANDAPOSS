import { redirect } from "next/navigation";

// /visor sin ID → redirigir a login (el visor requiere el ID de sucursal en la URL)
export default function VisorRootPage() {
  redirect("/login");
}
