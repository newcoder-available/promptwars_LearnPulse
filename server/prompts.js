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

    case "nextQuestion":
      return `You are LearnPulse. Subject: "${p.subject}". Learner mastery (0-100 per concept): ${masteryStr}.
Pick the WEAKEST concept and write ONE question at difficulty ${p.difficulty}/5.
Wrong options must map to real misconceptions.
${JSON_RULE}
Schema: {"concept":string,"question":string,"options":[{"text":string,"misconception":string|null}],"correctIndex":number,"difficulty":number}`;

    case "explain":
      return `You are LearnPulse. Explain "${p.concept}" (subject: ${p.subject}) to a struggling learner.
Use an analogy from their personal interest: "${p.interest}". Keep it under 120 words, warm and concrete.
${JSON_RULE}
Schema: {"explanation":string,"analogyUsed":string}`;

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
and corrects it with one vivid example using their interest: "${p.interest}".
${JSON_RULE}
Schema: {"lesson":string}`;

    case "pulseFeed":
      return `You are LearnPulse. Use Google Search to find CURRENT information for a learner studying "${p.subject}"${p.city ? ` who lives in or near ${p.city}` : ""}.
Find:
1. 3-4 recent news items, discoveries, or developments directly related to "${p.subject}" (last few months).
2. 2-3 upcoming or ongoing events near ${p.city || "the learner"} relevant to "${p.subject}" — workshops, meetups, exhibitions, hackathons, lectures, or online events if nothing local exists.
Keep every summary under 30 words, learner-friendly, and note WHY each matters for someone studying this subject.
${JSON_RULE}
Schema: {"news":[{"title":string,"summary":string,"whyItMatters":string,"source":string,"date":string}],"events":[{"name":string,"when":string,"where":string,"summary":string,"type":"in-person"|"online"}]}`;

    default:
      throw new Error("Unknown task");
  }
}
