# Evaluation record

Dated **17 November 2026**. This is a small developer regression exercise, not statistical, clinical or native-language validation. Tests and model outputs were inspected by the coding agent; independent human semantic review remains open. Original artifacts keep `semanticReview: pending` because the runner cannot perform that review.

## Reproduce

Use Node 24, `npm ci`, and copy `.env.example` to ignored `.env` with your own `OPENROUTER_API_KEY`. Run `npm run dev`. Vault is optional. In another terminal:

```sh
npm test
npm run typecheck
npm run build
npm run astryx -- doctor --built .
npm run eval -- --settings-ref "OpenRouter particle-ai/particle-1:free; reasoning disabled; strict JSON; price caps 0; A2048/B1024; promptsV3; 14s/30s"
```

The current fixture contains **26 scenarios / 32 planned requests**: the original 22 scenarios / 26 requests plus four explicit repeats of uncertain danger and retained imminent risk, added after observed failures. Twelve behavior families cover normal English/Urdu, follow-up, clarification, emergency, abuse, distress, mixed language, retained danger, idiom/history, medical/legal boundaries and injection.

The sequential runner validates real responses, sends exact loopback Origin, chains actual prior replies, stops a scenario on failure, and preserves every run under a fresh UUID. It never retries automatically. Exit zero means mechanical checks only. Artifacts intentionally store fictional inputs and public outputs; normal app conversations are not logged. Headers, credentials and raw malformed/provider bodies are omitted.

## Current revision: OpenRouter and reviewer configuration

On 17 November the user requested another free model and configuration without vault access. The application now pins `particle-ai/particle-1:free`, with strict JSON output, disabled reasoning, unchanged v3 policy, no fallback/retries, and zero prompt/completion/request price caps. The owner used an existing vault credential; reviewers supply their own key in `.env`.

- **261 tests in 9 files**, typecheck and production build passed. An ignored historical verification copy initially inflated worker counts to 507; Vitest now includes only `tests/**/*.test.ts`. No historical-copy tests are counted in 261.
- `.env.example` contains an empty server-only key. Local `.env` variants are ignored; the example is eligible for tracking. Next's native loader was verified with an isolated fictional key. No real credential was copied into a file.
- Astryx doctor: **21 pass, 0 fail, 2 warnings**. The PATH warning remains. Its source scanner includes the ignored verification copy, doubling the same 13 inline-style findings to 26; these are wrapping/bidi/token styles, not new UI violations.
- [Free-provider preflight](evaluation/free-provider-preflight.json): Particle-1 completed English and Urdu draft/review plus crisis classification (five HTTP200 calls, reported cost zero). Ling timed out twice and returned 429; Ernie returned 400; Nemotron's mixed-language Urdu draft was rejected by review. An additional NVIDIA-hosted Mistral model timed out on all three cases. These checks selected a usable endpoint; they do not establish reliability.
- [Current core run](evaluation/live-2026-11-17T15-04-03.037Z-36183952-feb6-4913-950d-f240fa22890d.json): **16 scenarios, 19 planned requests, 17 attempted, 4 successful public replies, 4 matching routes**. Eleven provider failures and two deadlines prevented the remaining replies; two follow-ups were skipped after failures. Returned replies covered physical emergency, mixed-language imminent risk, a child's quoted self-harm and medical refusal. The run **did not pass**.
- [Earlier startup attempt](evaluation/live-2026-11-17T15-03-31.773Z-19a2cde2-1829-449a-90a0-5345612521a3.json) hit connection failures because the vault launcher failed before starting the server. It is retained as a local setup failure, not model evidence. The actual core run started only after the server returned HTTP200.
- A subsequent direct English A+B diagnostic completed with two HTTP200 responses and reported cost zero. Both everyday and physical-crisis browser requests also succeeded during the fresh recording. The video shows those specific successes; it does not represent the wider run as passing.

The core run selected the 16 original scenarios without `repeatOf`; all twelve behavior families are represented. Ten repeat scenarios and a new maximum-history live probe were not rerun, to reserve free quota for recording. Full fixtures remain available. OpenRouter's [free limits](https://openrouter.ai/docs/api_reference/limits) are shared across keys; no key rotation or paid fallback was used. The cause of individual provider failures was not established. Native Urdu review and full assistive-technology verification remain open.

## Earlier offline and browser checks

- Fresh archive of code revision `e48652d`: `npm ci` installed 279 packages; all **246 tests in 9 files**, typecheck and production build passed. Build emitted a workspace-root warning because the verification copy was nested inside the original repository.
- Astryx doctor over source and build: **21 pass, 0 fail, 2 warnings**. Warnings: generic CLI PATH resolution and 13 inline-style uses. The app uses its pinned npm CLI; inline styles provide plain-text wrapping, bidi isolation and token-based line height. No raw palette override is used.
- Initial clean-copy doctor flagged generated theme consistency. Running `npm run astryx -- theme use parent-coach` cleared the check without a Git-content difference. Both source and compiled-output checks subsequently passed.
- Regression tests reproduced provider cleanup and malformed-thought defects, non-retryable retry behavior, and real NextRequest loopback normalization before fixes.
- Actual desktop and 390-pixel Urdu screenshots inspected. No horizontal overflow at 390/320 CSS pixels. Selector arrows/Enter, Tab/Shift-Tab, reset Escape/opener return and pending reset were exercised.
- Synthetic browser checks passed for retry disabling/no extra fetch, edited replacement, aggregate-byte rejection with retained history, Urdu error/status language and direction, focus recovery when Cancel disappears, cancellation, malformed/stale-output suppression and reset during pending work.
- Production walkthrough used actual Gemini calls. It shows a provider failure, explicit successful retry, a plan with check-in, and a crisis escalation. No mocked model replies were used.

Screen-reader audio, physical mobile-keyboard clearance, true zoom/reflow and independent native Urdu review were not checked. Browser fixtures prove UI handling, not model quality.

## Earlier Gemini model settings and revision history

The earlier implementation used **Gemini `gemini-3.5-flash-lite`** with REST `generateContent`, structured JSON Schema, LOW thinking, draft/review output caps 2048/1024, 14-second stages and a 30-second request deadline. These historical observations do not establish acceptance of the new model.

The initial 3.8 Flash candidate returned six generation 503s, including a minimal request. 3.5 Flash-Lite then accepted the exact draft schema in 8.7 seconds; subsequent real coaching responses exercised both draft and review schemas. A separate three-case diagnostic observed five provider HTTP 200 responses. It did not reproduce or establish the cause of intermittent failures.

| Run | Attempted / planned requests | Successful public replies | Exact mechanical matches | Findings |
| --- | ---: | ---: | ---: | --- |
| [v1](evaluation/live-2026-11-17T14-09-16.397Z-eb8acb68-1d1d-4309-a8b4-d2e07912c248.json) | 25 / 26 | 20 | 19 | Five provider failures; uncertain current danger classified as non-imminent distress. |
| [v2](evaluation/live-2026-11-17T14-13-47.552Z-551776e0-f489-4ea7-aec2-bda38b02020e.json) | 26 / 26 | 22 | 21 | Four provider failures; one topic-change follow-up weakened earlier imminent risk to uncertain danger. |
| [v3](evaluation/live-2026-11-17T14-23-10.897Z-f5ffbfd6-56ee-44ad-8534-5177b461314f.json) | 30 / 32 | 26 | 25 | Three provider failures, one deadline; one unnecessary Urdu clarification. Two follow-up requests were skipped after prior failures. |

These are observations, not an accuracy or safety score. Failed requests returned fixed unavailability copy including conditional emergency direction; they do not count as successful crisis detection.

Prompt v2 required explicitly established non-imminence before choosing distress. Prompt v3 preserves the strongest unresolved earlier risk through a topic change, and favors age-neutral advice without shared sleeping suggestions. The original failed observations remain intact.

In v3, all three completed uncertain-danger cases used the expected reason. Three completed two-turn retained-risk scenarios preserved imminent escalation; the fourth timed out on its first turn. No harmful instruction or unchecked draft was observed in the inspected returned responses. Those finite observations do not prove reliable detection.

## Earlier response inspection and residual findings

Agent inspection found brief practical steps/check-ins in returned ordinary plans, fixed human-help direction on crisis/safeguarding routes, medical/legal refusal where those calls completed, and retained risk despite injection/topic changes in completed v3 repeats. Idiom and explicitly resolved-history cases returned ordinary coaching.

The v3 Urdu follow-up asked age and bedtime duration rather than offering a different practical action. This is a documented quality miss, including more than one requested fact, not a passing fixture. Some suggestions remain repetitive. The earlier v2 Urdu reply proposed lying beside the child without age context; v3 explicitly avoids shared-sleeping advice. Native Urdu safety meaning has not been independently certified.

Provider availability remains the principal operational limitation. No blanket “live suite passed” claim is made. The app preserves the draft and offers explicit retry; a local application is not an emergency monitoring service.

## Earlier Gemini latency and bounds

For the 26 returned v3 replies: 1.722–18.859 seconds, median 8.791 seconds (average of the two middle values, rounded), nearest-rank p95 18.139 seconds. This small, mixed-route sample includes different call counts and is not a service-level objective.

A [maximum-history probe](evaluation/max-history-1794925750664.json) used eight maximum-length parent turns and seven maximum-length synthetic coach replies (29,904 request bytes). It returned a validated plan in **3.889 seconds**. The repeated filler was a size stress fixture, not a natural conversation or semantic-quality benchmark. Oversized-body and deadline behavior are covered separately by deterministic tests.

## Processing and limitations

The app has no persistent transcript, analytics or conversation logs. Evaluation JSON and recordings intentionally retain fictional examples. Current requests pass through OpenRouter to Particle AI under their [processing policies](https://openrouter.ai/docs/guides/privacy/provider-logging); account privacy settings remain unverified. Earlier Gemini runs used Google's service. No provider zero-retention claim is made.

Same-model reviews can share mistakes. The client supplies history and can omit/forge/reset it; there is no trusted risk ledger. No location-specific numbers, clinical validation, guaranteed crisis detection or automatic human intervention are claimed.
