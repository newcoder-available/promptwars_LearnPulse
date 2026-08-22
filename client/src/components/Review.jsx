import { fadingConcepts, conceptsNeedingReview } from "../lib/knowledgeTracker.js";

/**
 * Review: unlike "Continue learning" (which always targets the single
 * weakest concept), this view lists every fading/weak concept so the
 * learner picks exactly what to revise.
 */
export default function Review({ mastery, onReviewConcept, onBack }) {
  const fading = fadingConcepts(mastery);
  const toReview = conceptsNeedingReview(mastery);

  if (toReview.length === 0) {
    return (
      <section className="card" aria-labelledby="review-title">
        <h2 id="review-title">Nothing to review right now</h2>
        <p style={{ color: "var(--ink-soft)" }}>
          Every concept is holding steady above 60%. Come back after a break — memory naturally
          fades over time, and this page will fill up with concepts worth revisiting.
        </p>
        <button className="btn-primary" onClick={onBack}>
          Back to Pulse Map
        </button>
      </section>
    );
  }

  return (
    <section aria-labelledby="review-title">
      <h2 id="review-title">Review</h2>
      <p style={{ color: "var(--ink-soft)", marginTop: -6 }}>
        These concepts are fading or still weak. Pick one to get a fresh question targeted at it.
      </p>

      {toReview.map((concept) => {
        const score = mastery[concept];
        const isFading = fading.includes(concept);
        return (
          <article key={concept} className="card" style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <strong>{concept}</strong>{" "}
                <span className={`badge ${isFading ? "" : "alert"}`} style={isFading ? { color: "var(--fragile)", borderColor: "var(--fragile)" } : undefined}>
                  {score}% {isFading ? "· fading" : "· weak"}
                </span>
              </div>
              <button className="btn-primary" onClick={() => onReviewConcept(concept)} aria-label={`Review ${concept}, currently ${score} percent`}>
                Review this
              </button>
            </div>
            <div
              className="bar-track"
              style={{ marginTop: 10 }}
              role="progressbar"
              aria-valuenow={score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${concept} mastery`}
            >
              <div className={`bar-fill${isFading ? " fading" : ""}`} style={{ width: `${score}%` }} />
            </div>
          </article>
        );
      })}
    </section>
  );
}
