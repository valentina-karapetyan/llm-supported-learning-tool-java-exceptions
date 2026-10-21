// src/content/modules.ts
//
// Module definitions + a content lookup. All five modules now have
// authored task content.
//
// Modules 1-4 share one flow (diagnostic → feedback → transfer → completion,
// with one allowed retry). Module 5 is a consolidation module and runs a
// different one — CASE 1 → CASE 2 → CASE 3 → COMPLETE — declared via
// `flow: "mixed_practice"` and served by the mixed-practice helpers at the
// bottom of this file. Nothing about Modules 1-4 changes as a result: the
// `flow` field defaults to "diagnostic_transfer" when omitted.

import type { Module, Task } from "../types/content";
import { module1Tasks } from "./module1-trace-execution";
import { module2Tasks } from "./module2-catch-order";
import { module3Tasks } from "./module3-call-chains";
import { module4Tasks } from "./module4-designing-handlers";
import { module5Tasks } from "./module5-mixed-practice";

// Re-exported so App.tsx (and anything else) can pull every content lookup
// — task, module, and now retrieval question — from this one module.
export { getRetrievalQuestion } from "./retrievalQuestions";

export const module1: Module = {
  id: "module-1",
  title: "Trace the Execution",
  description: "What happens after an exception is thrown?",
  // m1-transfer-stretch is served on the one allowed transfer retry, not
  // listed statically — see retryVariant.
  taskIds: ["m1-diagnostic", "m1-transfer"],
  available: true,
};

export const module2: Module = {
  id: "module-2",
  title: "Catch Order & Specificity",
  description: "Which `catch` clause actually runs when several could match?",
  taskIds: ["m2-diagnostic", "m2-transfer"],
  available: true,
};

export const module3: Module = {
  id: "module-3",
  title: "Call Chains & Propagation",
  description: "Where does an uncaught exception actually get handled?",
  // m3-transfer-retry is served on the one allowed transfer retry, not
  // listed statically — see retryVariant.
  taskIds: ["m3-diagnostic", "m3-transfer"],
  available: true,
};

export const module4: Module = {
  id: "module-4",
  title: "Designing Handlers",
  description: "Choosing and refactoring exception-handling strategies.",
  // m4-transfer-retry is served on the one allowed transfer retry, not
  // listed statically — see retryVariant.
  taskIds: ["m4-diagnostic", "m4-transfer"],
  available: true,
};

// Module 5 authors no `keyRule` on any task (it introduces no new theory),
// so its completion screen can't derive a summary the way Modules 1-4's does
// — it supplies one instead. See ModuleCompletionSummary in types/content.ts.
export const module5: Module = {
  id: "module-5",
  title: "Mixed Case Review",
  description: "Three short cases that combine the rules from the earlier lessons.",
  // Every id here is one mixed case, answered once, in order. Case 3 runs
  // over two tasks (Part A, Part B) sharing one case file — the CaseNav
  // trail groups them via each task's `mixedCase.trailLabel`.
  taskIds: ["m5-case-1", "m5-case-2", "m5-case-3a", "m5-case-3b"],
  available: true,
  flow: "mixed_practice",
  completion: {
    eyebrow: "Mixed practice complete",
    title: "Integrated Exception Reasoning Complete",
    lede: "Three cases, no labels telling you which rule applied. Here's what you were combining:",
    points: [
      "Exceptions can interrupt the remaining statements in a `try` block.",
      "Uncaught exceptions propagate through the active call chain.",
      "Compatible handlers are determined by the exception hierarchy.",
      "Propagation stops at the first compatible handler encountered.",
      "Handler design should match whether related exceptions need shared or different reactions.",
    ],
    primaryActionLabel: "Back to lessons",
  },
};

export const modules: Module[] = [module1, module2, module3, module4, module5];

const allTasks: Task[] = [...module1Tasks, ...module2Tasks, ...module3Tasks, ...module4Tasks, ...module5Tasks];

export function getModuleById(moduleId: string): Module | undefined {
  return modules.find((m) => m.id === moduleId);
}

export function getTaskById(taskId: string): Task | undefined {
  return allTasks.find((t) => t.id === taskId);
}

/** The diagnostic task is always taskIds[0]. */
export function getDiagnosticTask(module: Module): Task | undefined {
  return getTaskById(module.taskIds[0]);
}

/** The transfer task is always taskIds[1] — a module's one baseline
 * transfer task. (Module 1's harder "stretch" variant is no longer swapped
 * in up front based on confidence; it's served only as the comparable
 * retry case — see getComparableRetryTask below.) */
export function getTransferTask(module: Module): Task | undefined {
  return getTaskById(module.taskIds[1]);
}

/**
 * The task served on the one allowed transfer retry (spec §11), after the
 * baseline transfer task was answered incorrectly — whatever `retryVariant`
 * that task authored, so the retry tests the same rule through a
 * differently-shaped (or at least fresh) question instead of literally
 * repeating itself.
 *
 * Modules that haven't authored a `retryVariant` just return undefined
 * here, and the caller's fallback re-serves the same task on retry. Not a
 * bug — a module that hasn't gotten that optional refinement.
 */
export function getComparableRetryTask(justAttempted: Task): Task | undefined {
  return justAttempted.retryVariant;
}

// --- Mixed-practice flow (Module 5) ---
//
// Deliberately kept beside getDiagnosticTask/getTransferTask rather than
// folded into them: the two flows answer different questions ("which stage
// of this one case file am I on" vs. "which case in this sequence am I on"),
// and collapsing them would have meant weakening the diagnostic/transfer
// helpers' guarantees for no gain.

export function isMixedPracticeModule(module: Module): boolean {
  return module.flow === "mixed_practice";
}

/** Every case of a mixed-practice module, in authored order. */
export function getMixedCaseTasks(module: Module): Task[] {
  return module.taskIds.map(getTaskById).filter((t): t is Task => Boolean(t));
}

/** The case served after `currentTaskId`, or undefined when it was the last
 * one — which is how the caller knows to go to the completion screen. */
export function getNextMixedCaseTask(module: Module, currentTaskId: string): Task | undefined {
  const tasks = getMixedCaseTasks(module);
  const index = tasks.findIndex((t) => t.id === currentTaskId);
  if (index < 0) return undefined;
  return tasks[index + 1];
}

/** The CaseNav trail for a mixed-practice module: one step per distinct
 * `mixedCase.trailLabel`, so Case 3's Part A and Part B collapse into a
 * single "Case 3" step instead of showing up twice. Returns undefined for
 * a module whose tasks don't author mixed-case metadata, so the nav simply
 * falls back to the plain back-link. */
export function getMixedCaseTrail(module: Module, currentTaskId: string): { labels: string[]; currentIndex: number } | undefined {
  const tasks = getMixedCaseTasks(module);
  const labels: string[] = [];
  for (const task of tasks) {
    const label = task.mixedCase?.trailLabel;
    if (label && !labels.includes(label)) labels.push(label);
  }
  const currentLabel = tasks.find((t) => t.id === currentTaskId)?.mixedCase?.trailLabel;
  const currentIndex = currentLabel ? labels.indexOf(currentLabel) : -1;
  if (labels.length === 0 || currentIndex < 0) return undefined;
  return { labels, currentIndex };
}
