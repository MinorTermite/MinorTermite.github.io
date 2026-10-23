// Сайт как приложение: страницы и оформление сохраняются для чтения без интернета.
// Страницы — сначала сеть (свежие тексты), при её отсутствии — сохранённая копия.
// Хешированные файлы, шрифты, картинки и озвучка — из кеша. Ролики не кешируются: они большие.
const CACHE = 'zhizn-v2'; // v2: озвучка студийным голосом из интервью вместо телефонного
const PAGES = ['/', '/en/'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PAGES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/media/clips/')) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request)
      .then((response) => { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); return response; })
      .catch(() => caches.match(event.request).then((hit) => hit || caches.match(url.pathname.startsWith('/en') ? '/en/' : '/'))));
    return;
  }
  event.respondWith(caches.match(event.request).then((hit) => hit || fetch(event.request).then((response) => {
    if (response.ok && response.status === 200) { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); }
    return response;
  })));
});
