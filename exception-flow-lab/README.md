# Exception Flow Lab

An investigative, non-gamified learning tool that diagnoses and corrects specific misconceptions about Java exception handling — built for the thesis "LLM-Supported Learning Tool Addressing Java Exception Handling Misconceptions".

No accounts, no backend, no leaderboards, no timers. A learner works through short "case files": trace what a snippet of code actually does, compare that against their own one-sentence reasoning, watch the control flow play out, and optionally step through four fixed levels of AI support (hint → step-by-step → simpler explanation → similar example). Nothing here is AI-graded — correctness is always checked against authored answer data.

## Status

Module 1 — **"Trace the Execution"** — and Module 2 — **"Catch Order & Specificity"** — are built completely and end-to-end: Welcome → Module Map → Task (diagnostic) → Feedback → AI Support → Transfer Task (with the one-retry, and for Module 1 the flow-adaptive variant swap) → Module Completion → Concept Journal. Modules 3–4 are scaffolded as locked "coming soon" cards on the Module Map — the architecture is ready to extend, but no task content has been authored for them yet (see "Adding a module" below).

Module 1's tasks are runtime control-flow traces, so their Feedback screen shows the animated `ExecutionReplay`. Module 2's tasks (`catch_order`) are about a static/compile-time ordering rule, not "what happens when this runs" — they have no `replayScript`, and `FeedbackCard` falls back to a plain code block for them instead of showing an animation that wouldn't mean anything. Module 2 also doesn't have a high-confidence "stretch" transfer variant yet (optional per the build spec, not required).

## Install & run

```bash
npm install
npm run dev       # starts the Vite dev server
npm run build     # type-checks (tsc -b) and produces a production build in dist/
npm run typecheck # type-check only, no build output
```

## Where things live

```
src/
├── types/content.ts            # Task, Feedback, LlmSupportResponse, SupportType, ReplayStep, ...
├── content/
│   ├── module1-trace-execution.ts   # all Module 1 task content (diagnostic + 2 transfer variants)
│   ├── module2-catch-order.ts       # all Module 2 task content (diagnostic + 1 transfer task)
│   └── modules.ts                   # module list + lookup helpers (getTaskById, getTransferTask, ...)
├── llm/llmSupportService.ts    # mock-first, swappable LLM support interface (see below)
├── state/
│   ├── progressStore.ts        # localStorage read/write/reset
│   ├── screenReducer.ts        # the App-level screen state machine
│   └── evaluateAnswer.ts       # correctness checking, one function per TaskType
├── components/                 # Screens A–H + shared pieces
│   └── tasks/                  # one component per TaskType (drag+click for ordering tasks, selection UI otherwise)
└── styles/tokens.css           # design tokens (colors, fonts, spacing) — CSS Modules everywhere else
```

### Adding a new task to an existing module

Add a `Task` object (see `types/content.ts`) to that module's content file, list its `id` in the `Module.taskIds` array in `content/modules.ts`, and make sure `TaskRenderer` already handles its `answer.type` (all six `TaskType`s are implemented).

### Adding a new module

1. Create `src/content/moduleN-<slug>.ts` following `module1-trace-execution.ts`'s shape: a diagnostic task (`taskIds[0]`) and one or more transfer tasks.
2. Register it in `src/content/modules.ts` — replace the relevant locked placeholder with `available: true` and real `taskIds`, and add its tasks to the internal task lookup array.
3. Nothing else needs to change: `App.tsx`, `TaskRenderer`, `FeedbackCard`, `AiSupportPanel`, etc. are all content-agnostic.

## Live LLM API integration

`src/llm/llmSupportService.ts` currently exports `mockLlmSupportService`, which just reads the task's own authored `supportContent` — no network call, no latency, no cost, and it can never contradict the task's correct answer since it isn't generating anything.

To add a **live** LLM-backed version later, implement the same `LlmSupportService` interface (see the commented-out `liveLlmSupportService` stub in that file) and swap the `llmSupportService` export. Every component that calls it (`AiSupportPanel`) is already `async`-aware and doesn't need to change.

**Do not put an API key directly in frontend code shipped to users** — a client-side bundle is fully readable by anyone who opens dev tools. If a live integration is added:

- (a) restrict the key's spending limit and accept that tradeoff only for a non-public prototype deployment, or
- (b) add a minimal backend proxy that holds the key server-side.

This should be a conscious decision made at integration time, not an accident.

## Resetting progress

All progress is stored client-side under the `exception-flow-lab-progress` `localStorage` key. Use the "Reset progress" button in the footer, or call `resetProgress()` from `src/state/progressStore.ts`.

## Design choices worth knowing about (deviations/extensions vs. the raw build spec)

- **Skip-detection UI (`ExecutionTraceTask`)**: cards start in a shuffled "Doesn't happen" pool; the learner sorts them into an ordered "This happens" sequence via drag **or** always-visible ▲/▼/"move" buttons — no interaction depends solely on drag-and-drop.
- **Transfer task ≠ renamed diagnostic**: Module 1's baseline transfer task originally reused the diagnostic's exact shape (throw on the first try-statement, two things skipped) with only method/variable names changed — that let a learner pattern-match the surface without engaging with the rule, so it was rebuilt with a genuinely different shape (one statement succeeds *before* the throw). The high-confidence "stretch" variant is different again (several things skipped instead of one). Same principle applied to Module 2: its transfer task uses an unrelated scenario (JSON parsing vs. file I/O) and a different exception hierarchy, not just renamed classes.
- **Transfer retry content**: the spec's "one retry with a new comparable version" is served using the *other* authored transfer variant (baseline ↔ stretch) where one exists, rather than a new authored task per retry. Module 1 has both variants, so its retry genuinely shows a different case. Module 2 only has a baseline (no stretch variant authored yet — see `getComparableRetryTask` in `content/modules.ts`), so its retry currently re-serves the same task; the copy on that screen ("look at it again") is deliberately worded to stay honest either way instead of promising a "different scenario" it might not deliver.
- **ExecutionReplay is optional, not universal**: it only renders when a `Task` has a non-empty `replayScript`. Module 1's tasks are runtime traces, so they all have one. Module 2's `catch_order` tasks test a static/compile-time rule (catch clause order), where "replay the execution" doesn't mean anything — `FeedbackCard` falls back to a plain `CodeBlock` for those instead of showing an animation with nothing real to animate.
- **ExecutionReplay's "arrow"**: implemented as a callout banner that fades in under the code block at the throw→catch moment, rather than a literal animated SVG path between two lines — simpler and more robust for a handful of short snippets; upgradeable later if wanted.
- **Progressive hint fading**: computed from the last two *completed* tasks in the current module; with fewer than two, it defaults to expanded (not enough signal to fade yet).
- **AnswerDiff on the Feedback screen**: shown only when the answer was wrong. It compares the learner's raw structured response against the authored correct answer (per `TaskType` — sequence diff, order diff, set diff, or single-choice diff) so a learner can see *what* was mis-sorted/mis-selected. This exists on top of the base spec because "wrong" alone wasn't informative enough on its own — it does **not** grade or check anything the learner wrote in the reflection box; that box is never graded, per the spec's explicit "No AI-based correctness grading, ever" rule, which stays in force.
