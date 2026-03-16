import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import * as cheerio from "cheerio";

interface ProductoImportado {
  nombre: string;
  precio: number;
  categoria?: string;
  descripcion?: string;
}

/**
 * POST /api/productos/importar-carta
 *
 * action="fetch-url" → descarga el HTML de la URL y extrae texto plano para previsualizar.
 * action="preview"   → usa Claude AI para extraer productos del texto, devuelve array sin escribir en DB.
 * action="crear"     → recibe el array confirmado y crea los productos en DB.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sucursalId = (session.user as { sucursalId?: number | null })?.sucursalId ?? null;
  const body = await req.json();
  const { action } = body;

  // ── PASO 0: FETCH URL → extraer texto plano ───────────────────────────────
  if (action === "fetch-url") {
    const { url } = body as { url: string };
    if (!url?.trim()) return NextResponse.json({ error: "URL vacía" }, { status: 400 });

    // Resolver redirects de wa.me → URL real
    let targetUrl = url.trim();

    // wa.me/c/PHONE  →  wa.me/catalog  (catálogo Business)
    // Intentamos acceder con un User-Agent de browser real
    try {
      const resp = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "es-CL,es;q=0.9",
        },
        redirect: "follow",
      });

      const html = await resp.text();
      const $ = cheerio.load(html);

      // Eliminar scripts, estilos, nav, footer
      $("script, style, nav, footer, header, noscript, iframe, svg").remove();

      // Extraer texto visible
      const texto = $("body").text()
        .replace(/\s{3,}/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, 8000); // límite para no saturar

      if (!texto || texto.length < 30) {
        return NextResponse.json({
          error: "No se pudo extraer texto de esa página. WhatsApp requiere que copies el texto manualmente.",
          instrucciones: true,
        }, { status: 422 });
      }

      return NextResponse.json({ texto });
    } catch {
      return NextResponse.json({
        error: "No se pudo acceder al link. Intenta copiar el texto manualmente desde WhatsApp.",
        instrucciones: true,
      }, { status: 422 });
    }
  }

  // ── PASO 1: PREVIEW (parseo AI) ──────────────────────────────────────────
  if (action === "preview") {
    const { texto } = body as { texto: string };
    if (!texto?.trim()) return NextResponse.json({ error: "Texto vacío" }, { status: 400 });

    const client = new Anthropic();

    const message = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Analiza esta carta/menú de restaurante y extrae todos los productos con sus precios.

Devuelve SOLO un JSON válido con este formato exacto, sin texto adicional ni markdown:
{"productos":[{"nombre":"string","precio":número,"categoria":"string","descripcion":"string"}]}

Reglas:
- precio debe ser un número entero o decimal (sin signos de moneda)
- Si el precio usa puntos/comas como separador de miles (ej: 1.990 o 1,990), interpreta el número completo (1990)
- Infiere la categoría desde emojis o secciones: 🍣=Sushi, 🍕=Pizza, 🍺=Bebidas, 🥤=Jugos, 🍖=Carnes, 🥗=Ensaladas, etc.
- descripcion puede quedar vacío ""
- Ignora textos que no sean productos: horarios, direcciones, teléfonos, títulos de secciones sin precio
- Si un ítem no tiene precio claro, omítelo

Carta:
${texto}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Error de AI" }, { status: 500 });
    }

    try {
      // Limpiar posible markdown ```json ... ``` si el modelo lo envuelve
      const clean = content.text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
      const parsed = JSON.parse(clean);
      return NextResponse.json({ productos: parsed.productos ?? [] });
    } catch {
      return NextResponse.json({ error: "No se pudo interpretar la respuesta de AI", raw: content.text }, { status: 500 });
    }
  }

  // ── PASO 2: CREAR en DB ──────────────────────────────────────────────────
  if (action === "crear") {
    const { productos } = body as { productos: ProductoImportado[] };
    if (!productos?.length) return NextResponse.json({ error: "Sin productos" }, { status: 400 });

    // Mapa de categorías existentes (búsqueda fuzzy por nombre)
    const categoriasExistentes = await prisma.categoria.findMany({
      select: { id: true, nombre: true },
    });
    const catMap = new Map(categoriasExistentes.map((c) => [c.nombre.toLowerCase(), c.id]));

    function buscarCategoria(nombre?: string): number | null {
      if (!nombre) return null;
      const key = nombre.toLowerCase();
      for (const [k, id] of catMap.entries()) {
        if (k.includes(key) || key.includes(k)) return id;
      }
      return null;
    }

    // Prefijo único basado en timestamp para los códigos
    const prefijo = `IMP${Date.now().toString().slice(-5)}`;
    let creados = 0;
    const errores: string[] = [];

    for (let i = 0; i < productos.length; i++) {
      const p = productos[i];
      const codigo = `${prefijo}-${String(i + 1).padStart(3, "0")}`;

      try {
        await prisma.producto.create({
          data: {
            codigo,
            nombre: p.nombre.slice(0, 120),
            descripcion: p.descripcion || null,
            precio: p.precio,
            sucursalId,
            categoriaId: buscarCategoria(p.categoria),
            activo: true,
            enMenu: true,
            enMenuQR: true,
          },
        });
        creados++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        errores.push(`${p.nombre}: ${msg}`);
      }
    }

    return NextResponse.json({ ok: true, creados, errores });
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}
