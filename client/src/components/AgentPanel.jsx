import { overallPulse, fadingConcepts } from "../lib/knowledgeTracker.js";

/**
 * Pulse Agent — right rail of task shortcuts (CYPHER-agent style).
 * Tasks enable/disable based on the learner's actual state.
 */
export default function AgentPanel({ mastery, started, strongest, actions }) {
  const pulse = overallPulse(mastery);
  const fading = fadingConcepts(mastery);

  const tasks = [
    {
      title: "Start a diagnostic",
      desc: "Map what you already know in 5 questions",
      onClick: actions.goHome,
      enabled: true,
    },
    {
      title: "Continue learning",
      desc: started ? "Next question targets your weakest concept" : "Pick a subject first",
      onClick: actions.continueLearning,
      enabled: started,
    },
    {
      title: "Teach-Back",
      desc: strongest ? `Prove you can teach ${strongest}` : "Reach 70% in a concept to unlock",
      onClick: () => actions.teachBack(strongest),
      enabled: Boolean(strongest),
    },
    {
      title: "Discover news & events",
      desc: "What's happening around your subject right now",
      onClick: actions.discover,
      enabled: started,
    },
    {
      title: "Revive fading concepts",
      desc: fading.length ? `${fading.length} concept(s) are fading` : "Nothing is fading yet",
      onClick: actions.continueLearning,
      enabled: started && fading.length > 0,
    },
  ];

  return (
    <aside className="agent" aria-label="Pulse Agent">
      <div className="agent-head">
        <span className="agent-title">✦ Pulse Agent</span>
        <span className="badge pulse mono" aria-label={`Overall pulse ${pulse} percent`}>
          {pulse}% pulse
        </span>
      </div>
      <p className="agent-sub">Powered by Gemini</p>

      {tasks.map((t) => (
        <button key={t.title} className="task" disabled={!t.enabled} onClick={t.onClick}>
          <strong>{t.title}</strong>
          <span>{t.desc}</span>
        </button>
      ))}
    </aside>
  );
}
