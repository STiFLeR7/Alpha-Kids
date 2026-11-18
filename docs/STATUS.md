# Delivery checklist

Updated 18 November 2026. This is the current status of the [implementation plan](../PLAN.md), including the later Gemini and chat-layout revisions. Older test runs and recordings remain evidence of their own revisions.

| Area | Status | Evidence or next action |
| --- | --- | --- |
| Brief, scope and architecture | Completed | Adult-parent English/Urdu chat, brief structured replies/check-ins, no login/database/hosting. [Architecture](../ARCHITECTURE.md). |
| Safety design and deterministic implementation | Completed | Strict contracts, bounded requests, draft/review arbitration, fixed escalation/refusal, no unchecked streaming. [Safety](../SAFETY.md). Semantic accuracy is a separate open check. |
| Gemini adapter and local configuration | Completed | Restored pinned Gemini adapter; actual ignored `.env` loads natively. Configuration smoke and production-browser requests include successful generations. Empty-key `.env.example` supports local configuration. |
| Revised light Astryx chat | Implemented and visually inspected | Cleaner layout, distinct wordmark, aligned wider header, chat composer and one-line disclaimer. [Design audit](../DESIGN.md). |
| Offline regression checks | Completed | 258 unit/integration tests, 9 portable Chromium browser tests, typecheck and production build passed after prompt v4. Astryx doctor: 21 pass, 2 warnings, 0 failures. |
| Current live availability | Targeted check passed; account limits remain | Instrumented full run identified upstream HTTP429 for all 17 failures. Later focused v4 run returned 5/5 replies in 1.9–3.7 seconds. Visitors bring their own Gemini key; sustained/full-matrix acceptance is still open. [Evaluation](EVALUATION.md). |
| Safety/Urdu quality acceptance | Targeted fix verified; broader review remains | Offline review completed. Expected routes retained; v4 live English/Urdu follow-ups now give different actions and check-ins. Full v4 matrix and independent safety/native Urdu review remain unpassed. [Quality review](QUALITY.md). |
| Fresh desktop/mobile screenshots | Completed | [Desktop](screenshots/desktop-home.png), [English mobile](screenshots/mobile-english.png), [Urdu mobile](screenshots/mobile-urdu.png). Focused keyboard/dialog/cancel/retry/reset checks passed with explicit synthetic browser fixtures. |
| Walkthrough | Completed | Two-minute MP4, separate everyday/crisis clips and self-contained HTML. Zero network calls in the HTML; actual Gemini evidence is separate. [Recording details](WALKTHROUGH.md). |
| Repository deliverables | Completed | Current Gemini adapter, compact chat, `.env.example`, screenshots, recordings, architecture and supporting-doc index are included. Publication is recorded in Git history. |
| Submission email | Not sent | Include the repository, recording and brief coding-agent note in the email. |

Remaining checks: full v4 semantic matrix, independent native Urdu wording, full screen-reader use and physical mobile-keyboard behavior. Tests and screenshots do not substitute for those checks. Production dependency audit is clean; seven development-tool audit findings remain without a patched version in the configured registry. A paid API account has not been shown to resolve the observed limits.
