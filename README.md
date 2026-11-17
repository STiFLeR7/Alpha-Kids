# Alpha Kids parent coach

A small English/Urdu parenting-coach hiring-test project for Alpha Kids / Vibbber.

**Current status: plan approved and frozen; implementation in progress.** Hill authorized the build on 17 November 2026. The local workspace contains installed Astryx tooling and consolidated planning documents; no completed LLM endpoint or verified safety evaluation is claimed yet. Run instructions will be added and checked against the implemented application before submission.

## Intended experience

An adult parent describes a concern in English or Urdu and receives a brief practical plan with one check-in question or invitation to return. The coach asks one focused question when essential context is missing. It does not diagnose or give medical/legal instructions, and it directs emergencies, self-harm and safeguarding concerns toward appropriate human support.

The agreed scope is one responsive conversation page, current-session history, a mascot-free Astryx interface, and a local server integration. No login, database, saved conversation history, voice, automatic reminders or hosted demo is planned for this submission.

## Documentation

- [Safety and business behavior](SAFETY.md): response states, escalation boundaries, uncertainty and evaluation criteria.
- [Architecture](ARCHITECTURE.md): shared contracts, model calls, server arbitration, limits and failure handling.
- [Design](DESIGN.md): actual Astryx components, conversation states, language/RTL and accessibility checks.
- [Execution plan](PLAN.md): foundation, parallel worker ownership, acceptance checks and delivery sequence.
- [Supporting-document index](docs/README.md): current sources and planned evaluation/walkthrough records.

The proposed provider is Gemini `gemini-3.5-flash-lite`, subject to account access, schema and latency checks. One call assesses/drafts; a fresh second call reviews non-crisis results. Urgent/safeguarding replies use fixed bilingual server copy. No unchecked draft is displayed, and two calls to the same model are not a safety guarantee.

The hiring email is the requirements source. The submission consists of this GitHub repository with verified run instructions, an approximately two-minute recorded walkthrough showing everyday and crisis behavior, and an honest coding-agent disclosure. Due: **19 November 2026, 16:00 Dubai / 17:30 India**.

## Current local tooling

The installed design tooling can be restored with `npm ci`. Its local CLI is available through `npm run astryx -- <command>`, for example `npm run astryx -- docs layout`. These commands do not start a parent-coaching application.

Astryx packages are pinned to 0.7.16. Framework/model compatibility, provider access and the final application commands remain implementation preflight checks.

## Credentials and privacy

The proposed application keeps credentials on the server. Local development uses vault injection; reviewer instructions will support their own server-side process environment without requiring access to the owner's vault. Do not commit credentials or create an `.env` file for this workspace.

Use fictional, non-identifying examples for development and recording. Messages will be sent to the selected model provider; provider retention and billing settings have not been verified. No claim of zero retention or guaranteed crisis detection is made.

## Coding-agent use so far

GPT-6 Astra Extra High coordinated discovery, visual research and architectural discussion, and consolidated the execution plan. Three GPT-6.1 Sol Medium agents prepared safety, architecture and Astryx UX plans in parallel. The previous standalone HTML mockup used fictional responses and was never a live coaching service. Implementation, final verification and Hill's review will be recorded accurately when they occur.
