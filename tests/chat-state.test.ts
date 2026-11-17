import { describe, it, expect } from "vitest";
import { initialChat, chatReducer } from "../lib/chat-state";
import { errorCopy } from "../lib/copy";
const send = (s = initialChat, id = "one") =>
  chatReducer({ ...s, draft: "Bedtime" }, { type: "send", id });
describe("conversation lifecycle", () => {
  it("blocks unchanged non-retryable failures while allowing an edited replacement", () => {
    const pending = send();
    const failed = chatReducer(pending, { type: "response", id: "one", generation: 0,
      response: { ok: false, requestId: "one", error: errorCopy("review_rejected", "en") } });
    expect(chatReducer(failed, { type: "send", id: "two" })).toBe(failed);
    const edited = chatReducer(failed, { type: "draft", value: "Different bedtime concern" });
    const retry = chatReducer(edited, { type: "send", id: "two" });
    expect(retry.active?.id).toBe("two");
    expect(retry.transcript).toEqual([{ role: "user", text: edited.draft }]);
  });
  it("blocks duplicate send and retains one unanswered turn through cancel/edit/retry", () => {
    const pending = send();
    expect(chatReducer(pending, { type: "send", id: "two" })).toBe(pending);
    const cancelled = chatReducer(pending, { type: "cancel" });
    expect(cancelled.draft).toBe(pending.draft);
    expect(cancelled.generation).toBe(pending.generation + 1);
    const edited = chatReducer(cancelled, {
      type: "draft",
      value: "New bedtime",
    });
    const retried = chatReducer(edited, { type: "send", id: "two" });
    expect(retried.transcript).toEqual([{ role: "user", text: "New bedtime" }]);
  });
  it("accepts null-ID errors only for the active closure and suppresses old outcomes", () => {
    const pending = send();
    const response = {
      ok: false as const,
      requestId: null,
      error: errorCopy("busy", "en"),
    };
    expect(
      chatReducer(pending, {
        type: "response",
        id: "one",
        generation: 0,
        response,
      }).error,
    ).toEqual(response.error);
    const reset = chatReducer(pending, { type: "reset" });
    expect(reset.transcript).toEqual([]);
    expect(reset.draft).toBe("");
    expect(reset.generation).toBe(pending.generation + 1);
    const replacement = chatReducer(chatReducer(pending, { type: "cancel" }), { type: "send", id: "replacement" });
    expect(chatReducer(replacement, { type: "response", id: "one", generation: 0, response })).toBe(replacement);
    expect(
      chatReducer(reset, {
        type: "response",
        id: "one",
        generation: 0,
        response,
      }),
    ).toBe(reset);
    expect(
      chatReducer(chatReducer(pending, { type: "cancel" }), {
        type: "response",
        id: "one",
        generation: 0,
        response,
      }).transcript,
    ).toHaveLength(1);
  });
  it("appends success once and prevents a ninth turn without discarding history", () => {
    const reply = {
      kind: "clarify" as const,
      reason: "missing_context" as const,
      language: "en" as const,
      question: "How old?",
    };
    let state = initialChat;
    for (let i = 0; i < 8; i++) {
      state = send(state, String(i));
      state = chatReducer(state, {
        type: "response",
        id: String(i),
        generation: 0,
        response: { ok: true, requestId: String(i), reply },
      });
    }
    expect(state.transcript).toHaveLength(16);
    expect(send(state).transcript).toHaveLength(16);
    expect(send(state).feedback).toBe("turnLimit");
  });
  it("rejects blank and UTF-16 overflow without truncation", () => {
    expect(chatReducer(initialChat, { type: "send", id: "a" }).feedback).toBe(
      "emptyMessage",
    );
    const state = { ...initialChat, draft: "😀".repeat(1001) };
    expect(chatReducer(state, { type: "send", id: "a" }).draft).toBe(
      state.draft,
    );
    expect(chatReducer(state, { type: "send", id: "a" }).feedback).toBe(
      "tooLong",
    );
  });
});

describe("response identity and recovery", () => {
  const reply = {
    kind: "clarify" as const,
    reason: "missing_context" as const,
    language: "en" as const,
    question: "How old is your child?",
  };
  it("ignores stale success after cancel, reset, or a replacement request", () => {
    const pending = send();
    const action = {
      type: "response" as const,
      id: "one",
      generation: 0,
      response: { ok: true as const, requestId: "one", reply },
    };
    const cancelled = chatReducer(pending, { type: "cancel" });
    expect(chatReducer(cancelled, action)).toBe(cancelled);
    const reset = chatReducer(pending, { type: "reset" });
    expect(chatReducer(reset, action)).toBe(reset);
    const replacement = chatReducer(cancelled, { type: "send", id: "two" });
    expect(chatReducer(replacement, action)).toBe(replacement);
    expect(
      chatReducer(pending, {
        ...action,
        response: { ...action.response, requestId: "wrong" },
      }),
    ).toBe(pending);
  });
  it("retains the submitted text on failure and retries without duplicating it", () => {
    const pending = send();
    const failed = chatReducer(pending, {
      type: "response",
      id: "one",
      generation: 0,
      response: {
        ok: false,
        requestId: null,
        error: errorCopy("provider_failure", "en"),
      },
    });
    expect(failed.draft).toBe("Bedtime");
    expect(failed.transcript).toHaveLength(1);
    const retry = chatReducer(failed, { type: "send", id: "two" });
    const answered = chatReducer(retry, {
      type: "response",
      id: "two",
      generation: 0,
      response: { ok: true, requestId: "two", reply },
    });
    expect(answered.transcript).toHaveLength(2);
    expect(answered.draft).toBe("");
    expect(
      chatReducer(answered, {
        type: "response",
        id: "two",
        generation: 0,
        response: { ok: true, requestId: "two", reply },
      }),
    ).toBe(answered);
  });
});
