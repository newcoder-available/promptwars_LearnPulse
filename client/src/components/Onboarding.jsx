import { useState } from "react";

const SUGGESTED_SUBJECTS = ["Python basics", "Fractions & ratios", "World War II", "Photosynthesis"];
const INTERESTS = ["Cricket", "Cooking", "Gaming", "Movies"];

/**
 * Captures WHAT to learn (any subject — Gemini builds the diagnostic)
 * and WHO is learning (an interest that powers the analogy engine).
 */
export default function Onboarding({ onStart }) {
  const [subject, setSubject] = useState("");
  const [interest, setInterest] = useState("");

  const ready = subject.trim().length >= 3 && interest.trim().length >= 3;

  return (
    <section className="card" aria-labelledby="ob-title">
      <span className="badge pulse">Step 1 · Your pulse starts here</span>
      <h2 id="ob-title" style={{ marginTop: 12 }}>What do you want to master?</h2>
      <p style={{ color: "var(--ink-soft)", marginTop: -4 }}>
        A short diagnostic maps what you already know. Then every question,
        explanation, and analogy adapts to you.
      </p>

      <label htmlFor="ob-subject" style={{ fontWeight: 600 }}>Subject</label>
      <input
        id="ob-subject"
        type="text"
        value={subject}
        maxLength={80}
        placeholder="e.g. Python basics"
        onChange={(e) => setSubject(e.target.value)}
        style={{ margin: "8px 0 6px" }}
      />
      <div role="group" aria-label="Suggested subjects" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
        {SUGGESTED_SUBJECTS.map((s) => (
          <button key={s} type="button" className="option" style={{ width: "auto", padding: "6px 12px", fontSize: 14 }}
            aria-pressed={subject === s} onClick={() => setSubject(s)}>
            {s}
          </button>
        ))}
      </div>

      <label id="ob-interest-label" style={{ fontWeight: 600 }}>
        Pick an interest — we explain things through it
      </label>
      <div role="radiogroup" aria-labelledby="ob-interest-label" style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0 6px" }}>
        {INTERESTS.map((i) => (
          <button key={i} type="button" role="radio" className="option"
            style={{ width: "auto", padding: "8px 16px" }}
            aria-checked={interest === i} onClick={() => setInterest(i)}>
            {i}
          </button>
        ))}
      </div>
      <input
        aria-label="Or type your own interest"
        type="text"
        value={INTERESTS.includes(interest) ? "" : interest}
        maxLength={60}
        placeholder="…or type your own (astronomy, F1, K-pop)"
        onChange={(e) => setInterest(e.target.value)}
        style={{ margin: "6px 0 20px" }}
      />

      <button className="btn-primary" disabled={!ready} onClick={() => onStart({ subject: subject.trim(), interest: interest.trim() })}>
        Read my pulse
      </button>
    </section>
  );
}
