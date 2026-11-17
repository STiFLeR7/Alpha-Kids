import {
  LIMITS,
  type Turn,
  type ReplyLanguage,
  type PublicError,
  type PublicResponse,
} from "./contracts";
export type ChatState = {
  transcript: Turn[];
  draft: string;
  language: ReplyLanguage;
  generation: number;
  active: { id: string; generation: number } | null;
  error: PublicError | null;
  feedback: "emptyMessage" | "tooLong" | "turnLimit" | null;
  cancelled: boolean;
};
export const initialChat: ChatState = {
  transcript: [],
  draft: "",
  language: "auto",
  generation: 0,
  active: null,
  error: null,
  feedback: null,
  cancelled: false,
};
export type ChatAction =
  | { type: "draft"; value: string }
  | { type: "language"; value: ReplyLanguage }
  | { type: "send"; id: string }
  | { type: "cancel" }
  | { type: "reset" }
  | {
      type: "response";
      id: string;
      generation: number;
      response: PublicResponse;
    };
export function retryBlocked(state: ChatState): boolean {
  const last = state.transcript.at(-1);
  return state.error?.retryable === false && last?.role === "user" && last.text === state.draft;
}
export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "draft":
      return state.active
        ? state
        : { ...state, draft: action.value, feedback: null };
    case "language":
      return state.active ? state : { ...state, language: action.value };
    case "reset":
      return {
        ...initialChat,
        language: state.language,
        generation: state.generation + 1,
      };
    case "cancel":
      return state.active
        ? {
            ...state,
            active: null,
            generation: state.generation + 1,
            cancelled: true,
          }
        : state;
    case "send": {
      if (state.active || retryBlocked(state)) return state;
      const unanswered = state.transcript.at(-1)?.role === "user";
      const feedback = !state.draft.trim()
        ? "emptyMessage"
        : state.draft.length > LIMITS.userText
          ? "tooLong"
          : !unanswered &&
              state.transcript.filter((t) => t.role === "user").length >=
                LIMITS.userTurns
            ? "turnLimit"
            : null;
      if (feedback) return { ...state, feedback };
      const transcript = unanswered
        ? state.transcript.slice(0, -1)
        : state.transcript;
      return {
        ...state,
        transcript: [...transcript, { role: "user", text: state.draft }],
        active: { id: action.id, generation: state.generation },
        error: null,
        feedback: null,
        cancelled: false,
      };
    }
    case "response": {
      if (
        !state.active ||
        state.active.id !== action.id ||
        state.generation !== action.generation
      )
        return state;
      if (
        action.response.requestId !== null &&
        action.response.requestId !== action.id
      )
        return state;
      return action.response.ok
        ? {
            ...state,
            active: null,
            draft: "",
            error: null,
            transcript: [
              ...state.transcript,
              { role: "assistant", reply: action.response.reply },
            ],
          }
        : { ...state, active: null, error: action.response.error };
    }
  }
}
