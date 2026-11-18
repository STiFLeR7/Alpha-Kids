# Evaluation record

Updated 18 November 2026. These are developer regression checks with fictional inputs. They do not establish statistical reliability, clinical safety or independent native-language acceptance. Raw artifacts retain `semanticReview: pending`; text observations below are AI-assisted review.

## Current checks

| Check | Result |
| --- | --- |
| Unit/integration tests | 258 passed in 9 files |
| Chromium browser tests | 9 passed against the production build |
| TypeScript / production build | Passed |
| Astryx doctor | 21 pass, 2 warnings, 0 failures |
| Production dependency audit | No reported vulnerabilities |
| Full dependency audit | Seven high-severity development-tool findings through picomatch; no patched version available in the configured registry |
| Recording integrity | The submitted two-minute MP4 decoded successfully |

Browser regressions cover input limits/newline, Send/Cancel/Retry focus, retained drafts, edited retries, delayed-response suppression, reset confirmation, privacy-dialog focus, inert HTML-like text and 320-pixel English/Urdu layout. They use explicit API-response fixtures and make no provider calls. The production HTTP checks also verified origin, content type, malformed JSON, body size, unknown-field rejection and no-store errors.

The two Astryx warnings concern CLI PATH resolution and source-style findings, including an ignored local verification copy. Use the pinned `npm run astryx -- ...` command. Browser checks cover Chromium only.

## Prompt v4: targeted live verification

The [five-request run](evaluation/live-2026-11-18T03-54-57.687Z-950d79a4-ec1c-4c3c-a508-7e1632db49b0.json) reused the unchanged screen-time, Urdu bedtime and physical-emergency fixtures. All five requests returned HTTP200 with matching routes/languages in 1.9–3.7 seconds. Both ordinary follow-ups supplied different actions and prospective check-ins. The crisis case selected fixed urgent copy.

Earlier outputs contained unnecessary Urdu follow-up intake. Prompt v4 reinforces alternative age-neutral steps, one meaningful check-in, one essential clarification fact and factual restraint in both draft and review. Risk precedence, fixed copy, schemas and arbitration are unchanged. Fixture expectations were retained.

Text inspection of the five replies found no medical/legal instructions or unnecessary clarification. Physical-activity and touch examples still require age/comfort judgment. This targeted result does not establish a full-matrix pass or sustained availability. A bounded code review found no actionable integration defects; it did not certify semantic safety.

## Quota and failure evidence

The [instrumented full run](evaluation/live-2026-11-18T03-51-11.334Z-433de3b8-e114-44f7-881d-689c500ea11b.json) attempted 28 requests across 26 scenarios: 11 replies, nine expected-route matches and 17 public HTTP503 errors. All 17 corresponding server diagnostics reported upstream HTTP429 / quota_or_rate_limit. The record does not distinguish a daily quota from a short-term rate limit. English and Urdu ordinary follow-ups returned clarification instead of another step before the v4 change.

Four later turns were skipped after their preceding turn failed. No automatic retries were used. Failures and unattempted turns supply no semantic-safety evidence.

Diagnostics retain only numeric upstream HTTP status and a fixed category. Tests verify that provider bodies, credentials, conversation text and diagnostics do not enter public responses. Each installation uses its own server-side Gemini key; available quota depends on that account.

The [saved records](evaluation/) support the quality review, quota diagnosis and focused v4 verification above. The [interface recording](WALKTHROUGH.md) uses predefined replies and is presentation evidence, separate from these live API records.

## Reproduce

With Node 24, install dependencies, configure your own server-side Gemini key as described in the [README](../README.md), then run:

```sh
npm test
npm run typecheck
npm run build
npm run test:browser:install
npm run test:browser
npm run astryx -- doctor --built .
```

With the app running, `npm run eval -- --settings-ref "Gemini gemini-3.5-flash-lite; LOW; promptsV4; A2048/B1024; 14s/30s"` evaluates the full 26-scenario / 32-request fixture matrix. The sequential runner preserves fresh dated records and failures, follows no redirects and performs no automatic retries. Exit zero establishes mechanical checks only.

## Remaining acceptance

Full v4 scenario coverage, independent native Urdu/safety review, screen-reader use, physical mobile-keyboard clearance and sustained provider availability remain open. A paid account has not been shown to resolve the observed limits. Failed requests and route/schema matches must not be counted as proof of appropriate advice.
