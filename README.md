# Exception Flow Lab

A web-based learning tool that helps students recognise and correct common misconceptions about exception handling in Java.

Learners work through short code cases, predict what the code does, and get feedback that shows exactly where their reasoning went wrong. An optional LLM-based support panel can rephrase explanations, but correctness is always checked against predefined answers, never by the model.

Built as part of the thesis *LLM-Supported Learning Tool Addressing Java Exception Handling Misconceptions*.

**Live demo:** [llm-supported-learning-tool-java-ex.vercel.app](https://llm-supported-learning-tool-java-ex.vercel.app/) (LLM features require an access code; without one, the app uses predefined content)

![Lesson overview](docs/screenshots/lessons.png)

## Lessons

| # | Lesson | Focus |
|---|--------|-------|
| 1 | Trace the Execution | Which statements run after an exception is thrown |
| 2 | Catch Order & Specificity | Which `catch` clause runs when several could match |
| 3 | Call Chains & Propagation | Where an uncaught exception is finally handled |
| 4 | Designing Handlers | Choosing and refactoring exception-handling strategies |
| 5 | Mixed Case Review | Short cases that combine the rules from lessons 1 to 4 |

Each lesson starts with a diagnostic case, followed by feedback, an optional AI explanation, a transfer case and a short retrieval question.

## Screenshots

**Solving a case.** The learner builds an execution trace from the events that actually happen.

![Task screen](docs/screenshots/task.png)

**Feedback.** The answer is compared with the correct trace, and a step-by-step replay shows which lines run and which are skipped.

![Feedback with replay](docs/screenshots/feedback.png)

## Getting started

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`. Progress is stored in the browser's `localStorage`; there is no backend or login.

Other scripts:

```bash
npm run build      # type-check and build to dist/
npm run preview    # serve the production build
```

## LLM support (optional)

Two features use Google's Gemini API: the AI support panel and the feedback on retrieval questions. Without an API key, the app falls back to predefined content and works normally.

To try them locally, copy `.env.example` to `.env.local` and add a free key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

## Project structure

```
api/              Vercel serverless proxy for Gemini
src/
  components/     Screens and UI components
  content/        Lesson content: tasks, answers, feedback, replay scripts
  llm/            Gemini client and the two LLM-backed services
  state/          Screen state machine, answer evaluation, progress storage
  types/          Shared TypeScript types
```

New tasks are added in the matching file under `src/content/` and registered in `src/content/modules.ts`.

## Tech stack

React, TypeScript, Vite, CSS Modules, dnd-kit, Google Gemini API.
