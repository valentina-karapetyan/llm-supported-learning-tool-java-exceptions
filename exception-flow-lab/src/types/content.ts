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

// --- Learner's submitted response, mirrors TaskAnswerData per type ---

export type TaskResponseData =
  | { type: "execution_trace"; sequence: string[] } // card ids the learner placed in the "happens" list, in order
  | { type: "statement_selection"; selectedIds: string[] }
  | { type: "call_chain"; selectedStepId: string }
  | { type: "catch_order"; order: string[] } // clause ids in the learner's chosen order
  | { type: "handler_selection"; selectedOptionId: string }
  | { type: "handler_refactoring"; selectedOptionId: string };

// --- Live control-flow visualizer (Feedback screen) ---

export type ReplayLineState = "active" | "throws" | "skipped" | "handled";

export interface ReplayStep {
  lineNumber: number; // 1-indexed line in `code`
  state: ReplayLineState;
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
  replayScript: ReplayStep[]; // drives ExecutionReplay, authored by hand per task
  isTransferTask?: boolean;
  transferVariantForHighConfidence?: Task; // swapped in for the "flow-adaptive transfer retry", see build spec §2
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
