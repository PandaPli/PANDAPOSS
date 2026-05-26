# PandaPOS Voice Realtime

Sistema de voz nativo para PANDI/PandaPoss.

## Variables

```env
OPENAI_API_KEY=sk-...
OPENAI_REALTIME_MODEL=gpt-realtime
OPENAI_REALTIME_VOICE=marin
```

## Flujo

1. El frontend solicita `POST /api/voice/realtime-session`.
2. El backend valida la sesion NextAuth y crea un client secret efimero en OpenAI.
3. React captura microfono con `getUserMedia`, ruido reducido y `autoGainControl`.
4. El navegador conecta a OpenAI Realtime por WebRTC.
5. El audio de respuesta se reproduce automaticamente.
6. Los eventos de transcripcion se agregan al historial de PANDI.

## Realtime Interno

Socket.IO mantiene rooms por sucursal:

```text
sucursal_{id}_voice
sucursal_{id}_ai
```

Eventos disponibles:

```text
voice:join
voice:state
ai-pos:join
ai-pos:event
```

## Diseno

- WebRTC para baja latencia en navegador.
- Client secrets efimeros para no exponer `OPENAI_API_KEY`.
- VAD de servidor para restaurantes ruidosos.
- UI con estados `connecting`, `listening`, `thinking`, `responding`.
- Preparado para wake word futuro desde cliente local o kiosko.
