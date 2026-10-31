const CACHE = "sabor-brasil-v1";
const PAGINA_OFFLINE = "/offline.html";

// Guarda só a página de "sem ligação" e o ícone
self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([PAGINA_OFFLINE, "/icons/icon-192.png"])),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(
          chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// As páginas vêm sempre da rede. Se não houver internet, mostra a página offline.
self.addEventListener("fetch", (evento) => {
  if (evento.request.mode !== "navigate") return;
  evento.respondWith(
    fetch(evento.request).catch(() => caches.match(PAGINA_OFFLINE)),
  );
});
