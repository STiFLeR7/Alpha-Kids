"use client";
import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  Layout,
  LayoutContent,
  VStack,
  HStack,
} from "@astryxdesign/core/Layout";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Selector } from "@astryxdesign/core/Selector";
import { List, ListItem } from "@astryxdesign/core/List";
import { Banner } from "@astryxdesign/core/Banner";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import {
  LIMITS,
  PublicResponseSchema,
  type Reply,
  type ReplyLanguage,
  type Language,
} from "../lib/contracts";
import { getUiCopy, errorCopy } from "../lib/copy";
import { resolveLanguage, conversationLanguage } from "../lib/locale";
import { initialChat, chatReducer, retryBlocked, type ChatAction } from "../lib/chat-state";
const prose: CSSProperties = {
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  unicodeBidi: "isolate",
  lineHeight: "var(--text-body-leading)",
};
function Answer({ reply }: { reply: Reply }) {
  const copy = getUiCopy(reply.language);
  return (
    <section
      lang={reply.language}
      dir={reply.language === "ur" ? "rtl" : "ltr"}
      style={prose}
    >
      <VStack gap={3}>
        {reply.kind === "coach" ? (
          <>
            <Text style={prose}>{reply.acknowledgment}</Text>
            <Heading level={3}>{copy.tryThis}</Heading>
            <List listStyle="decimal">
              {reply.steps.map((step, i) => (
                <ListItem key={i} label={<Text style={prose}>{step}</Text>} />
              ))}
            </List>
            <Heading level={3}>{copy.checkIn}</Heading>
            <Text style={prose}>{reply.checkIn}</Text>
          </>
        ) : reply.kind === "clarify" ? (
          <Text style={prose}>{reply.question}</Text>
        ) : (
          <Banner
            status={reply.kind === "boundary" ? "info" : "warning"}
            title={reply.heading}
            description={<Text style={prose}>{reply.message}</Text>}
            collapsible={false}
            role={reply.kind === "urgent" ? "alert" : undefined}
          />
        )}
      </VStack>
    </section>
  );
}
export default function Page() {
  const [state, dispatch] = useReducer(chatReducer, initialChat);
  const current = useRef(state);
  const controller = useRef<AbortController | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const focusAfterReply = useRef(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<{ text: string; language: Language }>({ text: "", language: "en" });
  const language = state.language === "ur" ? "ur" : "en";
  const copy = getUiCopy(language);
  const pending = !!state.active;
  const unanswered = state.transcript.at(-1)?.role === "user";
  const atLimit =
    !unanswered &&
    state.transcript.filter((t) => t.role === "user").length >=
      LIMITS.userTurns;
  function update(action: ChatAction) {
    current.current = chatReducer(current.current, action);
    dispatch(action);
    return current.current;
  }
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ur" ? "rtl" : "ltr";
  }, [language]);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (!pending && focusAfterReply.current) {
      focusAfterReply.current = false;
      if (document.activeElement === document.body) input.current?.focus();
    }
  }, [pending]);
  function isPending() {
    return !!current.current.active;
  }
  async function send() {
    if (isPending()) return;
    const id = crypto.randomUUID();
    const next = update({ type: "send", id });
    if (!next.active) return;
    const generation = next.generation;
    const request = {
      requestId: id,
      replyLanguage: next.language,
      transcript: next.transcript,
    };
    const body = JSON.stringify(request);
    const responseLanguage = resolveLanguage(
      next.language,
      next.draft,
      conversationLanguage(next.transcript.slice(0, -1)),
    );
    if (new TextEncoder().encode(body).length > LIMITS.requestBytes) {
      const error = errorCopy("too_large", responseLanguage);
      update({
        type: "response",
        id,
        generation,
        response: {
          ok: false,
          requestId: id,
          error,
        },
      });
      setAnnouncement({ text: error.message, language: error.language });
      return;
    }
    const abort = new AbortController();
    controller.current = abort;
    setAnnouncement({ text: copy.preparing, language });
    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: abort.signal,
      });
      const parsed = PublicResponseSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("Invalid public response");
      const active = current.current.active;
      if (!active || active.id !== id || active.generation !== generation)
        return;
      if (parsed.data.requestId !== null && parsed.data.requestId !== id)
        throw new Error("Mismatched response");
      focusAfterReply.current = parsed.data.ok && document.activeElement === cancelButton.current;
      update({ type: "response", id, generation, response: parsed.data });
      setAnnouncement(parsed.data.ok
        ? { text: parsed.data.reply.kind === "urgent" ? "" : copy.replyReady, language }
        : { text: parsed.data.error.message, language: parsed.data.error.language });
    } catch {
      if (
        !current.current.active ||
        current.current.active.id !== id ||
        current.current.generation !== generation
      )
        return;
      const error = errorCopy("provider_failure", responseLanguage);
      update({
        type: "response",
        id,
        generation,
        response: { ok: false, requestId: id, error },
      });
      setAnnouncement({ text: error.message, language: error.language });
    }
  }
  function cancel() {
    focusAfterReply.current = false;
    controller.current?.abort();
    update({ type: "cancel" });
    setAnnouncement({ text: copy.cancelled, language });
    input.current?.focus();
  }
  function clear() {
    focusAfterReply.current = false;
    controller.current?.abort();
    update({ type: "reset" });
    setResetOpen(false);
    setAnnouncement({ text: "", language });
    requestAnimationFrame(() => input.current?.focus());
  }
  return (
    <InternationalizationProvider
      locale={language}
      dir={language === "ur" ? "rtl" : "ltr"}
    >
      <Layout
        contentWidth={720}
        padding={6}
        content={
          <LayoutContent>
            <VStack gap={8}>
              <VStack gap={4}>
                <HStack gap={3} wrap="wrap" vAlign="center">
                  <Heading level={1}>{copy.appTitle}</Heading>
                  <Text color="secondary">{copy.prototype}</Text>
                </HStack>
                <HStack gap={3} wrap="wrap" vAlign="end">
                  <Selector
                    label={copy.languageLabel}
                    options={copy.languageOptions}
                    value={state.language}
                    isDisabled={pending}
                    onChange={(value) => {
                      if (!current.current.active)
                        update({
                          type: "language",
                          value: value as ReplyLanguage,
                        });
                    }}
                  />
                  <Button
                    label={copy.newConversation}
                    onClick={() =>
                      state.transcript.length || state.draft
                        ? setResetOpen(true)
                        : clear()
                    }
                  />
                </HStack>
              </VStack>
              {!state.transcript.length ? (
                <VStack gap={4}>
                  <Heading level={2}>{copy.welcome}</Heading>
                  <Text style={prose}>{copy.introduction}</Text>
                  <VStack gap={2}>
                    {copy.examples.map((example) => (
                      <Button
                        key={example}
                        label={example}
                        variant="secondary"
                        onClick={() => {
                          update({ type: "draft", value: example });
                          input.current?.focus();
                        }}
                      />
                    ))}
                  </VStack>
                </VStack>
              ) : (
                <List>
                  {state.transcript.map((turn, i) => (
                    <ListItem
                      key={i}
                      label={
                        <VStack gap={3}>
                          <Heading level={2}>
                            {turn.role === "user"
                              ? copy.parentLabel
                              : copy.coachLabel}
                          </Heading>
                          {turn.role === "user" ? (
                            <section
                              lang={conversationLanguage(state.transcript.slice(0, i + 1))}
                              dir={conversationLanguage(state.transcript.slice(0, i + 1)) === "ur" ? "rtl" : "ltr"}
                              style={prose}
                            >
                              <Text style={prose}>{turn.text}</Text>
                            </section>
                          ) : (
                            <Answer reply={turn.reply} />
                          )}
                        </VStack>
                      }
                    />
                  ))}
                </List>
              )}
              <VStack gap={4}>
                {state.error ? (
                  <section lang={state.error.language} dir={state.error.language === "ur" ? "rtl" : "ltr"} style={prose}>
                  <Banner
                    status="error"
                    title={state.error.message}
                    collapsible={false}
                  />
                  </section>
                ) : null}
                {state.cancelled ? <Text>{copy.cancelled}</Text> : null}
                {atLimit ? (
                  <Banner
                    status="info"
                    title={copy.turnLimit}
                    collapsible={false}
                  />
                ) : null}
                <TextArea
                  ref={input}
                  label={copy.composerLabel}
                  placeholder={copy.composerPlaceholder}
                  value={state.draft}
                  onChange={(value) => update({ type: "draft", value })}
                  rows={4}
                  isReadOnly={pending}
                  status={
                    state.feedback
                      ? { type: "error", message: copy[state.feedback] }
                      : undefined
                  }
                  description={copy.characterCount(
                    state.draft.length,
                    LIMITS.userText,
                  )}
                />
                <HStack gap={3} wrap="wrap">
                  <Button
                    label={unanswered ? copy.retry : copy.send}
                    variant="primary"
                    isDisabled={pending || atLimit || retryBlocked(state)}
                    onClick={() => void send()}
                  />
                  {pending ? (
                    <Button ref={cancelButton} label={copy.cancel} onClick={cancel} />
                  ) : unanswered ? (
                    <Button
                      label={copy.edit}
                      onClick={() => input.current?.focus()}
                    />
                  ) : null}
                </HStack>
                <section role="status" aria-live="polite" lang={announcement.language} dir={announcement.language === "ur" ? "rtl" : "ltr"}>
                  <Text>{announcement.text}</Text>
                </section>
                <Text color="secondary" style={prose}>
                  {copy.scope}
                </Text>
                <Text color="secondary" style={prose}>
                  {copy.privacy}
                </Text>
              </VStack>
              <Dialog isOpen={resetOpen} onOpenChange={setResetOpen}>
                <DialogHeader title={copy.resetTitle} />
                <VStack gap={4}>
                  <Text>{copy.resetBody}</Text>
                  <HStack gap={3} wrap="wrap">
                    <Button
                      label={copy.keepConversation}
                      onClick={() => setResetOpen(false)}
                    />
                    <Button
                      label={copy.clearConversation}
                      variant="destructive"
                      onClick={clear}
                    />
                  </HStack>
                </VStack>
              </Dialog>
            </VStack>
          </LayoutContent>
        }
      />
    </InternationalizationProvider>
  );
}
