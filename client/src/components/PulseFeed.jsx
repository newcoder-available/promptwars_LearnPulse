import { useState } from "react";
import { generate } from "../lib/api.js";

/**
 * Pulse Feed: live news + nearby events for the learner's subject,
 * fetched by Gemini with Google Search grounding.
 */
export default function PulseFeed({ subject }) {
  const [city, setCity] = useState("");
  const [feed, setFeed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await generate(
        "pulseFeed",
        { subject, city: city.trim() },
        { cacheable: true } // same subject+city = cached, no repeat searches
      );
      setFeed(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby="feed-title">
      <h2 id="feed-title">Discover: {subject}</h2>
      <p style={{ color: "var(--ink-soft)", marginTop: -6 }}>
        Fresh news and events around what you're learning — searched live by AI.
      </p>

      <div className="card" style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 220px" }}>
          <label htmlFor="city" style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>
            Your city (for nearby events)
          </label>
          <input
            id="city"
            type="text"
            maxLength={120}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="e.g. Gurugram"
          />
        </div>
        <button className="btn-primary" onClick={load} disabled={loading}>
          {loading ? "Searching…" : feed ? "Refresh" : "Find news & events"}
        </button>
      </div>

      {error && <p className="error-box" role="alert">{error}</p>}

      {loading && (
        <div className="card" role="status" aria-live="polite">
          <p className="mono" style={{ color: "var(--ink-soft)", margin: 0 }}>
            searching the web for your subject…
          </p>
        </div>
      )}

      {feed && !loading && (
        <>
          <h3 style={{ marginTop: 24 }}>Recent in {subject}</h3>
          {(feed.news || []).map((n, i) => (
            <article key={i} className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <strong>{n.title}</strong>
                <span className="badge">{n.date}{n.source ? ` · ${n.source}` : ""}</span>
              </div>
              <p style={{ margin: "8px 0 6px" }}>{n.summary}</p>
              <p style={{ margin: 0, fontSize: 14, color: "var(--ink-soft)" }}>
                <strong>Why it matters:</strong> {n.whyItMatters}
              </p>
            </article>
          ))}

          <h3 style={{ marginTop: 24 }}>Events {city ? `near ${city}` : "for you"}</h3>
          {(feed.events || []).map((ev, i) => (
            <article key={i} className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <strong>{ev.name}</strong>
                <span className={`badge ${ev.type === "online" ? "" : "pulse"}`}>{ev.type}</span>
              </div>
              <p style={{ margin: "8px 0 0" }}>{ev.summary}</p>
              <p className="mono" style={{ margin: "6px 0 0", fontSize: 13, color: "var(--ink-soft)" }}>
                {ev.when} · {ev.where}
              </p>
            </article>
          ))}

          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            AI-searched results — double-check dates and venues before attending.
          </p>
        </>
      )}
    </section>
  );
}
