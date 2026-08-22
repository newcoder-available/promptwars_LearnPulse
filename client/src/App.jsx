import { useCallback, useState } from "react";
import { generate } from "./lib/api.js";
import {
  updateMastery,
  isMisconceptionAlert,
  isFragile,
  weakestConcept,
  difficultyFor,
} from "./lib/knowledgeTracker.js";
import Sidebar from "./components/Sidebar.jsx";
import AgentPanel from "./components/AgentPanel.jsx";
import Home from "./components/Home.jsx";
import QuestionCard from "./components/QuestionCard.jsx";
import TeachBack from "./components/TeachBack.jsx";
import Dashboard from "./components/Dashboard.jsx";
import PulseLine from "./components/PulseLine.jsx";
import PulseFeed from "./components/PulseFeed.jsx";

/**
 * LearnPulse shell: sidebar | main view | Pulse Agent.
 * Learning loop: assess → track → adapt → feedback → visualize → teach-back.
 */
export default function App() {
  const [view, setView] = useState("home"); // home | learn | pulse | teachback
  const [name, setName] = useState("");
  const [profile, setProfile] = useState({ subject: "", interest: "" });
  const [mastery, setMastery] = useState({});
  const [signals, setSignals] = useState({ misconceptions: [], fragile: [] });
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [isDiagnostic, setIsDiagnostic] = useState(true);
  const [teachConcept, setTeachConcept] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  // Progress tracking: mastery at the start of the current session,
  // plus overall-pulse history across sessions for the trend line.
  const [sessionStart, setSessionStart] = useState({});
  const [pulseHistory, setPulseHistory] = useState([]);
  const [error, setError] = useState("");

  const started = Object.keys(mastery).length > 0;
  const strongestEntry = Object.entries(mastery).sort((a, b) => b[1] - a[1])[0];
  const strongest = strongestEntry && strongestEntry[1] >= 70 ? strongestEntry[0] : null;

  /* ── Diagnostic ─────────────────────────────────────────────── */
  const startDiagnostic = async (p) => {
    setProfile(p);
    setSessionStart({});
    setLoading(true);
    setError("");
    try {
      const data = await generate("diagnostic", { subject: p.subject }, { cacheable: true });
      setQuestions(data.questions);
      setQIndex(0);
      setIsDiagnostic(true);
      setView("learn");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Shared answer handler ──────────────────────────────────── */
  const handleAnswer = useCallback(
    async (q, res) => {
      const nextMastery = updateMastery(mastery, q.concept, res);
      setMastery(nextMastery);

      if (isMisconceptionAlert(res) && res.misconception) {
        setSignals((s) => ({ ...s, misconceptions: [...s.misconceptions, res.misconception] }));
        try {
          const data = await generate("misconception", {
            subject: profile.subject,
            interest: profile.interest,
            concept: q.concept,
            learnerAnswer: res.misconception,
          });
          setExplanation({ title: "About that trap…", body: data.lesson });
        } catch { /* non-blocking */ }
      } else if (isFragile(res)) {
        setSignals((s) => ({ ...s, fragile: [...s.fragile, q.concept] }));
      } else if (!res.correct) {
        try {
          const data = await generate("explain", {
            subject: profile.subject,
            interest: profile.interest,
            concept: q.concept,
          });
          setExplanation({ title: `Another way to see ${q.concept}`, body: data.explanation });
        } catch { /* non-blocking */ }
      }

      if (isDiagnostic && qIndex < questions.length - 1) {
        setQIndex((i) => i + 1);
      } else {
        const vals = Object.values(nextMastery);
        const pulseNow = vals.length ? Math.round(vals.reduce((x, y) => x + y, 0) / vals.length) : 0;
        setPulseHistory((h) => [...h, pulseNow]);
        setView("pulse");
      }
    },
    [mastery, profile, qIndex, questions.length, isDiagnostic]
  );

  /* ── Adaptive session ───────────────────────────────────────── */
  const continueLearning = async () => {
    if (!started) return;
    setSessionStart(mastery);
    setLoading(true);
    setError("");
    setExplanation(null);
    try {
      const target = weakestConcept(mastery);
      const data = await generate("nextQuestion", {
        subject: profile.subject,
        mastery,
        difficulty: difficultyFor(mastery[target] ?? 30),
      });
      setQuestions([data]);
      setQIndex(0);
      setIsDiagnostic(false);
      setView("learn");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const goTeachBack = (concept) => {
    if (!concept) return;
    setTeachConcept(concept);
    setView("teachback");
  };

  const confirmTeachBack = (confirmed) => {
    if (confirmed && teachConcept) {
      setMastery((m) => ({ ...m, [teachConcept]: 100 }));
    }
    setTeachConcept(null);
    setView("pulse");
  };

  const navigate = (id) => {
    setError("");
    if (id === "home") setView("home");
    else if (id === "learn" || id === "review") continueLearning();
    else if (id === "pulse") setView("pulse");
    else if (id === "discover") setView("discover");
  };

  return (
    <div className="shell">
      <Sidebar view={view === "teachback" ? "learn" : view} onNavigate={navigate} canLearn={started} />

      <main className="main">
        {error && (
          <p className="error-box" role="alert" style={{ marginBottom: 16 }}>
            {error} — check that the server terminal shows "LearnPulse API on :8787".
          </p>
        )}

        {loading && (
          <div className="card" role="status" aria-live="polite">
            <PulseLine pulse={45} />
            <p className="mono" style={{ textAlign: "center", color: "var(--ink-soft)" }}>
              reading your pulse…
            </p>
          </div>
        )}

        {!loading && view === "home" && (
          <Home name={name} onName={setName} onStart={startDiagnostic} />
        )}

        {!loading && view === "learn" && questions[qIndex] && (
          <QuestionCard
            q={questions[qIndex]}
            index={qIndex}
            total={isDiagnostic ? questions.length : 1}
            onAnswer={(res) => handleAnswer(questions[qIndex], res)}
          />
        )}

        {!loading && view === "pulse" && (
          <>
            {explanation && (
              <div className="card" role="status">
                <span className="badge pulse">{profile.interest} analogy</span>
                <h3 style={{ marginTop: 10 }}>{explanation.title}</h3>
                <p style={{ marginBottom: 0 }}>{explanation.body}</p>
              </div>
            )}
            {started ? (
              <Dashboard
                mastery={mastery}
                signals={signals}
                sessionStart={sessionStart}
                pulseHistory={pulseHistory}
                onContinue={continueLearning}
                onTeachBack={goTeachBack}
              />
            ) : (
              <div className="card">
                <h2>No pulse yet</h2>
                <p style={{ color: "var(--ink-soft)" }}>Start a diagnostic from Home to map your knowledge.</p>
              </div>
            )}
          </>
        )}

        {!loading && view === "discover" && (
          profile.subject ? (
            <PulseFeed subject={profile.subject} />
          ) : (
            <div className="card">
              <h2>Nothing to discover yet</h2>
              <p style={{ color: "var(--ink-soft)" }}>Pick a subject from Home first — then I'll find news and events around it.</p>
            </div>
          )
        )}

        {!loading && view === "teachback" && (
          <TeachBack subject={profile.subject} concept={teachConcept} onDone={confirmTeachBack} />
        )}
      </main>

      <AgentPanel
        mastery={mastery}
        started={started}
        strongest={strongest}
        actions={{ goHome: () => setView("home"), continueLearning, teachBack: goTeachBack, discover: () => setView("discover") }}
      />
    </div>
  );
}
