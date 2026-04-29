# PANDI

PANDI es el asistente IA interno de PandaPoss. Esta carpeta queda lista para integrarse al sistema, pero actualmente no esta conectada a ninguna ruta, menu ni layout de la aplicacion principal.

## Que incluye

- `pandi-engine.ts`: motor local para responder preguntas frecuentes del programa usando una base de conocimiento curada.
- `knowledge.ts`: contenido inicial sobre modulos, roles y flujos de PandaPoss.
- `prompt.ts`: instrucciones base para conectar el asistente a un proveedor IA mas adelante.
- `types.ts`: contratos compartidos del asistente.
- `components/PandiAssistant.tsx`: widget React listo para montar dentro del dashboard cuando se decida integrarlo.
- `api/route.example.ts`: ejemplo de API route para Next.js, sin activar.

## Como integrarlo despues

1. Mover o copiar `PANDI/api/route.example.ts` a una ruta real, por ejemplo:
   `app/api/pandi/route.ts`
2. Montar el componente en el lugar deseado:
   `import { PandiAssistant } from "@/PANDI";`
3. Pasar una funcion `onAsk` que llame a la ruta real o usar `createPandiAnswer` para respuestas locales.
4. Opcional: conectar un proveedor IA usando `buildPandiSystemPrompt()` como prompt de sistema y `PANDI_KNOWLEDGE` como contexto.

## Nota de seguridad

PANDI esta pensado para ayudar a usar el programa. No debe revelar variables de entorno, tokens, claves de MercadoPago, datos privados de clientes ni informacion sensible de usuarios.
