# Parent coach architecture

Status: approved baseline implemented, with integration verification in progress on 2026-11-17. Actual results and remaining findings are recorded in [docs/EVALUATION.md](docs/EVALUATION.md).
Read with [SAFETY.md](SAFETY.md), [DESIGN.md](DESIGN.md), and [PLAN.md](PLAN.md). This supersedes historical specs and mockups. Astra owns integration; Sol 6.1 Medium implements.

## Scope and evidence

One local Next.js TypeScript App Router app; one server `POST /api/coach`; browser memory only.
Adult parent writes English/Urdu; receives a brief practical plan and check-in, clarification, or fixed support copy.
No mascot, intake form, scores, tracker, login, database, persistence, analytics, hosting or external actions.
White/navy/coral is the accepted baseline in the approved plan. Use actual Astryx components and theme tokens.
English/Urdu/Auto UI: explicit Urdu localizes chrome and sets RTL; Auto has bilingual input cues and English chrome.
Every message has its own `lang`/direction; render plain text, never model HTML or unchecked streaming.

Implemented locally: Next 16.4.6, Node 24.11.0, Astryx core/theme/CLI 0.7.16, React/react-dom 19.3.1 and StyleX 0.19.2.
Core's installed peer ranges are React/react-dom >=19 and StyleX ^0.19.0; those ranges match installed packages.
Versions are pinned in package.json/package-lock.json. The foundation and UI builds passed; final release verification is tracked separately in the evaluation record.

## Data flow

```text
Astryx page (memory transcript, one active request)
   | bounded JSON + requestId; AbortController
   v
POST route: origin/body/schema/limits -> local concurrency slot
   v
call A: classify + optional draft -> strict validation
   | urgent/safeguarding -> fixed server copy ------------------+
   | other valid result                                      |
   v                                                         |
fresh call B: transcript + candidate (no A classification)      |
   v                                                         |
strict review validation -> arbitration -> fixed or checked --+
   v
public schema -> JSON, no-store -> matching active UI request only
```

## Shared contracts: `lib/contracts.ts`

Use Zod strict objects/discriminated unions, infer TypeScript types, export supported JSON Schema for provider use.
The sketch below summarizes the implemented shared shapes; lib/contracts.ts is authoritative. Never accept model-only fields from the browser.

```ts
type Language = 'en' | 'ur';
type ReplyLanguage = Language | 'auto';
type Plan = { kind: 'coach'; reason: 'everyday_parenting'; language: Language; acknowledgment: string;
  steps: [string, string] | [string, string, string]; checkIn: string };
type Clarification = { kind: 'clarify'; reason: 'missing_context'; language: Language; question: string };
type Candidate = Plan | Clarification;
type UrgentReason = 'immediate_emergency' | 'imminent_self_harm' | 'imminent_harm_to_others'
  | 'self_harm_distress' | 'uncertain_current_danger';
type SafeguardingReason = 'child_abuse' | 'domestic_abuse' | 'suspected_abuse';
type BoundaryReason = 'medical' | 'legal' | 'harmful_request' | 'off_topic';
type FixedRoute = { kind: 'urgent'; reason: UrgentReason }
  | { kind: 'safeguarding'; reason: SafeguardingReason }
  | { kind: 'boundary'; reason: BoundaryReason };
type Assessment = FixedRoute | { kind: 'coach'; reason: 'everyday_parenting' }
  | { kind: 'clarify'; reason: 'missing_context' };
type DraftResult = { route: FixedRoute; language: Language; candidate: null }
  | { route: { kind: 'coach'; reason: 'everyday_parenting' }; language: Language; candidate: Plan }
  | { route: { kind: 'clarify'; reason: 'missing_context' }; language: Language; candidate: Clarification };
type ReviewResult = { assessment: Assessment; decision: 'accept' | 'reject';
  checks: { prohibitedAdvice: boolean; inventedFacts: boolean;
    languageMismatch: boolean; missingCheckIn: boolean; harmfulParenting: boolean } };
// Checks are violation flags: true means reject; no rationale/free-text rewrite.
type FixedReply = FixedRoute & { language: Language; heading: string; message: string };
type Reply = Candidate | FixedReply;
type Turn = { role: 'user'; text: string } | { role: 'assistant'; reply: Reply };
type CoachRequest = { requestId: string; replyLanguage: ReplyLanguage; transcript: Turn[] };
type UnavailableReason = 'invalid_request' | 'too_large' | 'limit_reached' | 'forbidden_origin'
  | 'busy' | 'provider_failure' | 'deadline' | 'invalid_output' | 'review_rejected';
type PublicError = { kind: 'unavailable'; reason: UnavailableReason;
  language: Language; message: string; retryable: boolean };
type PublicResponse = { requestId: string; ok: true; reply: Reply }
  | { requestId: string | null; ok: false; error: PublicError };
```

UUID requestId; no extra properties; transcript starts/ends user and alternates roles.
At most 8 user turns/15 total entries; each user text 1–2,000 UTF-16 code units, nonblank.
Reject overflow rather than truncating old context. Cap streamed request bytes at 65,536 before JSON parsing;
Content-Length is only an early check. Bound body-read time under the same overall deadline.
All reply strings nonblank; acknowledgment <=300, step <=400, checkIn/question <=300 code units;
candidate total <=1,800. Fixed heading <=120/message <=1,800. Whole request still obeys byte cap.
Validate language equality across DraftResult/candidate and explicit language selection; Auto uses A's validated language.
Provider schema may omit unsupported refinements; local Zod enforces every constraint after parsing.
Failed/error UI notices are not assistant turns. A retry reuses the same final user entry with a fresh requestId.
On successful completion of turn eight the visible transcript may contain 16 entries; the next request is blocked locally and on the server.

Export `CoachRequestSchema`, `PublicResponseSchema`, `DraftResultSchema`, `ReviewResultSchema`, their inferred types,
`draftJsonSchema` and `reviewJsonSchema`. Keep `LIMITS` in this file: `userText=2000`, `userTurns=8`, `requestBytes=65536`,
`providerBytes=65536`, `candidateText=1800`, `deadlineMs=30000`, `stageMs=14000`, `reserveMs=1000`, `inFlight=2`.
`fixedReply(route: FixedRoute, language: Language): FixedReply` and
`errorCopy(reason: UnavailableReason, language: Language): PublicError` are the shared copy exports.
Use `getUiCopy(language: Language): UiCopy` for UI strings; define that returned shape completely in the foundation task.

## Ownership and seams

| Module | Single responsibility / exported seam |
| --- | --- |
| `app/layout.tsx` | Metadata, Astryx reset/astryx CSS and theme setup; client boundary only where needed. |
| `app/page.tsx` | Conversation/composer, language, pending/failure/cancel/reset, accessible focus/live status. |
| `lib/contracts.ts` | Shared schemas, limits, derived types; no secrets/server imports. |
| `lib/copy.ts` | Static UI strings; bilingual fixed replies keyed by exact route/reason; no provider text. |
| `app/api/coach/route.ts` | Node runtime; bounded body/origin validation, slot/deadline, invoke coach, public envelope/status. |
| `lib/coach.ts` | Server-only policy/prompts, sequential A/B, local validation and pure arbitration. |
| `lib/gemini.ts` | Server-only fetch/envelope parser; one pinned Gemini model, no framework or generic adapter layer. |
| `lib/chat-state.ts` | Pure UI reducer; one outstanding parent turn, request identity, retry/reset/cancel transitions. |
| `lib/locale.ts` | Shared explicit-language/fallback-script selection; no country inference. |
| `lib/errors.ts` | Controlled server failure type and reason; no provider payload. |
| `tests/` | Synthetic contracts/arbitration/provider failures and UI state checks; no real parent data. |

```ts
// Internal server seams; implementations belong in the modules above.
type ReviewCandidate = Omit<Plan, 'kind' | 'reason'> | Omit<Clarification, 'kind' | 'reason'>;
type ReviewInput = { transcript: Turn[]; language: Language;
  candidate: ReviewCandidate | null };
type CallContext = { signal: AbortSignal; deadlineAt: number };
declare function draft(input: CoachRequest, ctx: CallContext): Promise<DraftResult>;
declare function review(input: ReviewInput, ctx: CallContext): Promise<ReviewResult>;
declare function arbitrate(a: DraftResult, b: ReviewResult): Reply | null;
// null means review_rejected; fixed replies always come from copy.ts.
declare function coach(input: CoachRequest, ctx: CallContext): Promise<Reply>;
declare function generateJson(args: { system: string; input: string; schema: object;
  maxOutputTokens: number }, ctx: CallContext): Promise<unknown>;
// lib/gemini.ts owns generateJson; lib/coach.ts owns all four policy functions.
```

Controlled server failures use `CoachError` with an enumerated `UnavailableReason`; put it in `lib/errors.ts`.
It carries no raw provider payload. Unexpected exceptions map to a fixed provider_failure response without content logging.
`lib/locale.ts` exports `resolveLanguage(selection: ReplyLanguage, text: string, previous: Language): Language`:
explicit choice wins; otherwise Arabic-script text selects Urdu, Latin text selects English, and ambiguous text uses previous.
This is the deterministic failure/UI fallback only. On successful Auto assessment, use A's validated language;
B receives that expected language, with no A classification or reasoning. Do not assert full Roman-Urdu detection from script alone.

No request IDs or browser assistant text become privileged policy. Serialize the entire transcript as untrusted data
under server system instructions, including prior assistant replies. Review gets no A route, reason or reasoning.
Strip kind/reason from A's candidate before creating ReviewInput; B gets wording, not A's current route labels.
Its shape can still reveal that a plan/question was drafted, so this is not a blinded or independent assessment.
ReviewInput.candidate is null for boundary results, so B still independently checks context.

## Prompting contract

Use two small versioned server instruction strings in `lib/coach.ts`, with structured outputs rather than a prompting framework.
A's instructions define the adult-parent role, prohibited advice, exact route meanings, language behavior, unresolved-risk handling,
and the brief acknowledgment/actions/check-in format. Include a few contrasting synthetic examples: everyday versus idiomatic danger,
current versus resolved harm, and Urdu escalation. Examples illustrate policy, not a keyword allowlist.
Pass request data as serialized JSON in user content; never interpolate it into system instructions or replay browser assistant turns
as authoritative model messages. Ask for the schema only, never private reasoning or a diagnostic explanation.

B receives its own safety rubric, the untrusted transcript, expected language and optional candidate; no A classification/reasoning.
It independently assesses the situation, then checks the proposed wording for prohibited advice, invented facts, wrong language,
missing check-in (coach only), and harmful parenting. With a null candidate, wording flags are false; risk assessment still runs.
B returns only its assessment/decision/violation flags. It cannot rewrite an answer, generate a new question or invoke tools.
The application decides what to display. Prompts and strict schemas reduce errors; neither proves semantic safety.

## Arbitration and retained risk

1. A valid urgent/safeguarding assessment immediately returns the server-selected bilingual reply; do not call B.
2. Otherwise B freshly classifies the transcript and checks the candidate. Either assessment can escalate.
3. For two valid assessments, fixed routes take precedence: urgent > safeguarding > boundary.
   Within urgent use immediate_emergency > imminent_self_harm > imminent_harm_to_others > uncertain_current_danger > self_harm_distress.
   Within safeguarding use child_abuse > domestic_abuse > suspected_abuse; within boundary use medical > legal > harmful_request > off_topic.
   The tie order only chooses the fixed template; it cannot authorize advice. All confirmed immediate routes use immediate-help wording.
4. A boundary survives B disagreement only when B returned a valid assessment; a missing/invalid/failed B returns unavailable.
   Either valid fixed route wins even if B rejects candidate wording, because the server discards the candidate and supplies its own copy.
5. With no fixed route, return A's candidate only when A/B agree on coach or clarify, B accepts, and every violation flag is false.
   If they disagree or B requests a new clarification, return review_rejected; there is no third generation call.
6. Missing/invalid B, rejection or invalid A means no candidate reaches the client. Never repair malformed JSON by guessing.
7. If a valid escalation has been selected, later nonessential failure must not replace it with a generic error.
   Catch failures at the narrow provider/review boundary; public serialization uses trusted fixed copy.

Every request includes the entire bounded history. Prompts explicitly retain unresolved earlier danger despite “ignore that”;
historical/resolved, hypothetical, negated and idiomatic language need distinct fixtures. No server risk ledger is claimed.
A browser can forge/omit history, and a reset loses it: safety cannot be continuous or tamper-proof without trusted state.
Same-model review can repeat the first error; it is a mitigation, never a guarantee or expert assessment.
Urgent subtypes distinguish immediate danger from non-imminent self-harm distress/uncertain danger; safeguarding handles abuse.
No generated phone numbers, country inference from Urdu, diagnosis, treatment/dosing or legal instructions.

## Provider and verification

Implemented: **`gemini-3.5-flash-lite` for both calls through Gemini**, pinned in lib/gemini.ts. Prompts remain DRAFT_SYSTEM_V3 and REVIEW_SYSTEM_V3. The user explicitly requested this restoration and local `.env` configuration on 17 November 2026. Current configuration smoke and production-browser calls include successful everyday/crisis replies and provider failures; availability and full quality acceptance remain open. Current and historical observations are preserved in docs/EVALUATION.md.

Native fetch posts to `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent`, with server-only `GEMINI_API_KEY` in `x-goog-api-key`, systemInstruction and user contents. generationConfig uses `responseMimeType: application/json`, `responseJsonSchema`, and LOW thinking. Local Zod validation remains authoritative. Next loads the ignored local `.env` natively; reviewers copy `.env.example` and supply their own Gemini key without vault access. The owner's current local configuration is explicitly authorized and must stay ignored; never print or commit keys. No automatic model/key rotation, retries or fallback.

Accept exactly one candidate with `finishReason: STOP` and text parts. Reject blocked, malformed, truncated, non-text or invalid-JSON output. A present thought flag must be boolean; true thought parts are excluded. Never expose raw output or reasoning. Outbound redirects are rejected.

Implemented budgets: 30 seconds from route entry through final serialization; A <=14s, B <=14s and <=remaining budget minus 1s.
A uses `maxOutputTokens: 2048`, B `1024`, with `thinkingConfig: {thinkingLevel: 'LOW'}`. Cap each provider response body at 65,536 bytes before parsing; no automatic retry.
Do not queue; two active local requests maximum, then 429. Release slots/timers in finally, including cancellation.
These limits are deadlines rather than latency promises; overlong output or provider delays return a controlled failure.
Never expose raw provider body/errors to the browser or logs.

The approved implementation run includes a synthetic live preflight via the native-loaded local server key; no separate permission loop is planned:
verify access/quota/billing, exact request/schema/settings, normal EN/UR two-call runs and fixed crisis routing.
Measure complete A+B latency at shortest and maximum allowed history and review truncation/errors.
If it cannot reliably fit 30s, revise the budget/model decision explicitly; never skip review to meet a stopwatch.
Observed access and latency do not establish reliability, clinical quality or zero retention. Account quota and billing can limit evaluations and repeated use. Provider processing/account privacy settings remain separate from the app's memory-only history.

## HTTP and UI lifecycle

JSON/no-store responses: 400 invalid_request; 413 too_large; 422 limit_reached; 403 forbidden_origin;
429 busy; 503 provider_failure or invalid_output; 504 deadline; 200 review_rejected or successful reply.
Use `ok:false` for review_rejected. Error messages are fixed bilingual copy with conditional immediate-danger guidance;
do not label unknown risk as a detected crisis. `retryable` only for busy, provider_failure, deadline or invalid_output.
No background retry; the parent can explicitly retry, or edit/reset after non-retryable errors.
Missing/invalid request ID returns null. Preserve a valid parsed request ID; never echo arbitrary strings or raw errors.
Require JSON and exact local Origin/Host agreement (reject missing Origin for browser-only endpoint);
allow Next's loopback URL hostname normalization only when protocol/port match and both URL/Origin hosts are loopback.
no CORS wildcard. This is browser request validation, not authentication. Bind dev/start to 127.0.0.1.

On Send append visible user text once, retain a read-only composer draft, and store active requestId and conversation generation. Clear the draft only on successful completion.
On failure leave that user turn visible with Retry/Edit and announce the error; never append it twice.
Edit replaces only the unanswered final user turn. Disable new sends until that turn is retried/edited or reset.
Cancel aborts fetch and marks the final turn unanswered; reset aborts, increments generation and clears memory.
Append a reply only when requestId and generation still match the active request, even if abort races completion.
For a fixed error with null requestId, or a transport failure, use the active fetch closure's requestId/generation to accept the error;
never discard a legitimate early 400/403/413 just because the server could not parse an ID. Validate response JSON on the client too.
Link request.signal and server timeout to provider AbortSignal; browser cancellation cannot guarantee provider billing stops.
Do not persist to local/session storage or log conversation content. Explain refresh/reset loss and provider processing near input.

## Execution order and acceptance

1. Integrator owns package/lockfile, tsconfig, Next/test config, scripts, contracts and copy skeleton first.
   Add only Next, TypeScript/types, Zod and necessary test tooling; keep installed Astryx. No competing package edits.
2. Once contracts/copy exports freeze, server worker owns route/coach/gemini and server tests;
   UI worker owns page/layout/theme and UI tests. These are the smallest independent streams.
   Both use shared fixtures; integrator alone changes contracts/config and resolves interface changes.
3. An evaluation worker can prepare synthetic fixtures and the runner against the frozen public contract in parallel.
   Integrator runs offline checks, synthetic live gate, final accessibility/RTL checks and README/walkthrough integration.
   Parent indexes current documents and excludes superseded local artifacts from the submission.

Implemented commands: `npm run typecheck` (`tsc --noEmit`), `npm test` (Vitest run), `npm run build`,
`npm run astryx -- doctor --built .` to inspect source and build; resolve failures before delivery.
UI worker follows `npm run astryx -- build`, template/component inspection, layout docs and theme-editor PNG inspection.
No raw div/span, utility compiler assumptions or hardcoded colors/spacing; theme changes need visual verification.

Acceptance: strict request/public schemas and limits; precedence/disagreement matrix; preserved escalation on later failure;
timeouts, blocks, malformed/truncated output, busy slot release; failure retry and late-response/reset race;
English/Urdu/Auto, RTL/mixed text, keyboard/focus/live announcements, mobile layout and plain-text injection rendering.
Live safety fixtures include everyday, clarification, crisis, abuse, medical/legal, unresolved prior risk, idiom and injection.
Document actual outcomes in docs/EVALUATION.md; architecture requirements alone are not evidence of a passed check.

Preflight gates: exact Next version/peer build and provider access/terms/latency. Accepted visual baseline: white/navy/coral palette.
Urdu safety meaning must be inspected; independent native-language review is desirable, not falsely claimed or assumed available.
These gates do not justify adding persistence, extra providers, runtime tools, browsing or RAG.
