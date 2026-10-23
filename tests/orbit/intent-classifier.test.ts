import { describe, it, expect } from "vitest";
import {
  classifyOrbitIntent,
  classifyOrbitIntentDetailed,
  getSimpleConversationReply,
} from "@/lib/orbit/intentClassifier";

describe("Orbit Deterministic Intent Classifier", () => {
  describe("1. Simple Conversation Classification", () => {
    it.each([
      "hi",
      "hii",
      "hiii",
      "hello",
      "hey",
      "heyy",
      "Good morning",
      "good morning!",
      "Good afternoon",
      "Good evening",
      "Thanks",
      "thanks!",
      "thank you so much",
      "how are you",
      "How are you doing today?",
      "bye",
      "goodbye",
      "Hello Orbit",
      "Hey coach",
      "yo orbit!",
      "Namaste",
    ])('classifies "%s" as SIMPLE_CONVERSATION', (msg) => {
      expect(classifyOrbitIntent(msg)).toBe("SIMPLE_CONVERSATION");
    });

    it("generates natural deterministic greetings for simple conversation types", () => {
      expect(getSimpleConversationReply("morning", "Ayush")).toContain("Good morning, Ayush!");
      expect(getSimpleConversationReply("gratitude", "Ayush")).toContain("You're very welcome, Ayush!");
      expect(getSimpleConversationReply("general", "Ayush")).toContain("Hey Ayush!");
    });
  });

  describe("2. False Positive Prevention (Punctuation, Capitalization, Substrings)", () => {
    it("does not classify words containing 'hi' as simple conversation", () => {
      expect(classifyOrbitIntent("Which machine is best for back workouts?")).not.toBe("SIMPLE_CONVERSATION");
      expect(classifyOrbitIntent("What is the history of progressive overload?")).not.toBe("SIMPLE_CONVERSATION");
      expect(classifyOrbitIntent("Tell me about high intensity interval training.")).not.toBe("SIMPLE_CONVERSATION");
    });

    it("does not classify substantive questions containing greetings as simple conversation", () => {
      // Compound greeting + historical analysis
      expect(classifyOrbitIntent("Hi, how was my workout this week?")).toBe("HISTORICAL_ANALYSIS");
      expect(classifyOrbitIntent("Hello! Rate my week out of 10.")).toBe("HISTORICAL_ANALYSIS");
      expect(classifyOrbitIntent("Hey Orbit, track my workouts and meals from the last seven days.")).toBe("HISTORICAL_ANALYSIS");

      // Compound greeting + personal context
      expect(classifyOrbitIntent("Hello, what did I eat yesterday?")).toBe("PERSONAL_CONTEXT");
      expect(classifyOrbitIntent("Hi! What are my tasks for today?")).toBe("PERSONAL_CONTEXT");
      expect(classifyOrbitIntent("Hey coach, did I log my workout today?")).toBe("PERSONAL_CONTEXT");

      // Compound greeting + general coaching
      expect(classifyOrbitIntent("Hi, can you explain progressive overload?")).toBe("GENERAL_COACHING");
    });
  });

  describe("3. Historical Analysis Triggers", () => {
    it.each([
      "How was my workout this week?",
      "Track my workouts and meals from the last seven days.",
      "How consistent was I this week?",
      "Rate my progress out of 10.",
      "Rate my week out of 10",
      "What should I improve next week?",
      "Compare this week with the previous week.",
      "Give me a weekly review",
      "Show me my weekly summary",
      "What is my weight trend over the past week?",
      "How were my meals over the last 7 days?",
      "Give me an honest assessment of my weekly consistency and momentum.",
      "Rate my overall progress out of 10 based on my workouts, nutrition, habits, and tasks.",
      "Summarize my workouts from the last seven days.",
      "How consistent was I with my meals?",
      "How many tasks did I complete this week?",
    ])('classifies "%s" as HISTORICAL_ANALYSIS', (msg) => {
      expect(classifyOrbitIntent(msg)).toBe("HISTORICAL_ANALYSIS");
    });
  });

  describe("4. Personal Context Triggers", () => {
    it.each([
      "What did I eat yesterday?",
      "What did I eat today?",
      "What have I eaten so far?",
      "What are my tasks for today?",
      "What tasks do I have?",
      "Did I work out today?",
      "How many calories did I log?",
      "Show my logged meals",
      "What is my current body weight?",
    ])('classifies "%s" as PERSONAL_CONTEXT', (msg) => {
      expect(classifyOrbitIntent(msg)).toBe("PERSONAL_CONTEXT");
    });
  });

  describe("5. General Coaching Fallback", () => {
    it.each([
      "What is progressive overload?",
      "How do I do a Romanian deadlift?",
      "Give me 5 high protein vegetarian snack ideas.",
      "How can I improve my sleep for better recovery?",
    ])('classifies "%s" as GENERAL_COACHING', (msg) => {
      expect(classifyOrbitIntent(msg)).toBe("GENERAL_COACHING");
    });
  });
});

