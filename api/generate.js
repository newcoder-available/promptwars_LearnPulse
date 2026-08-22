/**
 * Vercel adapter for /api/generate. All logic lives in server/handler.js —
 * this file only translates Vercel's (req, res) shape to/from it.
 */
import { runGenerate } from "../server/handler.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only." });
  }
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const { status, payload } = await runGenerate(body);
  return res.status(status).json(payload);
}
