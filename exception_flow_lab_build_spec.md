# Build Spec: Exception Flow Lab

**How to read this document:** It merges two sources — (1) the detailed build prompt ("Exception Flow Lab") the user provided, which is authoritative for scope, screens, tone, and the explicit non-goals list, and (2) creative pedagogical mechanics carried over from earlier design work, which make the tool feel investigative rather than quiz-like. Where the two would conflict, this document says so explicitly and states which one wins and why — nothing is silently overridden.

**Build order (unchanged from the prompt, repeated because it matters most):** Build the application shell + a fully working "Trace the Execution" module first. Do not start Module 2–4 until diagnostic → feedback → AI support → transfer → completion works end-to-end for Module 1. Then replicate the same architecture.

---

## 1. What's kept from the literal prompt, unchanged

- No backend, no auth, no database, no payments. Local TypeScript data files.
- No leaderboards, no time pressure, no lives, no coins, no competitive scores.
- No unrestricted AI chat box; support is four fixed, sequential buttons.
- No AI-based correctness grading, ever.
- React + TypeScript + Vite, local storage for progress, reset-progress option.
- Screens A–H exactly as named (Welcome, Module Map, Task, Feedback, AI Support Panel, Transfer Task, Module Completion, Concept Journal).
- The `Task`, `Feedback`, `LlmSupportResponse`, `SupportType` shapes from the prompt's §14 are the foundation of the data model (extended below, not replaced).

## 2. Where this spec deliberately adds to the prompt, and why

| Addition | What it does | Why it's worth the extra build effort |
|---|---|---|
| **Streak counter dropped, replaced with nothing competitive** | No consecutive-correct counter anywhere in the UI or data model. | This is the one mechanic the prompt explicitly names as the kind of gamified pressure to avoid. Kept out rather than reframed — a "soft streak" is still a streak. |
| **Progressive hint fading** | The AI support panel's buttons unlock in sequence as described in the prompt (hint → step-by-step → simpler → similar example), but *additionally*, if a learner has answered the last 2 tasks in a module correctly on the first try, the panel opens collapsed ("Need help? ↓") instead of expanded by default. | Purely about not training learners to reach for AI help reflexively when they don't need it — a small nudge toward self-reliance, never a lock (all four buttons are still one click away). |
| **Self-articulation before reveal** | Between "submit answer" and "show feedback," a single optional text box: *"In one sentence — why do you think that happens?"* Never graded, never sent anywhere, purely for the learner's own reflection; shown back to them next to the key rule on the feedback screen. | Turns "click an answer, read an explanation" into "commit to reasoning, then compare it." This is the single highest-leverage addition for making the tool feel like investigation rather than a quiz, and it's a plain `<textarea>` — near-zero implementation cost. |
| **Flow-adaptive transfer retry** | The prompt already specifies "one retry with a new comparable version" if the transfer task is wrong (§11). This spec adds: if the *diagnostic* task was answered correctly with "very confident," the transfer task served is the slightly more interesting variant (see Module 1 content below) instead of the baseline one — still just one task, not a three-tier difficulty system. | A small, cheap way to avoid boring a learner who clearly already gets it, without building the heavier three-tier variant system from earlier drafts (which this spec explicitly does NOT carry forward — see §3). |
| **Live control-flow visualizer** | A small animated diagram (not a new screen — lives inside the Feedback screen) that visually replays the code's execution path: highlights each line in sequence, shows the jump to `catch` with a visible arrow/motion when an exception is thrown, and dims skipped lines. Reuses the same code block already shown, no separate asset. | This is the one purely "wow, that's smart" addition — it turns "read an explanation of control flow" into "watch control flow happen." It directly reinforces the module's central question and costs one shared component (`ExecutionReplay.tsx`) reused by every misconception's feedback screen. |
| **Case framing** | Each task gets a short in-universe label like *"Case file: The Vanishing Line"* shown above the code, in addition to the module/mission title the prompt already specifies. | Costs nothing (one string field), makes tasks feel less like "Question 3 of 6." |

## 3. What earlier drafts proposed that this spec explicitly drops

For anyone comparing against previous versions of this design:
- **No streak counter** (see §2 above — the prompt is right to flag this one).
- **No three-tier "bridge / standard / stretch" transfer-difficulty system.** Replaced by the lighter single-variant-swap in §2's "flow-adaptive transfer retry" row — same underlying idea (don't bore a confident learner), much less content to author.
- **No confidence-calibration message** ("you were overconfident / underconfident"). It's a nice idea in isolation but adds a second layer of feedback on top of the correctness feedback and the articulation box, and the prompt asks explicitly to prioritize a coherent working slice over stacking features. Cut for the prototype; easy to add later if evaluation shows learners want it.

## 4. Tech Stack & Repo Structure

React + TypeScript + Vite. No CSS framework — CSS Modules with a small shared design-token file (colors/fonts from the prompt's §17). Drag interaction via [`@dnd-kit/core`](https://dndkit.com/) (`npm install @dnd-kit/core @dnd-kit/sortable`) — chosen over `react-beautiful-dnd` because it has first-class keyboard support out of the box, which the prompt's accessibility section (§16) requires anyway.

```
exception-flow-lab/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── README.md
├── src/
│   ├── main.tsx
│   ├── App.tsx                       # top-level screen state machine
│   ├── types/
│   │   └── content.ts                # Task, Feedback, LlmSupportResponse, etc. (§5)
│   ├── content/
│   │   ├── modules.ts                # 4 module definitions
│   │   └── module1-trace-execution.ts  # full task content, built first
│   ├── llm/
│   │   └── llmSupportService.ts      # mock-first, swappable interface (§7)
│   ├── state/
│   │   ├── progressStore.ts          # localStorage read/write (§8)
│   │   └── screenReducer.ts          # screen transitions
│   ├── components/
│   │   ├── Welcome.tsx
│   │   ├── ModuleMap.tsx
│   │   ├── ModuleCard.tsx
│   │   ├── CodeBlock.tsx
│   │   ├── TaskRenderer.tsx          # switches on Task.type
│   │   ├── tasks/
│   │   │   ├── ExecutionTraceTask.tsx     # drag + click-fallback ordering
│   │   │   ├── StatementSelectionTask.tsx
│   │   │   ├── CallChainTask.tsx
│   │   │   ├── CatchOrderTask.tsx
│   │   │   ├── HandlerSelectionTask.tsx
│   │   │   └── HandlerRefactoringTask.tsx
│   │   ├── ConfidenceSelector.tsx
│   │   ├── ArticulationBox.tsx       # new, see §2
│   │   ├── FeedbackCard.tsx
│   │   ├── ExecutionReplay.tsx       # new, the animated visualizer, see §2
│   │   ├── AiSupportPanel.tsx
│   │   ├── TransferTaskFlow.tsx
│   │   ├── CompletionScreen.tsx
│   │   └── ConceptJournal.tsx
│   └── styles/
│       ├── tokens.css                # colors/fonts from prompt §17
│       └── *.module.css
└── ...
```

## 5. Data Model

Extends the prompt's §14 types with concrete per-`TaskType` shapes (the prompt leaves `answerOptions`/`correctAnswer` as `unknown`, which isn't buildable as-is — a `TaskRenderer` needs to know exactly what shape to expect per type).

```typescript
// src/types/content.ts

export type ConfidenceLevel = "low" | "medium" | "high";

export type TaskType =
  | "execution_trace"
  | "statement_selection"
  | "call_chain"
  | "catch_order"
  | "handler_selection"
  | "handler_refactoring";

export type SupportType = "hint" | "step_by_step" | "simpler_explanation" | "similar_example";

export interface LlmSupportResponse {
  supportType: SupportType;
  title: string;
  content: string;
  keyRule?: string;
}

export interface Feedback {
  correctTitle: string;
  correctExplanation: string;
  incorrectTitle: string;
  incorrectExplanation: string;
  keyRule: string;
}

// --- Per-task-type answer shapes (concrete, replacing `unknown`) ---

export interface EventCard {
  id: string;
  label: string; // e.g. "`first()` starts"
}

export interface ExecutionTraceData {
  cards: EventCard[];       // shuffled for display
  correctOrder: string[];   // card ids in correct sequence
}

export interface StatementOption {
  id: string;
  label: string;            // a line of code or a short description of a statement
}

export interface StatementSelectionData {
  options: StatementOption[];
  correctSelectedIds: string[]; // ids of statements that DO execute
}

export interface CallChainStep {
  id: string;
  methodName: string;
}

export interface CallChainData {
  steps: CallChainStep[];        // displayed in call order, e.g. start -> first -> second
  correctHandlerStepId: string;  // which step's context actually handles the exception
}

export interface CatchClauseCard {
  id: string;
  label: string; // e.g. "catch (FileNotFoundException e)"
}

export interface CatchOrderData {
  clauses: CatchClauseCard[];    // shuffled
  correctOrder: string[];        // clause ids, most specific first
}

export interface HandlerOption {
  id: string;
  label: string;
  isCorrect: boolean;
  rationale: string; // shown after selection regardless of correctness
}

export interface HandlerSelectionData {
  options: HandlerOption[];
}

export interface RefactorOption {
  id: string;
  label: string;
  code: string;
  isCorrect: boolean;
}

export interface HandlerRefactoringData {
  options: RefactorOption[];
}

export type TaskAnswerData =
  | { type: "execution_trace"; data: ExecutionTraceData }
  | { type: "statement_selection"; data: StatementSelectionData }
  | { type: "call_chain"; data: CallChainData }
  | { type: "catch_order"; data: CatchOrderData }
  | { type: "handler_selection"; data: HandlerSelectionData }
  | { type: "handler_refactoring"; data: HandlerRefactoringData };

export interface Task {
  id: string;
  moduleId: string;
  caseLabel: string;             // e.g. "Case file: The Vanishing Line" — new, see §2
  title: string;
  learningObjective: string;
  misconception: string;
  code: string;
  question: string;
  answer: TaskAnswerData;         // discriminated union, see above
  feedback: Feedback;
  supportContent: Record<SupportType, LlmSupportResponse>;
  articulationPrompt: string;     // new, see §2 — e.g. "Why do you think `second()` never runs?"
  isTransferTask?: boolean;
  transferVariantForHighConfidence?: Task; // new, see §2's "flow-adaptive transfer retry" — optional, only author this once Module 1 is validated
}

export interface Module {
  id: string;
  title: string;
  description: string;
  taskIds: string[]; // first is the diagnostic task, rest are transfer tasks in order
}
```

**Why a discriminated union instead of `unknown`:** `TaskRenderer.tsx` needs to exhaustively switch on `Task.answer.type` to pick the right sub-component (`ExecutionTraceTask`, `CatchOrderTask`, etc.) and get full type-checking on the props it passes down — `unknown` would push a runtime cast into every task component instead of catching mismatches at compile time.

## 6. Module 1 — Full Task Content ("Trace the Execution")

This is the module to build completely before touching anything else.

### 6.1 Diagnostic Task

```typescript
// src/content/module1-trace-execution.ts

const diagnosticTask: Task = {
  id: "m1-diagnostic",
  moduleId: "module-1",
  caseLabel: "Case file: The Vanishing Line",
  title: "Trace the Execution",
  learningObjective: "Understand that a thrown exception skips the remaining statements in the same try block.",
  misconception: "Assuming execution continues with later statements in the same try block after an exception is thrown.",
  code:
`void start() {
    try {
        first();
        second();
        System.out.println("done");
    } catch (SomeException e) {
        System.out.println("error");
    }
}
// Assume first() throws SomeException.`,
  question: "Drag the events into the order they actually occur.",
  answer: {
    type: "execution_trace",
    data: {
      cards: [
        { id: "e1", label: "`first()` starts" },
        { id: "e2", label: "An exception is thrown inside `first()`" },
        { id: "e3", label: "`second()` starts" },
        { id: "e4", label: "\"done\" is printed" },
        { id: "e5", label: "The matching `catch` block runs" },
      ],
      // second() and "done" never happen — the correct sequence has only 3 events
      correctOrder: ["e1", "e2", "e5"],
    },
  },
  feedback: {
    correctTitle: "Correct — you traced the exceptional control flow.",
    correctExplanation: "Once first() throws the exception, Java skips the remaining statements in the try block and executes the matching catch block directly.",
    incorrectTitle: "Not quite — follow the control flow.",
    incorrectExplanation: "When first() throws an exception, Java does not continue with the remaining statements in the same try block. second() and the \"done\" message are skipped entirely. Control moves straight to the matching catch clause.",
    keyRule: "An exception interrupts the remaining statements in the current try block and transfers control to a matching catch clause.",
  },
  supportContent: {
    hint: {
      supportType: "hint",
      title: "A nudge",
      content: "Look at exactly where the exception is thrown. What normally happens to code that comes *after* the point where something goes wrong?",
    },
    step_by_step: {
      supportType: "step_by_step",
      title: "Step by step",
      content: "1. first() runs and throws SomeException.\n2. Java immediately stops executing the try block — it does not finish first()'s remaining code or move on to second().\n3. Java looks for a catch clause matching SomeException.\n4. The catch (SomeException e) block runs and prints \"error\".",
      keyRule: "An exception interrupts the remaining statements in the current try block.",
    },
    simpler_explanation: {
      supportType: "simpler_explanation",
      title: "In simple terms",
      content: "Think of the try block as a checklist. If something goes wrong on one item, Java doesn't keep ticking off the rest of the list — it jumps straight to the \"if something goes wrong\" plan (the catch block).",
    },
    similar_example: {
      supportType: "similar_example",
      title: "A similar example",
      content:
`void checkout() {
    try {
        validateCart();
        chargeCard();
        System.out.println("order placed");
    } catch (PaymentException e) {
        System.out.println("payment failed");
    }
}
// If validateCart() throws PaymentException, chargeCard() and
// "order placed" never run — Java jumps straight to the catch block.`,
    },
  },
  articulationPrompt: "In one sentence — why do you think second() never runs here?",
};
```

### 6.2 Transfer Task (baseline)

```typescript
const transferTaskBaseline: Task = {
  id: "m1-transfer",
  moduleId: "module-1",
  caseLabel: "Case file: The Interrupted Load",
  title: "Trace the Execution — Transfer",
  learningObjective: "Apply the same rule to a new scenario with different method and output names.",
  misconception: "Assuming execution continues with later statements in the same try block after an exception is thrown.",
  code:
`void load() {
    try {
        loadProfile();
        showDashboard();
        System.out.println("ready");
    } catch (IOException e) {
        System.out.println("loading failed");
    }
}
// Assume loadProfile() throws IOException.`,
  question: "Drag the events into the order they actually occur.",
  answer: {
    type: "execution_trace",
    data: {
      cards: [
        { id: "t1", label: "`loadProfile()` starts" },
        { id: "t2", label: "An exception is thrown inside `loadProfile()`" },
        { id: "t3", label: "`showDashboard()` starts" },
        { id: "t4", label: "\"ready\" is printed" },
        { id: "t5", label: "The matching `catch` block runs" },
      ],
      correctOrder: ["t1", "t2", "t5"],
    },
  },
  feedback: {
    correctTitle: "Correct — same rule, new scenario.",
    correctExplanation: "loadProfile() throws before showDashboard() gets a chance to run, so Java jumps straight to the catch block, exactly as before.",
    incorrectTitle: "Check the control flow again.",
    incorrectExplanation: "showDashboard() and \"ready\" never execute — loadProfile()'s exception sends control straight to the catch block, skipping the rest of the try block.",
    keyRule: "An exception interrupts the remaining statements in the current try block and transfers control to a matching catch clause.",
  },
  supportContent: {
    hint: { supportType: "hint", title: "A nudge", content: "Which method call comes right after the one that fails? Does it get a chance to start?" },
    step_by_step: { supportType: "step_by_step", title: "Step by step", content: "1. loadProfile() runs and throws IOException.\n2. Java abandons the rest of the try block immediately.\n3. showDashboard() and the \"ready\" message never run.\n4. The catch (IOException e) block runs and prints \"loading failed\".", keyRule: "An exception interrupts the remaining statements in the current try block." },
    simpler_explanation: { supportType: "simpler_explanation", title: "In simple terms", content: "Same idea as before: once one step in the list fails, Java stops going through the list and jumps to the backup plan." },
    similar_example: { supportType: "similar_example", title: "A similar example", content: "void save() {\n    try {\n        validateInput();\n        writeToDisk();\n        System.out.println(\"saved\");\n    } catch (ValidationException e) {\n        System.out.println(\"save aborted\");\n    }\n}\n// If validateInput() throws, writeToDisk() and \"saved\" never run." },
  },
  articulationPrompt: "In one sentence — what do loadProfile() and first() from before have in common?",
};
```

### 6.3 Transfer Task Variant for High Confidence (optional, author after baseline is validated)

Per §2's "flow-adaptive transfer retry": if the diagnostic was correct and confidence was "high," serve this instead of the baseline — same rule, slightly less obvious because the exception is thrown by a helper call nested one level deeper, requiring a touch more attention:

```typescript
const transferTaskStretch: Task = {
  id: "m1-transfer-stretch",
  moduleId: "module-1",
  caseLabel: "Case file: The Quiet Failure",
  title: "Trace the Execution — A Trickier Case",
  learningObjective: "Apply the same rule when the failing call is less obviously the risky one.",
  misconception: "Assuming execution continues with later statements in the same try block after an exception is thrown.",
  code:
`void processOrder() {
    try {
        System.out.println("checking stock");
        reserveStock();     // throws StockException here
        System.out.println("stock reserved");
        emailReceipt();
        System.out.println("order complete");
    } catch (StockException e) {
        System.out.println("out of stock");
    }
}`,
  question: "Drag the events into the order they actually occur.",
  answer: {
    type: "execution_trace",
    data: {
      cards: [
        { id: "s1", label: "\"checking stock\" is printed" },
        { id: "s2", label: "`reserveStock()` throws StockException" },
        { id: "s3", label: "\"stock reserved\" is printed" },
        { id: "s4", label: "`emailReceipt()` runs" },
        { id: "s5", label: "\"out of stock\" is printed" },
      ],
      correctOrder: ["s1", "s2", "s5"],
    },
  },
  feedback: {
    correctTitle: "Correct — you caught the less obvious case.",
    correctExplanation: "The first println runs fine — the failure is one call later, inside reserveStock(). Everything after that point in the try block, including emailReceipt(), is skipped.",
    incorrectTitle: "Look again at where exactly the exception happens.",
    incorrectExplanation: "\"checking stock\" does print — that line runs before the exception. But once reserveStock() throws, everything after it in the try block is skipped, including \"stock reserved\" and emailReceipt().",
    keyRule: "An exception interrupts the remaining statements in the current try block and transfers control to a matching catch clause — everything before the failing line still runs normally.",
  },
  supportContent: {
    hint: { supportType: "hint", title: "A nudge", content: "Not every line in the try block is equally risky — find the exact line that throws, then think about what comes only before it." },
    step_by_step: { supportType: "step_by_step", title: "Step by step", content: "1. \"checking stock\" prints — this happens before anything risky.\n2. reserveStock() runs and throws StockException.\n3. Java abandons the rest of the try block: \"stock reserved\" and emailReceipt() never happen.\n4. catch (StockException e) runs and prints \"out of stock\".", keyRule: "Everything before the failing line still runs; everything after it in the same try block does not." },
    simpler_explanation: { supportType: "simpler_explanation", title: "In simple terms", content: "The checklist analogy still holds — some items on the list are fine, and then one item fails. Java completes the fine items, then stops at the failure and skips straight to the backup plan." },
    similar_example: { supportType: "similar_example", title: "A similar example", content: "void publishPost() {\n    System.out.println(\"draft saved\");\n    validateContent(); // throws here\n    System.out.println(\"content ok\");\n    notifyFollowers();\n}\n// \"draft saved\" already printed before this snippet's try block starts;\n// once validateContent() throws, everything after it inside the try is skipped." },
  },
  articulationPrompt: "In one sentence — why does \"checking stock\" still print, but \"stock reserved\" doesn't?",
};
```

### 6.4 Module 1 definition

```typescript
export const module1: Module = {
  id: "module-1",
  title: "Trace the Execution",
  description: "What happens after an exception is thrown?",
  taskIds: ["m1-diagnostic", "m1-transfer"], // m1-transfer-stretch is swapped in at runtime, not listed statically
};
```

## 7. `llmSupportService.ts` — Mock-First, Swappable

```typescript
// src/llm/llmSupportService.ts

import type { SupportType, LlmSupportResponse, Task } from "../types/content";

export interface LlmSupportService {
  getSupport(task: Task, supportType: SupportType): Promise<LlmSupportResponse>;
}

// --- Mock implementation for the prototype ---
// Reads directly from the task's authored supportContent — no network call, no latency,
// no cost. This is what ships in the first version.
export const mockLlmSupportService: LlmSupportService = {
  async getSupport(task, supportType) {
    return task.supportContent[supportType];
  },
};

// --- Where a live LLM API integration goes later ---
// Replace the export below with a real implementation matching this same interface.
// IMPORTANT: never put an API key directly in frontend code shipped to users; if a live
// integration is added, either (a) restrict the key's spending limit and accept the
// tradeoff for a non-public prototype deployment, or (b) add a minimal backend proxy
// that holds the key server-side. See the README's "Live LLM integration" section.
//
// export const liveLlmSupportService: LlmSupportService = {
//   async getSupport(task, supportType) {
//     const response = await fetch("https://api.anthropic.com/v1/messages", { ... });
//     // parse response into LlmSupportResponse shape
//   },
// };

export const llmSupportService: LlmSupportService = mockLlmSupportService;
```

`AiSupportPanel.tsx` calls `llmSupportService.getSupport(task, supportType)` and awaits it (even though the mock resolves instantly, keeping this async means swapping in a real API later requires zero changes to the component).

## 8. `ExecutionTraceTask.tsx` — Drag + Click Fallback

The prompt requires (§16) that no interaction depend solely on drag-and-drop. Implementation:

- Use `@dnd-kit/sortable` for the draggable list of event cards.
- Alongside dragging, every card also has ▲/▼ buttons (visible, not just on focus) that move it up/down one position — fully keyboard- and click-operable, no drag required.
- The learner builds an ordered list from the shuffled `cards`; submit is enabled once the learner has explicitly confirmed an order (a "This is my order" button), not just on any interaction.
- Checking correctness: compare the *ordered list of card ids the learner kept* against `correctOrder` — cards the learner correctly excludes/discards (see below) matter too.

**Design decision for the skip-detection mechanic:** since `correctOrder` in Module 1 deliberately excludes some cards (e.g. `e3`, `e4` — the skipped events), the interaction needs a way to mark cards as "this doesn't happen" rather than only reordering. Implementation: below the draggable "sequence" list, add a second, always-visible drop zone (or, for the click fallback, a toggle button per card) labeled **"Doesn't happen"**. The learner sorts cards into either the sequence or that zone. This directly teaches the concept through the interaction itself — sorting "does this happen at all" is the actual skill Module 1 is testing, not just "what order."

## 9. `ExecutionReplay.tsx` — The Animated Visualizer

Shown on the Feedback screen, directly under the `keyRule` card. Reuses `task.code` (already displayed in `CodeBlock`), and does not require re-fetching or duplicating content.

Behavior:
1. On mount, briefly highlights each line of the try block in sequence (subtle background color transition, ~400ms per line), from the top of `try` down to the line that throws.
2. At the throwing line, show a short animated arrow/motion transitioning focus from that line down to the matching `catch` clause — this is the one moment worth a slightly more noticeable transition, since it's the crux of the misconception.
3. Lines after the throw point, within the same try block, are shown dimmed/greyed rather than highlighted, with a small "skipped" label — directly visualizing the misconception being corrected.
4. Respects `prefers-reduced-motion`: if set, skip straight to the final highlighted/dimmed state with no animation, per accessibility guidance in the prompt's §16.

This is intentionally kept as one reusable component driven by two pieces of data already available on the `Task`: the code text and the `correctOrder`/skip information already encoded in `answer.data`. No new authored content is required per task — the component derives line ranges from matching the card labels' referenced method calls against the code string, or (simpler and much more robust to build first) each `Task` additionally carries a small `replayScript` describing which lines to highlight/dim/skip in order:

```typescript
// Add to Task in types/content.ts:
export interface ReplayStep {
  lineNumber: number;   // 1-indexed line in `code`
  state: "active" | "throws" | "skipped" | "handled";
}
export interface Task {
  // ...all fields from §5...
  replayScript: ReplayStep[];
}
```

Authoring `replayScript` by hand per task (rather than trying to infer it automatically) is the pragmatic choice for a prototype with a handful of tasks — infer-from-code parsing would be significant extra engineering for no real benefit at this scale.

## 10. State & Progress (localStorage)

```typescript
// src/state/progressStore.ts

export interface TaskProgress {
  taskId: string;
  completed: boolean;
  selectedAnswer: unknown;       // the learner's submitted TaskAnswerData payload
  wasCorrect: boolean;
  confidence: ConfidenceLevel;
  articulationText?: string;
  supportRequested: SupportType[]; // in the order requested, empty if skipped
}

export interface ModuleProgress {
  moduleId: string;
  state: "not_started" | "in_progress" | "completed";
  taskProgress: TaskProgress[];
}

export interface AppProgress {
  modules: ModuleProgress[];
}

const STORAGE_KEY = "exception-flow-lab-progress";

export function loadProgress(): AppProgress { /* JSON.parse(localStorage...) with safe default */ }
export function saveProgress(progress: AppProgress): void { /* JSON.stringify + localStorage.setItem */ }
export function resetProgress(): void { localStorage.removeItem(STORAGE_KEY); }
```

`ConceptJournal.tsx` reads directly from `AppProgress` — no separate data store needed, since everything the journal shows (completion state, key rule, misconception addressed) is derivable from `ModuleProgress` plus the static `content/modules.ts` data.

## 11. Style Tokens

```css
/* src/styles/tokens.css */
:root {
  --color-bg: #fafaf9;
  --color-surface: #ffffff;
  --color-primary: #2b2470;       /* deep violet, primary actions */
  --color-accent: #0f9b8e;        /* teal, secondary accents */
  --color-attention: #e8a33d;     /* warm yellow, hints only */
  --color-error: #c65b5b;         /* soft red, feedback only, never sole indicator */
  --color-text: #1c1c1e;
  --color-text-muted: #6b6b70;
  --font-body: "Inter", system-ui, sans-serif;
  --font-code: "JetBrains Mono", ui-monospace, monospace;
  --radius-card: 12px;
  --shadow-card: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
}
```

## 12. Build Order (concrete steps)

1. Scaffold repo (§4), install `@dnd-kit` packages, add `tokens.css`.
2. Implement types (§5) and `module1-trace-execution.ts` with the diagnostic task only (§6.1) — no transfer task yet.
3. Build `App.tsx` screen state machine covering: Welcome → Module Map → Task (diagnostic) → Feedback (with `ExecutionReplay`) → AI Support Panel → Completion. Skip Transfer and Concept Journal in this pass.
4. Get `ExecutionTraceTask.tsx` working with both drag and click-fallback controls before moving on — this is the highest-risk component to get right.
5. Wire in `llmSupportService` (mock) and confirm all four support types render correctly and unlock in sequence.
6. Add the transfer task (§6.2) and `TransferTaskFlow.tsx`, including the one-retry-on-wrong-answer behavior from the prompt's §11.
7. Add `ConceptJournal.tsx` and `progressStore.ts` persistence.
8. Only once all of the above works end-to-end for Module 1: add the high-confidence transfer variant (§6.3) and the flow-adaptive swap logic.
9. Only then replicate the architecture for Modules 2–4, reusing every shared component as-is.

## 13. README Contents (to generate alongside the code)

Must cover, per the prompt's §18:
- Install (`npm install`) and run (`npm run dev`) instructions.
- Where task data lives (`src/content/*.ts`) and how to add a new task/module.
- Where live LLM API integration belongs (`src/llm/llmSupportService.ts`, see §7 above) and why: keeps every component that calls it agnostic to mock-vs-live.
- Why API keys must never be committed to frontend code: a client-side bundle is fully readable by anyone who opens dev tools; if a live integration is added later, either restrict the key's spending limit for a non-public deployment, or add a thin backend proxy — this tradeoff should be a conscious decision, not an accident.
- How to reset progress (the localStorage reset function, exposed via a footer button per the prompt's §15).
