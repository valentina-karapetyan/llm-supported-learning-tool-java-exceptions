// src/content/modules.ts
//
// Module definitions + a content lookup. Per the build spec's build order,
// only Module 1 has authored task content right now. Modules 2–4 are listed
// as locked/"coming soon" placeholders on the Module Map so the screen's
// shape is right, without inventing task content that hasn't been authored
// or validated yet (the spec is explicit that Module 1 must work end-to-end
// before any other module is even started).

import type { Module, Task } from "../types/content";
import { diagnosticTask, transferTaskBaseline, module1Tasks } from "./module1-trace-execution";

export const module1: Module = {
  id: "module-1",
  title: "Trace the Execution",
  description: "What happens after an exception is thrown?",
  // m1-transfer-stretch is swapped in at runtime for high-confidence learners,
  // not listed statically — see transferVariantForHighConfidence.
  taskIds: ["m1-diagnostic", "m1-transfer"],
  available: true,
};

const module2Placeholder: Module = {
  id: "module-2",
  title: "Catch Order & Specificity",
  description: "Which catch clause actually runs when several could match?",
  taskIds: [],
  available: false,
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

export const modules: Module[] = [module1, module2Placeholder, module3Placeholder, module4Placeholder];

const allTasks: Task[] = [...module1Tasks];

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
