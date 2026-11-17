# Alpha Kids parent coach

A local English/Urdu parenting-coach demo built with Next.js, TypeScript and Astryx. An adult parent describes a concern and gets a short practical plan with a check-in, one clarifying question, or a clear referral to human support.

**[Watch the two-minute walkthrough](docs/walkthrough.mp4).** The app runs locally and includes real English/Urdu evaluation evidence. [Known limitations](docs/EVALUATION.md) include intermittent provider failures and an unnecessary Urdu clarification; this is not a clinically validated or production-ready service.

## Run locally

Requires **Node.js 24.x**, npm, and a Gemini API key with access to **`gemini-3.5-flash-lite`**.

```sh
git clone https://github.com/STiFLeR7/Alpha-Kids.git
cd Alpha-Kids
npm ci
```

Supply `GEMINI_API_KEY` through your server process environment or secret manager. No `.env` file is required. For PowerShell 7:

```powershell
$env:GEMINI_API_KEY = Read-Host 'Gemini API key' -MaskInput
npm run dev
```

Open **http://127.0.0.1:3000**. The key stays on the server. The owner's development environment uses vault injection; reviewers do not need that vault.

For a production build, keep the key in the same process environment:

```sh
npm run build
npm start
```

The server binds to loopback. It rejects cross-origin requests and is scoped to a local demo, with no hosting, authentication or database.

## Try it

- Everyday: “My child argues when screen time ends. What small step can I try?” Then: “That did not help; the argument happened again.”
- Urdu: “میرا بچہ سونے کے وقت کھیلنا چاہتا ہے۔ میں کیا کر سکتا ہوں؟” Select **اردو** for Urdu controls and RTL, or **Auto** for context-based replies.
- Fictional crisis: “My child is unconscious and is not breathing right now.” The intended response is immediate human-help direction, with no generated parenting plan.

History lives only in the page and clears on refresh/reset. Cancel preserves the draft; retry replaces the unanswered turn. Limits: eight parent turns and 2,000 UTF-16 units per message. Check-ins are questions or invitations to return; the app sends no reminders and does not contact emergency services.

## How the guardrails work

1. The server checks origin, body size, strict request schema and concurrency limits.
2. Gemini assesses the supplied conversation and optionally drafts a response. Valid urgent/safeguarding routes immediately select fixed bilingual server copy.
3. Other responses receive a fresh model review of the transcript and candidate wording, without the first call's current classification. Deterministic arbitration selects fixed copy or releases the checked response.
4. Strict validation, deadlines and fixed errors prevent failed/rejected drafts from reaching the page. Responses are not streamed.

Both calls use the same pinned model, so their errors can correlate. Supplied history is untrusted and can be reset or forged. This reduces some failure modes; it cannot guarantee crisis detection or appropriate advice.

## Checks and evidence

```sh
npm test
npm run typecheck
npm run build
npm run astryx -- doctor --built .
```

With the local app running, evaluate the fictional scenario matrix:

```sh
npm run eval -- --settings-ref "gemini-3.5-flash-lite; LOW; draft2048/review1024; see docs/EVALUATION.md for prompt revision"
```

The runner writes dated evidence in `docs/evaluation/`, preserves failures and performs no automatic retries. Exit zero establishes mechanical checks only. See [evaluation](docs/EVALUATION.md) and [walkthrough](docs/WALKTHROUGH.md) for results and recording status.

## Data and provider limits

Use fictional, non-identifying examples. The app does not persist conversations, but messages and history are sent to Google. Google's [Gemini terms](https://aistudio.google.com/docs/terms) distinguish paid and unpaid processing; unpaid inputs may be used for product improvement and human review. Paid access does not itself mean zero retention. Account billing/retention settings have not been independently verified. This is an adult-parent developer demo, not a child-facing app or medical/legal service.

## Documentation and coding agents

[ARCHITECTURE.md](ARCHITECTURE.md) describes contracts and flow; [SAFETY.md](SAFETY.md) defines behavior; [DESIGN.md](DESIGN.md) explains the Astryx UI. [docs/README.md](docs/README.md) indexes evidence. [PLAN.md](PLAN.md) retains the approved execution plan.

GPT-6 Astra Extra High coordinated architecture, integration and reviews. GPT-6.1 Sol Medium agents implemented foundation/contracts, server guardrails, Astryx UI and evaluation tooling in parallel. Astra applied integration fixes and checked tests, live outputs and browser behavior. Human/native-language/clinical validation is not implied by agent review.
