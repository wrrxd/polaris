/* Service worker: прячет копию сайта в память телефона.
   Правило "сначала сеть": если интернет есть, берём свежую версию, если нет, открываем сохранённую. */
const V = "polaris-demo-v3"; // меняй версию при каждом обновлении — телефон скачает свежие файлы
const SHELL = ["./", "index.html", "privacy.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  // Трогаем только GET-запросы к нашему же сайту. Шрифты и база данных идут напрямую.
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(V).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match("index.html")))
  );
});
