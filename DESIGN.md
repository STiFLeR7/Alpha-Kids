# Parent coach design

## Chat layout

The interface uses a **light palette and a compact chat layout**. Existing safety, language, retry, cancellation and reset behavior remains required.

Use the reference's quiet header, centered empty-state greeting, dominant composer, restrained suggestions and generous space. Keep the white/navy/coral theme. The compact header contains Alpha Kids / Parent coach, language selector and New conversation. In the empty state, center a short greeting over the composer and place three compact, wrapping topic suggestions below. Suggestions fill and focus the draft without sending. After the first message, hide the greeting/suggestions, show clearly spaced parent/coach turns and place the composer below the transcript. Keep mobile scrolling natural without a fixed overlay over the keyboard.

Use the installed Astryx `ai-chat-landing` composition and `ChatComposer` shell. A controlled TextArea inside that shell preserves Enter-as-newline, UTF-16 validation, pending read-only state and focus behavior; connect it through the documented composer context for body-click focus. Read component APIs before implementing. Use an outer 1120-wide frame and a centered chat column up to 720, with padding 6 and overall gap 8. The wider header has a distinct Alpha Kids wordmark and a smaller localized Parent coach subtitle; controls align at the opposite edge. The wordmark remains Alpha Kids in Urdu. Use existing Button, Selector, Layout, Text, VisuallyHidden, Dialog and Banner components and theme tokens. One Button stays mounted across Send/Cancel/Retry, using isIconOnly for the send arrow so keyboard focus survives the transition. Do not add dependencies, a contenteditable editor, fake sidebar/history, decorative orb, attachments, voice or model selectors.

Below the composer, show **“AI can make mistakes. Use your judgment.”** with a corresponding Urdu sentence. One line where it fits; natural wrapping on narrow screens/zoom, never clipping. A small **Privacy & limits** control opens an accessible dialog with the existing scope/privacy details, available before sending. Crisis, safeguarding, boundary and error content remains fully visible. Keep live announcements without an empty visual paragraph; show pending status during a request.

Approach: retain the light palette and improve hierarchy through actual Astryx chat components.

Acceptance: inspect actual desktop and 390-wide Urdu screenshots; verify wrapping/no horizontal scrolling, example fill/focus, newline entry, send/cancel/retry/reset safeguards, privacy dialog naming/focus return and fully visible urgent support. Build/doctor and reducer/copy checks supplement those observations; they do not establish full accessibility or native-language review.

### Visual audit and implemented corrections

- Brand: the slash-separated page label competed with the controls. It is now a distinct wordmark/subtitle, outside the chat's narrow reading column.
- Hierarchy: the earlier greeting lacked emphasis; the first refinement then added too much vertical empty space. The final layout groups a centered display heading, brief language cue and dominant composer below the header with bounded spacing, without forced viewport height.
- Composer: the form label, bilingual placeholder and separate Send row added visual clutter. The field keeps its accessible label, uses a short localized placeholder and places an accessible send-arrow action inside Astryx's composer. Two visible text rows keep it compact. Native resizing is disabled through the theme editor's `resize: none` setting on `text-area-control`, confirmed in the rendered browser. Empty sends are disabled; Retry and Cancel retain explicit text.
- Footer: two long paragraphs became one short sentence and a Privacy & limits dialog. Critical response content remains inline and fully visible.
- Responsive behavior: inspected 1440-wide desktop, 390-wide English/Urdu and 320-wide Urdu. Checked RTL document metadata, overflow, example focus/newline, privacy dialog name/Escape/focus return, cancellation, non-retryable errors and reset. These are focused browser observations, not a full assistive-technology audit.

The standalone interface walkthrough reuses the actual rendered Astryx interface with predefined scenarios. The application keeps its live Gemini integration. The recording is an interface walkthrough; separate evaluation evidence records actual provider behavior.

Verification results are documented in the evaluation record. Read with [ARCHITECTURE.md](ARCHITECTURE.md), [SAFETY.md](SAFETY.md), and [docs/EVALUATION.md](docs/EVALUATION.md). No mascot; white/navy/coral. Actual desktop and Urdu mobile screens have been inspected, with focused keyboard/state checks. This does not establish native-language or full assistive-technology acceptance.

## Experience

One responsive page for an adult parent to describe a concern in English or Urdu, receive brief practical support, and continue the conversation. No intake form. Header: Alpha Kids / Parent coach, language control, New conversation. Main column: short welcome, transcript, labeled multiline composer, Send, and concise scope/privacy copy. Three optional everyday example buttons fill the composer without sending; remove them once the conversation begins.

Welcome: “What's been difficult today?” Explain English/Urdu input. Near the composer: general parenting support, not diagnosis or medical/legal instructions; messages go to the model provider; this app keeps history only in this page's memory. Do not imply provider zero retention, confidentiality, professional credentials, or that the app monitors emergencies. No voice, uploads, dashboards, scores, tracker, gamification, mascot or avatar persona.

Normal answers contain one acknowledgment, two or three specific low-risk actions under “Try this,” and one check-in question or invitation to return after trying them. Aim for 60–120 English words and similarly brief Urdu; enforce structured field/total bounds on the server. Clarification asks one useful question without an invented plan. Boundary responses use fixed server copy for medical/legal requests and relevant redirection. Urgent and safeguarding responses use fixed bilingual server copy: clear human-support action, no ordinary plan, no suggestion to wait or return later. Immediate danger explicitly calls for local emergency services now; non-imminent safeguarding wording must not assert an emergency without evidence. Never generate phone numbers or infer country from language.

## Astryx mapping and build constraints

Pre-implementation research inspected Astryx core/theme-neutral/CLI 0.7.16, React/React DOM 19.3.1 and StyleX 0.19.2 through `build`, `template ai-chat-landing`, layout/styling/theme/token documentation and component reads. Those peer checks informed the design; the implemented Next app and actual build results are now documented in docs/EVALUATION.md.

Use `ai-chat-landing` as the closest starting template when implementation is authorized. Its actual frame is Layout/ LayoutContent with a centered content width of 720 and padding 6, VStack gap 8. Preserve the frame/gap/padding while replacing its content and adding transcript sections. Do not ship its example categories, attachments, dictation, mentions, slash commands, settings or model modes. The CLI's generic shell-top-nav suggestion is less appropriate to a single conversation page. The `ai-chat` alternative includes a resizable artifact panel and streaming features outside scope.

| Surface | Actual component mapping | Implementation constraint |
| --- | --- | --- |
| Landing/header/layout | Layout, LayoutContent, VStack, HStack; Heading/Text; Button | Use component layout/spacing props. No authored div/span layout wrappers. Wrap header controls on narrow screens; no sidebar or bottom navigation. |
| Composer | TextArea from core/TextArea + Button from core/Button | Controlled label/value/onChange; onChange supplies the string first. Use explicit Send. Enter remains newline. No dependency on rich ChatComposer/contenteditable behavior. |
| History | List / ListItem from core/List; Text/Heading | Static chronological rows with visible Parent/Coach labels. ListItem requires label; string labels auto-truncate, so use a Text node for full message content and verify wrapping. No Card around every turn, avatars, reorder or virtualization. |
| Answer | Text, Heading, List with listStyle="decimal" / ListItem | Render validated fields as text; no HTML or model Markdown renderer. Plain text acknowledgment and check-in. |
| Pending | Text + loading Button | Announce preparation once; show no raw draft, token animation, or unchecked streaming. Provide Cancel. |
| Error/escalation | Banner from core/Banner | status/title/description; set collapsible={false} for essential child content. Keep escalation non-dismissible and inline. Banner is non-live by default: announce once using supported announcement APIs; urgent alert semantics only for urgent output. |
| Reset confirmation | Dialog + DialogHeader from core/Dialog; Button | Controlled isOpen/onOpenChange. Named title, explicit Keep conversation / Clear conversation. Escape/dismiss means keep. Verify focus return. |
| Language | Selector from core/Selector | label/options/value/onChange, three choices: Auto / English / اردو. No search or clear affordance needed. Select and Alert are not actual component names. |

Load the required prebuilt reset.css, astryx.css and neutral theme stylesheet once in the app entry/layout. Follow AGENTS.md over generic CLI styling examples: props first, theme tokens second; no raw hex/px styling, custom CSS imports, utility classes or uncompiled xstyle. Template numeric frame values are existing component props, not permission to add arbitrary CSS lengths.

The inspected landing template uses plain CSSProperties, but includes raw sizes and missing @heroicons/react imports. Replace raw presentation values with theme tokens and remove unused icon imports with the excluded features; do not add an icon dependency just to retain decoration. Generic shell templates can require StyleX compilation: installed StyleX runtime alone does not provide a compiler. Use prebuilt components and avoid new stylex.create source. Next.js client boundaries, stylesheet integration, hydration and selected template imports need a real build smoke check. No compatibility blocker was proven or resolved in this planning task.

White/navy/coral styling is generated through Astryx's theme editor and imported-theme extension workflow. Editor sources live in themes/parent-coach; application artifacts live in src/themes/parent-coach. Actual desktop/Urdu-mobile app images were inspected, alongside generated showcase images. Semantic theme tokens carry palette and focus styling. Delivery checks use the framework build and `npm run astryx -- doctor --built .` to inspect both source and built output; see docs/EVALUATION.md for warnings and remaining visual/accessibility limits.

## States and transitions

Transcript stays visible through every state except confirmed reset/reload. Language changes affect future output/UI, never rewrite earlier turns. Retain the submitted text on failure/cancel; retry must reuse that pending turn rather than append a duplicate.

| State | Visible behavior and transition |
| --- | --- |
| Empty | Welcome, examples, composer and disclosures. Valid Send appends parent text once and enters pending. Blank/over-limit input shows field error without a request. |
| Pending | Existing transcript plus submitted parent message; preparing status, Cancel and New conversation. Block duplicate sends and freeze the request language. Only the final public response can move to answered, clarify, escalation, boundary or error. |
| Answered | Validated normal answer plus check-in; composer ready for follow-up. At eight parent turns explain the limit and offer New conversation without deleting history. |
| Clarify | One focused question; same history/composer. A follow-up enters pending with full bounded transcript. |
| Escalation | Server-selected urgent/safeguarding copy, prominent heading and human-help action, fully visible. No return-later CTA; follow-up must retain unresolved risk in context. |
| Boundary | Fixed medical/legal/harmful-request/off-topic limit and suitable redirection; no unchecked candidate. Follow-up remains available within bounds. |
| Error | Fixed unavailable/rejected/timeout/cancel notice; no raw provider details. Keep history and submitted text, offer explicit retry/edit. No automatic retry. Conditional immediate-danger guidance must not label every failure a crisis. |
| Reset | Empty conversation resets immediately; otherwise ask in Dialog, including while pending. Keep preserves state. Clear aborts request, invalidates its generation ID, clears history/draft, then focuses empty composer. Late results are ignored even if network cancellation fails. |

Cancel also invalidates the active request ID and suppresses late responses while preserving text/history. Never remove older turns silently to fit a request. Proposed contract: 2,000 characters per parent message, eight parent turns, 64 KiB aggregate request bytes, bounded output and a 30-second total server deadline across both calls. Align exact character counting between UI and server before implementation: TextArea maxLength is a soft user-perceived-character counter; htmlMaxLength counts native UTF-16 units. Neither substitutes for shared validation. Show a specific limit message rather than truncate text.

The server performs call A classification/drafting, schema validation, immediate fixed urgent/safeguarding routing, and fresh call B review of other results without A classification. Explicit conservative arbitration and fixed rejection/error copy protect the UI from unchecked drafts. Browser code sees only the final public object. Review reduces risk; it is not a safety guarantee. Loopback-only operation, same-origin validation and bounded concurrency are server concerns; origin checks are not authentication.

## Language, RTL and accessibility

- Auto defaults to bilingual input cues and English UI chrome; reply language matches the latest substantive message, using history for short follow-ups. Explicit English/Urdu controls future replies and localized UI. In pending state retain the request language; disable language changes until completion/cancel to avoid mixed state.
- Urdu UI uses lang="ur" and RTL; English uses lang="en" and LTR. Each transcript turn retains its own language/direction. Use logical spacing/alignment and bidirectional isolation for mixed Latin words/numbers. Do not mirror text or assume Urdu implies a country. Fixed failure/escalation copy must have reviewed Urdu equivalents; fallback uses explicit choice, then visible script/context, then UI language.
- Astryx exports InternationalizationProvider/useDirection/getLocaleDirection. Installed provider typings accept locale, messages, overrides and dir; its dir sets context only, not the DOM attribute. Set both provider direction and document dir, keeping them in sync. Missing message catalogs fall back to English. Direction support does not prove Urdu translations: supply app strings and check internal selector/dialog/disabled-state announcements. Portaled menus/dialogs must inherit the intended direction. Never assume undocumented dir/lang forwarding on controls; verify rendered DOM.
- Keep the single column fluid, transcript readable, and composer in document flow so mobile keyboard does not cover the last answer. Check narrow mobile, desktop, zoom/reflow and long Urdu/mixed-script text. Use a legible system font stack with sufficient line height; no external runtime font dependency.
- Provide visible labels, semantic headings and keyboard focus. Announce pending/completion/errors once without rereading the full transcript or stealing focus during ordinary replies. Verify urgent announcements, dialog focus trap/return, selector arrows, screen-reader language changes and reduced motion. Loading/disabled Button uses aria-disabled and stays focusable; handler guards remain required.

## Implementation tasks and acceptance

1. **Shell and theme:** scaffold the selected template, retain its frame, remove excluded affordances, wire prebuilt styles and proposed theme. Acceptance: no mascot/intake/dashboard; all actual imports resolve, theme PNGs inspected, mobile and desktop layout readable.
2. **Conversation and controls:** implement state table, limits, language, Cancel and reset dialog. Acceptance: error/cancel retains text; explicit retry creates no duplicate; reset/cancel rejects a deliberately delayed response; eight-turn/byte limits preserve history.
3. **Response presentation:** map only final validated public variants. Acceptance: ordinary output has brief actions/check-in, clarification asks one question, crisis has fully visible immediate support and no waiting invitation; invalid/rejected/provider-blocked output exposes no draft.
4. **Verification and recording:** component/build/doctor checks; synthetic English/Urdu normal, crisis, safeguarding, boundary and failure examples; keyboard/RTL/zoom checks. Acceptance: record actual results and limitations, then capture approximately two minutes of the running app showing everyday/follow-up, Urdu and crisis. No live model test or accessibility pass is claimed here.

Submission is GitHub repository + README + recording, due Thursday 19 November 2026, 16:00 Dubai / 17:30 India; no hosted application.
