/**
 * Mock mode — deterministic sample data so LearnPulse runs
 * before a Gemini key is configured (demo resilience).
 * Subject assumed: "Python basics".
 */

const BANK = [
  {
    concept: "Variables",
    question: "What does x = 5 do in Python?",
    options: [
      { text: "Stores the value 5 under the name x", misconception: null },
      { text: "Checks whether x equals 5", misconception: "Confusing = with ==" },
      { text: "Creates a constant that can never change", misconception: "Variables are immutable" },
      { text: "Prints 5 to the screen", misconception: "Assignment produces output" },
    ],
    correctIndex: 0,
    difficulty: 1,
  },
  {
    concept: "Loops",
    question: "How many times does `for i in range(3)` loop?",
    options: [
      { text: "3 times (i = 0, 1, 2)", misconception: null },
      { text: "4 times (i = 0..3)", misconception: "range() includes the stop value" },
      { text: "2 times (i = 1, 2)", misconception: "range() starts at 1" },
      { text: "Forever", misconception: "for loops need a break" },
    ],
    correctIndex: 0,
    difficulty: 2,
  },
  {
    concept: "Functions",
    question: "What does `return` do inside a function?",
    options: [
      { text: "Sends a value back and exits the function", misconception: null },
      { text: "Prints the value", misconception: "return is the same as print" },
      { text: "Restarts the function", misconception: "return loops the function" },
      { text: "Deletes the function", misconception: null },
    ],
    correctIndex: 0,
    difficulty: 2,
  },
  {
    concept: "Lists",
    question: "What is my_list[0]?",
    options: [
      { text: "The first item", misconception: null },
      { text: "The last item", misconception: "Indexing starts at the end" },
      { text: "An error — indexing starts at 1", misconception: "1-based indexing" },
      { text: "The list's length", misconception: null },
    ],
    correctIndex: 0,
    difficulty: 1,
  },
  {
    concept: "Conditionals",
    question: "When does the `else` branch run?",
    options: [
      { text: "When the if condition is False", misconception: null },
      { text: "Always, after the if", misconception: "else always executes" },
      { text: "Only when there is an error", misconception: "else is error handling" },
      { text: "When the condition is True", misconception: "else mirrors if" },
    ],
    correctIndex: 0,
    difficulty: 1,
  },
];

export function mockResponse(task, p) {
  switch (task) {
    case "diagnostic":
      return { questions: BANK };
    case "nextQuestion": {
      // pick weakest concept from mastery, fall back to random
      const entries = Object.entries(p.mastery);
      const weakest = entries.length
        ? entries.sort((a, b) => a[1] - b[1])[0][0]
        : BANK[0].concept;
      const q = BANK.find((b) => b.concept === weakest) || BANK[Math.floor(Math.random() * BANK.length)];
      return { ...q, difficulty: p.difficulty };
    }
    case "explain":
      return {
        explanation: `Think of "${p.concept}" like something from ${p.interest || "cooking"}: a variable is a labelled jar — the label (name) stays, but you can swap what's inside (the value) any time. When code reads the name, it just looks inside the jar.`,
        analogyUsed: p.interest || "cooking",
      };
    case "teachback": {
      const good = (p.learnerAnswer || "").length > 80;
      return {
        score: good ? 85 : 55,
        feedback: good
          ? "That was clear! You covered the core idea well."
          : "You have the right direction, but I'm still a bit confused about the details.",
        followUpQuestion: good ? null : `Wait — but WHY does that happen? Can you give me an example?`,
        masteryConfirmed: good,
      };
    }
    case "misconception":
      return {
        lesson: `The trap: it *feels* like range(3) should include 3 — but Python stops just before the end value. Like floors in a lift labelled 0, 1, 2: three floors, and "3" is the roof you never reach. So range(3) → 0, 1, 2.`,
      };
    case "pulseFeed":
      return {
        news: [
          {
            title: `Python 3.13 adoption accelerates`,
            summary: "The latest Python release brings a faster interpreter and improved error messages for beginners.",
            whyItMatters: "The error-message upgrades make learning basics noticeably easier.",
            source: "python.org",
            date: "Recent",
          },
          {
            title: "AI pair-programmers change how beginners learn to code",
            summary: "Studies show learners using AI assistants progress faster when they explain code back.",
            whyItMatters: "Validates the teach-back method you're using right now.",
            source: "Tech press",
            date: "Recent",
          },
          {
            title: "Open-source projects seek first-time contributors",
            summary: "Beginner-friendly Python repos are tagging 'good first issues' for newcomers.",
            whyItMatters: "Real practice ground once your basics are solid.",
            source: "GitHub",
            date: "Ongoing",
          },
        ],
        events: [
          {
            name: `${p.city || "Local"} Python User Group meetup`,
            when: "Check meetup.com for next date",
            where: p.city || "Near you",
            summary: "Monthly talks + beginner corner. Friendly crowd for first-timers.",
            type: "in-person",
          },
          {
            name: "PyCon India / regional conference",
            when: "Annual — see pycon.org",
            where: "India (rotating city)",
            summary: "The biggest Python gathering in the region, with beginner tracks.",
            type: "in-person",
          },
          {
            name: "Real Python office hours",
            when: "Weekly",
            where: "Online",
            summary: "Live Q&A on exactly the concepts you're studying.",
            type: "online",
          },
        ],
      };

    default:
      return {};
  }
}
