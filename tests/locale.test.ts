import { expect, it } from "vitest";
import { conversationLanguage, resolveLanguage } from "../lib/locale";

it("retains Urdu context for scriptless follow-ups and uses actual assistant language", () => {
  const transcript = [
    { role: "user" as const, text: "میرے بچے کو نیند نہیں آتی" },
    { role: "assistant" as const, reply: { kind: "clarify" as const, reason: "missing_context" as const, language: "ur" as const, question: "بچے کی عمر کیا ہے؟" } },
    { role: "user" as const, text: "5" },
  ];
  expect(conversationLanguage(transcript)).toBe("ur");
  expect(resolveLanguage("auto", "5", conversationLanguage(transcript.slice(0, -1)))).toBe("ur");
  expect(conversationLanguage([...transcript, { role: "user", text: "Thank you" }])).toBe("en");
  expect(conversationLanguage([])).toBe("en");
});
