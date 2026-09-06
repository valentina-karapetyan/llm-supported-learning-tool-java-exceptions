// src/components/ConceptJournal.tsx
//
// Screen H. Reads directly from AppProgress + the static module/task
// content — no separate data store, per the build spec's §10 note.

import type { Module } from "../types/content";
import type { AppProgress } from "../state/progressStore";
import { getTaskById } from "../content/modules";
import { InlineCode } from "./InlineCode";
import styles from "./ConceptJournal.module.css";

export interface ConceptJournalProps {
  modules: Module[];
  progress: AppProgress;
  onBack: () => void;
}

export function ConceptJournal({ modules, progress, onBack }: ConceptJournalProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Concept Journal</h1>
        <button type="button" className={styles.backLink} onClick={onBack}>
          ← Back
        </button>
      </div>

      <div className={styles.entries}>
        {modules.map((module) => {
          const moduleProgress = progress.modules.find((m) => m.moduleId === module.id);
          const completedTasks = (moduleProgress?.taskProgress ?? []).filter((tp) => tp.completed);
          const misconceptions = Array.from(
            new Set(completedTasks.map((tp) => getTaskById(tp.taskId)?.misconception).filter((m): m is string => Boolean(m)))
          );
          const keyRules = Array.from(
            new Set(completedTasks.map((tp) => getTaskById(tp.taskId)?.feedback.keyRule).filter((r): r is string => Boolean(r)))
          );
          const state = moduleProgress?.state ?? "not_started";

          return (
            <div key={module.id} className={styles.entry}>
              <div className={styles.entryHeader}>
                <h2 className={styles.entryTitle}>{module.title}</h2>
                <span className={styles.entryState}>
                  {!module.available ? "Coming soon" : state === "completed" ? "Completed" : state === "in_progress" ? "In progress" : "Not started"}
                </span>
              </div>

              {misconceptions.length === 0 ? (
                <p className={styles.emptyState}>Nothing recorded yet, head to the case files to get started.</p>
              ) : (
                <>
                  <div className={styles.block}>
                    <p className={styles.blockLabel}>Misconceptions addressed</p>
                    <ul className={styles.list}>
                      {misconceptions.map((m) => (
                        <li key={m}>
                          <InlineCode text={m} />
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Module 5's tasks author no keyRule (it introduces no new
                      theory), so this block would otherwise render as an
                      empty list under a heading. */}
                  {keyRules.length > 0 && (
                    <div className={styles.block}>
                      <p className={styles.blockLabel}>Key rules</p>
                      <ul className={styles.list}>
                        {keyRules.map((r) => (
                          <li key={r}>
                            <InlineCode text={r} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
