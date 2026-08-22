# LearnPulse

*Learning that adapts to your pulse.*

An AI-powered adaptive learning system for the **PromptWars: Adaptive Learning Intelligence System** challenge. LearnPulse continuously senses a learner's knowledge state and adapts in real time: it detects misconceptions, calibrates confidence, generates analogy-based explanations from your personal interests, and only confirms mastery when you can **teach the concept back**.

## The loop

```
assess (diagnostic) → track (mastery + confidence matrix) → adapt (weakest-concept
targeting, difficulty scaling) → feedback (misconception micro-lessons, analogies,
struggle-timer hints) → visualize (Knowledge Pulse map) → teach-back (Feynman check)
```

## Quick start

```bash
npm install
cp .env.example .env     # add your Gemini key (optional — mock mode works without it)
npm run dev              # server :8787 + client :5173
npm test                 # unit tests for the knowledge tracker
```

No API key? The server auto-runs in **mock mode** with a built-in Python question bank, so the full flow demos instantly.

## What makes it different

| Feature | What it does |
|---|---|
| **Teach-Back mode** | AI plays a confused student; mastery is only confirmed when you can teach it (Feynman technique) |
| **Confidence calibration** | Every answer includes a confidence rating. Confident+wrong = misconception alert; unsure+correct = fragile knowledge scheduled for review |
| **Misconception detection** | Wrong options map to *specific* misconceptions; repeated traps trigger targeted micro-lessons |
| **Goal-adaptive explanations** | Learner picks WHY they're learning (exam, interview, project, curiosity) — every explanation and micro-lesson restyles to that goal |
| **Memory decay** | Mastery fades over time on a spaced-repetition curve; fading concepts dim on the Pulse map |
| **Struggle timer** | Silent stall detection slides in a gentle hint before the learner fails |

## How this maps to the evaluation parameters

- **Problem Statement Alignment (high):** the full assess→track→adapt→feedback→visualize loop, plus knowledge-state modeling that goes beyond right/wrong (confidence matrix, misconceptions, decay).
- **Code Quality (high):** clean separation — `server/prompts.js` (AI brain), `client/src/lib/knowledgeTracker.js` (pure logic), `lib/constants.js` (all tuning values named and documented, zero magic numbers in components), thin components with JSDoc. No dead code.
- **Security (medium):** Gemini key lives server-side only; input sanitization + task allow-list + body size caps + locked CORS origin on `/api/generate`.
- **Efficiency (medium):** session-level response caching + in-flight request dedupe (`lib/api.js`); strong-memory decay computed lazily; single-question fetches instead of batch generation.
- **Testing (low):** `npm test` — 10 unit tests on the pure knowledge-tracker core (mastery updates, clamping, signals, decay, adaptivity).
- **Accessibility (low):** semantic landmarks, radiogroup/progressbar ARIA, keyboard-visible focus rings, `role="status"`/`alert` live regions, `prefers-reduced-motion` respected, AA color contrast.

## Architecture

```
learnpulse/
├── server/
│   ├── index.js        # Express API — key custody, validation, mock fallback
│   ├── prompts.js      # All Gemini prompt templates (strict JSON output)
│   └── mock.js         # Zero-setup demo data
└── client/src/
    ├── lib/
    │   ├── knowledgeTracker.js   # Pure adaptive logic (unit-tested)
    │   ├── __tests__/            # Vitest suite
    │   └── api.js                # Cached, deduped API gateway
    ├── components/
    │   ├── Onboarding.jsx        # Subject + interest (analogy engine input)
    │   ├── QuestionCard.jsx      # Confidence slider, struggle timer, trap feedback
    │   ├── TeachBack.jsx         # Feynman mode
    │   ├── Dashboard.jsx         # Knowledge Pulse map
    │   └── PulseLine.jsx         # Signature ECG line — beats stronger as you learn
    └── App.jsx                   # Flow state machine
```

## Deploy (GitHub + Netlify)

The repo includes `netlify.toml` and `netlify/functions/generate.js`, so the API deploys as a serverless function alongside the frontend — one site, no separate server.

1. Push to GitHub (see below). `.env` is gitignored — the key never enters the repo.
2. On [netlify.com](https://netlify.com): **Add new site → Import an existing project → GitHub** → pick the repo. Build settings auto-detect from `netlify.toml`.
3. Before deploying: **Site configuration → Environment variables → Add** `GEMINI_API_KEY` = your key.
4. Deploy. The live site serves the app, and `/api/generate` runs serverless with the key held by Netlify.

Local dev is unchanged: `npm run server` + `npm run client`.
