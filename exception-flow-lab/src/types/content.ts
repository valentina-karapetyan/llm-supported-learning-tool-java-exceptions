// src/types/content.ts
//
// Core data model for Exception Flow Lab. Extends the shapes from the
// build prompt's data-model section with concrete per-TaskType answer
// shapes, since a TaskRenderer needs to know exactly what to expect per
// type instead of working against `unknown`.

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
  // Optional: the "Key rule" card on the Feedback screen. Modules 1-4 all
  // author one — each of those tasks teaches a rule for the first time.
  // Module 5 (mixed practice) deliberately omits it: it introduces no new
  // theory, so restating a rule card there would turn retrieval practice
  // back into instruction. FeedbackCard/ConceptJournal/CompletionScreen all
  // skip the card entirely when it's absent.
  keyRule?: string;
  // Optional rule-based override for the incorrect-answer explanation,
  // computed from the learner's actual submitted response instead of always
  // showing the same static `incorrectExplanation` string. Still 100%
  // predefined/hand-authored logic (never LLM-generated) — see
  // module1-trace-execution.ts's diagnosticTask for the one task that
  // currently supplies this. Falls back to `incorrectExplanation` when
  // omitted, so every other task is unaffected.
  getIncorrectExplanation?: (response: TaskResponseData) => string;
  // Same idea as getIncorrectExplanation, but for the banner *title* —
  // Module 3's diagnostic/retry tasks show a different headline depending
  // on *which* wrong option was picked (e.g. "throwing and handling are
  // separate steps" vs. "look at the type relationship"), not just a
  // different explanation under one fixed headline. Falls back to
  // `incorrectTitle` when omitted.
  getIncorrectTitle?: (response: TaskResponseData) => string;
  // A one-time glossary aside (build spec §3), shown on FeedbackCard near
  // the Key Rule card only when present. Authored on exactly two tasks in
  // the whole app: m2-diagnostic (the first time "handler" is used at all —
  // Module 1 never uses the word) and m3-diagnostic (the first time
  // "compatible handler" specifically needs defining). Not baked into
  // `keyRule` itself, since several tasks in the same module reuse one
  // `keyRule` string verbatim — that would repeat the definition every time
  // instead of showing it exactly once.
  glossaryNote?: { term: string; definition: string };
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
// the Feedback screen. Use this whenever a task just needs "pick one of N
// options, then see feedback the normal way" — e.g. Case 2's "does this
// code compile?" transfer task.
export interface SingleChoiceData {
  options: SingleChoiceOption[];
  correctOptionId: string;
  // Overrides SingleChoiceTask's default "Submit answer" label — e.g.
  // Module 3's diagnostic uses "Check my answer" instead. Optional so every
  // existing single_choice task (all of Module 2) keeps the default.
  submitLabel?: string;
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

// --- Case 3: call-chain trail + propagation trace (presentational only) ---
//
// Neither of these is an answer type — Module 3 answers via single_choice,
// same as Module 2's transfer task. These just give the learner (trail,
// pre-answer) and then the Feedback screen (trace, post-answer) a visual of
// the call chain itself, which per-line code highlighting can't show since
// propagation crosses method boundaries.

export interface CallChainTrailStep {
  methodName: string; // e.g. "readProfileFile()"
  // Marks where the exception originates. Never marks where it's handled —
  // figuring that out is the whole point of the task.
  isOrigin?: boolean;
}

export type PropagationStepStatus = "throws" | "propagates" | "handled" | "uncaught";

export interface PropagationStep {
  methodName: string; // e.g. "readProfileFile()"
  detail: string; // e.g. "throws FileNotFoundException", "no handler — propagates"
  status: PropagationStepStatus;
}

// --- Module 5 (mixed practice) only ---
//
// Modules 1-4 run one shape: diagnostic → feedback → transfer → completion,
// where "which stage am I on" is enough to drive the UI. Module 5 runs
// CASE 1 → CASE 2 → CASE 3 → COMPLETE instead: a flat sequence of short
// mixed cases, each answered once and immediately followed by its own
// feedback, with no confidence step, no reflection step and no retry. These
// three fields are the only extra information that flow needs, grouped into
// one optional object rather than three loose optional fields on `Task`.
export interface MixedCaseMeta {
  // Groups the tasks belonging to one case under a single step in the
  // CaseNav trail — Case 3's Part A and Part B share "Case 3", so the trail
  // reads "Case 1 → Case 2 → Case 3", not "… → Case 3 → Case 3".
  trailLabel: string;
  // Feedback-screen button label for continuing out of this case, e.g.
  // "Continue to Case 2" / "Continue to Part B" / "See the summary".
  // Authored per task so the copy can be honest about what actually comes
  // next instead of a generic "Continue".
  continueLabel: string;
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
  // Drives ExecutionReplay, authored by hand per task. Optional and omitted
  // entirely for tasks that aren't runtime control-flow traces (e.g. a
  // catch_order task tests a static/compile-time rule — there's nothing to
  // "replay"). Use `hasReplayScript(task)` rather than checking
  // `.length > 0` ad hoc at call sites.
  replayScript?: ReplayStep[];
  // Overrides the callout ExecutionReplay fades in under the code at the
  // throw -> catch moment. The default ("control jumps straight to the
  // matching catch clause") describes a jump inside one method, which is
  // right for Module 1 but understates what happens when the exception
  // crosses method boundaries first — Module 5's Case 1 names the
  // propagation instead. Rendered through InlineCode, so `code spans` work.
  replayCallout?: string;
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
  // Case 3's "start() → loadProfile() → readProfileFile()" visual, shown
  // above the question (CallChainTrail component). Optional; omitted by
  // every task outside Module 3.
  callChainTrail?: CallChainTrailStep[];
  // Case 3's main Feedback-screen visualization (PropagationReplay
  // component): an animated vertical trace of the exception moving up the
  // call chain to wherever it's handled. Takes priority over the
  // hasReplayScript/resolvedCode fallback in FeedbackCard when present —
  // see that component's branch order.
  propagationTrace?: PropagationStep[];
  // A short, content-authored sentence shown right under the title while
  // the task is still being answered — orients the learner to the kind of
  // interaction this is, without explaining the underlying rule. Generic
  // successor to the module-1/module-2 hardcoded showIntro/
  // showCatchOrderIntro conditionals in TaskScreen.tsx; new modules
  // (starting with Module 3) should prefer this field over adding another
  // hardcoded per-module conditional there.
  orientationNote?: string;
  // Set only by Module 5's mixed-practice tasks (see MixedCaseMeta above).
  // Absent everywhere else, which is also how App.tsx tells a mixed case
  // apart from a diagnostic/transfer task when rendering its chrome.
  mixedCase?: MixedCaseMeta;
  isTransferTask?: boolean;
  // Served on the one allowed transfer retry (spec §11) when *this exact
  // task* was just answered incorrectly — lets the retry test the same rule
  // through a differently-shaped question instead of literally repeating
  // itself. See getComparableRetryTask in content/modules.ts.
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

/** How a module's screens are sequenced.
 *  - "diagnostic_transfer" (default): Modules 1-4's flow — taskIds[0] is the
 *    diagnostic, taskIds[1] the transfer task, with one allowed retry.
 *  - "mixed_practice": Module 5's flow — every entry in taskIds is one short
 *    mixed case, answered once, each immediately followed by its own
 *    feedback screen, then straight on to the next case. No retry. */
export type ModuleFlow = "diagnostic_transfer" | "mixed_practice";

/** Hand-authored copy for a module's completion screen, used instead of the
 *  default "here are the key rules you collected" derivation. Module 5 needs
 *  this because its tasks deliberately author no `keyRule` (it introduces no
 *  new theory), so there'd be nothing to derive — and because a consolidation
 *  module's summary is a written recap, not a list of per-task rules. */
export interface ModuleCompletionSummary {
  eyebrow?: string; // overrides the default "Module complete"
  title: string;
  lede?: string;
  points: string[]; // rendered through InlineCode, same as derived key rules
  primaryActionLabel?: string; // overrides the default "Back to case files"
}

export interface Module {
  id: string;
  title: string;
  description: string;
  // For "diagnostic_transfer": first is the diagnostic task, rest are
  // transfer tasks in order. For "mixed_practice": every case, in order.
  taskIds: string[];
  available: boolean; // false for modules whose content hasn't been authored yet
  flow?: ModuleFlow; // defaults to "diagnostic_transfer" when omitted
  completion?: ModuleCompletionSummary;
}

// --- Retrieval Practice (every module, after the final task, before
// completion) ---
//
// One open-recall question per module, shown on its own screen between the
// module's last feedback (Modules 1-4's transfer feedback, Module 5's last
// mixed case) and its completion screen. Deliberately free-text, not
// multiple-choice — the point is active recall, not recognition.
//
// The four fields below are 100% hand-authored and predefined, same as every
// other piece of "correctness" content in this app (Feedback.keyRule,
// HandlerOption.isCorrect, etc.). They exist now so a future LLM integration
// has something fixed to compare the learner's answer against — the LLM's
// job will only ever be to compare and explain, never to invent what counts
// as correct or decide what the learner was supposed to learn. See
// RetrievalComparisonResult below and retrievalComparisonService.ts.
export interface RetrievalQuestion {
  id: string;
  moduleId: string;
  question: string; // may contain `inline code`, rendered via InlineCode
  referenceAnswer: string; // never shown to the learner before they submit
  requiredConcepts: string[];
  commonMisconceptions: string[];
}

/** The shape the live LLM-backed comparison returns (see
 *  retrievalComparisonService.ts) — deliberately NOT a grade. There is no
 *  overall verdict/score/pass-fail field anywhere in this shape (build spec
 *  §12 explicitly forbids assigning one to retrieval-practice explanations):
 *  each required concept is classified independently, and the learner sees
 *  a formative suggestion, never a judgment on the explanation as a whole.
 *  `retrievalComparisonService.compare()` wraps this in a `RetrievalCheckOutcome`
 *  so "not evaluated" (no key configured) and "evaluation failed" are never
 *  confused with each other or with a real result. */
export type CriterionStatus = "addressed" | "partly_addressed" | "missing";

export interface RetrievalCriterionAssessment {
  concept: string; // one of the question's requiredConcepts, verbatim
  status: CriterionStatus;
}

export interface RetrievalComparisonResult {
  criteria: RetrievalCriterionAssessment[]; // one entry per requiredConcepts item, same order
  potentialInaccuracies: string[]; // subset of commonMisconceptions the learner's answer actually shows signs of
  improvementSuggestion: string; // "What to improve" — one concise, formative suggestion
}

/** Type guard so a component can narrow `answer`/`response` pairs safely. */
export function isTaskType<T extends TaskType>(
  answer: TaskAnswerData,
  type: T
): answer is Extract<TaskAnswerData, { type: T }> {
  return answer.type === type;
}
