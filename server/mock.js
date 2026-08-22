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
      // targeted (Review) or weakest-first (adaptive session), fall back to random
      const entries = Object.entries(p.mastery);
      const target =
        p.targetConcept ||
        (entries.length ? entries.sort((a, b) => a[1] - b[1])[0][0] : BANK[0].concept);
      const q = BANK.find((b) => b.concept === target) || BANK[Math.floor(Math.random() * BANK.length)];
      return { ...q, difficulty: p.difficulty };
    }
    case "explain": {
      const styles = {
        "Exam prep": `Exam trick for "${p.concept}": remember "label stays, contents change" — a variable is a labelled jar. If the exam asks what x holds after reassignment, always take the LAST value poured in.`,
        "Interview prep": `In interviews, "${p.concept}" shows up as: "what's the output after reassignment?" A variable is a labelled jar — the name points to whatever was stored last. Say that out loud and you sound senior.`,
        "Building a project": `In a real build, "${p.concept}" is your app's short-term memory: store user input in a named jar, read it wherever needed, overwrite it when things change.`,
        "Just curious": `Here's the neat part of "${p.concept}": the computer never stores the NAME — just an address. The label is purely for humans. Naming things is a gift the language gives you, not the machine.`,
      };
      return {
        explanation: styles[p.goal] || styles["Just curious"],
        styleUsed: p.goal || "Just curious",
      };
    }
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
        lesson: `The trap: it *feels* like range(3) should include 3 — but Python stops just before the end value. Like floors in a lift labelled 0, 1, 2: three floors, and "3" is the roof you never reach. So range(3) → 0, 1, 2. Remember it as "stop means stop-before".`,
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
        courses: [
          {
            title: "Python for Everybody",
            platform: "Coursera",
            level: "beginner",
            cost: "free",
            summary: "The classic beginner path from University of Michigan — audit for free.",
            url: "https://www.coursera.org/specializations/python",
          },
          {
            title: "Python Essential Training",
            platform: "LinkedIn Learning",
            level: "beginner",
            cost: "paid",
            summary: "Compact, career-oriented coverage of core Python with exercises.",
            url: "https://www.linkedin.com/learning/",
          },
          {
            title: "Programming, Data Structures and Algorithms using Python",
            platform: "NPTEL",
            level: "intermediate",
            cost: "free",
            summary: "IIT-taught course with certification option — strong for Indian learners.",
            url: "https://nptel.ac.in/",
          },
          {
            title: "Python Full Course for Beginners",
            platform: "YouTube",
            level: "beginner",
            cost: "free",
            summary: "A single long-form walkthrough — good for revising after your diagnostic.",
            url: "https://www.youtube.com/",
          },
        ],
      };

    case "noteSuggest": {
      const t = p.topic || "Token";
      const known = {
        token: [
          { title: "Token in AI & LLMs", field: "Artificial Intelligence", hook: "The unit language models actually read — not words." },
          { title: "Token in Blockchain", field: "Web3 / Crypto", hook: "Digital assets living on someone else's chain." },
          { title: "Token Economy Systems", field: "Psychology / Education", hook: "Earning tokens to shape behavior — from classrooms to apps." },
          { title: "Authentication Tokens", field: "Cybersecurity", hook: "How you stay logged in without resending your password." },
        ],
      };
      const generic = [
        { title: `${t} in Computer Science`, field: "Technology", hook: `How "${t}" is used in software and systems.` },
        { title: `${t} in Everyday Life`, field: "General", hook: `The common meaning and where you meet it daily.` },
        { title: `${t} in Business`, field: "Business", hook: `What "${t}" means in markets and organizations.` },
      ];
      return { suggestions: known[t.toLowerCase()] || generic };
    }

    case "noteCreate":
      return {
        title: p.topic || "Token in AI & LLMs",
        field: "Artificial Intelligence",
        summary:
          "A token is the basic unit of text a language model processes — roughly a word piece, not a whole word. Models read, predict, and are billed in tokens, so token counts drive both context limits and cost.",
        keyPoints: [
          "Tokenizers split text into sub-word pieces (\u2248 4 characters or \u00be of a word in English).",
          "Context windows are measured in tokens — exceed them and the model forgets the start.",
          "API pricing is per token (input + output counted separately).",
          "The same text can tokenize differently across models — always count with the model's own tokenizer.",
        ],
        example:
          'The word "unbelievable" may become 3 tokens: "un", "believ", "able" — which is why long rare words cost more than short common ones.',
        relatedConcepts: ["Context window", "Embeddings", "Byte-pair encoding"],
        quickRecall: "Tokens are LEGO bricks of language — models build meaning brick by brick.",
      };

    default:
      return {};
  }
}
