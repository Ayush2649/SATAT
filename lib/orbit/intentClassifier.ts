// lib/orbit/intentClassifier.ts

export type OrbitIntent =
  | "SIMPLE_CONVERSATION"
  | "PERSONAL_CONTEXT"
  | "HISTORICAL_ANALYSIS"
  | "GENERAL_COACHING";

export interface ClassifiedIntent {
  intent: OrbitIntent;
  confidence: "high" | "medium";
  greetingType?: "morning" | "afternoon" | "evening" | "general" | "gratitude" | "status" | "farewell";
}

// ── Greetings, pleasantries, closings, and bot-address patterns ────────────────

const GREETING_WORDS = new Set([
  "hi",
  "hii",
  "hiii",
  "hey",
  "heyy",
  "heyyy",
  "hello",
  "hola",
  "yo",
  "sup",
  "namaste",
  "howdy",
]);

const FAREWELL_WORDS = new Set([
  "bye",
  "goodbye",
  "cya",
  "later",
]);

const BOT_NAMES = new Set([
  "orbit",
  "coach",
  "aria",
  "bot",
  "satat",
]);

const FILLER_CONVERSATIONAL = new Set([
  "there",
  "friend",
  "buddy",
  "mate",
  "bro",
  "man",
  "sir",
  "all",
  "everyone",
  "please",
  "today",
  "now",
  "again",
  "so",
  "much",
  "very",
  "a",
  "an",
  "the",
  "to",
  "you",
  "for",
  "is",
  "it",
  "its",
  "am",
  "im",
  "i",
]);

// ── Historical Analysis Triggers ───────────────────────────────────────────────

const HISTORICAL_PATTERNS: RegExp[] = [
  // Explicit multi-day / weekly temporal periods
  /\b(last\s+7\s+days|past\s+7\s+days|last\s+seven\s+days|previous\s+7\s+days|past\s+seven\s+days)\b/i,
  /\b(this\s+week|last\s+week|past\s+week|previous\s+week|two\s+weeks\s+ago|my\s+week)\b/i,
  /\b(weekly\s+(review|summary|report|breakdown|check|analysis|recap|progress|assessment|adherence|consistency|momentum|performance|habits))\b/i,
  /\b(review|summary|recap|assessment|audit|breakdown)\s+(of\s+)?(my\s+)?(week|past\s+week|last\s+7\s+days|last\s+seven\s+days|weekly\s+consistency|momentum)\b/i,
  /\b(how\s+was|how\s+did\s+i\s+do|how\s+were)\s+(my\s+)?(week|past\s+week|last\s+7\s+days|last\s+seven\s+days)\b/i,

  // Ratings out of 10 & overall progress
  /\brate\s+(my\s+)?(week|progress|consistency|performance|adherence)(\s+out\s+of\s+10)?\b/i,
  /\b(rate|score)\s+.*?\bout\s+of\s+10\b/i,
  /\b(score|rating)\s+(for\s+)?(my\s+)?(week|progress)\b/i,
  /\b(rate|score)\s+(my\s+)?overall\s+progress\b/i,

  // Consistency, momentum & trends
  /\b(honest\s+)?(assessment|evaluation|audit)\s+of\s+(my\s+)?(weekly|week|progress|momentum|consistency|performance|habits|routine)\b/i,
  /\b(consistency\s+and\s+momentum|momentum\s+and\s+consistency)\b/i,
  /\b(give\s+me\s+(an\s+)?|provide\s+(an\s+)?|share\s+(an\s+)?)(honest\s+)?(assessment|breakdown|review|evaluation)\b/i,
  /\bhow\s+consistent\s+(was\s+i|have\s+i\s+been)\b/i,
  /\b(weight\s+trend|trend\s+analysis|trends?\s+over|progress\s+trends?)\b/i,
  /\bcompare\s+(this\s+week|last\s+week|my\s+progress|the\s+previous\s+week)\b/i,
  /\bwhat\s+should\s+i\s+improve\s+(next\s+week|for\s+next\s+week)\b/i,

  // Multi-day tracking queries
  /\b(track|review)\s+my\s+(workouts?|meals?|tasks?|habits?)\s+(and\s+(meals?|workouts?|tasks?|habits?)\s+)?(from|over|in)\s+(the\s+)?(last\s+7\s+days|last\s+seven\s+days|past\s+7\s+days|this\s+week|last\s+week)\b/i,
  /\bhow\s+was\s+my\s+(workout|training|nutrition|diet|meal|task|habit|consistency|momentum|week)\s*(this\s+week|last\s+week|over\s+the\s+last\s+7\s+days|past\s+7\s+days)?\b/i,
  /\b(how\s+many|what)\s+tasks?\s+did\s+i\s+(complete|finish|do)\s*(this\s+week|last\s+week|over\s+the\s+last\s+7\s+days|past\s+7\s+days)?\b/i,
];

// ── Personal Context Triggers (Single-day or logged item queries) ───────────────

const PERSONAL_PATTERNS: RegExp[] = [
  /\b(what\s+did\s+i\s+(eat|have|log|track|do))\b/i,
  /\b(what\s+have\s+i\s+(eaten|logged|done|tracked))\b/i,
  /\b(did\s+i\s+(work\s*out|exercise|eat|log|track|complete|hit))\b/i,
  /\b(how\s+many\s+(calories|macros|carbs|fats?|protein|steps|sets|reps)\s+(did\s+i|have\s+i|do\s+i\s+have))\b/i,
  /\b(what\s+are\s+my\s+(tasks|goals|macros|habits|workouts|meals|targets|priorities))\b/i,
  /\b(what\s+is\s+my\s+(current\s+|latest\s+)?(weight|body\s*weight|progress|target|goal))\b/i,
  /\b(what\s+tasks?\s+(do\s+i\s+have|are\s+due|are\s+pending))\b/i,
  /\b(my\s+(current\s+|latest\s+)?(tasks?|meals?|workouts?|habits?|nutrition|calories|protein|macros?|weight|body\s*weight|progress))\b/i,
  /\b(log\s+my|show\s+my|view\s+my|check\s+my)\b/i,
];

/**
 * Deterministically classify the intent of a user message.
 * Priority:
 * 1. HISTORICAL_ANALYSIS (e.g. "Hi, how was my workout this week?" -> historical)
 * 2. PERSONAL_CONTEXT (e.g. "Hello, what did I eat yesterday?" -> personal)
 * 3. SIMPLE_CONVERSATION (e.g. "Hi", "Good morning", "Thanks", "How are you?")
 * 4. GENERAL_COACHING (open-ended workout/nutrition advice without personal records)
 */
export function classifyOrbitIntent(message: string): OrbitIntent {
  const result = classifyOrbitIntentDetailed(message);
  return result.intent;
}

export function classifyOrbitIntentDetailed(message: string): ClassifiedIntent {
  const trimmed = message.trim();
  if (!trimmed) {
    return { intent: "SIMPLE_CONVERSATION", confidence: "high", greetingType: "general" };
  }

  const lower = trimmed.toLowerCase();

  // 1. Check for Historical Analysis first so compound messages
  // like "Hi, how was my workout this week?" are NOT classified as simple conversation
  for (const pattern of HISTORICAL_PATTERNS) {
    if (pattern.test(lower)) {
      return { intent: "HISTORICAL_ANALYSIS", confidence: "high" };
    }
  }

  // 2. Check for Personal Context
  for (const pattern of PERSONAL_PATTERNS) {
    if (pattern.test(lower)) {
      return { intent: "PERSONAL_CONTEXT", confidence: "high" };
    }
  }

  // Also check temporal single-day keywords combined with data domains
  const hasSingleDayTemporal = /\b(today|yesterday|last\s+night|this\s+morning)\b/i.test(lower);
  const hasDomainKeyword = /\b(eat|ate|food|meal|workout|exercise|training|task|habit|calorie|protein|weight)\b/i.test(lower);
  if (hasSingleDayTemporal && hasDomainKeyword) {
    return { intent: "PERSONAL_CONTEXT", confidence: "high" };
  }

  // 3. Check for Simple Conversation (Greetings, Gratitude, Closings, Casual pleasantries)
  const greetingType = detectGreetingType(lower);
  if (greetingType) {
    // Verify that after removing conversational words, no substantive question remains
    const isSubstantive = hasSubstantiveContent(lower);
    if (!isSubstantive) {
      return { intent: "SIMPLE_CONVERSATION", confidence: "high", greetingType };
    }
  }

  // 4. Fallback: General coaching or unclassified open-ended query
  return { intent: "GENERAL_COACHING", confidence: "medium" };
}

/** Detect greeting sub-types for deterministic fast responses */
function detectGreetingType(
  lower: string
): "morning" | "afternoon" | "evening" | "general" | "gratitude" | "status" | "farewell" | null {
  if (/\bgood\s+morning\b/i.test(lower)) return "morning";
  if (/\bgood\s+afternoon\b/i.test(lower)) return "afternoon";
  if (/\b(good\s+evening|good\s+night)\b/i.test(lower)) return "evening";
  if (/\b(thanks?|thank\s+you|thx|appreciate\s+it)\b/i.test(lower)) return "gratitude";
  if (/\b(how\s+are\s+you|hows\s+it\s+going|how\'s\s+it\s+going|how\s+are\s+things|what\'s\s+up|whats\s+up)\b/i.test(lower)) return "status";
  if (/\b(bye|goodbye|see\s+you|see\s+ya|cya|take\s+care)\b/i.test(lower)) return "farewell";

  // Check standalone greeting tokens
  const words = lower.replace(/[^\w\s]/g, " ").split(/\s+/).filter(Boolean);
  for (const w of words) {
    if (GREETING_WORDS.has(w)) return "general";
    if (FAREWELL_WORDS.has(w)) return "farewell";
  }

  return null;
}

/**
 * Returns true if the message contains substantive tokens beyond greetings, bot names, and pleasantries.
 */
function hasSubstantiveContent(lower: string): boolean {
  // Strip out known phrase pleasantries
  let remaining = lower
    .replace(/\bgood\s+(morning|afternoon|evening|night|day)\b/gi, " ")
    .replace(/\bhow\s+are\s+you(\s+doing)?\b/gi, " ")
    .replace(/\bhow\'?s\s+it\s+going\b/gi, " ")
    .replace(/\bwhat\'?s\s+up\b/gi, " ")
    .replace(/\bhow\s+are\s+things\b/gi, " ")
    .replace(/\bthank\s+you(\s+so\s+much)?\b/gi, " ")
    .replace(/\bsee\s+(you|ya)\b/gi, " ")
    .replace(/\btake\s+care\b/gi, " ")
    .replace(/[^\w\s]/g, " ");

  const tokens = remaining.split(/\s+/).filter(Boolean);
  const substantiveTokens = tokens.filter((t) => {
    return (
      !GREETING_WORDS.has(t) &&
      !FAREWELL_WORDS.has(t) &&
      !BOT_NAMES.has(t) &&
      !FILLER_CONVERSATIONAL.has(t) &&
      t !== "thanks" &&
      t !== "thank" &&
      t !== "thx" &&
      t !== "good" &&
      t !== "morning" &&
      t !== "afternoon" &&
      t !== "evening" &&
      t !== "night"
    );
  });

  return substantiveTokens.length > 0;
}

/**
 * Returns a fast, deterministic, warm coaching response for simple conversation.
 */
export function getSimpleConversationReply(
  greetingType: "morning" | "afternoon" | "evening" | "general" | "gratitude" | "status" | "farewell",
  userName: string
): string {
  switch (greetingType) {
    case "morning":
      return `Good morning, ${userName}! Ready to make today count. What would you like to focus on — workouts, meals, or tasks?`;
    case "afternoon":
      return `Good afternoon, ${userName}! Hope your day is going well. How can I assist with your training, nutrition, or productivity today?`;
    case "evening":
      return `Good evening, ${userName}! Wrapping up the day? Let me know if you'd like to review today's accomplishments or plan ahead for tomorrow.`;
    case "gratitude":
      return `You're very welcome, ${userName}! Keep up the great momentum. Let me know whenever you need anything else.`;
    case "status":
      return `I'm doing great, ${userName}, and ready to help! How's your day shaping up with your workouts and daily goals?`;
    case "farewell":
      return `Take care, ${userName}! Stay consistent and crush your goals. Catch you next time!`;
    case "general":
    default:
      return `Hey ${userName}! Ready to help you stay on track. What are we focusing on today — workouts, nutrition, or tasks?`;
  }
}
