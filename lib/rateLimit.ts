/**
 * Rate limiter en memoria — sliding window por IP.
 *
 * LIMITACIÓN: funciona por instancia de servidor. En un entorno con
 * múltiples instancias (Vercel serverless en producción con mucho tráfico)
 * cada instancia mantiene su propio contador. Para rate limiting
 * distribuido real, reemplazar con Upstash Redis (@upstash/ratelimit).
 *
 * PARA PRODUCCIÓN ESCALADA:
 *   npm i @upstash/ratelimit @upstash/redis
 *   y configurar UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 */

interface Window {
  count: number;
  resetAt: number;
}

// Map global persistente en el proceso Node.js (survives HMR en dev)
const globalForRL = global as unknown as { _rlStore?: Map<string, Window> };
if (!globalForRL._rlStore) globalForRL._rlStore = new Map();
const store = globalForRL._rlStore;

// Limpiar entradas expiradas cada 5 minutos para evitar memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, win] of store) {
    if (now > win.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  /** Máximo de requests permitidos en la ventana */
  max: number;
  /** Duración de la ventana en milisegundos */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Verifica y registra un request para la clave dada.
 * @param key  Identificador único — normalmente `${endpoint}:${ip}`
 */
export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const win = store.get(key);

  if (!win || now > win.resetAt) {
    // Primera request o ventana expirada → nueva ventana
    store.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { allowed: true, remaining: opts.max - 1, resetAt: now + opts.windowMs };
  }

  if (win.count >= opts.max) {
    return { allowed: false, remaining: 0, resetAt: win.resetAt };
  }

  win.count++;
  return { allowed: true, remaining: opts.max - win.count, resetAt: win.resetAt };
}

/**
 * Extrae la IP real del request (compatible con Vercel / proxies).
 */
export function getClientIp(req: Request): string {
  const headers = req instanceof Request ? req.headers : (req as never as { headers: Headers }).headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
