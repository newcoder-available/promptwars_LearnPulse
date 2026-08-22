/**
 * Netlify adapter for /api/generate. All logic lives in server/handler.js —
 * this file only translates Netlify's Request/Response shape to/from it.
 */
import { runGenerate } from "../../server/handler.js";

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "POST only." }, 405);
  const body = await req.json().catch(() => ({}));
  const { status, payload } = await runGenerate(body);
  return json(payload, status);
};

export const config = { path: "/api/generate" };
