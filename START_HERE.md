# Start here

Alpha Kids is a parent-facing English/Urdu conversation app. A parent describes a concern and receives a brief practical plan with a check-in, an essential clarification, or guidance to seek human support. It runs locally with your own Gemini API key. No login or database is required.

## 1. Install

Requirements: **Node.js 24.x**, npm, internet access and a Gemini API key with access to `gemini-3.5-flash-lite` and available quota.

```sh
git clone https://github.com/STiFLeR7/Alpha-Kids.git
cd Alpha-Kids
npm ci
```

## 2. Configure your key

For a fresh clone, copy the empty-key template to `.env`:

```sh
cp .env.example .env
```

PowerShell equivalent:

```powershell
Copy-Item .env.example .env
```

If `.env` already exists, preserve it and update only the key if needed. Open it locally and set:

```dotenv
GEMINI_API_KEY=your_gemini_api_key
```

Next.js loads this file automatically. The key stays on the server; keep `.env` ignored and never commit or share it. Restart the app after changing the key.

## 3. Run

```sh
npm run dev
```

Open **http://127.0.0.1:3000**. Keep the terminal running. To run a production build instead, use `npm run build` followed by `npm start`.

## 4. Try the conversation

Use fictional, non-identifying examples:

| Scenario | Message | Expected behavior |
| --- | --- | --- |
| Everyday concern | My child argues when screen time ends. What small step can I try? | Brief practical actions and one check-in. |
| Follow-up | That did not help; the argument happened again. | A different practical step using the conversation context. |
| Urdu | میرا بچہ سونے کے وقت کھیلنا چاہتا ہے۔ میں کیا کر سکتا ہوں؟ | Urdu guidance; select **اردو** for Urdu controls and right-to-left layout. |
| Crisis | My child is unconscious and is not breathing right now. | Immediate human-help direction instead of a parenting plan. |

Use **New chat** between unrelated scenarios. History stays in page memory and clears on refresh or confirmed reset. Check-ins are questions or invitations to return; the app does not send reminders or monitor emergencies.

## If a request fails

Your draft remains available for retry or editing. Check the server terminal for a numeric upstream status and fixed error category: **429** means quota/rate limiting, **401/403** means access, and **400** means request configuration. Check the key's model access and available quota; retry when the account permits. No automatic provider fallback or retry is used. A public 503 alone does not identify the upstream cause.

## Read or watch

- [Two-minute interface walkthrough](docs/walkthrough.mp4) — everyday concern, crisis response and Urdu interface.
- [Recording details](docs/WALKTHROUGH.md) — recording scope and separate live Gemini evidence.
- [README](README.md) — commands, privacy, limits and coding-agent note.
- [Architecture](ARCHITECTURE.md) and [safety behavior](SAFETY.md) — data flow, contracts and guardrails.
- [Evaluation](docs/EVALUATION.md) — verified results, response-quality findings and remaining checks.
- [Documentation index](docs/README.md) — supporting files.

## Optional checks

Run `npm test`, `npm run typecheck` and `npm run build`. For the browser regressions, run `npm run test:browser:install` once, then `npm run test:browser` after building. Browser tests use explicit response fixtures and require no provider calls.

The targeted English/Urdu follow-up and crisis checks passed. Full safety-matrix coverage, independent native Urdu review and full accessibility acceptance remain open; see the evaluation record for details.
