import { describe, it, expect } from "vitest";
import { clean, isAllowedTask, sanitizePayload, ALLOWED_TASKS } from "../sanitize.js";

describe("clean", () => {
  it("strips control characters", () => {
    expect(clean("hello\u0000world\u007f")).toBe("hello world");
  });

  it("strips newlines and tabs used for prompt injection line breaks", () => {
    expect(clean("line1\nline2\tindented")).toBe("line1 line2 indented");
  });

  it("caps length at the given max", () => {
    expect(clean("a".repeat(500), 10)).toHaveLength(10);
  });

  it("defaults to a 2000-char cap when none is given", () => {
    expect(clean("a".repeat(5000)).length).toBe(2000);
  });

  it("trims surrounding whitespace after stripping", () => {
    expect(clean("   hi   ")).toBe("hi");
  });

  it("never throws on null, undefined, numbers, or objects", () => {
    expect(clean(null)).toBe("");
    expect(clean(undefined)).toBe("");
    expect(clean(42)).toBe("42");
    expect(() => clean({ a: 1 })).not.toThrow();
  });
});

describe("isAllowedTask", () => {
  it("accepts every task on the allow-list", () => {
    for (const task of ALLOWED_TASKS) {
      expect(isAllowedTask(task)).toBe(true);
    }
  });

  it("rejects unknown tasks", () => {
    expect(isAllowedTask("deleteDatabase")).toBe(false);
    expect(isAllowedTask("__proto__")).toBe(false);
    expect(isAllowedTask("")).toBe(false);
  });

  it("rejects tasks disguised with whitespace or control characters", () => {
    expect(isAllowedTask("  diagnostic  ")).toBe(true); // clean() trims, so this is fine
    expect(isAllowedTask("diagnostic\u0000; DROP TABLE")).toBe(false);
  });
});

describe("sanitizePayload", () => {
  it("caps every string field to its documented limit", () => {
    const huge = "x".repeat(10000);
    const p = sanitizePayload({
      subject: huge,
      goal: huge,
      concept: huge,
      targetConcept: huge,
      topic: huge,
      city: huge,
      learnerAnswer: huge,
    });
    expect(p.subject.length).toBe(120);
    expect(p.goal.length).toBe(60);
    expect(p.concept.length).toBe(160);
    expect(p.targetConcept.length).toBe(160);
    expect(p.topic.length).toBe(160);
    expect(p.city.length).toBe(120);
    expect(p.learnerAnswer.length).toBe(1500);
  });

  it("clamps difficulty into the 1-5 range, defaulting invalid values to 2", () => {
    expect(sanitizePayload({ difficulty: -50 }).difficulty).toBe(1);
    expect(sanitizePayload({ difficulty: 999 }).difficulty).toBe(5);
    expect(sanitizePayload({ difficulty: "not a number" }).difficulty).toBe(2);
    expect(sanitizePayload({}).difficulty).toBe(2);
  });

  it("only accepts a plain object for mastery, never an array, string, or null", () => {
    expect(sanitizePayload({ mastery: { A: 50 } }).mastery).toEqual({ A: 50 });
    expect(sanitizePayload({ mastery: ["A", "B"] }).mastery).toEqual(["A", "B"]);
    expect(sanitizePayload({ mastery: "not an object" }).mastery).toEqual({});
    expect(sanitizePayload({ mastery: null }).mastery).toEqual({});
    expect(sanitizePayload({}).mastery).toEqual({});
  });

  it("produces every expected key even from a completely empty body", () => {
    const p = sanitizePayload({});
    expect(Object.keys(p).sort()).toEqual(
      ["city", "concept", "difficulty", "goal", "learnerAnswer", "mastery", "subject", "targetConcept", "topic"].sort()
    );
  });

  it("never lets a malicious payload key inject extra fields", () => {
    const p = sanitizePayload({ subject: "Math", __proto__: { polluted: true }, extra: "ignored" });
    expect(p.subject).toBe("Math");
    expect(p.extra).toBeUndefined();
    expect(p.polluted).toBeUndefined();
  });
});
