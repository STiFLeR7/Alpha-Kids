# Delivery checklist

Updated 17 November 2026. This is the current status of the approved [plan](../PLAN.md), including the later Gemini and chat-layout revisions. Older test runs and recordings remain evidence of their own revisions.

| Area | Status | Evidence or next action |
| --- | --- | --- |
| Brief, scope and architecture | Completed | Adult-parent English/Urdu chat, brief structured replies/check-ins, no login/database/hosting. [Architecture](../ARCHITECTURE.md). |
| Safety design and deterministic implementation | Completed | Strict contracts, bounded requests, draft/review arbitration, fixed escalation/refusal, no unchecked streaming. [Safety](../SAFETY.md). Semantic accuracy is a separate open check. |
| Gemini adapter and local configuration | Completed | Restored pinned Gemini adapter; actual ignored `.env` loads natively. Configuration smoke and production-browser requests include successful generations. Empty-key `.env.example` supports reviewers without vault access. |
| Revised light Astryx chat | Implemented and visually inspected | Cleaner layout, distinct wordmark, aligned wider header, chat composer and one-line disclaimer. [Design audit](../DESIGN.md). |
| Offline regression checks | Completed | Combined 252 tests, typecheck and latest production build passed. Astryx doctor: zero failures; documented warnings remain. |
| Current live availability | Unresolved | Configuration smoke: English HTTP503, Urdu deadline, crisis escalation succeeded. Browser: everyday succeeded; crisis failed then succeeded on explicit retry. [Evaluation](EVALUATION.md). |
| Safety/Urdu quality acceptance | Remaining | Historical scenario outputs are preserved; full current acceptance and independent native Urdu review are unpassed. |
| Fresh desktop/mobile screenshots | Completed | [Desktop](screenshots/desktop-home.png), [English mobile](screenshots/mobile-english.png), [Urdu mobile](screenshots/mobile-urdu.png). Focused keyboard/dialog/cancel/retry/reset checks passed with explicit synthetic browser fixtures. |
| Walkthrough | Completed | Two-minute MP4, separate everyday/crisis clips and self-contained HTML. Zero network calls in the HTML; actual Gemini evidence is separate. [Recording details](WALKTHROUGH.md). |
| Repository deliverables | Completed | Current Gemini adapter, compact chat, `.env.example`, screenshots, recordings, architecture and supporting-doc index are included. Publication is recorded in Git history. |
| Submission email | Not sent | Repository, recording and coding-agent disclosure must be included when the owner sends it. No email authorization was given. |

Remaining manual checks: independent native Urdu wording, full screen-reader use, and physical mobile-keyboard behavior. Tests and screenshots do not substitute for those checks. A paid API account has not been shown to resolve the observed provider failures.
