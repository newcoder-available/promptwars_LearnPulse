import { useState } from "react";

const SUBJECTS = [
  { name: "Python basics", desc: "Variables, loops, functions & lists" },
  { name: "Fractions & ratios", desc: "The foundations of proportional thinking" },
  { name: "World War II", desc: "Causes, turning points & aftermath" },
  { name: "Photosynthesis", desc: "How plants turn light into life" },
];

const GOALS = [
  { name: "Exam prep", desc: "Mnemonics & recall under pressure" },
  { name: "Interview prep", desc: "Real-world use + typical questions" },
  { name: "Building a project", desc: "Practical, apply-it-now examples" },
  { name: "Just curious", desc: "The fascinating why behind it" },
];

/** Home: "Hello, {name} — what would you like to master?" hero + suggestion cards. */
export default function Home({ name, onName, onStart }) {
  const [subject, setSubject] = useState("");
  const [goal, setGoal] = useState("Just curious");
  const [draftName, setDraftName] = useState("");

  // First visit: ask the learner's name once.
  if (!name) {
    return (
      <section className="card" style={{ maxWidth: 520 }}>
        <h2>Welcome to LearnPulse</h2>
        <p style={{ color: "var(--ink-soft)" }}>What should I call you?</p>
        <label htmlFor="name" style={{ position: "absolute", left: -9999 }}>Your name</label>
        <input
          id="name"
          type="text"
          maxLength={40}
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && draftName.trim() && onName(draftName.trim())}
          placeholder="e.g. Prashant"
        />
        <button
          className="btn-primary"
          style={{ marginTop: 16 }}
          disabled={!draftName.trim()}
          onClick={() => onName(draftName.trim())}
        >
          Let's go
        </button>
      </section>
    );
  }

  const start = (s) => onStart({ subject: s, goal });

  return (
    <section aria-labelledby="home-title">
      <p className="hello">Hello, {name}</p>
      <h1 id="home-title" className="hero-q">What would you like to master?</h1>

      <label htmlFor="subject" style={{ position: "absolute", left: -9999 }}>Subject</label>
      <input
        id="subject"
        type="text"
        className="big-input"
        maxLength={120}
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && subject.trim() && start(subject.trim())}
        placeholder="Type any subject… then press Enter"
      />

      <div className="suggest-grid">
        {SUBJECTS.map((s) => (
          <button key={s.name} className="suggest" onClick={() => start(s.name)}>
            <strong>{s.name}</strong>
            <span>{s.desc}</span>
          </button>
        ))}
      </div>

      <p style={{ fontWeight: 600, margin: "26px 0 8px" }}>
        Why are you learning this?
      </p>
      <div role="radiogroup" aria-label="Learning goal" className="suggest-grid" style={{ marginTop: 0 }}>
        {GOALS.map((g) => (
          <button
            key={g.name}
            role="radio"
            aria-checked={goal === g.name}
            className="suggest option"
            style={{ marginBottom: 0 }}
            onClick={() => setGoal(g.name)}
          >
            <strong>{g.name}</strong>
            <span>{g.desc}</span>
          </button>
        ))}
      </div>

      {subject.trim() && (
        <button className="btn-primary" style={{ marginTop: 22 }} onClick={() => start(subject.trim())}>
          Read my pulse
        </button>
      )}
    </section>
  );
}
