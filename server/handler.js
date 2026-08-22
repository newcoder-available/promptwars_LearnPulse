/**
 * handler.js — the ENTIRE /api/generate brain, platform-agnostic.
 * Both the Netlify function and the Vercel function are thin adapters
 * that call this one function. Edit prompts, security, or fallback
 * behavior here ONCE and both deployments pick it up automatically.
 */
import { buildPrompt } from "./prompts.js";
import { mockResponse } from "./mock.js";
import { clean, isAllowedTask, sanitizePayload } from "./sanitize.js";

const MODEL = "gemini-3.5-flash";

/**
 * Runs one /api/generate request end-to-end.
 * @param {object} body   parsed JSON request body
 * @returns {Promise<{status:number, payload:object}>}
 */
export async function runGenerate(body = {}) {
  const task = clean(body.task, 40);

  if (!isAllowedTask(task)) {
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
