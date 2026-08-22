import { overallPulse, fadingConcepts } from "../lib/knowledgeTracker.js";
import { TEACHBACK_UNLOCK } from "../lib/constants.js";
import { buildPulseReport } from "../lib/pulseReport.js";
import PulseLine from "./PulseLine.jsx";

/** Tiny SVG sparkline of overall pulse across sessions. */
function TrendSpark({ history }) {
  if (history.length < 2) return null;
  const w = 140, h = 36, pad = 4;
  const min = Math.min(...history), max = Math.max(...history);
  const span = Math.max(1, max - min);
  const pts = history
    .map((v, i) => {
      const x = pad + (i * (w - 2 * pad)) / (history.length - 1);
      const y = h - pad - ((v - min) * (h - 2 * pad)) / span;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} role="img" aria-label={`Pulse trend across ${history.length} sessions`}>
      <polyline points={pts} fill="none" stroke="var(--pulse)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** +N / −N / — badge for a concept's change since the session started. */
function Delta({ value }) {
  if (value > 0) return <span className="delta up">▲ +{value}</span>;
  if (value < 0) return <span className="delta down">▼ {value}</span>;
  return <span className="delta flat">—</span>;
}

/** The Knowledge Pulse map: mastery bars, session progress, and review nudges. */
export default function Dashboard({ mastery, signals, sessionStart = {}, pulseHistory = [], profile = {}, onContinue, onTeachBack }) {
  /** Download the session as a Markdown Pulse Report. */
  const downloadReport = () => {
    const md = buildPulseReport(profile, mastery, sessionStart, signals);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "learnpulse-report.md";
    link.click();
    URL.revokeObjectURL(url);
  };

  const pulse = overallPulse(mastery);
  const fading = fadingConcepts(mastery);
  const strongest = Object.entries(mastery).sort((a, b) => b[1] - a[1])[0];

  const prevPulse = overallPulse(sessionStart);
  const hadBaseline = Object.keys(sessionStart).length > 0;
  const pulseDelta = pulse - prevPulse;

  return (
    <section className="card" aria-labelledby="db-title">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 id="db-title">Knowledge Pulse</h2>
        <span className="mono" style={{ fontSize: 28, color: "var(--pulse)" }}>{pulse}%</span>
      </div>

      <PulseLine pulse={pulse} />

      {/* Previous vs current: how this session moved the needle */}
      <div className="trend-wrap">
        {hadBaseline && (
          <p style={{ margin: 0 }} role="status">
            This session: <span className="mono">{prevPulse}%</span> →{" "}
            <span className="mono">{pulse}%</span> <Delta value={pulseDelta} />
          </p>
        )}
        {pulseHistory.length >= 2 && (
          <>
            <TrendSpark history={pulseHistory} />
            <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
              {pulseHistory.length} sessions
            </span>
          </>
        )}
      </div>

      <ul style={{ listStyle: "none", padding: 0, margin: "18px 0" }}>
        {Object.entries(mastery).map(([concept, score]) => {
          const delta = score - (sessionStart[concept] ?? (hadBaseline ? 30 : score));
          return (
            <li key={concept} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span>{concept}</span>
                <span className="mono" style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                  {hadBaseline && delta !== 0 && <><Delta value={delta} />{" "}</>}
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
          );
        })}
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
        {strongest && strongest[1] >= TEACHBACK_UNLOCK && (
          <button onClick={() => onTeachBack(strongest[0])}>
            Teach-Back: {strongest[0]}
          </button>
        )}
        <button onClick={downloadReport}>Download Pulse Report</button>
      </div>
    </section>
  );
}
