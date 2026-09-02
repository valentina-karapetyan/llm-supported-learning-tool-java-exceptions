// src/state/progressStore.ts

import type { SupportType } from "../types/content";

export interface TaskProgress {
  taskId: string;
  completed: boolean;
  selectedAnswer: unknown; // the learner's submitted TaskResponseData payload
  wasCorrect: boolean;
  supportRequested: SupportType[]; // in the order requested, empty if skipped
  // Extension beyond the base spec shape: which attempt this was (1 or 2,
  // since the transfer task allows exactly one retry). Needed to compute
  // "answered correctly on the first try" for the progressive hint-fading
  // rule below.
  attempt: number;
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

function emptyProgress(): AppProgress {
  return { modules: [] };
}

export function loadProgress(): AppProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.modules)) return emptyProgress();
    return parsed as AppProgress;
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress: AppProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function resetProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
}

function getOrCreateModuleProgress(progress: AppProgress, moduleId: string): ModuleProgress {
  const existing = progress.modules.find((m) => m.moduleId === moduleId);
  if (existing) return existing;
  const created: ModuleProgress = { moduleId, state: "not_started", taskProgress: [] };
  progress.modules.push(created);
  return created;
}

export function getModuleProgress(progress: AppProgress, moduleId: string): ModuleProgress | undefined {
  return progress.modules.find((m) => m.moduleId === moduleId);
}

/**
 * Records (or replaces, on retry) a task attempt, updates the owning
 * module's state, persists to localStorage, and returns the new
 * AppProgress. Callers should use the returned value going forward.
 */
export function recordTaskAttempt(
  progress: AppProgress,
  moduleId: string,
  taskAttempt: TaskProgress,
  moduleCompleted: boolean
): AppProgress {
  const next: AppProgress = { modules: progress.modules.map((m) => ({ ...m, taskProgress: [...m.taskProgress] })) };
  const moduleProgress = getOrCreateModuleProgress(next, moduleId);

  const existingIndex = moduleProgress.taskProgress.findIndex((t) => t.taskId === taskAttempt.taskId);
  if (existingIndex >= 0) {
    moduleProgress.taskProgress[existingIndex] = taskAttempt;
  } else {
    moduleProgress.taskProgress.push(taskAttempt);
  }

  moduleProgress.state = moduleCompleted ? "completed" : "in_progress";

  saveProgress(next);
  return next;
}

/**
 * Progressive hint fading (build spec §2): the AI Support Panel opens
 * collapsed by default if the learner answered the last two *completed*
 * tasks in this module correctly on the first try. With fewer than two
 * completed tasks so far, there isn't enough signal yet, so it defaults to
 * expanded.
 */
export function shouldCollapseSupportPanel(progress: AppProgress, moduleId: string): boolean {
  const moduleProgress = getModuleProgress(progress, moduleId);
  if (!moduleProgress || moduleProgress.taskProgress.length < 2) return false;
  const lastTwo = moduleProgress.taskProgress.slice(-2);
  return lastTwo.every((t) => t.wasCorrect && t.attempt === 1);
}
