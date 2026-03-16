import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import * as cheerio from "cheerio";
import { checkLimit } from "@/core/billing/limitChecker";

interface ProductoImportado {
  nombre: string;
  precio: number;
  categoria?: string;
  descripcion?: string;
}

const HEADERS_BROWSER = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "es-CL,es;q=0.9,en;q=0.8",
};

/**
 * POST /api/productos/importar-carta
 *
 * action="fetch-url" → detecta tipo (PDF / web / WhatsApp) y extrae texto plano.
 * action="preview"   → usa Claude AI para extraer productos del texto.
 * action="crear"     → crea los productos confirmados en DB.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sucursalId = (session.user as { sucursalId?: number | null })?.sucursalId ?? null;
  const body = await req.json();
  const { action } = body;

  // ── PASO 0: FETCH URL → extraer texto ─────────────────────────────────────
  if (action === "fetch-url") {
    const { url } = body as { url: string };
    if (!url?.trim()) return NextResponse.json({ error: "URL vacía" }, { status: 400 });

    const targetUrl = url.trim();

    // ── Bloquear redes sociales (requieren JS / login) ──────────────────────
    const esRedsocial =
      targetUrl.includes("wa.me") ||
      targetUrl.includes("whatsapp.com") ||
      targetUrl.includes("instagram.com") ||
      targetUrl.includes("facebook.com") ||
      targetUrl.includes("tiktok.com");

    if (esRedsocial) {
      return NextResponse.json({
        error: "Las redes sociales no permiten lectura automática. Usa un link de PDF o página web.",
        instrucciones: true,
        tipo: "redes",
      }, { status: 422 });
    }

    try {
      const resp = await fetch(targetUrl, {
        headers: HEADERS_BROWSER,
        redirect: "follow",
      });

      if (!resp.ok) {
        return NextResponse.json({
          error: `La página respondió con error ${resp.status}. Verifica que el link sea público y accesible.`,
          instrucciones: false,
        }, { status: 422 });
      }

      const contentType = resp.headers.get("content-type") ?? "";

      // ── PDF ───────────────────────────────────────────────────────────────
      if (contentType.includes("pdf") || targetUrl.toLowerCase().endsWith(".pdf")) {
        const buffer = await resp.arrayBuffer();
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const pdfParse = require("pdf-parse/lib/pdf-parse.js");
          const data = await pdfParse(Buffer.from(buffer));
          const texto = data.text?.replace(/\s{3,}/g, "\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, 8000) ?? "";
          if (!texto || texto.length < 30) {
            return NextResponse.json({ error: "El PDF no contiene texto legible (puede ser una imagen escaneada).", instrucciones: false }, { status: 422 });
          }
          return NextResponse.json({ texto, tipo: "pdf" });
        } catch {
          return NextResponse.json({ error: "No se pudo leer el PDF. Asegúrate de que tenga texto seleccionable.", instrucciones: false }, { status: 422 });
        }
      }

      // ── Página web HTML ───────────────────────────────────────────────────
      const html = await resp.text();
      const $ = cheerio.load(html);
      $("script, style, nav, footer, header, noscript, iframe, svg, img, button").remove();

      const texto = $("body").text()
        .replace(/\t/g, " ")
        .replace(/ {3,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, 8000);

      // Detectar páginas de error genéricas
      const esError =
        texto.includes("Sorry, something went wrong") ||
        texto.includes("404 Not Found") ||
        texto.includes("403 Forbidden") ||
        (texto.includes("Meta © 20") && texto.length < 200) ||
        texto.length < 60;

      if (esError) {
        return NextResponse.json({
          error: "No se pudo leer el contenido de esa página. Verifica que el link sea público.",
          instrucciones: false,
        }, { status: 422 });
      }

      return NextResponse.json({ texto, tipo: "web" });
    } catch {
      return NextResponse.json({
        error: "No se pudo conectar al servidor. Verifica que el link sea válido y accesible.",
        instrucciones: false,
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

    // Verificar cuántos productos puede importar según el plan
    const { allowed: limitOk, error: limitError } = await checkLimit(sucursalId, "productos");
    if (!limitOk) {
      return NextResponse.json({ error: limitError }, { status: 403 });
    }

    // Calcular cuántos productos quedan disponibles en el plan
    const { PLAN_LIMITS } = await import("@/core/billing/planConfig");
    const sucursalData = sucursalId
      ? await prisma.sucursal.findUnique({ where: { id: sucursalId }, select: { plan: true } })
      : null;
    const plan = sucursalData?.plan ?? "BASICO";
    const maxPlan = (PLAN_LIMITS as Record<string, { productos: number }>)[plan]?.productos ?? 150;
    const actuales = sucursalId
      ? await prisma.producto.count({ where: { sucursalId, activo: true } })
      : 0;
    const disponibles = Math.max(0, maxPlan - actuales);

    // Truncar la lista de importación al espacio disponible
    const productosACrear = productos.slice(0, disponibles);
    if (productosACrear.length === 0) {
      return NextResponse.json({ error: limitError ?? "Has alcanzado el límite de productos de tu plan." }, { status: 403 });
    }

    const categoriasExistentes = await prisma.categoria.findMany({ select: { id: true, nombre: true } });
    const catMap = new Map(categoriasExistentes.map((c) => [c.nombre.toLowerCase(), c.id]));

    function buscarCategoria(nombre?: string): number | null {
      if (!nombre) return null;
      const key = nombre.toLowerCase();
      for (const [k, id] of catMap.entries()) {
        if (k.includes(key) || key.includes(k)) return id;
      }
      return null;
    }

    const prefijo = `IMP${Date.now().toString().slice(-5)}`;
    let creados = 0;
    const errores: string[] = [];

    for (let i = 0; i < productosACrear.length; i++) {
      const p = productosACrear[i];
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

    const omitidos = productos.length - productosACrear.length;
    return NextResponse.json({
      ok: true,
      creados,
      errores,
      ...(omitidos > 0 ? { advertencia: `${omitidos} producto(s) no importados por límite del plan (${plan}: máx ${maxPlan}).` } : {}),
    });
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}
