import { describe, it, expect } from "vitest";
import {
  updateMastery,
  isMisconceptionAlert,
  isFragile,
  weakestConcept,
  difficultyFor,
  applyDecay,
  fadingConcepts,
  conceptsNeedingReview,
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

describe("boundaries and edges", () => {
  it("difficultyFor hits every band boundary exactly", () => {
    expect(difficultyFor(0)).toBe(1);
    expect(difficultyFor(24)).toBe(1);
    expect(difficultyFor(25)).toBe(2);
    expect(difficultyFor(44)).toBe(2);
    expect(difficultyFor(45)).toBe(3);
    expect(difficultyFor(64)).toBe(3);
    expect(difficultyFor(65)).toBe(4);
    expect(difficultyFor(84)).toBe(4);
    expect(difficultyFor(85)).toBe(5);
    expect(difficultyFor(100)).toBe(5);
  });

  it("unknown confidence applies no delta", () => {
    const m = updateMastery({ A: 50 }, "A", { correct: true, confidence: "nonsense" });
    expect(m.A).toBe(50);
  });

  it("decay never goes below zero and ignores future timestamps", () => {
    const now = Date.now();
    const longAgo = now - 30 * 86_400_000;
    const decayed = applyDecay({ A: 10 }, { A: longAgo }, now);
    expect(decayed.A).toBe(0);
    const future = applyDecay({ B: 60 }, { B: now + 86_400_000 }, now);
    expect(future.B).toBe(60);
  });
});

describe("overallPulse", () => {
  it("averages mastery and handles empty state", () => {
    expect(overallPulse({ A: 40, B: 60 })).toBe(50);
    expect(overallPulse({})).toBe(0);
  });
});

describe("conceptsNeedingReview", () => {
  it("returns fading concepts before weak-but-not-fading ones, weakest first", () => {
    const mastery = { Strong: 90, Fading: 30, Weak: 58, AlsoFading: 10 };
    const result = conceptsNeedingReview(mastery);
    expect(result).toEqual(["AlsoFading", "Fading", "Weak"]);
  });

  it("never double-counts a concept as both fading and weak", () => {
    const mastery = { A: 20 }; // below both thresholds
    const result = conceptsNeedingReview(mastery);
    expect(result).toEqual(["A"]);
    expect(new Set(result).size).toBe(result.length);
  });

  it("returns nothing when every concept is healthy", () => {
    expect(conceptsNeedingReview({ A: 70, B: 95 })).toEqual([]);
  });

  it("respects custom thresholds", () => {
    expect(conceptsNeedingReview({ A: 55 }, 50, 60)).toEqual(["A"]); // weak, not fading
    expect(conceptsNeedingReview({ A: 55 }, 60, 60)).toEqual(["A"]); // now counts as fading
  });

  it("stays consistent with fadingConcepts for the fading half", () => {
    const mastery = { A: 10, B: 80, C: 40 };
    const fading = fadingConcepts(mastery);
    const review = conceptsNeedingReview(mastery);
    for (const c of fading) expect(review).toContain(c);
  });
});
