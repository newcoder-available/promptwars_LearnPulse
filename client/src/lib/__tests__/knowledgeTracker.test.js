import { describe, it, expect } from "vitest";
import {
  updateMastery,
  isMisconceptionAlert,
  isFragile,
  weakestConcept,
  difficultyFor,
  applyDecay,
  overallPulse,
  CONFIDENCE,
} from "../knowledgeTracker.js";

describe("updateMastery", () => {
  it("rewards confident correct answers the most", () => {
    const m = updateMastery({ Loops: 50 }, "Loops", { correct: true, confidence: CONFIDENCE.SURE });
    expect(m.Loops).toBe(68);
  });

  it("penalises confident wrong answers the most", () => {
    const m = updateMastery({ Loops: 50 }, "Loops", { correct: false, confidence: CONFIDENCE.SURE });
    expect(m.Loops).toBe(30);
  });

  it("clamps to the 0–100 range", () => {
    expect(updateMastery({ A: 95 }, "A", { correct: true, confidence: CONFIDENCE.SURE }).A).toBe(100);
    expect(updateMastery({ A: 5 }, "A", { correct: false, confidence: CONFIDENCE.SURE }).A).toBe(0);
  });

  it("uses a prior of 30 for unseen concepts and never mutates input", () => {
    const original = {};
    const m = updateMastery(original, "New", { correct: true, confidence: CONFIDENCE.MAYBE });
    expect(m.New).toBe(42);
    expect(original).toEqual({});
  });
});

describe("signals", () => {
  it("flags confident+wrong as a misconception alert", () => {
    expect(isMisconceptionAlert({ correct: false, confidence: CONFIDENCE.SURE })).toBe(true);
    expect(isMisconceptionAlert({ correct: false, confidence: CONFIDENCE.GUESS })).toBe(false);
  });

  it("flags guess+correct as fragile knowledge", () => {
    expect(isFragile({ correct: true, confidence: CONFIDENCE.GUESS })).toBe(true);
    expect(isFragile({ correct: true, confidence: CONFIDENCE.SURE })).toBe(false);
  });
});

describe("adaptivity", () => {
  it("targets the weakest concept", () => {
    expect(weakestConcept({ A: 80, B: 20, C: 55 })).toBe("B");
    expect(weakestConcept({})).toBe(null);
  });

  it("maps mastery to difficulty bands", () => {
    expect(difficultyFor(10)).toBe(1);
    expect(difficultyFor(50)).toBe(3);
    expect(difficultyFor(90)).toBe(5);
  });
});

describe("memory decay", () => {
  it("decays unseen concepts and spares strong ones", () => {
    const now = Date.now();
    const twoDaysAgo = now - 2 * 86_400_000;
    const decayed = applyDecay({ Weak: 60, Strong: 90 }, { Weak: twoDaysAgo, Strong: twoDaysAgo }, now);
    expect(decayed.Weak).toBe(48);   // 60 - 6*2
    expect(decayed.Strong).toBe(84); // 90 - 3*2
  });
});

describe("overallPulse", () => {
  it("averages mastery and handles empty state", () => {
    expect(overallPulse({ A: 40, B: 60 })).toBe(50);
    expect(overallPulse({})).toBe(0);
  });
});
