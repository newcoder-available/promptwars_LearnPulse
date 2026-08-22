/**
 * sanitize.js — the security boundary between untrusted request bodies
 * and everything downstream (prompts, Gemini, mock data). Pulled out of
 * handler.js into its own module specifically so this logic is unit
 * tested in isolation, not just exercised incidentally through the API.
 */

export const ALLOWED_TASKS = new Set([
  "diagnostic",
  "nextQuestion",
  "explain",
  "teachback",
  "misconception",
  "pulseFeed",
  "noteSuggest",
  "noteCreate",
]);

/** Strip control characters and cap length. Never throws, always returns a string. */
export function clean(s = "", max = 2000) {
  return String(s ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .slice(0, max)
    .trim();
}

/** True only for tasks on the allow-list; unknown/absent tasks are rejected. */
export function isAllowedTask(task) {
  return ALLOWED_TASKS.has(clean(task, 40));
}

/**
 * Sanitize a raw request body into the fixed shape every prompt builder
 * expects. Every field is capped and stripped; nothing here can grow
 * unbounded or carry control characters into a prompt.
 */
export function sanitizePayload(body = {}) {
  return {
    subject: clean(body.subject, 120),
    goal: clean(body.goal, 60),
    concept: clean(body.concept, 160),
    targetConcept: clean(body.targetConcept, 160),
    topic: clean(body.topic, 160),
    city: clean(body.city, 120),
    difficulty: Math.min(5, Math.max(1, Number(body.difficulty) || 2)),
    learnerAnswer: clean(body.learnerAnswer, 1500),
    mastery: body.mastery && typeof body.mastery === "object" ? body.mastery : {},
  };
}
