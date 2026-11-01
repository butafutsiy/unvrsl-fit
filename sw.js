"use strict";
// Refresh shell for per-session working sets and compact rest timer.
const SW_RELEASE = "v563",
  CACHE_PREFIX = "unvrsl-",
  SHELL = `${CACHE_PREFIX}shell-${SW_RELEASE}`,
  MEDIA = `${CACHE_PREFIX}media-${SW_RELEASE}`;
// Exact versioned URLs only: never return an asset from another release.
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    const response = await fetch("./index.html", {cache:"reload"});
    if(!response.ok) throw new Error("New app shell is not reachable");
    const html = await response.clone().text();
    const urls = [
      ...[...html.matchAll(/<script src="([^"]+)"/g)].map(x=>x[1]),
      ...[...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(x=>x[1])
    ];
    // An optional image, offline catalog, or delayed module must not block a new release.
    const requiredNames = new Set(["app.js","focus-workout.js","focus-cardio-ui.js","cardio-workout-brief.js","pwa-refresh-ui.js"]);
    const required = [...new Set(urls.filter(url=>requiredNames.has(url.split("?")[0])))];
    await Promise.all(required.map(url=>cache.add(url)));
    await cache.put("./index.html",response);
    const optional = [...new Set([
      ...urls,
      "assets/story-plates-v472.png",
      "assets/story-atlas-gym-v473.png",
      "assets/story-atlas-vehicles-v473.png",
      "assets/story-atlas-animals-v473.png",
      "assets/story-atlas-heavy-v473.png",
      "intake.html","intake.css?v=561","intake-page.js?v=561","intake-wizard.js?v=561",
      "data/anatome-body-paths.json"
    ])].filter(url=>!required.includes(url));
    const fetchOptional = async list=>{
      const workers = Array.from({length:Math.min(6,list.length)},async(_,i)=>{
        for(let j=i;j<list.length;j+=6){
          try{await cache.add(list[j]);}
          catch(error){console.warn("PWA optional cache miss",list[j],error);}
        }
      });
      await Promise.all(workers);
    };
    await fetchOptional(optional);
    const loaderSrc = urls.find(url=>url.startsWith("frequent-patch.js?v="));
    const loader = loaderSrc ? await cache.match(loaderSrc) : null;
    if(loader){
      const source = await loader.text();
      const dynamic = [...new Set([...source.matchAll(/["']([a-z][a-z0-9-]*\.js(?:\?v=\d+)?)["']/g)]
        .map(x=>x[1].replace(/\?v=\d+$/,"")+ "?v="+SW_RELEASE.slice(1)))];
      await fetchOptional(dynamic);
    }
    await self.skipWaiting();
  })());
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
          return (await cache.match(u.pathname.endsWith("/intake.html") ? "intake.html" : "./index.html")) || Response.error();
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
