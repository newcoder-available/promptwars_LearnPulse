/**
 * LearnPulse local dev API server (Express).
 * Thin adapter around server/handler.js — the same shared core used
 * by the Netlify and Vercel adapters. Security: the Gemini API key
 * lives ONLY server-side, loaded from .env, never sent to the browser.
 */
import express from "express";
import cors from "cors";
import fs from "node:fs";
import { runGenerate } from "./handler.js";

/* Tiny zero-dependency .env loader (never overrides real env vars). */
try {
  for (const line of fs.readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* no .env file — mock mode */
}

const app = express();
// Allow any localhost port in dev (Vite may hop 5173 -> 5174 if busy).
app.use(cors({ origin: /^http:\/\/localhost:\d+$/ }));
app.use(express.json({ limit: "50kb" })); // efficiency + DoS guard

app.post("/api/generate", async (req, res) => {
  const { status, payload } = await runGenerate(req.body);
  res.status(status).json(payload);
});

const PORT = process.env.PORT || 8787;
const hasKey = Boolean(process.env.GEMINI_API_KEY);
app.listen(PORT, () =>
  console.log(`LearnPulse API on :${PORT} ${hasKey ? "(Gemini live)" : "(MOCK mode — set GEMINI_API_KEY)"}`)
);
