// src/content/modules.ts
//
// Module definitions + a content lookup. Modules 1, 2 and 3 have authored
// task content; 4 is still listed as a locked/"coming soon" placeholder on
// the Module Map so the screen's shape is right, without inventing task
// content that hasn't been authored or validated yet.

import type { Module, Task } from "../types/content";
import { module1Tasks } from "./module1-trace-execution";
import { module2Tasks } from "./module2-catch-order";
import { module3Tasks } from "./module3-call-chains";

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

export const module3: Module = {
  id: "module-3",
  title: "Call Chains & Propagation",
  description: "Where does an uncaught exception actually get handled?",
  // m3-transfer-retry is served on the one allowed transfer retry, not
  // listed statically — see retryVariant.
  taskIds: ["m3-diagnostic", "m3-transfer"],
  available: true,
};

const module4Placeholder: Module = {
  id: "module-4",
  title: "Designing Handlers",
  description: "Choosing and refactoring exception-handling strategies.",
  taskIds: [],
  available: false,
};

export const modules: Module[] = [module1, module2, module3, module4Placeholder];

const allTasks: Task[] = [...module1Tasks, ...module2Tasks, ...module3Tasks];

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
 * §11): whichever transfer-task variant (baseline ↔ transferVariantForHighConfidence)
 * the learner has *not* just seen, rather than requiring a third authored
 * task. Generalized off `justAttempted.moduleId` — same pattern as
 * `getTransferTask` above — so it works for any module as soon as that
 * module's baseline task gets a `transferVariantForHighConfidence` wired
 * up, with no per-module edit needed here.
 *
 * Modules with neither a `retryVariant` nor a `transferVariantForHighConfidence`
 * authored just return undefined here, and the caller's fallback re-serves
 * the same task on retry. Not a bug — a module that hasn't gotten that
 * optional refinement.
 */
export function getComparableRetryTask(justAttempted: Task): Task | undefined {
  // A task-specific retry variant (spec §11 — Case 2's "Try again" case)
  // takes priority when authored: it exists specifically to differ from the
  // baseline on a wrong answer, independent of the high-confidence swap
  // below, so it applies regardless of *why* this is a retry.
  if (justAttempted.retryVariant) return justAttempted.retryVariant;

  const module = getModuleById(justAttempted.moduleId);
  if (!module) return undefined;
  const baseline = getTaskById(module.taskIds[1]);
  if (!baseline) return undefined;

  if (justAttempted.id === baseline.id) {
    return baseline.transferVariantForHighConfidence;
  }
  if (baseline.transferVariantForHighConfidence?.id === justAttempted.id) {
    return baseline;
  }
  return undefined;
}
