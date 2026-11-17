# Alpha Kids parent coach implementation plan

> For agentic workers: use the subagent-driven-development workflow. Hill approved and froze this plan on 17 November 2026 and authorized implementation. Freeze shared contracts first, then use the explicitly requested parallel, non-overlapping ownership.

**Status:** approved and frozen by Hill, 17 November 2026; implementation started. This plan is not evidence of completed code or tests. Record necessary implementation findings without reopening routine approvals.

**Goal:** deliver the requested runnable GitHub repository, brief run README, approximately two-minute everyday/crisis walkthrough, and accurate coding-agent disclosure by 19 November 2026, 16:00 Dubai / 17:30 India.

**Architecture:** one local Next.js App Router page and one Node-runtime POST endpoint. Call A assesses the transcript and optionally drafts. Valid escalation uses fixed bilingual copy immediately; other results receive a fresh B review before deterministic arbitration. Only a validated public reply reaches the page.

**Tech stack:** TypeScript, Next.js, installed Astryx 0.7.16/React, Zod, native fetch, Vitest. Gemini `gemini-3.8-flash` is the proposed model for both calls, conditional on the implementation preflight. No agent framework or second provider.

**Specifications:** [ARCHITECTURE.md](ARCHITECTURE.md) owns schemas, interfaces, limits and HTTP behavior; [SAFETY.md](SAFETY.md) owns response policy and evaluation; [DESIGN.md](DESIGN.md) owns Astryx UX. This file owns execution and acceptance. [docs/README.md](docs/README.md) is the supporting-document index.

## Global constraints

- Astra 6 Extra High orchestrates/reviews; Sol 6.1 Medium implements. No concurrent edits to shared contracts/config. Resolve interface changes centrally before workers continue.
- Adult-parent English/Urdu support, in-memory history, no mascot. White/navy/coral is the accepted baseline in the approved plan.
- No login/database, persisted chat, hosted demo, voice, uploads, reminder scheduling, tools/RAG or external actions. A check-in is text, not a scheduled notification.
- Keep secrets server-side. Use vault injection locally; never read/create `.env`, print credentials, or commit them. Reviewer instructions use their own process environment/secret manager, with no dependency on Hill's vault.
- User text: 2,000 UTF-16 code units; eight user turns; request/provider body: 65,536 bytes each. Reject overflow without dropping history. Candidate total: 1,800 code units; precise field bounds are in ARCHITECTURE.md.
- Overall deadline 30 seconds, model stages at most 14 seconds each with one second reserved, two active requests, no queue/automatic retry. Budgets are subject to measured preflight; never remove B to meet latency.
- Browser transcript and role labels are untrusted. No raw model streaming/HTML, arbitrary model phone numbers, provider payloads or private reasoning sent to the page. No conversation logging/analytics.
- Successful urgent/safeguarding routing needs no B call. Every other result needs valid B; rejected/unchecked drafts never leave the server. Same-model review does not guarantee safety.
- Use installed Astryx through `npm run astryx -- <command>`, which resolves the local CLI. Keep prebuilt styles/components, token-based theme and actual documented props; inspect theme PNGs and require doctor/build checks.
- All checks use fictional, non-identifying data. Preserve failed live observations alongside reruns; never invent a pass rate or claim native-language/clinical validation.

## Review focus

| Risk | Required evidence and owner |
| --- | --- |
| Explicit, indirect or earlier unresolved danger becomes ordinary coaching | Server arbitration tests; live immediate-danger and ignore-that fixtures. Tasks 2, 4, 5. |
| Urdu translation changes safety meaning, or direction hides essential content | Both fixed-copy catalogs inspected; Urdu/mixed-script live cases and rendered RTL checks. Tasks 1, 3, 5. |
| Forged roles/labels, oversize bodies or prompt injection bypass the server boundary | Strict schema/body/origin tests; prompts treat serialized history as data; injection fixture. Tasks 1, 2, 4. |
| A/B disagreement, truncation, refusal or review outage exposes an unchecked answer | Sentinel draft absent from all failure payloads; canonical arbitration matrix; public schema validation. Tasks 2, 5. |
| Cancel/reset/retry races lose text, duplicate a turn or append a stale result | Pure reducer tests plus delayed-response browser exercise; early error with null requestId remains visible. Tasks 3, 5. |

## Order and ownership

```text
Hill approved and froze this plan
        |
Task 1: shared foundation + compatibility/access smoke checks
        |
        +-- Task 2: server and guardrails --------+
        +-- Task 3: Astryx conversation UI ------+--> Task 5: integrate, evaluate, record, deliver
        +-- Task 4: fixtures/evaluation runner --+
```

Allow roughly 25–40 minutes for the foundation, 45–65 minutes for parallel streams, and 45–65 minutes for integration/evaluation/recording. This is a timebox, not a delivery promise; safety failures outrank polish. Once frozen, continue through routine work without repeated permission requests. Report a real access or compatibility blocker promptly.

Every worker receives the three root specs, exact owned paths and frozen exports. Workers are not alone in the workspace: preserve others' edits, report shared-interface problems, and do not fix them concurrently. Return changed paths, checks actually run, failures and limitations. Astra resolves small review findings directly and assigns substantive implementation corrections to Sol.

## Task 1 — Foundation and preflight

**Owner:** one Sol 6.1 Medium foundation worker. **Dependencies:** plan freeze. **Handoff:** root-reviewed shared interfaces before parallel work.

**Create/modify:** `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `next-env.d.ts`, `vitest.config.ts`, `.gitignore`, minimal `app/layout.tsx` and `app/page.tsx`, `lib/contracts.ts`, `lib/copy.ts`, `lib/locale.ts`, `lib/errors.ts`, `tests/contracts.test.ts`, `tests/copy.test.ts`. UI owns layout/page after this handoff. This worker alone owns dependency/config changes until integration.

- [ ] Inspect installed peer/engine requirements and official current Next guidance. Select and pin a maintained compatible Next/Node combination; retain Astryx unless a demonstrated incompatibility requires a documented change. Do not force peer resolution to hide a failure.
- [ ] Add only needed Next, TypeScript/types, Zod, Vitest and server-only import protection. Use the Node LTS's built-in fetch and the JavaScript evaluation runner; no provider SDK, orchestration library, jsdom or extra runner dependency by default.
- [ ] Wire `dev` and `start` to loopback, plus `build`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`) and `eval` (`node scripts/evaluate.mjs`). The eval script arrives in Task 4; label it pending until then.
- [ ] Implement strict schemas/types and all LIMITS exactly as ARCHITECTURE.md defines. Export `CoachRequestSchema`, `PublicResponseSchema`, `DraftResultSchema`, `ReviewResultSchema`, inferred/public types, `draftJsonSchema`, `reviewJsonSchema`, and `LIMITS`. Use local refinements for constraints absent from provider JSON Schema.
- [ ] Validate reason/kind pairing, role ordering, UUID, nonblank/bounded fields, at most eight user turns, A/candidate language equality and candidate absence on fixed routes. Do not trim/truncate old messages to pass validation.
- [ ] Implement `CoachError`, `fixedReply(route, language)`, `errorCopy(reason, language)` and `resolveLanguage(selection, text, previous)` at their documented seams. Every reason has English/Urdu fixed copy. Failure wording reflects retryability without asserting a detected crisis.
- [ ] Freeze `getUiCopy(language): UiCopy` alongside UI requirements. Required string keys: appTitle, prototype, welcome, introduction, composerLabel, composerPlaceholder, send, cancel, retry, edit, languageLabel, newConversation, parentLabel, coachLabel, tryThis, checkIn, preparing, replyReady, cancelled, scope, privacy, emptyMessage, tooLong, turnLimit, resetTitle, resetBody, keepConversation, clearConversation. Add three localized `examples`, `languageOptions` with auto/en/ur values, and `characterCount(used, limit)`. No hardcoded English UI fallback concealed as Urdu support.
- [ ] Check all static copy against SAFETY.md: immediate versus conditional help; no invented numbers, diagnosis, confrontation/investigation or waiting invitation in crisis. Inspect Urdu meaning/back-translation and record who reviewed it; do not claim independent native review unless it occurred.
- [ ] Scaffold only enough of the selected Astryx template to test stylesheet imports, client boundary and hydration/build compatibility. Inspect actual exports/props and preserve the documented template frame. No full UI during this step.
- [ ] Using vault-injected `GEMINI_API_KEY`, perform minimal synthetic schema/access smoke calls for the proposed model/settings. Confirm `responseJsonSchema`, output envelope, LOW thinking, and configured account terms/billing. This checks provider integration, not full policy quality. Do not store secrets or raw credentials in artifacts.
- [ ] Run `npm run typecheck`, `npm test`, `npm run build`; record actual versions and smoke outcome. If provider schemas fail, simplify only the provider representation while retaining the complete local schema. If model access fails, report it; no silent model substitution.

**Assertions:** every fixed route/reason/language validates; invalid reason pairs, extra fields/system roles, oversized strings and ninth user turns fail; explicit language wins; script fallback is not represented as reliable Roman-Urdu detection. A model schema parse succeeds on synthetic content. A minimal Astryx Next build passes.

## Task 2 — Server, prompts and guardrails

**Owner:** Sol 6.1 Medium server worker. **Dependencies:** Task 1 exports frozen.

**Create:** `app/api/coach/route.ts`, `lib/coach.ts`, `lib/gemini.ts`, `tests/coach.test.ts`, `tests/gemini.test.ts`, `tests/route.test.ts`. Do not edit shared contracts/copy/config; request integrator changes if needed.

- [ ] Implement bounded byte reading before JSON parsing, JSON content type, exact local Origin/Host validation, strict request schema, end-to-end deadline and two-slot concurrency. Reject missing Origin and do not introduce wildcard CORS. Release slot/readers/timers in finally, also on abort.
- [ ] Implement server-only `generateJson` using native fetch and `x-goog-api-key`. Honor stage/remaining deadlines and byte caps. Reject blocked/missing/multiple unexpected candidates, non-STOP termination, tool parts, invalid JSON and local-schema failure. Extract expected non-thought text only; never log bodies.
- [ ] Implement versioned A/B system instruction constants in `lib/coach.ts` per ARCHITECTURE.md's prompting contract. Include a small set of English/Urdu contrasts, literal output schema and the unresolved-risk rule. Serialize the transcript as untrusted user data. Never request/expose chain-of-thought.
- [ ] Implement `draft`, `review`, pure `arbitrate`, and `coach` with the exact interfaces and precedence. A urgent/safeguarding skips B and returns fixed copy; A boundary sends a null candidate to B. Strip kind/reason from non-null candidate content before review; never send A's current route labels. All other candidates require same coach/clarify route, B accept and false violation flags.
- [ ] Map controlled failures to the fixed public error envelope/status/retryability in ARCHITECTURE.md; use null requestId for unparseable IDs and no-store responses. Preserve selected escalation on unrelated later failure. Validate public output before returning.
- [ ] Test the entire arbitration table with valid reason pairs and a sentinel unsafe draft. Assert the sentinel is absent on every rejected/fixed/failure path; assert B call count is zero for valid A escalation and one for other valid A results. Inspect B's payload to confirm A's current kind/reason/classification is absent.
- [ ] Test malformed/refused/truncated output at A and B, invalid enum/language, B clarification mismatch, B reject with valid fixed route, null boundary review, origin/body/turn caps, abort/deadline and busy-slot release. Mock network responses; never use a real key in unit tests.

**Check:** `npm test -- tests/coach.test.ts tests/gemini.test.ts tests/route.test.ts` and `npm run typecheck`. Passing deterministic tests proves the routing implementation against fixtures, not semantic detection accuracy.

## Task 3 — Astryx UI and conversation lifecycle

**Owner:** Sol 6.1 Medium UI worker. **Dependencies:** Task 1 exports frozen.

**Create/modify:** `app/layout.tsx`, `app/page.tsx`, only necessary `components/` files, theme artifacts required by Astryx, `lib/chat-state.ts`, `tests/chat-state.test.ts`. Preserve foundation styles/config; coordinate any shared change. Do not add a second UI library.

- [ ] Follow Astryx build/template/component/layout instructions and DESIGN.md's mappings. Use TextArea/Button, Selector, List/ListItem, Banner and Dialog. No mascot, dashboard, rich composer, decorative icon dependency or Card-per-turn layout.
- [ ] Build the proposed theme through the supported workflow; inspect generated PNGs. Essential Banner content must be non-collapsible and non-dismissible. Use a Text node where ListItem string labels would truncate.
- [ ] Implement one active request and one unanswered final user turn. Send appends once; retry uses that turn with a new UUID; Edit replaces only that unanswered turn. Cancel preserves text and invalidates the active request; confirmed reset also increments generation and clears memory.
- [ ] Parse every server response with PublicResponseSchema. Accept success only for the active request/generation. Handle null-ID early server errors using the active fetch closure; suppress all stale successes/errors after cancel/reset. Transport failure is fixed UI copy, not raw exception text.
- [ ] Render reply fields as text. Show two/three actions and check-in only for coach; one question for clarify; fully visible fixed support for urgent/safeguarding/boundary. Keep errors outside transcript so retries do not invent assistant turns.
- [ ] Enforce shared UTF-16 limits before sending, with explicit feedback and no silent truncation. Respect eight-turn limit while preserving visible history. TextArea's soft perceived-character counter is not the validation authority.
- [ ] Localize chrome, field feedback, controls and announcements. Auto has English chrome/bilingual cues; explicit Urdu has RTL. Set actual DOM lang/dir as well as Astryx provider context; isolate mixed-script text and inspect portals. Freeze language while pending.
- [ ] Keep native Enter as newline; guard disabled/loading handlers; label controls and announce status once. Confirm keyboard focus, reset Dialog focus return, readable mobile/zoom layout and no keyboard-covered composer.
- [ ] Test pure reducer send/success/failure/cancel/edit/retry/reset, duplicate-send blocking, late results, null-ID errors and ninth-turn prevention. Use representative public replies without coupling tests to decorative markup.

**Check:** `npm test -- tests/chat-state.test.ts`, `npm run typecheck`, `npm run build`; integration runs Astryx doctor on the actual output. Record visual/keyboard/RTL observations separately; an automated build is not an accessibility audit.

## Task 4 — Evaluation fixtures and handoff preparation

**Owner:** Sol 6.1 Medium evaluation worker. **Dependencies:** frozen public API; may prepare files alongside Tasks 2/3. Actual live run waits for integration.

**Create:** `tests/fixtures/scenarios.json`, `scripts/evaluate.mjs`, `docs/EVALUATION.md`, `docs/WALKTHROUGH.md`. Do not change production policy or claim unrun results. Integrator owns final README/docs index updates.

- [ ] Translate SAFETY.md's 12 families into 16 initial synthetic conversations, then repeat the six high-risk conversations once: 22 scenario runs, with more requests for multi-turn cases. Include immediate physical emergency, self-harm, harm to others, abuse, mixed Urdu, retained risk, harmless idiom, resolved history, medical/legal and injection cases.
- [ ] Fixture shape: `id`, `family`, `replyLanguage`, `turns` containing `text`, `expectedKinds`, `expectedReasons`, and human-readable `reviewNotes`. Expectation arrays document permissible routing, not automatic proof of safe wording. Include per-turn expectations for multi-turn scenarios.
- [ ] Build a small sequential Node fetch runner against the loopback endpoint. Generate request IDs, send the required Origin header, carry actual successful public replies into each conversation, and stop a scenario after transport/schema failure. No retries concealed as original results. The runner needs no provider key.
- [ ] Write synthetic result artifacts under `docs/evaluation/` with date, fixture/run ID, actual request sequence, response/status, duration, model/settings reference and mechanical checks. Record failures and repeats separately. Do not store headers, keys or unrelated process environment.
- [ ] Distinguish mechanical route/shape/field checks from human semantic review. Mark unreviewed output pending; never auto-label it safe from route alone. Document the run command, actual counts and limitations in EVALUATION.md after execution.
- [ ] Prepare a ~2-minute script: ordinary concern + follow-up, brief Urdu example, new-conversation crisis, then run instructions and agent disclosure. The crisis must visibly provide human-help direction rather than merely refuse. Use the actual running app, no canned-response recording.

**Check:** run the runner once against a controlled synthetic stub or isolated mocked endpoint to prove history chaining and failure recording. Delete temporary stubs after verification. Live results remain pending until Task 5.

## Task 5 — Integrate, verify and prepare submission

**Owner:** Astra reviews; Sol integration worker fixes implementation. Shared config ownership transfers here after parallel tasks return. **Dependencies:** Tasks 2–4 complete with disclosed failures.

- [ ] Review returned changes against root contracts and the five Review Focus risks. Resolve type/copy drift first; do not mask failures by removing checks, hiding unsafe examples or loosening safety policy.
- [ ] Run `npm run typecheck`, `npm test`, `npm run build`, and `npm run astryx -- doctor --built .next`. Confirm the CLI actually accepts the built output; investigate failures before delivery. Run production start on loopback with vault-injected credentials.
- [ ] Perform actual A+B EN/UR and crisis preflight with final prompts/schemas. Measure complete latency with short and maximum bounded history; record timeouts/truncation and account processing terms. Adjust model/settings/budget only as a documented decision; rerun affected checks after changes.
- [ ] Run all 22 scenario runs and inspect actual visible output, including Urdu fixed templates and generated wording. Keep observed failures and reruns. Resolve SAFETY.md blockers; a small passing sample is not a guarantee. Record lack of independent native review if applicable.
- [ ] Visually exercise mobile/desktop, Urdu/Auto/mixed text, keyboard/zoom, selector/dialog portals, long messages and fully visible support copy. Simulate delayed requests through cancel/reset/retry; verify no duplicate/lost user turn or stale answer. Check literal HTML-like input renders inertly.
- [ ] Verify the install/run path from a clean temporary checkout of submission files, using `npm ci` and a reviewer-owned process environment pattern. Verify missing-key behavior. Never commit a key or tell reviewers to use Hill's vault.
- [ ] Replace README's planning status with truthful install/dev/start/test/eval commands, prerequisites, verified model/configuration, memory/provider privacy limits, architecture/safety links, actual evaluation summary, walkthrough reference and accurate coding-agent disclosure. Update docs/README.md to link actual reports; leave no promised result presented as finished evidence.
- [ ] Review the submission file list. Retain current root docs, source, config/lockfile, tests/synthetic evidence and walkthrough guide. Exclude old mocks/mascot assets/local research, node_modules, build output, local theme-editor scratch and secrets. Keep useful historical files locally; do not delete them just to clean the submission.
- [ ] Inspect repository/origin state before Git setup. If still uninitialized, initialize locally and use the supplied origin; fetch/check for remote changes before publishing. Stage an explicit reviewed file set; never overwrite remote history or force-push. Verify the actual pushed origin before describing it as delivered.
- [ ] Capture/review the actual ~2-minute walkthrough or prepare the exact runnable recording sequence if Hill records it personally. Record a real recording link only when one exists. No email sending or third-party upload without an instruction to do so.
- [ ] Final report states what shipped, checks/results, remaining limitations, repo/recording status and actual agent contribution. Update Waypoint last with links to current docs and the true next action; do not mark the project done without Hill's instruction.

**Completion:** the implemented app satisfies the brief, meaningful checks pass, observed safety blockers are resolved, README works for another developer, submission files are clean, and repo/recording availability is reported accurately. No implementation, live model evaluation or runtime test has occurred as part of writing this plan.
