// Service worker do Precificador de Receitas (gerado pelo build).
// Estratégia: cache-first do "app shell" para funcionar offline.
// A versão do cache é carimbada pelo build (v1780629370283) — ao publicar uma
// versão nova, o cache muda e o app se atualiza sozinho.
const CACHE = "precificador-v1780629370283";
const ATIVOS = [
  "./",
  "./index.html",
  "./como-calcula.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ATIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cacheado) => {
      if (cacheado) return cacheado;
      return fetch(e.request)
        .then((resp) => {
          if (resp && resp.status === 200 && resp.type === "basic") {
            const copia = resp.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copia));
          }
          return resp;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
