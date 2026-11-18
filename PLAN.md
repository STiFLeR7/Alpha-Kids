# Implementation and acceptance plan

The application provides a parent-facing English/Urdu conversation, brief practical plans and check-ins, and escalation for emergencies, abuse and self-harm. It runs locally without authentication or a database.

## Implemented

- Request/response contracts, size and turn limits, language resolution and fixed bilingual safety copy.
- Server endpoint with origin checks, bounded provider calls, timeouts, cancellation, schema validation and draft/review arbitration.
- Light Astryx chat interface with conversation history, language selection, retry, cancel, confirmed reset and a privacy dialog.
- Fictional scenario fixtures, deterministic tests and a live evaluation runner that preserves failures.
- Run instructions, architecture/safety/design documents, screenshots and a two-minute interface walkthrough.

## Verification

Run `npm test`, `npm run typecheck`, `npm run build` and `npm run astryx -- doctor --built .`.

With the application running, use `npm run eval` for the live scenario matrix. Evaluation covers everyday concerns, follow-ups, clarification, English/Urdu, crisis, abuse, medical/legal boundaries, retained risk and prompt injection. Validate keyboard focus, error recovery, cancellation and stale-response suppression separately from model quality.

Current outcomes and incomplete checks are recorded in [docs/STATUS.md](docs/STATUS.md) and [docs/EVALUATION.md](docs/EVALUATION.md). Passing deterministic tests does not establish live service reliability or semantic safety.

## Submission

- GitHub repository and [README](README.md) with local run instructions.
- [Two-minute walkthrough](docs/walkthrough.mp4) showing an everyday concern and a crisis response.
- A brief coding-agent note in the README.

The [documentation index](docs/README.md) links supporting specifications and evidence. Recording details are in [docs/WALKTHROUGH.md](docs/WALKTHROUGH.md). No hosted application is required.
