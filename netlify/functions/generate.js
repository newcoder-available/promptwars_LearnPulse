/**
 * Netlify Function: /api/generate
 * Same brain as server/index.js, deployed serverless so the whole app
 * (frontend + API) lives on one Netlify site. The Gemini key comes from
 * Netlify environment variables — never from the repo.
 */
import { buildPrompt } from "../../server/prompts.js";
import { mockResponse } from "../../server/mock.js";

const MODEL = "gemini-2.0-flash";
const ALLOWED_TASKS = new Set([
  "diagnostic",
  "nextQuestion",
  "explain",
  "teachback",
  "misconception",
  "pulseFeed",
]);

const clean = (s = "", max = 2000) =>
  String(s).replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, max).trim();

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "POST only." }, 405);

  try {
    const body = await req.json();
    const task = clean(body.task, 40);
    if (!ALLOWED_TASKS.has(task)) return json({ error: "Unknown task." }, 400);

    const payload = {
      subject: clean(body.subject, 120),
      interest: clean(body.interest, 120),
      concept: clean(body.concept, 160),
      city: clean(body.city, 120),
      difficulty: Math.min(5, Math.max(1, Number(body.difficulty) || 2)),
      learnerAnswer: clean(body.learnerAnswer, 1500),
      mastery: body.mastery && typeof body.mastery === "object" ? body.mastery : {},
    };

    const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
    if (!GEMINI_KEY) return json({ mock: true, data: mockResponse(task, payload) });

    const prompt = buildPrompt(task, payload);
    const grounded = task === "pulseFeed";
    const geminiBody = {
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
        body: JSON.stringify(geminiBody),
      }
    );

    if (!r.ok) throw new Error(`Gemini ${r.status}`);
    const out = await r.json();
    const text = out?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ?? "{}";
    return json({ mock: false, data: JSON.parse(text.replace(/```json|```/g, "").trim()) });
  } catch (err) {
    console.error("generate failed:", err.message);
    return json({ error: "Generation failed. Try again." }, 502);
  }
};

export const config = { path: "/api/generate" };
