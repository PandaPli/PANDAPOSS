// Service Worker — PandaPoss Carta Digital
const CACHE = "carta-v1";
const PRECACHE = ["/"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  // Solo cachear GET; pasar el resto sin intervención
  if (e.request.method !== "GET") return;
  // No interceptar API calls
  if (e.request.url.includes("/api/")) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Guardar copia en caché solo para requests de navegación y estáticos
        if (res.ok && (e.request.mode === "navigate" || e.request.destination === "image")) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
