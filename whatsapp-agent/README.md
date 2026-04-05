# PandaPoss — Agente WhatsApp

Bot de WhatsApp multi-sucursal para PandaPoss. Disponible solo para plan **PRIME**.

## Requisitos
- Node.js 18+
- PM2 (`npm i -g pm2`)
- AGENTE_API_KEY configurada en Vercel (variable `AGENTE_API_KEY`)
- ANTHROPIC_API_KEY para respuestas con IA

## Instalación

```bash
cd whatsapp-agent
npm install
cp .env.example .env
# Editar .env con tus credenciales
```

## Arrancar

```bash
# Desarrollo
npm run dev

# Producción (persistente)
pm2 start index.js --name "pandaposs-wsp-agent"
pm2 save
pm2 startup
```

## Vincular WhatsApp

1. Activar el agente en PandaPoss Dashboard → Agente WhatsApp
2. Arrancar este servicio
3. Escanear el QR que aparece en el Dashboard con WhatsApp

## Arquitectura

```
[WhatsApp] ↔ [Baileys] ↔ [index.js] ↔ [api.js] ↔ [pandaposs.com API]
                                                         ↓
                                               [PostgreSQL/Railway]
```
