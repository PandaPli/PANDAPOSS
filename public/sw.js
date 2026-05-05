// ─── PandaPoss Service Worker v3 ──────────────────────────────────────────────
// Estrategia:
//   • Estáticos Next.js (_next/static)  → Cache-first (inmutables con hash)
//   • Páginas del dashboard             → Network-first, fallback a caché
//   • /api/productos (GET)              → Stale-while-revalidate (precios cacheados)
//   • Resto de /api/                    → Network-only (nunca interceptar POST)
//   • Imágenes externas                 → Cache-first con TTL implícito

const STATIC_CACHE = "pp-static-v3";
const PAGE_CACHE   = "pp-pages-v3";
const API_CACHE    = "pp-api-v3";

const PRECACHE_PAGES = [
  "/ventas/caja",
  "/pedidos",
  "/mesas",
  "/panel",
];

// ── Install ────────────────────────────────────────────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(PAGE_CACHE)
      .then((c) => c.addAll(PRECACHE_PAGES).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ───────────────────────────────────────────────────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) =>
              !k.startsWith("pp-") || (
                k !== STATIC_CACHE &&
                k !== PAGE_CACHE &&
                k !== API_CACHE
              )
            )
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ──────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Pasar POST/PATCH/DELETE sin intervención (el cliente maneja offline)
  if (request.method !== "GET") return;

  // No interceptar auth ni socket.io
  if (
    url.pathname.startsWith("/api/auth") ||
    url.pathname.startsWith("/api/socket") ||
    url.pathname.startsWith("/_next/webpack")
  ) return;

  // Estáticos de Next.js → cache-first (llevan hash → inmutables)
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Productos API → stale-while-revalidate (precios disponibles offline)
  if (url.pathname === "/api/productos" || url.pathname.startsWith("/api/productos?")) {
    e.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  // Resto de /api/ → network-only
  if (url.pathname.startsWith("/api/")) return;

  // Imágenes → cache-first
  if (
    request.destination === "image" ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)
  ) {
    e.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Páginas HTML → network-first con fallback
  if (request.mode === "navigate" || request.headers.get("Accept")?.includes("text/html")) {
    e.respondWith(networkFirstPage(request));
    return;
  }

  // Resto (fonts, CSS, JS) → cache-first
  e.respondWith(cacheFirst(request, STATIC_CACHE));
});

// ── Estrategias ────────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    // Si no hay caché exacta, intentar servir /ventas/caja como fallback del POS
    return cached
      || await cache.match("/ventas/caja")
      || new Response("<h1>Sin conexión</h1><p>PandaPoss está en modo offline</p>", {
          status: 503,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Revalidar en segundo plano
  const fetchPromise = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);

  // Servir caché inmediatamente si existe, sino esperar red
  return cached ?? (await fetchPromise) ?? new Response("[]", {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
