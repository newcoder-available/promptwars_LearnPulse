/**
 * constants.js — single source of truth for LearnPulse tuning values.
 * Centralizing these removes magic numbers from components and makes
 * the learning model's behavior auditable in one place.
 */

/** Mastery % a concept needs before Teach-Back unlocks for it. */
export const TEACHBACK_UNLOCK = 70;

/** Teach-Back explanation score (0–100) required to confirm mastery. */
export const TEACHBACK_PASS = 80;

/** Prior mastery assumed for a concept the learner hasn't been tested on. */
export const MASTERY_PRIOR = 30;

/** Concepts below this mastery % are flagged as "fading" for review. */
export const FADING_THRESHOLD = 50;

/** Milliseconds of inactivity on a question before a gentle hint appears. */
export const HINT_AFTER_MS = 25_000;

/** Number of questions in the initial diagnostic. */
export const DIAGNOSTIC_LENGTH = 5;

/** Post-answer pause (ms) so feedback is readable before advancing. */
export const ADVANCE_DELAY_CORRECT_MS = 900;
export const ADVANCE_DELAY_WRONG_MS = 2_600;
