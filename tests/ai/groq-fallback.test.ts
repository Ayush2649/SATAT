import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Groq SDK ─────────────────────────────────────────────────────────────
const mockCreate = vi.fn();

vi.mock("groq-sdk", () => {
  return {
    default: class MockGroq {
      chat = {
        completions: {
          create: mockCreate,
        },
      };
    },
  };
});

import { callTextWithFallback } from "@/lib/ai/groq";

describe("Groq Timeout & Fallback Resilience (Phase 1 & 2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GROQ_API_KEY = "gsk_test_mock_key";
  });

  it("1. Successfully returns response from primary model when primary succeeds", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "Primary model answer" }, finish_reason: "stop" }],
      usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
    });

    const result = await callTextWithFallback(["primary-model", "fallback-model"], {
      messages: [{ role: "user", content: "Summarize my week" }],
      maxTokens: 500,
    });

    expect(result.data).toBe("Primary model answer");
    expect(result.usage.model).toBe("primary-model");
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate.mock.calls[0][0].model).toBe("primary-model");
  });

  it("2. Falls back to secondary model when primary model encounters TIMEOUT (AbortError)", async () => {
    // Primary model times out / aborts
    const abortErr = new Error("This operation was aborted");
    abortErr.name = "AbortError";
    mockCreate.mockRejectedValueOnce(abortErr);

    // Fallback model responds successfully
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "Fallback model recovery answer" }, finish_reason: "stop" }],
      usage: { prompt_tokens: 90, completion_tokens: 45, total_tokens: 135 },
    });

    const result = await callTextWithFallback(["primary-120b", "fallback-20b"], {
      messages: [{ role: "user", content: "Summarize my week" }],
      maxTokens: 500,
    });

    expect(result.data).toBe("Fallback model recovery answer");
    expect(result.usage.model).toBe("fallback-20b");
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(mockCreate.mock.calls[0][0].model).toBe("primary-120b");
    expect(mockCreate.mock.calls[1][0].model).toBe("fallback-20b");
  });

  it("3. Falls back to secondary model when primary model is persistent RATE_LIMITED (429)", async () => {
    // Primary model attempt 0 rate limited
    mockCreate.mockRejectedValueOnce({
      status: 429,
      headers: { "retry-after": "0.01" },
      message: "Rate limit reached for requests per minute (TPM limit exceeded)",
    });
    // Primary model attempt 1 rate limited
    mockCreate.mockRejectedValueOnce({
      status: 429,
      headers: { "retry-after": "0.01" },
      message: "Rate limit reached for requests per minute (TPM limit exceeded)",
    });

    // Fallback model responds successfully
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "Fallback model answer under rate limit" }, finish_reason: "stop" }],
      usage: { prompt_tokens: 80, completion_tokens: 40, total_tokens: 120 },
    });

    const result = await callTextWithFallback(["primary-120b", "fallback-20b"], {
      messages: [{ role: "user", content: "Summarize my week" }],
      maxTokens: 500,
    });

    expect(result.data).toBe("Fallback model answer under rate limit");
    expect(result.usage.model).toBe("fallback-20b");
    expect(mockCreate).toHaveBeenCalledTimes(3);
    expect(mockCreate.mock.calls[0][0].model).toBe("primary-120b");
    expect(mockCreate.mock.calls[1][0].model).toBe("primary-120b");
    expect(mockCreate.mock.calls[2][0].model).toBe("fallback-20b");
  });

  it("4. Falls back to secondary model when primary model is MODEL_UNAVAILABLE (503)", async () => {
    // Primary model 503
    mockCreate.mockRejectedValueOnce({
      status: 503,
      message: "Service Unavailable",
    });

    // Fallback model responds successfully
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "Recovered from 503" }, finish_reason: "stop" }],
      usage: { prompt_tokens: 50, completion_tokens: 25, total_tokens: 75 },
    });

    const result = await callTextWithFallback(["primary-120b", "fallback-20b"], {
      messages: [{ role: "user", content: "Review my tasks" }],
      maxTokens: 500,
    });

    expect(result.data).toBe("Recovered from 503");
    expect(result.usage.model).toBe("fallback-20b");
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(mockCreate.mock.calls[0][0].model).toBe("primary-120b");
    expect(mockCreate.mock.calls[1][0].model).toBe("fallback-20b");
  });

  it("5. Rethrows error when all models in the fallback chain fail", async () => {
    const abortErr1 = new Error("This operation was aborted");
    abortErr1.name = "AbortError";
    const abortErr2 = new Error("This operation was aborted");
    abortErr2.name = "AbortError";

    mockCreate.mockRejectedValueOnce(abortErr1);
    mockCreate.mockRejectedValueOnce(abortErr2);

    await expect(
      callTextWithFallback(["primary-120b", "fallback-20b"], {
        messages: [{ role: "user", content: "Hello" }],
        maxTokens: 500,
      })
    ).rejects.toThrow();

    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});

