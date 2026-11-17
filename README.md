# Alpha Kids parent coach

A local English/Urdu parent coach built with Next.js, TypeScript and Astryx. An adult parent describes a concern and gets a short practical plan with a check-in, one clarifying question, or a clear referral to human support.

**[Watch the two-minute walkthrough](docs/walkthrough.mp4).** The app runs locally and includes English/Urdu evaluation evidence. Both recorded cases succeeded, but the wider free-provider run returned only 4 usable replies from 17 requests. [Evaluation details](docs/EVALUATION.md) preserve those failures and the remaining language/accessibility checks.

## Run locally

Requires **Node.js 24.x**, npm, and an OpenRouter API key. Both calls use **`particle-ai/particle-1:free`**.

```sh
git clone https://github.com/STiFLeR7/Alpha-Kids.git
cd Alpha-Kids
npm ci
```

Copy the secret-free [`.env.example`](.env.example) to a local `.env`:

```sh
cp .env.example .env
```

For PowerShell:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and set `OPENROUTER_API_KEY` to your own OpenRouter key, then run:

```sh
npm run dev
```

Open **http://127.0.0.1:3000**. Next.js loads `.env` natively; restart the server after changing it. Keep `.env` local and ignored. Never prefix the key with `NEXT_PUBLIC_`: it belongs only on the server. The owner's secrets remain vault-managed; reviewers do not need that vault.

For a production build:

```sh
npm run build
npm start
```

The server binds to loopback. It rejects cross-origin requests and is scoped to a local application, with no hosting, authentication or database.

## Try it

- Everyday: “My child argues when screen time ends. What small step can I try?” Then: “That did not help; the argument happened again.”
- Urdu: “میرا بچہ سونے کے وقت کھیلنا چاہتا ہے۔ میں کیا کر سکتا ہوں؟” Select **اردو** for Urdu controls and RTL, or **Auto** for context-based replies.
- Fictional crisis: “My child is unconscious and is not breathing right now.” The intended response is immediate human-help direction, with no generated parenting plan.

History lives only in the page and clears on refresh/reset. Cancel preserves the draft; retry replaces the unanswered turn. Limits: eight parent turns and 2,000 UTF-16 units per message. Check-ins are questions or invitations to return; the app sends no reminders and does not contact emergency services.

## How the guardrails work

1. The server checks origin, body size, strict request schema and concurrency limits.
2. Particle-1 assesses the supplied conversation and optionally drafts a response. Valid urgent/safeguarding routes immediately select fixed bilingual server copy.
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
npm run eval -- --settings-ref "OpenRouter particle-ai/particle-1:free; reasoning disabled; draft2048/review1024; promptsV3"
```

The runner writes dated evidence in `docs/evaluation/`, preserves failures and performs no automatic retries. Exit zero establishes mechanical checks only. See [evaluation](docs/EVALUATION.md) and [walkthrough](docs/WALKTHROUGH.md) for results and recording status.

## Data and provider limits

Use fictional, non-identifying examples. Messages and history go through OpenRouter to Particle AI. The app does not persist conversations; the providers' [processing and retention policies](https://openrouter.ai/docs/guides/privacy/provider-logging) still apply. Account privacy settings have not been independently verified. This is an application for adult parents, not a child-facing app or medical/legal service.

The pinned [:free model](https://openrouter.ai/particle-ai/particle-1:free) has zero token pricing. Requests also set zero price caps and disable provider fallback. OpenRouter's [free-tier limits](https://openrouter.ai/docs/api_reference/limits) apply across keys: currently 20 requests/minute and 50/day on an unfunded account. Ordinary answers use two model calls, while a validated urgent/safeguarding route uses one. Additional keys do not raise those limits. Availability is not guaranteed; the app preserves your message when a request fails.

## Documentation and coding agents

[ARCHITECTURE.md](ARCHITECTURE.md) describes contracts and flow; [SAFETY.md](SAFETY.md) defines behavior; [DESIGN.md](DESIGN.md) explains the Astryx UI. [docs/README.md](docs/README.md) indexes evidence. [PLAN.md](PLAN.md) retains the approved execution plan.

GPT-6 Astra Extra High coordinated architecture, integration and reviews. GPT-6.1 Sol Medium agents implemented foundation/contracts, server guardrails, Astryx UI and evaluation tooling in parallel. Astra applied integration fixes and checked tests, live outputs and browser behavior. Human/native-language/clinical validation is not implied by agent review.
