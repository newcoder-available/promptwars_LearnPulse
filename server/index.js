/**
 * LearnPulse API server
 * ---------------------
 * Security: the Gemini API key lives ONLY here (never in the browser).
 * All client requests are validated + sanitized before reaching Gemini.
 * If no key is configured, the server falls back to MOCK mode so the
 * app always demos smoothly.
 */
import express from "express";
import cors from "cors";
import fs from "node:fs";
import { buildPrompt } from "./prompts.js";
import { mockResponse } from "./mock.js";

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

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const MODEL = "gemini-3.5-flash";
const ALLOWED_TASKS = new Set([
  "diagnostic",
  "nextQuestion",
  "explain",
  "teachback",
  "misconception",
  "pulseFeed",
]);

/** Basic input sanitation: strip control chars, cap length. */
const clean = (s = "", max = 2000) =>
  String(s).replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, max).trim();

app.post("/api/generate", async (req, res) => {
  try {
    const task = clean(req.body.task, 40);
    if (!ALLOWED_TASKS.has(task)) {
      return res.status(400).json({ error: "Unknown task." });
    }

    const payload = {
      subject: clean(req.body.subject, 120),
      interest: clean(req.body.interest, 120),
      concept: clean(req.body.concept, 160),
      city: clean(req.body.city, 120),
      difficulty: Math.min(5, Math.max(1, Number(req.body.difficulty) || 2)),
      learnerAnswer: clean(req.body.learnerAnswer, 1500),
      mastery: req.body.mastery && typeof req.body.mastery === "object" ? req.body.mastery : {},
    };

    // Mock mode: zero-setup demo resilience.
    if (!GEMINI_KEY) {
      return res.json({ mock: true, data: mockResponse(task, payload) });
    }

    const prompt = buildPrompt(task, payload);

    // pulseFeed needs live web data -> Google Search grounding.
    // Grounded calls can't force JSON output mode, so we parse defensively.
    const grounded = task === "pulseFeed";
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      ...(grounded
        ? { tools: [{ google_search: {} }], generationConfig: { temperature: 0.4 } }
        : { generationConfig: { temperature: 0.7, responseMimeType: "application/json" } }),
    };

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!r.ok) throw new Error(`Gemini ${r.status}`);
    const out = await r.json();
    const text = out?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ?? "{}";
    const jsonText = text.replace(/```json|```/g, "").trim();
    res.json({ mock: false, data: JSON.parse(jsonText) });
  } catch (err) {
    console.error("generate failed:", err.message);
    res.status(502).json({ error: "Generation failed. Try again." });
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () =>
  console.log(
    `LearnPulse API on :${PORT} ${GEMINI_KEY ? "(Gemini live)" : "(MOCK mode — set GEMINI_API_KEY)"}`
  )
);
