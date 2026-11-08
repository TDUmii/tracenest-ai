# Devpost submission draft — SLAY HACKS 2026

Status: PREPARED, **NOT YET SUBMITTED**. The project creation flow is blocked by a human reCAPTCHA challenge in the signed-in Devpost browser. Do not claim official entry until a public Devpost project URL is verified.

Event: https://slayy-hacks.devpost.com/
Official deadline displayed in account: Dec 8, 2026 at 05:00 GMT+7 (equivalent to Dec 7 in many other time zones). Verify in the logged-in account before sending.

## Project Name
TraceNest AI — Learn Code by Understanding Mistakes

## One-line pitch
A privacy-first coding coach that helps beginners understand *why* their code fails through evidence-based hints and optional on-device AI, without giving away complete solutions.

## Inspiration
Beginner coders often jump from error to full generated answer. The fix may work, yet the underlying misconception—an off-by-one error, a mistaken comparison, or a loop that never updates—remains. Educators need a way to give small, specific hints, while learners need room to reason independently. Many AI tutors require user accounts or transmit student code to remote services.

## What it does
TraceNest provides seven focused debugging challenges for Python and JavaScript learners. A student edits a small code snippet and asks for feedback. The app highlights likely misconceptions, shows short evidence from the submitted code, and suggests one next step for self-correction. The learner can repeat and improve; completed exercises and review intervals are kept locally in the browser. There is no backend database and no API key.

## How we built it
TypeScript and Vite render the responsive UI. A transparent pattern-based diagnosis layer detects selected programming misconceptions and works without a hosted AI service. For harder cases, the optional in-browser semantic path loads Xenova/all-MiniLM-L6-v2 using Transformers.js and ONNX Runtime Web. Embeddings compare user code and question context against curated descriptions of typical misconceptions. The generated similarity score is combined with evidence signals and lesson context to rank possible hints. The project uses browser localStorage for progress and a simple spaced-review interval. GitHub Actions runs six unit tests and deploys a static site to GitHub Pages.

## AI integration — accurately stated
- Model: Xenova/all-MiniLM-L6-v2 (MiniLM embedding model); inference via Transformers.js.
- Role: rank the semantic relevance of common coding misconceptions, **not** generate solutions or execute code.
- User can disable AI and use a no-cost transparent rules fallback.
- On first use, the browser must download model weights from external infrastructure. After downloading, model inference is on-device. The model's output is heuristic; no guarantee of factual correctness.
- The model mode has not yet passed full cross-device performance validation. Provide a live demo of rule-based mode, and only claim model-specific functions if separately tested and demonstrated.

## Challenges we ran into
A single regex can recognize a textbook correction but cannot prove a program is correct. We therefore show a visible limitation notice. We also avoided sending student code to a custom backend; in-browser model inference requires managing larger static assets and a first-run model download. Mobile performance and more robust evaluation remain future improvements.

## Accomplishments
- Seven short beginner coding lessons
- A responsive web UI tested through a live public deployment
- Evidence-aware feedback that shows the reason for suggested corrections
- Repeat practice and browser-local persistence
- Six unit tests passing, continuous deployment working
- Entire experience usable without accounts or paid API keys in rules mode

## What's next
- Run an instrumented benchmark of the optional on-device model on low-end phones.
- Compare misconceptions with teacher-labeled examples and calibrate the confidence display.
- Add privacy-preserving sandboxed unit tests for richer correctness checking (not supported in this prototype).
- Let educators author safe custom challenges and gather opt-in aggregate progress.

## Try it out
Live application: https://tdumii.github.io/tracenest-ai/
Source repository: https://github.com/TDUmii/tracenest-ai

Suggested demo steps:
1. Open the live application and select “Cửa qua môn” (Python, Level 1).
2. Observe the starter code `score > 50`; leave On-device AI off for deterministic rule-based feedback.
3. Click “Phân tích code” to see the likely boundary-condition misconception.
4. Change `if score > 50:` to `if score >= 50:`.
5. Analyze again; observe the solution hint and 1/7 progress.
6. Choose another mission and show that the next-repetition suggestion changes.
7. Clearly explain that passing a rule pattern is not equivalent to executing or verifying the program.

## Built with
TypeScript; Vite; Vitest; Transformers.js; ONNX Runtime Web; MiniLM; GitHub Actions; GitHub Pages; HTML; CSS.

## Credits
Original application authored for this hackathon with ChatGPT AI assistance to research, write code, and design the interface. No paid outsourced work. Third-party model, runtime and open-source library contributions credited by project dependencies.

## Required submission checklist
- [x] Public source code URL
- [x] Public working prototype URL
- [x] Title, problem, solution, AI implementation and limitations prepared
- [x] Basic local and CI tests in repository
- [ ] Desktop and mobile screenshots from final deployed app
- [ ] Recommended 2–4-minute walkthrough video recorded/uploaded
- [ ] Human completes reCAPTCHA on Devpost
- [ ] Project draft saved in logged-in Devpost form
- [ ] Eligibility and participant identity verified by account holder
- [ ] Final official submission made and URL verified

No cash is earned merely by submitting.
