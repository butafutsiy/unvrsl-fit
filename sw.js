"use strict";
const SW_RELEASE = "v403",
  CACHE_PREFIX = "unvrsl-",
  SHELL = `${CACHE_PREFIX}shell-${SW_RELEASE}`,
  MEDIA = `${CACHE_PREFIX}media-${SW_RELEASE}`;
// Exact versioned URLs only: never return an asset from another release.
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      const response = await fetch("./index.html", { cache: "reload" });
      if (!response.ok) throw new Error("Shell download failed");
      const html = await response.clone().text();
      const urls = [
        ...[...html.matchAll(/<script src="([^"]+)"/g)].map((x) => x[1]),
        ...[...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((x) => x[1]),
      ];
      await cache.addAll(urls);
      // The boot gate also needs dynamically loaded local owners when offline.
      // Resolve their exact current URLs from the installed loader itself.
      const loader = await cache.match(`frequent-patch.js?v=${SW_RELEASE.slice(1)}`);
      if (loader) {
        const source = await loader.text();
        const dynamic = [...source.matchAll(/["']([a-z][a-z0-9-]*\.js(?:\?v=\d+)?)["']/g)]
          .map(x => x[1].replace(/\?v=\d+$/, "") + `?v=${SW_RELEASE.slice(1)}`);
        await cache.addAll([...new Set(dynamic)]);
      }
      await cache.put("./index.html", response);
      await self.skipWaiting();
    })(),
  );
});
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (k) =>
              /^unvrsl-(?:shell|media|cache|assets|v\d)/.test(k) &&
              ![SHELL, MEDIA].includes(k),
          )
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
      for (const c of await self.clients.matchAll({ type: "window" }))
        c.postMessage({ type: "UNVRSL_RELEASE_READY", release: SW_RELEASE });
    })(),
  ),
);
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING" || event.data === "SKIP_WAITING")
    self.skipWaiting();
});
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const u = new URL(req.url);
  const trustedMedia =
    u.origin === "https://raw.githubusercontent.com" &&
    u.pathname.startsWith("/hasaneyldrm/exercises-dataset/") &&
    /\.(gif|png|jpg)$/.test(u.pathname);
  if (u.origin !== self.location.origin && !trustedMedia) return;
  if (
    !(
      /\.(?:js|css|json|png|svg|gif|jpg|webmanifest)$/.test(u.pathname) ||
      req.mode === "navigate"
    )
  )
    return;
  event.respondWith(
    (async () => {
      const isMedia = /\.(gif|png|jpg|svg)$/.test(u.pathname),
        cache = await caches.open(isMedia ? MEDIA : SHELL);
      if (req.mode === "navigate") {
        try {
          const r = await fetch(req, { cache: "no-cache" });
          if (r.ok) return r;
          throw new Error("Navigation unavailable");
        } catch {
          return (await cache.match("./index.html")) || Response.error();
        }
      }
      const cached = await cache.match(req);
      if (cached) return cached;
      const response = await fetch(req);
      if (response.ok) {
        await cache.put(req, response.clone());
        if (isMedia) {
          const keys = await cache.keys();
          if (keys.length > 220) await cache.delete(keys[0]);
        }
      }
      return response;
    })(),
  );
});
