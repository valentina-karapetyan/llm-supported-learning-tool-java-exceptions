// src/content/modules.ts
//
// Module definitions + a content lookup. Modules 1 and 2 have authored task
// content; 3 and 4 are listed as locked/"coming soon" placeholders on the
// Module Map so the screen's shape is right, without inventing task content
// that hasn't been authored or validated yet.

import type { Module, Task } from "../types/content";
import { diagnosticTask, transferTaskBaseline, module1Tasks } from "./module1-trace-execution";
import { module2Tasks } from "./module2-catch-order";

export const module1: Module = {
  id: "module-1",
  title: "Trace the Execution",
  description: "What happens after an exception is thrown?",
  // m1-transfer-stretch is swapped in at runtime for high-confidence learners,
  // not listed statically — see transferVariantForHighConfidence.
  taskIds: ["m1-diagnostic", "m1-transfer"],
  available: true,
};

export const module2: Module = {
  id: "module-2",
  title: "Catch Order & Specificity",
  description: "Which catch clause actually runs when several could match?",
  taskIds: ["m2-diagnostic", "m2-transfer"],
  available: true,
};

const module3Placeholder: Module = {
  id: "module-3",
  title: "Call Chains & Propagation",
  description: "Where does an uncaught exception actually get handled?",
  taskIds: [],
  available: false,
};

const module4Placeholder: Module = {
  id: "module-4",
  title: "Designing Handlers",
  description: "Choosing and refactoring exception-handling strategies.",
  taskIds: [],
  available: false,
};

export const modules: Module[] = [module1, module2, module3Placeholder, module4Placeholder];

const allTasks: Task[] = [...module1Tasks, ...module2Tasks];

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

/**
 * Resolves the transfer task to serve for a module, applying the
 * flow-adaptive swap: if the diagnostic was answered correctly with "high"
 * confidence, serve the more interesting variant instead of the baseline.
 */
export function getTransferTask(module: Module, diagnosticHighConfidenceCorrect: boolean): Task | undefined {
  const baseline = getTaskById(module.taskIds[1]);
  if (!baseline) return undefined;
  if (diagnosticHighConfidenceCorrect && baseline.transferVariantForHighConfidence) {
    return baseline.transferVariantForHighConfidence;
  }
  return baseline;
}

/**
 * The "comparable version" served on the one allowed transfer retry (spec
 * §11). Module 1 authors exactly two transfer-task variants (baseline and
 * stretch) that teach the same rule — so the retry reuses whichever variant
 * the learner has *not* just seen, rather than requiring a third authored
 * task. This is a deliberate build choice, not something the spec spells
 * out explicitly.
 *
 * Module 2 doesn't have a second variant yet (no high-confidence stretch
 * task authored — see module2-catch-order.ts), so this returns undefined
 * for it and the caller's fallback re-serves the same task on retry. Not a
 * bug: just a module that hasn't gotten that optional refinement yet.
 */
export function getComparableRetryTask(justAttempted: Task): Task | undefined {
  if (justAttempted.id === transferTaskBaseline.id) {
    return transferTaskBaseline.transferVariantForHighConfidence;
  }
  if (transferTaskBaseline.transferVariantForHighConfidence && justAttempted.id === transferTaskBaseline.transferVariantForHighConfidence.id) {
    return transferTaskBaseline;
  }
  return undefined;
}

export { diagnosticTask };
