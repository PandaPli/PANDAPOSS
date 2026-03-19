import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Límites según el tipo de upload:
// ?tipo=fondo  → 8 MB  (PNG con transparencia para fondos de carta)
// ?tipo=logo   → 5 MB  (logos con transparencia)
// default      → 4 MB  (productos)
function getMaxBytes(tipo: string | null): number {
  if (tipo === "fondo") return 8 * 1024 * 1024;
  if (tipo === "logo")  return 5 * 1024 * 1024;
  return 4 * 1024 * 1024;
}

function getFolder(tipo: string | null): string {
  if (tipo === "fondo") return "fondos";
  if (tipo === "logo")  return "logos";
  return "productos";
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tipo = req.nextUrl.searchParams.get("tipo"); // "fondo" | "logo" | null
  const maxBytes = getMaxBytes(tipo);
  const folder   = getFolder(tipo);

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Error al leer el archivo" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });

  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / 1024 / 1024);
    return NextResponse.json(
      { error: `El archivo supera el límite de ${mb} MB para este tipo de imagen` },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato no permitido. Use JPG, PNG, WEBP o GIF" },
      { status: 400 }
    );
  }

  // Preservar extensión original (PNG → mantiene canal alfa)
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const blob = await put(filename, file, {
    access: "public",
    contentType: file.type, // preserva image/png con transparencia
  });

  return NextResponse.json({ url: blob.url });
}
