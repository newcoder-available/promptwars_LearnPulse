import { overallPulse, fadingConcepts } from "../lib/knowledgeTracker.js";
import PulseLine from "./PulseLine.jsx";

/** The Knowledge Pulse map: per-concept mastery bars + fading-concept review nudge. */
export default function Dashboard({ mastery, signals, onContinue, onTeachBack }) {
  const pulse = overallPulse(mastery);
  const fading = fadingConcepts(mastery);
  const strongest = Object.entries(mastery).sort((a, b) => b[1] - a[1])[0];

  return (
    <section className="card" aria-labelledby="db-title">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 id="db-title">Knowledge Pulse</h2>
        <span className="mono" style={{ fontSize: 28, color: "var(--pulse)" }}>{pulse}%</span>
      </div>

      <PulseLine pulse={pulse} />

      <ul style={{ listStyle: "none", padding: 0, margin: "18px 0" }}>
        {Object.entries(mastery).map(([concept, score]) => (
          <li key={concept} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span>{concept}</span>
              <span className="mono" style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                {score}%{fading.includes(concept) ? " · fading" : ""}
              </span>
            </div>
            <div
              className="bar-track"
              role="progressbar"
              aria-valuenow={score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${concept} mastery`}
            >
              <div
                className={`bar-fill${fading.includes(concept) ? " fading" : ""}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      {signals.misconceptions.length > 0 && (
        <p className="hint" role="status">
          <strong>Misconception radar:</strong> {signals.misconceptions[signals.misconceptions.length - 1]}
        </p>
      )}
      {signals.fragile.length > 0 && (
        <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>
          Fragile (right but unsure): {[...new Set(signals.fragile)].join(", ")} — scheduled for review.
        </p>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
        <button className="btn-primary" onClick={onContinue}>
          Continue learning
        </button>
        {strongest && strongest[1] >= 70 && (
          <button onClick={() => onTeachBack(strongest[0])}>
            Teach-Back: {strongest[0]}
          </button>
        )}
      </div>
    </section>
  );
}
