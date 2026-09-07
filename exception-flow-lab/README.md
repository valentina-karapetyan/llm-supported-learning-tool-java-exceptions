# Exception Flow Lab

An investigative, non-gamified learning tool that diagnoses and corrects specific misconceptions about Java exception handling — built for the thesis "LLM-Supported Learning Tool Addressing Java Exception Handling Misconceptions".

No accounts, no backend, no leaderboards, no timers. A learner works through short "case files": trace what a snippet of code actually does, compare that against their own one-sentence reasoning, watch the control flow play out, and optionally step through four fixed levels of AI support (hint → step-by-step → simpler explanation → similar example). Nothing here is AI-graded — correctness is always checked against authored answer data.

## Status

All five modules are built end-to-end. Modules 1–4 run the standard flow: Welcome → Module Map → Task (diagnostic) → Feedback → AI Support → Transfer Task (with the one retry, serving a comparable variant where one is authored) → Module Completion → Concept Journal.

**Module 5 — "Mixed Case Review" — runs a different flow on purpose.** It's a consolidation module: interleaved retrieval practice over the rules Modules 1–4 introduced, with no new theory of its own. Its flow is CASE 1 → CASE 2 → CASE 3 → COMPLETE — each case is one short snippet, one focused question, immediate targeted feedback, then straight on to the next. No diagnostic/transfer split, no confidence question, no reflection question, no retry. See "Module 5" below.

Module 1's tasks are runtime control-flow traces, so their Feedback screen shows the animated `ExecutionReplay`. Module 2's tasks (`catch_order`) are about a static/compile-time ordering rule, not "what happens when this runs" — they have no `replayScript`, and `FeedbackCard` falls back to a plain code block for them instead of showing an animation that wouldn't mean anything. Module 3's tasks show the animated `PropagationReplay` instead, since propagation crosses method boundaries that per-line highlighting can't represent. Module 2 doesn't have a high-confidence "stretch" transfer variant (optional per the build spec, not required).

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
│   ├── module3-call-chains.ts       # all Module 3 task content (diagnostic + transfer + retry variant)
│   ├── module4-designing-handlers.ts# all Module 4 task content (diagnostic + transfer + retry variant)
│   ├── module5-mixed-practice.ts    # all Module 5 task content (3 mixed cases; case 3 has parts A and B)
│   └── modules.ts                   # module list + lookup helpers (getTaskById, getTransferTask, getMixedCaseTrail, ...)
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
2. Register it in `src/content/modules.ts` — add it to `modules`, and add its tasks to the internal task lookup array.
3. Nothing else needs to change: `App.tsx`, `TaskRenderer`, `FeedbackCard`, `AiSupportPanel`, etc. are all content-agnostic.

To add another *mixed-practice* module instead, set `flow: "mixed_practice"` on it, list every case in `taskIds` in order, give each of those tasks a `mixedCase: { trailLabel, continueLabel }`, and author a `completion` summary (a mixed-practice module has no per-task `keyRule` to derive one from). Everything else — the screens, the reducer transitions, the CaseNav trail — is already generic.

## Module 5 — mixed practice

Module 5 exists to consolidate, not to teach. It combines, without ever telling the learner which earlier case file a rule came from:

| Case | Case file | Interaction | What has to be combined |
| --- | --- | --- | --- |
| 1 | The Missing Confirmation | `execution_trace` | statements skipped after a throw **+** propagation past a method with no handler |
| 2 | The Special Case | `handler_refactoring` | subtype-before-supertype ordering **+** matching handler scope to the intended group |
| 3A | The Handler That Never Sees It | `single_choice` | propagation **+** hierarchy compatibility **+** first-compatible-handler |
| 3B | The Handler That Never Sees It | `handler_refactoring` | all of 3A **+** specific-before-general **+** designing for different reactions |

Design constraints this module holds itself to, all enforced in content rather than in code:

- **No new theory, and no Key Rule card.** `Feedback.keyRule` is optional; Module 5 authors none, so `FeedbackCard` skips the card, `ConceptJournal` skips the (otherwise empty) "Key rules" block, and `CompletionScreen` uses the module's authored `completion` summary instead of derived rules.
- **Shorter feedback than Modules 1–4.** It names the specific mistake and shows the resolution; it doesn't re-teach.
- **No repeated interaction across cases**, and no confidence or reflection screens anywhere.
- **Neutral option labels.** Modules 1–4 label handler options evaluatively ("overly general", "duplicated handling"); Module 5's are purely structural ("`catch (X e)`, then `catch (Y e)`") so the label can't hand over the verdict before the learner has reasoned. They still read correctly in `AnswerDiff`'s "you picked / correct answer".
- **Correctness is still 100% predefined** — `evaluateAnswer` against authored answer data, exactly as everywhere else. The LLM support panel never grades.

Every Java snippet in this module (task code, all option snippets, and every `resolvedCode`) was compiled and run against a real JDK during authoring, including the two intentionally-invalid distractors — Case 2 option A and Case 3B option B, both rejected with `exception … has already been caught`. Case 3's `process()` must declare `throws FileNotFoundException` for `start()`'s handler to compile at all, which is the same wrinkle Module 3's transfer task has, and is itself part of what makes the case interesting.

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

- **Skip-detection UI (`ExecutionTraceTask`)**: cards start in a shuffled, neutral "Events to sort" pool — never pre-sorted into "happens" or "doesn't happen", so the starting layout can't be read as a hint — and the learner explicitly sorts them into an ordered "This happens, in order" list and a "Doesn't happen" list via drag **or** always-visible "move to zone" / ▲/▼ buttons; no interaction depends solely on drag-and-drop. Submission is gated on the pool being empty (every card explicitly classified).
- **Case 1 rule-based feedback (`Feedback.getIncorrectExplanation`)**: an optional, hand-authored function on a task's `feedback` that picks which predefined explanation to show for a wrong answer based on *what* was actually wrong with the learner's submitted sequence (wrong events included, events missing, right set/wrong order, etc.) — still fully predefined/non-LLM, just reactive instead of one static string. Only `module1-trace-execution.ts`'s `diagnosticTask` supplies one; every other task falls back to the static `incorrectExplanation` unchanged.
- **Transfer task ≠ renamed diagnostic**: Module 1's baseline transfer task originally reused the diagnostic's exact shape (throw on the first try-statement, one thing skipped) with only method/variable names changed — that let a learner pattern-match the surface without engaging with the rule, so it was rebuilt with a genuinely different shape (one statement succeeds *before* the throw, and *two* are skipped after it, not one). The high-confidence "stretch" variant is different again (three things skipped instead of two, and the throwing call is less obviously "the risky one"). Same principle applied to Module 2: its transfer task uses an unrelated scenario (XML parsing vs. file I/O) and a different exception hierarchy, not just renamed classes.
- **Transfer retry content**: the spec's "one retry with a new comparable version" is served using the *other* authored transfer variant (baseline ↔ stretch) where one exists, rather than a new authored task per retry. `getComparableRetryTask` (in `content/modules.ts`) resolves this generically off `justAttempted.moduleId`, the same pattern `getTransferTask` already uses — so it works for any module the moment a `transferVariantForHighConfidence` is wired up, no per-module edit needed. Module 1 has both variants, so its retry genuinely shows a different case, and both the retry button ("Try a comparable case") and the Transfer Task screen's eyebrow copy say so. Module 2 only has a baseline (no stretch variant authored yet), so its retry re-serves the same task — and the button/copy there say "Try again" / "look at it again" instead, computed from whether a distinct variant actually exists rather than a single hardcoded string that could overclaim.
- **ExecutionReplay is optional, not universal**: it only renders when a `Task` has a non-empty `replayScript`. Module 1's tasks are runtime traces, so they all have one. Module 2's `catch_order` tasks test a static/compile-time rule (catch clause order), where "replay the execution" doesn't mean anything — `FeedbackCard` falls back to a plain `CodeBlock` for those instead of showing an animation with nothing real to animate.
- **ExecutionReplay's "arrow"**: implemented as a callout banner that fades in under the code block at the throw→catch moment, rather than a literal animated SVG path between two lines — simpler and more robust for a handful of short snippets; upgradeable later if wanted.
- **Progressive hint fading**: computed from the last two *completed* tasks in the current module; with fewer than two, it defaults to expanded (not enough signal to fade yet).
- **AnswerDiff on the Feedback screen**: shown only when the answer was wrong. It compares the learner's raw structured response against the authored correct answer (per `TaskType` — sequence diff, order diff, set diff, or single-choice diff) so a learner can see *what* was mis-sorted/mis-selected. This exists on top of the base spec because "wrong" alone wasn't informative enough on its own — it does **not** grade or check anything the learner wrote in the reflection box; that box is never graded, per the spec's explicit "No AI-based correctness grading, ever" rule, which stays in force.

## QA pass

Beyond the manual click-throughs during initial development, a structured review pass (9 independent finder angles: cross-file tracing, removed-behavior auditing, wrapper/proxy correctness, language-pitfall specifics, reuse/simplification/efficiency/altitude cleanup) plus targeted Playwright checks for behaviors that hadn't actually been exercised yet caught and fixed:

- **Reopening the AI Support panel silently relocked everything** — closing and reopening it for the same task reset `requested`/`responses` to empty every time, even though `progressStore` already remembered what had been unlocked. Fixed: the panel now takes an `initialRequested` prop and re-fetches content for anything already unlocked on mount.
- **Factually wrong Java exception hierarchies in Module 2's content** — `JsonParseException extends ParseException extends Exception` and `DateTimeParseException extends IllegalArgumentException extends Exception` don't correspond to any real Java library's actual class hierarchy. Replaced with verified, accurate JDK chains (`SAXParseException → SAXException → Exception`, `NameNotFoundException → NamingException → Exception`, `SocketException → IOException → Exception`) — a Java-teaching tool asserting an invented hierarchy as fact would undermine exactly what it's trying to teach.
- **A broken "similar example"** in Module 1's stretch task referenced "this snippet's try block" in a code sample that had no try/catch at all (a leftover from editing). Fixed to actually show one.
- **Retry copy could overclaim**: "Try a comparable case" / "here's a comparable case, different scenario" was shown even for Module 2, which re-serves the *identical* task on retry (no stretch variant authored yet). The button label and the Transfer Task screen's eyebrow copy are now both computed from whether a distinct variant actually exists, not a single hardcoded string.
- **`getComparableRetryTask` was hardcoded to Module 1's specific task constants** — generalized to resolve via `justAttempted.moduleId`, matching the pattern `getTransferTask` already used, so a future module's stretch variant works automatically instead of needing a bespoke edit here.
- Smaller fixes: a dead re-export (`diagnosticTask` from `modules.ts`, nothing imported it), a duplicated `shuffledIds` helper (now shared, `components/tasks/shuffle.ts`), non-memoized id-lookup maps in the two ordering task components, an asymmetric bounds check in `CatchOrderTask`'s keyboard-move handler (`index === -1` wasn't guarded the way the drag handler already guarded it — currently unreachable via the UI, but latent), a stale code comment in `ModuleMap.tsx`, and the four support-type titles ("A nudge", "Step by step", ...) were retyped per task instead of referencing one `SUPPORT_TITLES` constant.
- Verified via Playwright specifically (none of these had been exercised before): the progressive hint-fading heuristic actually reaching its collapsed state (requires two first-try-correct completions in a module before it triggers), the keyboard-only path through the drag-fallback controls, the `prefers-reduced-motion` path skipping straight to final state, and edge cases (empty Concept Journal, resetting progress mid-task).
