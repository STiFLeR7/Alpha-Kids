# Documentation map

Status: plan approved and frozen by Hill; implementation in progress, 17 November 2026. No completed application or live evaluations are claimed yet. An installed UI library and static mockup are not a working coach.

## Current sources

| Document | Owns |
| --- | --- |
| [README.md](../README.md) | Project status, submission scope, current tooling; verified application run instructions will replace planning status after implementation. |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Request/public/model schemas, provider candidate, prompting, arbitration, limits, module seams and HTTP lifecycle. |
| [SAFETY.md](../SAFETY.md) | Useful coaching, escalation and boundary behavior, bilingual copy requirements, acceptance matrix and limitations. |
| [DESIGN.md](../DESIGN.md) | Mascot-free Astryx interface, proposed palette, state transitions, language/RTL and visual/accessibility acceptance. |
| [PLAN.md](../PLAN.md) | Execution order, exact worker ownership, shared-contract handoff, verification and clean submission. |

Root specifications are the approved implementation baseline. Latest user decisions take priority. Changes to shared types/limits are integrated centrally so server, UI and evaluation workers stay aligned.

## Records to create during implementation

These paths are assigned in PLAN.md; the files/results do not exist yet and are not evidence of completed checks.

| Planned path | Contents |
| --- | --- |
| `docs/EVALUATION.md` | Actual deterministic and live checks, dated model/settings, latency, failures/reruns, semantic review and known limitations. Separate a mechanical route match from a human assessment of the answer. |
| `tests/fixtures/scenarios.json` | Synthetic scenarios: 12 families, 16 initial conversations, six high-risk repeats; 22 scenario runs with additional requests in multi-turn cases. |
| `docs/evaluation/` | Synthetic run artifacts preserving requests/responses, durations and failed observations, with no credentials or real parent data. |
| `docs/WALKTHROUGH.md` | Approximately two-minute running-app sequence covering everyday help, follow-up, Urdu and crisis; recording link only when it exists. |

Final README must contain checked install/run/test instructions using the reviewer's own server-side process environment, provider-processing disclosure, in-memory history limits, actual recording reference and honest coding-agent use.

## Historical local material

Earlier `mockup.html`, mascot assets, `docs/superpowers/` specifications and `docs/research/` screenshots are preserved locally but excluded from the submission file set. They contain superseded visual directions and fictional examples. They are not current UI targets, live model results or evidence about the production Alpha Kids backend. Current docs do not depend on those files.
