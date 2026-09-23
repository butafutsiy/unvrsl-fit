"use strict";
function memoryIndexedDB() {
  const stores = new Map();
  let created = false;
  const db = {
    createObjectStore(name) {
      if (!stores.has(name)) stores.set(name, new Map());
    },
    transaction(name) {
      const tx = {
        error: null,
        objectStore() {
          const values = stores.get(name);
          return {
            put(value, key) {
              values.set(key, structuredClone(value));
            },
            get(key) {
              const request = {};
              queueMicrotask(() => {
                request.result = structuredClone(values.get(key));
                request.onsuccess?.();
              });
              return request;
            },
          };
        },
      };
      setImmediate(() => tx.oncomplete?.());
      return tx;
    },
  };
  return {
    stores,
    open() {
      const request = {};
      queueMicrotask(() => {
        request.result = db;
        if (!created) {
          created = true;
          request.onupgradeneeded?.();
        }
        request.onsuccess?.();
      });
      return request;
    },
  };
}

module.exports = { memoryIndexedDB };
