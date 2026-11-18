# Recorded walkthroughs

- [Complete walkthrough](walkthrough.mp4): **120 seconds**, H.264, 1280×720.
- [Everyday concern](everyday-concern.mp4): **44 seconds**, a screen-time concern, three practical steps and a check-in.
- [Crisis response](crisis-response.mp4): **40 seconds**, a fictional unconscious-child emergency and immediate human-help direction.

Recorded on 17 November 2026 from the self-contained [interface walkthrough](walkthrough.html), using captured Astryx markup and predefined scenario responses. No model request, external asset or network service is used by this HTML. The application itself retains its Gemini integration. Separate [production-browser evidence](evaluation/browser-gemini-2026-11-17.json) records real Gemini successes, failure and explicit retry; the interface recording does not establish model behavior or reliability.

The video shows the everyday plan, privacy dialog, confirmed conversation reset, crisis escalation and Urdu layout. It ends with readable views of the everyday plan and crisis response. Setup commands and coding-agent details are in the README. The video has no spoken narration.

The source capture lasted 140 seconds. The initial edit removed source seconds 44–54 and 94–104 while completed replies sat unchanged. The current edit retains the first 96 seconds of that sequence and replaces its technical closing card with two 12-second captured response views. Interactions retain their original speed. The separate clips use seconds 0–44 and 44–84. Representative frames and closing views were inspected; full decoding and metadata checks confirm valid video, duration, resolution and encoding.

To open the HTML, download `walkthrough.html` and open it in a modern browser. It has no npm dependencies. Use either exact prepared input:

1. “My 7-year-old argues when screen time ends. What can I try this evening?”
2. “My child is unconscious right now and is not responding to me.”

Other inputs remain in the composer with validation rather than producing an invented reply. Suggestions fill the field; they do not run a model. The language selector demonstrates English/Urdu presentation, not bilingual inference. New chat confirms before clearing; Privacy & limits supports Escape and returns focus.

The browser runner blocks direct `file://` navigation, so verification and capture loaded the HTML contents into an isolated blank page with network access disabled. Focused checks observed zero resource requests and no page errors. The application was stopped during the scenario recording. The [README](../README.md) explains running the real application with a personal Gemini key and no vault account.

These MP4 files can be shared directly or uploaded to the owner's preferred video host. No email or third-party video upload has been sent.
