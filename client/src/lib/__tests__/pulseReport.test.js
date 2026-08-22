import { describe, it, expect } from "vitest";
import { buildPulseReport } from "../pulseReport.js";

const profile = { name: "Prashant", subject: "Python basics", goal: "Exam prep" };

describe("buildPulseReport", () => {
  it("includes learner, subject, goal, and overall pulse", () => {
    const r = buildPulseReport(profile, { Loops: 60, Lists: 40 });
    expect(r).toContain("**Learner:** Prashant");
    expect(r).toContain("**Subject:** Python basics");
    expect(r).toContain("**Goal:** Exam prep");
    expect(r).toContain("**Overall pulse:** 50%");
  });

  it("shows session delta when a baseline exists", () => {
    const r = buildPulseReport(profile, { Loops: 60 }, { Loops: 40 });
    expect(r).toContain("40% → 60%");
    expect(r).toContain("▲ +20");
  });

  it("sorts concepts by mastery descending and marks fading ones", () => {
    const r = buildPulseReport(profile, { Weak: 20, Strong: 90 });
    expect(r.indexOf("Strong")).toBeLessThan(r.indexOf("Weak"));
    expect(r).toContain("fading — review soon");
  });

  it("lists deduplicated misconceptions and fragile concepts", () => {
    const r = buildPulseReport(profile, { Loops: 50 }, {}, {
      misconceptions: ["range() includes stop", "range() includes stop"],
      fragile: ["Loops", "Loops"],
    });
    expect(r.match(/range\(\) includes stop/g)).toHaveLength(1);
    expect(r.match(/Loops — scheduled for review/g)).toHaveLength(1);
  });

  it("recommends the weakest concept as the next step", () => {
    const r = buildPulseReport(profile, { A: 80, B: 25 });
    expect(r).toContain("weakest concept: **B**");
  });

  it("handles an anonymous learner and empty signals safely", () => {
    const r = buildPulseReport({ subject: "X", goal: "" }, { A: 50 });
    expect(r).toContain("**Learner:** Anonymous");
    expect(r).toContain("**Goal:** Just curious");
    expect(r).not.toContain("Misconceptions caught");
  });
});
