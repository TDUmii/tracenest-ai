# TraceNest AI

A privacy-aware debugging coach for beginner Python and JavaScript learners. Built during **SLAY HACKS 2026** (Nov 7–Dec 7, 2026).

**Problem:** Beginning programmers often paste a full error into a chatbot and get the complete solution without understanding why their reasoning failed.

**Solution:** TraceNest offers short faulty-code exercises, interpretable evidence-based hints, an optional on-device semantic model, and spaced-practice suggestions. It does not execute submitted code or claim formal verification.

## Features

- Seven+ bite-sized code debugging missions in Python / JavaScript.
- Transparent rule-based error clues that function offline after the app loads.
- Optional **on-device MiniLM** semantic similarity via Transformers.js / ONNX WebAssembly. The first use downloads model weights from Hugging Face; the inference runs in the browser and code is not sent to a custom application backend.
- Editable code exercises with Ctrl+Enter to analyze, reset, and next-mission suggestions.
- Progress saved only in browser localStorage; no account, analytics, or API key required.
- Responsive touch-friendly design for mobile and desktop.

## Run locally

Requirements: Node.js 20.19+ (or 22.12+).

```bash
npm ci
npm run dev
npm test
npm run build
```

Open the URL printed by Vite. Built files go into `dist/`; deploy that directory to static hosting. Relative asset paths are configured for GitHub Pages.

## Privacy / limitations

- Static hosting serves app files. Code entered into the editor is stored in the browser's localStorage for convenience, not a server database.
- AI mode downloads third-party pretrained model resources on first use. Network requests to model infrastructure are therefore required unless already cached; low-memory devices may be slow.
- MiniLM is an embedding model, **not** a code execution engine, a proof system, or a general-purpose LLM. It suggests likely misconceptions from examples; confidence percentages are heuristic, not calibrated probabilities.
- Rule-based evaluation uses regex patterns. A correct answer outside the patterns might not be recognized, and an incorrect answer could match the pattern. Do not use this for grades, hiring, or security validation.
- No sensitive code or secrets should be entered into third-party web apps.

## Tech stack

Vite, TypeScript, Vitest, Transformers.js, ONNX Runtime Web. No paid services.

## Hackathon submission note

Original project built in the official SLAY HACKS development window. AI assistance was used in coding and UI creation; repository authorship and original contributions should be credited accurately in the submission. For judging, provide a live demo, screenshot(s), and a short walkthrough explaining local AI versus fallback rule evaluation.

License: MIT.
