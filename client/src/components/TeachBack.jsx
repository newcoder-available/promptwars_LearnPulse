import { useState } from "react";
import { generate } from "../lib/api.js";

/**
 * Teach-Back (Feynman) mode: the AI plays a confused student.
 * Mastery of a concept is only confirmed once the learner can teach it.
 */
export default function TeachBack({ subject, concept, onDone }) {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (answer.trim().length < 10) return;
    setLoading(true);
    setError("");
    try {
      const data = await generate("teachback", { subject, concept, learnerAnswer: answer });
      setResult(data);
      if (data.masteryConfirmed) setTimeout(() => onDone(true), 2600);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card" aria-labelledby="tb-title">
      <span className="badge alert">Teach-Back Mode</span>
      <h2 id="tb-title" style={{ marginTop: 10 }}>
        Now teach <em>me</em>: {concept}
      </h2>
      <p style={{ color: "var(--ink-soft)" }}>
        I'm a confused student. Explain {concept} to me in your own words — if I can't follow, I'll ask.
      </p>

      <label htmlFor="tb-input" className="sr-only" style={{ position: "absolute", left: -9999 }}>
        Your explanation
      </label>
      <textarea
        id="tb-input"
        rows={5}
        value={answer}
        maxLength={1500}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder={`Okay, so ${concept} works like this...`}
      />

      {error && <p className="error-box" role="alert">{error}</p>}

      {result && (
        <div className="hint" role="status" style={{ marginTop: 14 }}>
          <p style={{ margin: 0 }}>
            <span className="mono">score {result.score}/100</span> — {result.feedback}
          </p>
          {result.followUpQuestion && (
            <p style={{ marginBottom: 0 }}>
              <strong>🤔 "{result.followUpQuestion}"</strong>
            </p>
          )}
          {result.masteryConfirmed && (
            <p style={{ marginBottom: 0, color: "var(--pulse)", fontWeight: 600 }}>
              Mastery confirmed — you can teach it, you own it.
            </p>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <button className="btn-primary" disabled={loading || answer.trim().length < 10} onClick={submit}>
          {loading ? "Listening…" : result?.followUpQuestion ? "Answer follow-up" : "Teach it"}
        </button>
        <button onClick={() => onDone(false)}>Skip for now</button>
      </div>
    </section>
  );
}
