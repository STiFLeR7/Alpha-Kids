"use client";
import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import {
  Layout,
  LayoutContent,
  VStack,
  HStack,
} from "@astryxdesign/core/Layout";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { ChatComposer, ChatMessage, useChatComposerContext } from "@astryxdesign/core/Chat";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Selector } from "@astryxdesign/core/Selector";
import { List, ListItem } from "@astryxdesign/core/List";
import { Banner } from "@astryxdesign/core/Banner";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import { VisuallyHidden } from "@astryxdesign/core/VisuallyHidden";
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
function ComposerInput({ input, copy, pending }: {
  input: RefObject<HTMLTextAreaElement | null>;
  copy: ReturnType<typeof getUiCopy>;
  pending: boolean;
}) {
  const composer = useChatComposerContext();
  const control = composer?.inputControlRef;
  useEffect(() => {
    if (!control) return;
    control.current = { focus: () => input.current?.focus() };
    return () => { control.current = null; };
  }, [control, input]);
  if (!composer) return null;
  return <TextArea ref={input} label={copy.composerLabel} isLabelHidden
    placeholder={copy.composerPlaceholder} value={composer.value}
    onChange={composer.onChange} rows={2} isReadOnly={pending}
    controlStyle={{ borderColor: "transparent", background: "transparent", boxShadow: "none" }} />;
}
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
  const actionButton = useRef<HTMLButtonElement>(null);
  const focusAfterReply = useRef(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
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
      if (document.activeElement === document.body ||
        (document.activeElement === actionButton.current && actionButton.current?.getAttribute("aria-disabled") === "true")) input.current?.focus();
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
      focusAfterReply.current = document.activeElement === actionButton.current;
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
      focusAfterReply.current = document.activeElement === actionButton.current;
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
        height="auto"
        contentWidth={1120}
        padding={6}
        content={
          <LayoutContent>
            <VStack gap={8}>
              <HStack gap={3} wrap="wrap" vAlign="center" hAlign="between" as="header">
                <VStack gap={0.5}>
                  <Text type="large" size="2xl" weight="bold" color="secondary"><bdi>{copy.appTitle}</bdi></Text>
                  <Text type="supporting">{copy.appSubtitle}</Text>
                </VStack>
                <HStack gap={3} wrap="wrap" vAlign="center">
                  <Selector label={copy.languageLabel} isLabelHidden options={copy.languageOptions}
                    value={state.language} isDisabled={pending}
                    onChange={(value) => {
                      if (!current.current.active) update({ type: "language", value: value as ReplyLanguage });
                    }} />
                  <Button label={copy.newConversation} size="sm" variant="ghost"
                    onClick={() => state.transcript.length || state.draft ? setResetOpen(true) : clear()} />
                </HStack>
              </HStack>
              <VStack gap={6} width="100%" maxWidth={720}
                paddingBlock={state.transcript.length ? 0 : 8}
                style={{ alignSelf: "center" }}>
              {!state.transcript.length ? (
                <VStack gap={3} style={{ textAlign: "center" }}>
                  <Text as="h1" type="display-2" weight="semibold" justify="center">{copy.welcome}</Text>
                  <Text color="secondary">{copy.introduction}</Text>
                </VStack>
              ) : (
                <VStack gap={8}>
                  {state.transcript.map((turn, i) => (
                    <ChatMessage key={i} sender={turn.role === "user" ? "user" : "assistant"}
                      name={turn.role === "user" ? copy.parentLabel : copy.coachLabel}>
                      {turn.role === "user" ? (
                        <section lang={conversationLanguage(state.transcript.slice(0, i + 1))}
                          dir={conversationLanguage(state.transcript.slice(0, i + 1)) === "ur" ? "rtl" : "ltr"} style={prose}>
                          <Text style={prose}>{turn.text}</Text>
                        </section>
                      ) : <Answer reply={turn.reply} />}
                    </ChatMessage>
                  ))}
                </VStack>
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
                {pending ? <Text color="secondary">{copy.preparing}</Text> : null}
                <ChatComposer value={state.draft} elevation="none"
                  onChange={(value) => update({ type: "draft", value })}
                  onSubmit={() => void send()}
                  input={<ComposerInput input={input} copy={copy} pending={pending} />}
                  status={state.feedback ? { type: "error", message: copy[state.feedback] } : undefined}
                  footerActions={state.draft.length ? <Text color="secondary">{copy.characterCount(state.draft.length, LIMITS.userText)}</Text> : undefined}
                  sendActions={!pending && unanswered ? <Button label={copy.edit} size="sm" variant="ghost" onClick={() => input.current?.focus()} /> : undefined}
                  sendButton={
                    <Button ref={actionButton} label={pending ? copy.cancel : unanswered ? copy.retry : copy.send}
                      tooltip={pending ? copy.cancel : unanswered ? copy.retry : copy.send}
                      isIconOnly={!pending && !unanswered}
                      icon={!pending && !unanswered ? <Icon icon="arrowUp" /> : undefined}
                      variant={pending ? undefined : "primary"}
                      isDisabled={!pending && (atLimit || (unanswered ? retryBlocked(state) : !state.draft.trim()))}
                      onClick={pending ? cancel : () => void send()} />
                  }
                />
                {!state.transcript.length ? (
                  <HStack gap={2} wrap="wrap" hAlign="center">
                    {copy.examples.map((example, i) => (
                      <Button key={example} label={copy.exampleLabels[i]} size="sm" variant="secondary"
                        onClick={() => { update({ type: "draft", value: example }); input.current?.focus(); }} />
                    ))}
                  </HStack>
                ) : null}
                <VisuallyHidden as="section">
                  <section role="status" aria-live="polite" lang={announcement.language}
                    dir={announcement.language === "ur" ? "rtl" : "ltr"}>
                    {announcement.text}
                  </section>
                </VisuallyHidden>
                <HStack gap={2} wrap="wrap" hAlign="center" vAlign="center">
                  <Text type="supporting" justify="center">{copy.disclaimer}</Text>
                  <Button label={copy.privacyTitle} size="sm" variant="ghost" onClick={() => setPrivacyOpen(true)} />
                </HStack>
              </VStack>
              </VStack>
              <Dialog isOpen={privacyOpen} onOpenChange={setPrivacyOpen}>
                <DialogHeader title={copy.privacyTitle} />
                <VStack gap={4}>
                  <Text style={prose}>{copy.scope}</Text>
                  <Text style={prose}>{copy.privacy}</Text>
                  <Button label={copy.close} onClick={() => setPrivacyOpen(false)} />
                </VStack>
              </Dialog>
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
