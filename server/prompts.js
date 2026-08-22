/**
 * Prompt templates for every LearnPulse task.
 * All tasks force strict JSON output so the client can render safely.
 */

const JSON_RULE = `Respond ONLY with valid JSON. No markdown, no backticks, no preamble.`;

export function buildPrompt(task, p) {
  const masteryStr = JSON.stringify(p.mastery);

  switch (task) {
    case "diagnostic":
      return `You are LearnPulse, an adaptive tutor. Subject: "${p.subject}".
Create a 5-question diagnostic quiz covering 5 distinct core concepts, mixed difficulty.
Each wrong option must map to a REAL common misconception.
${JSON_RULE}
Schema: {"questions":[{"concept":string,"question":string,"options":[{"text":string,"misconception":string|null}],"correctIndex":number,"difficulty":1-5}]}`;

    case "nextQuestion": {
      const target = p.targetConcept
        ? `Write ONE question specifically for the concept "${p.targetConcept}"`
        : `Pick the WEAKEST concept from the mastery map and write ONE question for it`;
      return `You are LearnPulse. Subject: "${p.subject}". Learner mastery (0-100 per concept): ${masteryStr}.
${target}, at difficulty ${p.difficulty}/5.
Wrong options must map to real misconceptions.
${JSON_RULE}
Schema: {"concept":string,"question":string,"options":[{"text":string,"misconception":string|null}],"correctIndex":number,"difficulty":number}`;
    }

    case "explain":
      return `You are LearnPulse. Explain "${p.concept}" (subject: ${p.subject}) to a struggling learner
whose learning goal is: "${p.goal}".
Adapt the explanation style to that goal:
- "Exam prep": concise rule + a memorable mnemonic or trick to recall it under pressure.
- "Interview prep": the real-world application + how this concept appears in interview questions.
- "Building a project": a concrete, practical example of using it in a real build.
- "Just curious": the fascinating why-it-works context that makes it stick.
Keep it under 120 words, warm and concrete.
${JSON_RULE}
Schema: {"explanation":string,"styleUsed":string}`;

    case "teachback":
      return `You are a curious, slightly confused student. The learner just explained "${p.concept}" to you:
"""${p.learnerAnswer}"""
Grade the explanation 0-100 for accuracy and completeness. If gaps exist, ask ONE naive follow-up
question a confused student would ask. If it is solid (>=80), congratulate and confirm mastery.
${JSON_RULE}
Schema: {"score":number,"feedback":string,"followUpQuestion":string|null,"masteryConfirmed":boolean}`;

    case "misconception":
      return `You are LearnPulse. The learner repeatedly shows this misconception: "${p.learnerAnswer}"
in concept "${p.concept}" (subject: ${p.subject}).
Write a short targeted micro-lesson (<=100 words) that names the trap, explains why it feels right,
and corrects it with one vivid example fitted to their learning goal: "${p.goal}".
${JSON_RULE}
Schema: {"lesson":string}`;

    case "pulseFeed":
      return `You are LearnPulse. Use Google Search to find CURRENT information for a learner studying "${p.subject}"${p.city ? ` who lives in or near ${p.city}` : ""}.
Find:
1. 3-4 recent news items, discoveries, or developments directly related to "${p.subject}" (last few months).
2. 2-3 upcoming or ongoing events near ${p.city || "the learner"} relevant to "${p.subject}" — workshops, meetups, exhibitions, hackathons, lectures, or online events if nothing local exists.
3. 3-4 well-reviewed online courses for "${p.subject}" from platforms like LinkedIn Learning, Coursera, Udemy, edX, NPTEL, SWAYAM, or YouTube. Mix free and paid; note the level (beginner/intermediate/advanced). Only include courses you actually found via search, with their real URLs.
Keep every summary under 30 words, learner-friendly, and note WHY each matters for someone studying this subject.
${JSON_RULE}
Schema: {"news":[{"title":string,"summary":string,"whyItMatters":string,"source":string,"date":string}],"events":[{"name":string,"when":string,"where":string,"summary":string,"type":"in-person"|"online"}],"courses":[{"title":string,"platform":string,"level":string,"cost":"free"|"paid","summary":string,"url":string}]}`;

    case "noteSuggest":
      return `You are LearnPulse Notes. The learner typed the topic word: "${p.topic}".
This word may mean different things in different fields (e.g. "Token" \u2192 token in AI/LLMs, token in blockchain, token systems in psychology, authentication tokens).
Suggest 3-5 DISTINCT interpretations across different fields, each phrased as a clear note title.
${JSON_RULE}
Schema: {"suggestions":[{"title":string,"field":string,"hook":string}]} where hook is a one-line teaser (<=15 words).`;

    case "noteCreate":
      return `You are LearnPulse Notes. Create a structured, Notion-style study note.
Note title: "${p.topic}"${p.goal ? ` | Learner's goal: ${p.goal}` : ""}.
Make it accurate, concise, and immediately useful for revision.
${JSON_RULE}
Schema: {"title":string,"field":string,"summary":string,"keyPoints":[string,string,string,string],"example":string,"relatedConcepts":[string,string,string],"quickRecall":string}
- summary: 2-3 sentences. keyPoints: 3-5 crisp bullets. example: one concrete example. quickRecall: a one-line mnemonic or memory hook.`;

    default:
      throw new Error("Unknown task");
  }
}
