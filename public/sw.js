// Service worker minimal — l'app est en ligne (Supabase), donc :
//  - le HTML / les pages / les API ne sont JAMAIS mis en cache (toujours frais)
//  - seuls les assets immuables (/_next/static/* avec hash, /icon*) sont cachés
//  - à chaque mise à jour du SW, on PURGE tout l'ancien cache (fini les vieilles versions)
const CACHE = "anim-pa-v5";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k)))) // purge TOUT
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Assets immuables uniquement (hash dans l'URL) → cache-first, sans risque d'ancienneté.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icon")) {
    e.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
            return res;
          })
      )
    );
  }
  // Tout le reste (pages HTML, /membre, /animateur, API…) = réseau direct, jamais de cache.
});

// ── Notifications push ───────────────────────────────────────────────────────
self.addEventListener("push", (e) => {
  let data = { title: "Animation réseau PA", body: "", url: "/animateur", tag: undefined };
  try {
    if (e.data) data = Object.assign(data, e.data.json());
  } catch {
    if (e.data) data.body = e.data.text();
  }
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon",
      badge: "/icon",
      tag: data.tag,
      data: { url: data.url || "/animateur" },
      vibrate: [120, 60, 120],
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/animateur";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
