/**
 * api.js — single gateway to the LearnPulse server.
 * Efficiency: caches identical requests + dedupes in-flight calls
 * so rapid clicks never fire duplicate Gemini requests.
 */

// Dev: talk to the local Express server. Production (Netlify): same-origin function.
const BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:8787" : "");

const cache = new Map();     // key -> data (session cache)
const inFlight = new Map();  // key -> promise (dedupe)

export async function generate(task, payload = {}, { cacheable = false } = {}) {
  const key = cacheable ? task + JSON.stringify(payload) : null;

  if (key && cache.has(key)) return cache.get(key);
  if (key && inFlight.has(key)) return inFlight.get(key);

  const p = (async () => {
    const r = await fetch(`${BASE}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task, ...payload }),
    });
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      throw new Error(body.error || `Request failed (${r.status})`);
    }
    const { data } = await r.json();
    if (key) cache.set(key, data);
    return data;
  })();

  if (key) inFlight.set(key, p);
  try {
    return await p;
  } finally {
    if (key) inFlight.delete(key);
  }
}
