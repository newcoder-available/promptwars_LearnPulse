/**
 * knowledgeTracker.js
 * -------------------
 * Pure functions only — no I/O, no framework. This is the "brain"
 * that makes LearnPulse adaptive, and it is fully unit-testable.
 *
 * Mastery model: 0–100 per concept.
 * Confidence matrix (confidence x correctness) drives update size:
 *   confident + correct  -> strong gain        (true mastery)
 *   confident + wrong    -> strong loss + flag (misconception!)
 *   unsure    + correct  -> small gain         (fragile knowledge)
 *   unsure    + wrong    -> small loss         (normal gap)
 */

export const CONFIDENCE = { SURE: "sure", MAYBE: "maybe", GUESS: "guess" };

const DELTAS = {
  [CONFIDENCE.SURE]: { correct: +18, wrong: -20 },
  [CONFIDENCE.MAYBE]: { correct: +12, wrong: -12 },
  [CONFIDENCE.GUESS]: { correct: +6, wrong: -6 },
};

const clamp = (n) => Math.max(0, Math.min(100, n));

/** Update mastery for one concept after an answer. Returns new mastery map. */
export function updateMastery(mastery, concept, { correct, confidence = CONFIDENCE.MAYBE }) {
  const current = mastery[concept] ?? 30; // sensible prior
  const delta = DELTAS[confidence]?.[correct ? "correct" : "wrong"] ?? 0;
  return { ...mastery, [concept]: clamp(current + delta) };
}

/** True when the answer pattern signals a misconception worth intervening on. */
export function isMisconceptionAlert({ correct, confidence }) {
  return !correct && confidence === CONFIDENCE.SURE;
}

/** Fragile knowledge = right answer, low confidence — schedule a review. */
export function isFragile({ correct, confidence }) {
  return correct && confidence === CONFIDENCE.GUESS;
}

/** Pick the concept with the lowest mastery (the next learning target). */
export function weakestConcept(mastery) {
  const entries = Object.entries(mastery);
  if (!entries.length) return null;
  return entries.reduce((min, cur) => (cur[1] < min[1] ? cur : min))[0];
}

/** Map mastery to question difficulty 1–5. */
export function difficultyFor(masteryScore) {
  if (masteryScore >= 85) return 5;
  if (masteryScore >= 65) return 4;
  if (masteryScore >= 45) return 3;
  if (masteryScore >= 25) return 2;
  return 1;
}

/**
 * Memory decay: mastery fades over time (spaced-repetition curve).
 * ~6 points/day, slower for well-mastered concepts.
 */
export function applyDecay(mastery, lastSeen, now = Date.now()) {
  const out = {};
  for (const [concept, score] of Object.entries(mastery)) {
    const days = Math.max(0, (now - (lastSeen[concept] ?? now)) / 86_400_000);
    const rate = score >= 80 ? 3 : 6; // strong memories fade slower
    out[concept] = clamp(Math.round(score - rate * days));
  }
  return out;
}

/** Concepts that decayed below the review threshold — "fading" on the Pulse map. */
export function fadingConcepts(mastery, threshold = 50) {
  return Object.entries(mastery)
    .filter(([, s]) => s < threshold)
    .map(([c]) => c);
}

/** Overall pulse = average mastery, for the dashboard headline. */
export function overallPulse(mastery) {
  const vals = Object.values(mastery);
  if (!vals.length) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}
