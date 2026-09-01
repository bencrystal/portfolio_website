// Service worker for the /practice PWA (registered with scope "/practice").
// Network-first with cache fallback for all GETs: pages, assets, and API
// reads all fall back to the last good copy when the network is gone, so the
// installed app opens and shows data offline. Writes are never intercepted —
// PracticeView queues those in localStorage and replays them itself.
const CACHE = "practice-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          e.waitUntil(caches.open(CACHE).then((c) => c.put(e.request, copy)));
        }
        return res;
      })
      .catch(async () => (await caches.match(e.request)) ?? Response.error())
  );
});
