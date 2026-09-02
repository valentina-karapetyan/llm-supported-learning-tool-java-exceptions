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
