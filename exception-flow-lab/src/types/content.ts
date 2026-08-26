// src/types/content.ts
//
// Core data model for Exception Flow Lab. Extends the shapes from the
// build prompt's data-model section with concrete per-TaskType answer
// shapes, since a TaskRenderer needs to know exactly what to expect per
// type instead of working against `unknown`.

export type ConfidenceLevel = "low" | "medium" | "high";

export type TaskType =
  | "execution_trace"
  | "statement_selection"
  | "call_chain"
  | "catch_order"
  | "single_choice"
  | "handler_selection"
  | "handler_refactoring";

export type SupportType = "hint" | "step_by_step" | "simpler_explanation" | "similar_example";

// Order in which the AI Support Panel's buttons unlock.
export const SUPPORT_TYPE_ORDER: SupportType[] = [
  "hint",
  "step_by_step",
  "simpler_explanation",
  "similar_example",
];

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
  // Optional rule-based override for the incorrect-answer explanation,
  // computed from the learner's actual submitted response instead of always
  // showing the same static `incorrectExplanation` string. Still 100%
  // predefined/hand-authored logic (never LLM-generated) — see
  // module1-trace-execution.ts's diagnosticTask for the one task that
  // currently supplies this. Falls back to `incorrectExplanation` when
  // omitted, so every other task is unaffected.
  getIncorrectExplanation?: (response: TaskResponseData) => string;
}

// --- Per-task-type answer shapes (concrete, replacing `unknown`) ---

export interface EventCard {
  id: string;
  label: string; // e.g. "`first()` starts"
}

export interface ExecutionTraceData {
  cards: EventCard[]; // shuffled for display
  correctOrder: string[]; // card ids in correct sequence; ids not listed here "don't happen"
}

export interface StatementOption {
  id: string;
  label: string; // a line of code or a short description of a statement
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
  steps: CallChainStep[]; // displayed in call order, e.g. start -> first -> second
  correctHandlerStepId: string; // which step's context actually handles the exception
}

export interface CatchClauseCard {
  id: string;
  label: string; // e.g. "catch (FileNotFoundException e)"
}

export interface CatchOrderData {
  clauses: CatchClauseCard[]; // shuffled
  correctOrder: string[]; // clause ids, most specific first
}

export interface SingleChoiceOption {
  id: string;
  label: string; // may contain `inline code`, rendered via InlineCode
}

// A plain single-select question with no per-option reveal — correctness is
// decided and shown only on the Feedback screen, same as every other task
// type. Distinct from HandlerSelectionData below: that shape's component
// reveals a rationale per option immediately on selection (built for a
// different, not-yet-authored flow), which would leak correctness before
// the confidence step. Use this whenever a task just needs "pick one of N
// options, then see feedback the normal way" — e.g. Case 2's "does this
// code compile?" transfer task.
export interface SingleChoiceData {
  options: SingleChoiceOption[];
  correctOptionId: string;
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
  | { type: "single_choice"; data: SingleChoiceData }
  | { type: "handler_selection"; data: HandlerSelectionData }
  | { type: "handler_refactoring"; data: HandlerRefactoringData };

// --- Learner's submitted response, mirrors TaskAnswerData per type ---

export type TaskResponseData =
  | { type: "execution_trace"; sequence: string[] } // card ids the learner placed in the "happens" list, in order
  | { type: "statement_selection"; selectedIds: string[] }
  | { type: "call_chain"; selectedStepId: string }
  | { type: "catch_order"; order: string[] } // clause ids in the learner's chosen order
  | { type: "single_choice"; selectedOptionId: string }
  | { type: "handler_selection"; selectedOptionId: string }
  | { type: "handler_refactoring"; selectedOptionId: string };

// --- Live control-flow visualizer (Feedback screen) ---

export type ReplayLineState = "active" | "throws" | "skipped" | "handled";

export interface ReplayStep {
  lineNumber: number; // 1-indexed line in `code`
  state: ReplayLineState;
  // Optional override for the line's badge text (CodeBlock/ExecutionReplay),
  // shown instead of the generic per-state label (e.g. "throws here"). Use
  // this when the generic label would be ambiguous about *what* actually
  // throws — e.g. a line reading `first();` throwing is really "first()
  // throws", not "this line contains a throw statement".
  badgeLabel?: string;
}

// A class hierarchy shown as task information, entirely separate from any
// code block (never spliced into the code itself or a trailing comment).
// Ordered most general first: depth 0 is the root, and depth increases by 1
// per level toward the most specific type. Rendered by ExceptionHierarchy
// as a small indented list with a heading, e.g.
//   Exception hierarchy
//   `Exception`
//   ↳ `IOException`
//     ↳ `FileNotFoundException`
export interface HierarchyNode {
  label: string; // a class name, e.g. "FileNotFoundException" — rendered as code
  depth: number;
}

export interface Task {
  id: string;
  moduleId: string;
  caseLabel: string; // e.g. "Case file: The Vanishing Line"
  title: string;
  learningObjective: string;
  misconception: string;
  code: string;
  question: string;
  answer: TaskAnswerData; // discriminated union
  feedback: Feedback;
  supportContent: Record<SupportType, LlmSupportResponse>;
  articulationPrompt: string; // e.g. "Why do you think `second()` never runs?"
  // Drives ExecutionReplay, authored by hand per task. Optional and omitted
  // entirely for tasks that aren't runtime control-flow traces (e.g. a
  // catch_order task tests a static/compile-time rule — there's nothing to
  // "replay"). Use `hasReplayScript(task)` rather than checking
  // `.length > 0` ad hoc at call sites.
  replayScript?: ReplayStep[];
  // The "solved" version of `code`, authored by hand, shown on the Feedback
  // screen instead of the plain `code` for tasks with no replayScript (a
  // runtime trace already shows the resolution via ExecutionReplay; a static
  // task like catch_order needs this instead, or the Feedback screen would
  // just re-show the same unfinished snippet with its "fill this in" comment
  // still sitting there unresolved). Falls back to `code` when omitted.
  resolvedCode?: string;
  // Shown below the code (see hasReplayScript comment above) as task
  // information, not Java syntax — e.g. Case 2's "which exception types are
  // related, and how" context. Optional; most tasks (e.g. every Module 1
  // task) omit it entirely.
  hierarchy?: HierarchyNode[];
  isTransferTask?: boolean;
  transferVariantForHighConfidence?: Task; // swapped in for the "flow-adaptive transfer retry", see build spec §2
  // Served on the one allowed transfer retry (spec §11) when *this exact
  // task* was just answered incorrectly — lets the retry test the same rule
  // through a differently-shaped question instead of literally repeating
  // itself. Distinct from transferVariantForHighConfidence above: that field
  // is keyed off a *correct, high-confidence first attempt* (a trigger this
  // module may not use); this one only ever appears after a wrong answer.
  // See getComparableRetryTask in content/modules.ts for how the two combine.
  retryVariant?: Task;
}

/** Canonical, reused title per SupportType — content files reference this
 * instead of retyping "A nudge" / "Step by step" / etc. per task, so a
 * wording change can't drift between tasks. */
export const SUPPORT_TITLES: Record<SupportType, string> = {
  hint: "A nudge",
  step_by_step: "Step by step",
  simpler_explanation: "In simple terms",
  similar_example: "A similar example",
};

/** True when a replayScript is non-empty and worth animating. Centralizes the
 * "does this task have a runtime replay" check so callers don't each
 * reimplement `.length > 0` (and so `undefined` and `[]` are treated the
 * same). Takes the array directly (not a `Task`) so calling it on a plain
 * local variable — `hasReplayScript(replayScript)` — actually narrows that
 * variable's type in the branch that follows; wrapping it in a fresh object
 * literal would not. */
export function hasReplayScript(replayScript: ReplayStep[] | undefined): replayScript is ReplayStep[] {
  return Boolean(replayScript && replayScript.length > 0);
}

export interface Module {
  id: string;
  title: string;
  description: string;
  taskIds: string[]; // first is the diagnostic task, rest are transfer tasks in order
  available: boolean; // false for modules whose content hasn't been authored yet
}

/** Type guard so a component can narrow `answer`/`response` pairs safely. */
export function isTaskType<T extends TaskType>(
  answer: TaskAnswerData,
  type: T
): answer is Extract<TaskAnswerData, { type: T }> {
  return answer.type === type;
}
