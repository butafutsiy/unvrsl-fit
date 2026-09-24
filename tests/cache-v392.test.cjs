"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm");
function runtime() {
  const handlers = {},
    buckets = new Map(),
    requests = [],
    base = "https://app.test/unvrsl-fit/";
  let offline = false;
  const url = (x) => new URL(typeof x === "string" ? x : x.url, base).href;
  const fetch = async (req) => {
    requests.push(url(req));
    if (offline) throw Error("offline");
    return new Response(
      String(req).includes("index.html")
        ? fs.readFileSync("index.html", "utf8")
        : String(req).includes('frequent-patch.js')
          ? fs.readFileSync('frequent-patch.js','utf8')
          : "network:" + url(req),
    );
  };
  const caches = {
    async open(name) {
      if (!buckets.has(name)) buckets.set(name, new Map());
      const values = buckets.get(name);
      return {
        async put(k, v) {
          values.set(url(k), await v.clone().text());
        },
        async match(k) {
          const value = values.get(url(k));
          return value == null ? undefined : new Response(value);
        },
        async keys() {
          return [...values.keys()].map((url) => ({ url }));
        },
        async delete(k) {
          return values.delete(url(k));
        },
        async addAll(keys) {
          for (const k of keys) await this.put(k, await fetch(k));
        },
      };
    },
    async keys() {
      return [...buckets.keys()];
    },
    async delete(k) {
      return buckets.delete(k);
    },
  };
  const self = {
    location: { origin: "https://app.test" },
    addEventListener: (k, v) => (handlers[k] = v),
    skipWaiting: async () => {},
    clients: { claim: async () => {}, matchAll: async () => [] },
  };
  vm.runInNewContext(fs.readFileSync("sw.js", "utf8"), {
    self,
    caches,
    fetch,
    Response,
    URL,
  });
  async function event(name, data = {}) {
    let promise;
    handlers[name]({
      ...data,
      waitUntil: (p) => (promise = p),
      respondWith: (p) => (promise = p),
    });
    return promise ? await promise : undefined;
  }
  return { event, caches, buckets, requests, offline: () => (offline = true) };
}
test("23: activate removes old app caches while preserving unrelated caches", async () => {
  const r = runtime();
  await r.caches.open("unvrsl-shell-v391");
  await r.caches.open("other-app");
  await r.event("install");
  await r.event("activate");
  assert.equal(r.buckets.has("unvrsl-shell-v391"), false);
  assert.ok(r.buckets.has("other-app"));
  assert.ok(r.buckets.has("unvrsl-shell-v420"));
});
test("offline launch uses the fully installed current HTML and versioned scripts", async () => {
  const r = runtime();
  await r.event("install");
  r.offline();
  const html = await r.event("fetch", {
    request: {
      url: "https://app.test/unvrsl-fit/",
      method: "GET",
      mode: "navigate",
    },
  });
  assert.match(await html.text(), /workout-store.js\?v=420/);
  const script = await r.event("fetch", {
    request: { url: "https://app.test/unvrsl-fit/app.js?v=420", method: "GET" },
  });
  assert.match(await script.text(), /app.js\?v=420/);
  const owner = await r.event('fetch',{request:{url:'https://app.test/unvrsl-fit/trainer-shell.js?v=420',method:'GET'}});
  assert.match(await owner.text(),/trainer-shell.js\?v=420/);
});
test("a v391 URL can never satisfy a v420 script request", async () => {
  const r = runtime(),
    cache = await r.caches.open("unvrsl-shell-v420");
  await cache.put("./app.js?v=391", new Response("OLD"));
  const res = await r.event("fetch", {
    request: { url: "https://app.test/unvrsl-fit/app.js?v=420", method: "GET" },
  });
  assert.notEqual(await res.text(), "OLD");
  assert.equal(r.requests.length, 1);
});
test("exercise GIF is cached by exact stable URL and does not repeat network requests", async () => {
  const r = runtime(),
    request = {
      url: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/exercise.gif",
      method: "GET",
    };
  await r.event("fetch", { request });
  await r.event("fetch", { request });
  assert.equal(r.requests.length, 1);
});
test("API responses and user data are never put in the service worker asset cache", async () => {
  const r = runtime();
  assert.equal(
    await r.event("fetch", {
      request: { url: "https://db.example/rest/v1/workouts", method: "GET" },
    }),
    undefined,
  );
  assert.equal(r.buckets.size, 0);
});
