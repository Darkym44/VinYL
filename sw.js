/* Vinile: copia offline della pagina. Le chiamate a Spotify/Deezer non vengono mai memorizzate. */
const VER = 'vinile-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VER).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VER).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;       /* solo i file della pagina */
  if (u.searchParams.has('code') || u.searchParams.has('error')) {       /* ritorno dal login Spotify: sempre la pagina, senza parametri nella chiave */
    e.respondWith(fetch(r).catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(
    caches.match(r, { ignoreSearch: true }).then((hit) => {
      const net = fetch(r).then((res) => {
        if (res && res.ok) { const cp = res.clone(); caches.open(VER).then((c) => c.put(r, cp)); }
        return res;
      }).catch(() => hit || caches.match('index.html'));
      return hit || net;                                                  /* subito dalla copia, aggiorna in sottofondo */
    })
  );
});
