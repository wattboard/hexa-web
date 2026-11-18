// Hexa sin conexión: lo que se abre una vez queda guardado y se sirve aunque no haya internet.
// La página (navegación) se pide primero a internet: así una versión nueva nunca deja la página en blanco por pedir
// archivos que ya no existen. Sin conexión se usa la copia guardada. El resto (dibujos, fotos, código con huella en el
// nombre) sale de la copia y se actualiza en segundo plano.
const CACHE = "hexa-v2";
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./index.html", "./manifest.webmanifest", "./icon.svg"])).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(caches.open(CACHE).then((cache) =>
      fetch(req).then((res) => { if (res.ok) cache.put("./index.html", res.clone()); return res; })
        .catch(async () => (await cache.match(req, { ignoreSearch: true })) || (await cache.match("./index.html")))));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const cached = await cache.match(req);
    const fresh = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => cached);
    return cached || fresh;
  }));
});
