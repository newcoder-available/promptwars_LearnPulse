import { useMemo, useState } from "react";

/**
 * Curated catalog of globally recognized, in-demand courses.
 * Static data = always available, even when live AI search is rate-limited.
 */
export const CATALOG = [
  { category: "Artificial Intelligence", name: "Google AI Essentials", provider: "Coursera · Google", skills: "AI productivity, prompt engineering, AI ethics", url: "https://www.coursera.org/learn/google-ai-essentials" },
  { category: "Artificial Intelligence", name: "Prompt Engineering for ChatGPT", provider: "Coursera · Vanderbilt University", skills: "Advanced prompting, workflows, LLM logic", url: "https://www.coursera.org/learn/prompt-engineering" },
  { category: "Data Science & Tech", name: "Google Data Analytics", provider: "Coursera · Google", skills: "SQL, R programming, Tableau, data cleaning", url: "https://www.coursera.org/professional-certificates/google-data-analytics" },
  { category: "Data Science & Tech", name: "Google Cybersecurity", provider: "Coursera · Google", skills: "Python, Linux, SIEM tools", url: "https://www.coursera.org/professional-certificates/google-cybersecurity" },
  { category: "Web Development", name: "Responsive Web Design", provider: "freeCodeCamp", skills: "HTML5, CSS3, Flexbox, UI/UX layouts", url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/" },
  { category: "Web Development", name: "Meta Front-End Developer", provider: "Coursera · Meta", skills: "JavaScript, React, Git", url: "https://www.coursera.org/professional-certificates/meta-front-end-developer" },
  { category: "Digital Marketing", name: "Fundamentals of Digital Marketing", provider: "Google Digital Garage", skills: "SEO, e-commerce, content strategy, analytics", url: "https://grow.google/intl/en_in/courses-and-tools/" },
  { category: "Digital Marketing", name: "SEO Certification Course", provider: "HubSpot Academy", skills: "Inbound marketing, link building, keyword optimization", url: "https://academy.hubspot.com/courses/seo-training" },
  { category: "Business & Finance", name: "Financial Markets", provider: "Coursera · Yale University", skills: "Risk management, behavioral finance, stocks", url: "https://www.coursera.org/learn/financial-markets-global" },
];

const CATEGORIES = ["All", ...new Set(CATALOG.map((c) => c.category))];

export default function CourseCatalog() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG.filter(
      (c) =>
        (category === "All" || c.category === category) &&
        (!q ||
          c.name.toLowerCase().includes(q) ||
          c.skills.toLowerCase().includes(q) ||
          c.provider.toLowerCase().includes(q))
    );
  }, [query, category]);

  return (
    <section aria-labelledby="catalog-title" style={{ marginTop: 32 }}>
      <h3 id="catalog-title">In-demand courses, worldwide</h3>
      <p style={{ color: "var(--ink-soft)", marginTop: -4 }}>
        A curated shortlist of globally recognized certifications — always available, no search needed.
      </p>

      <div className="card" style={{ padding: 18 }}>
        <label htmlFor="catalog-search" className="sr-only">
          Search courses
        </label>
        <input
          id="catalog-search"
          type="text"
          maxLength={80}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by course, skill, or platform…"
        />
        <div
          role="radiogroup"
          aria-label="Filter by category"
          style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}
        >
          {CATEGORIES.map((c) => (
            <button
              key={c}
              role="radio"
              aria-checked={category === c}
              className="option"
              style={{ width: "auto", marginBottom: 0, padding: "8px 14px", fontSize: 14 }}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {results.length === 0 ? (
        <div className="card">
          <p style={{ margin: 0, color: "var(--ink-soft)" }}>
            No courses match "{query}". Try a broader term or switch category.
          </p>
        </div>
      ) : (
        results.map((c) => (
          <article key={c.name} className="card" style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <strong>{c.name}</strong>
              <span>
                <span className="badge">{c.category}</span>{" "}
                <span className="badge pulse">{c.provider}</span>
              </span>
            </div>
            <p style={{ margin: "8px 0 6px", fontSize: 15 }}>
              <strong>Skills:</strong> {c.skills}
            </p>
            <a
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--focus)", fontWeight: 600, fontSize: 14 }}
            >
              Learn more ↗
            </a>
          </article>
        ))
      )}
    </section>
  );
}
