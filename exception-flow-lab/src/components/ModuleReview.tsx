// src/components/ModuleReview.tsx
//
// Post-completion module review menu (build spec §1). Shown instead of
// restarting a completed module from its first task — a small, read-only
// menu of that learner's own past task screens for this module. This is a
// review feature, not unrestricted navigation: it only ever lists task
// screens that were actually recorded in `taskProgress` (so an un-triggered
// retry, for instance, never appears), and never lists feedback, AI support,
// or retrieval practice as separate menu items.

import type { Module } from "../types/content";
import type { TaskProgress } from "../state/progressStore";
import {
  getDiagnosticTask,
  getTransferTask,
  getComparableRetryTask,
  isMixedPracticeModule,
  getMixedCaseTasks,
} from "../content/modules";
import { CaseNav } from "./CaseNav";
import styles from "./ModuleReview.module.css";

export interface ModuleReviewProps {
  module: Module;
  taskProgress: TaskProgress[];
  onSelectTask: (taskId: string) => void;
  onBackToMap: () => void;
}

interface ReviewableTask {
  taskId: string;
  label: string;
}

/** Derives the review menu entirely from recorded `taskProgress` entries —
 *  no separate "what should be reviewable" state to keep in sync. For
 *  diagnostic_transfer modules this naturally yields up to 3 entries
 *  (Initial task / New case / Retry case); a module whose transfer task has
 *  no distinct `retryVariant` authored just won't have a third entry, since
 *  a same-id retry already overwrites the attempt-1 record in
 *  `recordTaskAttempt` — there's nothing separate left to show. For
 *  mixed_practice (Module 5), one entry per recorded task, labeled with
 *  `caseLabel` rather than `title` — Case 3's two parts share a title
 *  ("The Handler That Never Sees It") but have distinct, already-unique
 *  case labels ("Mixed case 3 of 3 · Part A" / "· Part B"). */
function getReviewableTasks(module: Module, taskProgress: TaskProgress[]): ReviewableTask[] {
  const hasEntry = (taskId: string) => taskProgress.some((tp) => tp.taskId === taskId);

  if (isMixedPracticeModule(module)) {
    return getMixedCaseTasks(module)
      .filter((task) => hasEntry(task.id))
      .map((task) => ({ taskId: task.id, label: task.caseLabel }));
  }

  const entries: ReviewableTask[] = [];

  const diagnostic = getDiagnosticTask(module);
  if (diagnostic && hasEntry(diagnostic.id)) {
    entries.push({ taskId: diagnostic.id, label: "Initial task" });
  }

  const transfer = getTransferTask(module);
  if (transfer && hasEntry(transfer.id)) {
    entries.push({ taskId: transfer.id, label: "New case" });
  }

  const retryVariant = transfer && getComparableRetryTask(transfer);
  if (retryVariant && hasEntry(retryVariant.id)) {
    entries.push({ taskId: retryVariant.id, label: "Retry case" });
  }

  return entries;
}

export function ModuleReview({ module, taskProgress, onSelectTask, onBackToMap }: ModuleReviewProps) {
  const reviewable = getReviewableTasks(module, taskProgress);
  const heading = isMixedPracticeModule(module) ? "Review cases" : "Review tasks";

  return (
    <div className={styles.wrapper}>
      <CaseNav onBackToMap={onBackToMap} />
      <p className={styles.eyebrow}>Module complete</p>
      <h1 className={styles.title}>{module.title}</h1>
      <p className={styles.lede}>You've completed this case file. Revisit any of your past answers below.</p>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{heading}</h2>
        {reviewable.length === 0 ? (
          <p className={styles.emptyState}>Nothing recorded yet for this module.</p>
        ) : (
          <div className={styles.list}>
            {reviewable.map((entry, index) => (
              <button key={entry.taskId} type="button" className={styles.row} onClick={() => onSelectTask(entry.taskId)}>
                <span className={styles.number} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={styles.label}>{entry.label}</span>
                <span className={styles.arrow} aria-hidden="true">
                  →
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.primaryButton} onClick={onBackToMap}>
          Back to case files
        </button>
      </div>
    </div>
  );
}
