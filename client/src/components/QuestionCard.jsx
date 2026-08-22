import { useEffect, useRef, useState } from "react";
import { CONFIDENCE } from "../lib/knowledgeTracker.js";

const HINT_AFTER_MS = 25_000; // struggle timer → invisible rescue

const CONF_LABELS = [
  { key: CONFIDENCE.SURE, label: "I'm sure" },
  { key: CONFIDENCE.MAYBE, label: "Maybe" },
  { key: CONFIDENCE.GUESS, label: "Guessing" },
];

/**
 * One question with:
 *  - confidence selection (calibration signal)
 *  - struggle timer that offers a gentle hint
 *  - post-answer misconception feedback
 */
export default function QuestionCard({ q, index, total, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [confidence, setConfidence] = useState(CONFIDENCE.MAYBE);
  const [revealed, setRevealed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => {
    setSelected(null);
    setRevealed(false);
    setShowHint(false);
    startRef.current = Date.now();
    const t = setTimeout(() => setShowHint(true), HINT_AFTER_MS);
    return () => clearTimeout(t);
  }, [q]);

  const submit = () => {
    if (selected === null) return;
    setRevealed(true);
    const correct = selected === q.correctIndex;
    const misconception = correct ? null : q.options[selected]?.misconception || null;
    // Small pause so the learner sees the feedback before the next step.
    setTimeout(
      () =>
        onAnswer({
          correct,
          confidence,
          misconception,
          timeMs: Date.now() - startRef.current,
        }),
      correct ? 900 : 2600
    );
  };

  return (
    <section className="card" aria-labelledby="q-title">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="badge">{q.concept}</span>
        <span className="mono" style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          {index + 1} / {total} · lvl {q.difficulty}
        </span>
      </div>

      <h2 id="q-title" style={{ marginTop: 12, fontSize: 22 }}>{q.question}</h2>

      <div role="radiogroup" aria-label="Answer options">
        {q.options.map((opt, i) => {
          let cls = "option";
          if (revealed && i === q.correctIndex) cls += " correct";
          else if (revealed && i === selected) cls += " wrong";
          return (
            <button
              key={i}
              role="radio"
              aria-checked={selected === i}
              className={cls}
              disabled={revealed}
              onClick={() => setSelected(i)}
            >
              {opt.text}
            </button>
          );
        })}
      </div>

      {revealed && selected !== q.correctIndex && q.options[selected]?.misconception && (
        <p className="hint" role="status">
          <strong>Spotted a trap:</strong> {q.options[selected].misconception}. We'll work on this.
        </p>
      )}

      {!revealed && showHint && (
        <p className="hint" role="status">
          Stuck? Eliminate the options that feel too extreme — then trust the simplest one.
        </p>
      )}

      {!revealed && (
        <>
          <p style={{ fontWeight: 600, margin: "16px 0 6px" }}>How confident are you?</p>
          <div role="radiogroup" aria-label="Confidence" style={{ display: "flex", gap: 8 }}>
            {CONF_LABELS.map(({ key, label }) => (
              <button
                key={key}
                role="radio"
                aria-checked={confidence === key}
                className="option"
                style={{ width: "auto", marginBottom: 0 }}
                onClick={() => setConfidence(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            className="btn-primary"
            style={{ marginTop: 18 }}
            disabled={selected === null}
            onClick={submit}
          >
            Lock answer
          </button>
        </>
      )}
    </section>
  );
}
