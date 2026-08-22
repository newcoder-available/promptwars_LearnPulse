import { useEffect, useRef, useState } from "react";
import { generate } from "../lib/api.js";
import MicButton from "./MicButton.jsx";

/**
 * Smart Notes: type any topic word (e.g. "Token") → as you type, AI
 * live-suggests distinct interpretations across fields (debounced,
 * fires automatically at 3+ characters — no button press needed) →
 * one click generates a structured, Notion-style note.
 */
export default function Notes({ goal }) {
  const [topic, setTopic] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  const suggest = async (word) => {
    const w = (word ?? topic).trim();
    if (!w) return;
    setLoading("suggest");
    setError("");
    try {
      const data = await generate("noteSuggest", { topic: w }, { cacheable: true });
      setSuggestions(data.suggestions || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading("");
    }
  };

  // Live auto-suggest: 3+ characters, 500ms after the learner stops typing —
  // so "Token" surfaces "Token of AI", "Token Economy" etc. without a click.
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (topic.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => suggest(topic), 500);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  const createNote = async (title) => {
    if (notes.some((n) => n.title === title)) return; // no duplicates
    setLoading(title);
    setError("");
    try {
      const data = await generate("noteCreate", { topic: title, goal }, { cacheable: true });
      setNotes((n) => [data, ...n]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading("");
    }
  };

  const createAll = async () => {
    for (const s of suggestions) {
      // Sequential on purpose: keeps within rate limits (efficiency).
      await createNote(s.title);
    }
  };

  const noteToMarkdown = (n) =>
    [
      `# ${n.title}`,
      `*Field: ${n.field}*`,
      ``,
      n.summary,
      ``,
      `## Key points`,
      ...(n.keyPoints || []).map((k) => `- ${k}`),
      ``,
      `## Example`,
      n.example,
      ``,
      `## Related concepts`,
      (n.relatedConcepts || []).join(" · "),
      ``,
      `> Quick recall: ${n.quickRecall}`,
      ``,
    ].join("\n");

  const download = (content, filename) => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // PDF export via the browser's native print dialog — works everywhere,
  // no library, and produces a real, universally-openable PDF (choose
  // "Save as PDF" as the destination). Markdown stays available for
  // people who specifically want plain text.
  const printAsPdf = (note) => {
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    const keyPointsHtml = (note.keyPoints || []).map((k) => "<li>" + k + "</li>").join("");
    const related = (note.relatedConcepts || []).join(" · ");
    win.document.write(
      "<html><head><title>" + note.title + " — LearnPulse</title>" +
      "<style>" +
      "body{font-family:Georgia,serif;max-width:640px;margin:40px auto;color:#10312e;line-height:1.6;}" +
      "h1{font-family:sans-serif;}" +
      ".field{color:#5a7370;font-style:italic;margin-top:-8px;}" +
      ".recall{background:#fdf6ec;border-left:3px solid #e8a13c;padding:10px 16px;margin-top:20px;}" +
      "</style></head><body>" +
      "<h1>" + note.title + "</h1>" +
      "<p class=\"field\">Field: " + note.field + "</p>" +
      "<p>" + note.summary + "</p>" +
      "<h3>Key points</h3><ul>" + keyPointsHtml + "</ul>" +
      "<h3>Example</h3><p>" + note.example + "</p>" +
      "<h3>Related concepts</h3><p>" + related + "</p>" +
      "<p class=\"recall\">Quick recall: " + note.quickRecall + "</p>" +
      "</body></html>"
    );
    win.document.close();
    win.focus();
    setTimeout(function () { win.print(); }, 300);
  };

  return (
    <section aria-labelledby="notes-title">
      <h2 id="notes-title">Smart Notes</h2>
      <p style={{ color: "var(--ink-soft)", marginTop: -6 }}>
        Type one word — I'll show what it means across different fields, then write the notes for you.
      </p>

      <div className="card" style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 240px" }}>
          <label htmlFor="note-topic" style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>
            Topic word or phrase
          </label>
          <input
            id="note-topic"
            type="text"
            maxLength={160}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && suggest()}
            placeholder='Start typing… e.g. "Token"'
          />
        </div>
        <MicButton label="Speak topic" onText={(t) => setTopic(t)} />
        <span style={{ fontSize: 13, color: "var(--ink-soft)", alignSelf: "center" }}>
          {loading === "suggest" ? "Thinking…" : "Suggestions appear as you type"}
        </span>
      </div>

      {error && <p className="error-box" role="alert">{error}</p>}

      {suggestions.length > 0 && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <h3 style={{ margin: 0 }}>"{topic}" can mean…</h3>
            <button onClick={createAll} disabled={Boolean(loading)}>
              ✦ Create all notes
            </button>
          </div>
          <div className="suggest-grid" style={{ marginTop: 14 }}>
            {suggestions.map((s) => (
              <button
                key={s.title}
                className="suggest"
                disabled={loading === s.title || notes.some((n) => n.title === s.title)}
                onClick={() => createNote(s.title)}
              >
                <strong>{s.title}</strong>
                <span>{s.field} — {s.hook}</span>
                <span style={{ display: "block", marginTop: 6, color: "var(--focus)", fontWeight: 600 }}>
                  {loading === s.title ? "Writing…" : notes.some((n) => n.title === s.title) ? "✓ Created" : "+ Create note"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {notes.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 24 }}>
            <h3 style={{ margin: 0 }}>Your notes ({notes.length})</h3>
            <button
              onClick={() => download(notes.map(noteToMarkdown).join("\n---\n\n"), "learnpulse-notes.md")}
            >
              Download all (.md)
            </button>
          </div>
          {notes.map((n) => (
            <article key={n.title} className="card" style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <h3 style={{ margin: 0 }}>{n.title}</h3>
                <span className="badge pulse">{n.field}</span>
              </div>
              <p>{n.summary}</p>
              <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
                {(n.keyPoints || []).map((k, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>{k}</li>
                ))}
              </ul>
              <p style={{ fontSize: 15 }}>
                <strong>Example:</strong> {n.example}
              </p>
              <p style={{ fontSize: 14, color: "var(--ink-soft)" }}>
                Related: {(n.relatedConcepts || []).join(" · ")}
              </p>
              <p className="hint" style={{ marginTop: 10 }}>
                🧠 <strong>Quick recall:</strong> {n.quickRecall}
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button className="btn-primary" onClick={() => printAsPdf(n)} aria-label={`Save ${n.title} note as PDF`}>
                  Save as PDF
                </button>
                <button
                  onClick={() => download(noteToMarkdown(n), `${n.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.md`)}
                  aria-label={`Download ${n.title} note as markdown`}
                >
                  Download (.md)
                </button>
              </div>
            </article>
          ))}
        </>
      )}
    </section>
  );
}
