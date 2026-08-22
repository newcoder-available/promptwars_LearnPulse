/** Left navigation rail (CYPHER-style). */
const ITEMS = [
  { id: "home", label: "Home", icon: "⌂" },
  { id: "learn", label: "Learn", icon: "▶" },
  { id: "pulse", label: "Pulse Map", icon: "∿" },
  { id: "review", label: "Review", icon: "↻" },
  { id: "discover", label: "Discover", icon: "✦" },
];

export default function Sidebar({ view, onNavigate, canLearn }) {
  return (
    <nav className="sidebar" aria-label="Main">
      <div className="logo">
        Learn<span>Pulse</span>
      </div>
      {ITEMS.map((it) => {
        const disabled = it.id !== "home" && !canLearn;
        return (
          <button
            key={it.id}
            className="nav-item"
            aria-current={view === it.id ? "page" : undefined}
            disabled={disabled}
            title={disabled ? "Start a subject first" : undefined}
            onClick={() => onNavigate(it.id)}
          >
            <span aria-hidden="true">{it.icon}</span> {it.label}
          </button>
        );
      })}
    </nav>
  );
}
