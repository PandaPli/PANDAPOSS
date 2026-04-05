// llm.js — Integración Claude con contexto de PandaPoss
require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL  = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 220;

function iaDisponible() { return !!process.env.ANTHROPIC_API_KEY; }

function construirMenuTexto(productos) {
  if (!productos || productos.length === 0) return 'Menú no disponible.';
  // Group by category
  const cats = {};
  for (const p of productos) {
    const cat = p.categoria?.nombre || 'General';
    if (!cats[cat]) cats[cat] = [];
    cats[cat].push(`  - ${p.nombre}: $${Number(p.precio).toLocaleString('es-CL')}`);
  }
  return Object.entries(cats)
    .map(([cat, items]) => `${cat}:\n${items.join('\n')}`)
    .join('\n\n');
}

function construirSystemPrompt(sucursal, productos, sesion) {
  const menu = construirMenuTexto(productos);
  const carritoResumen = sesion?.carritoJson?.length
    ? sesion.carritoJson.map(i => `${i.cantidad}x ${i.nombre_producto}`).join(', ')
    : 'vacío';

  return `Eres el asistente de ventas de ${sucursal.nombre || 'el restaurante'} por WhatsApp.

PERSONALIDAD: Amigable, natural, chileno. Máximo 2-3 líneas por respuesta. Sin "lo siento" ni frases corporativas.

TU ROL: Ayudar con consultas, preguntas sobre productos y delivery. El flujo de pedidos lo maneja el sistema automáticamente.

MENÚ ACTUAL:
${menu}

ESTADO ACTUAL DEL CLIENTE:
- Carrito: ${carritoResumen}
- Tipo entrega: ${sesion?.contextoJson?.tipoEntrega || 'sin definir'}

REGLAS CRÍTICAS:
- Solo menciona productos que están en el menú
- No inventes precios ni promociones
- Si no sabes algo, di "voy a consultar" y sugiere escribir al restaurante directamente
- Responde siempre en español chileno informal`;
}

async function generarRespuesta(mensajeActual, sucursal, productos, sesion) {
  if (!iaDisponible()) return null;

  const historial = (sesion?.historialJson || [])
    .slice(-10)
    .map(m => ({ role: m.role, content: m.content }));

  try {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0.3,
      system: construirSystemPrompt(sucursal, productos, sesion),
      messages: [...historial, { role: 'user', content: mensajeActual }],
    });
    const texto = resp.content[0]?.text || '';
    // Sanitize: max 3 lines, 280 chars
    return texto.split('\n').slice(0, 3).join('\n').slice(0, 280).trim();
  } catch (e) {
    console.error('[LLM] Error:', e.message);
    return null;
  }
}

module.exports = { generarRespuesta, iaDisponible };
