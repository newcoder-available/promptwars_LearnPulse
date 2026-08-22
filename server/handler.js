/**
 * handler.js — the ENTIRE /api/generate brain, platform-agnostic.
 * Both the Netlify function and the Vercel function are thin adapters
 * that call this one function. Edit prompts, security, or fallback
 * behavior here ONCE and both deployments pick it up automatically.
 */
import { buildPrompt } from "./prompts.js";
import { mockResponse } from "./mock.js";

const MODEL = "gemini-3.5-flash";
const ALLOWED_TASKS = new Set([
  "diagnostic",
  "nextQuestion",
  "explain",
  "teachback",
  "misconception",
  "pulseFeed",
  "noteSuggest",
  "noteCreate",
]);

const clean = (s = "", max = 2000) =>
  String(s).replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, max).trim();

const sanitizePayload = (body) => ({
  subject: clean(body.subject, 120),
  goal: clean(body.goal, 60),
  concept: clean(body.concept, 160),
  targetConcept: clean(body.targetConcept, 160),
  topic: clean(body.topic, 160),
  city: clean(body.city, 120),
  difficulty: Math.min(5, Math.max(1, Number(body.difficulty) || 2)),
  learnerAnswer: clean(body.learnerAnswer, 1500),
  mastery: body.mastery && typeof body.mastery === "object" ? body.mastery : {},
});

/**
 * Runs one /api/generate request end-to-end.
 * @param {object} body   parsed JSON request body
 * @returns {Promise<{status:number, payload:object}>}
 */
export async function runGenerate(body = {}) {
  const task = clean(body.task, 40);

  if (!ALLOWED_TASKS.has(task)) {
    return { status: 400, payload: { error: "Unknown task." } };
  }

  const payload = sanitizePayload(body);
  const GEMINI_KEY = process.env.GEMINI_API_KEY || "";

  if (!GEMINI_KEY) {
    return { status: 200, payload: { mock: true, data: mockResponse(task, payload) } };
  }

  try {
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
    const data = JSON.parse(text.replace(/```json|```/g, "").trim());
    return { status: 200, payload: { mock: false, data } };
  } catch (err) {
    // Demo resilience: never show a dead end on a public link.
    // The real cause (rate limit / quota / model error) goes to the platform's function logs.
    console.error("generate failed, serving fallback:", err.message);
    try {
      const data = mockResponse(task, payload);
      data._fallback = true;
      return { status: 200, payload: { mock: true, data } };
    } catch {
      return { status: 502, payload: { error: "Generation failed. Try again." } };
    }
  }
}
