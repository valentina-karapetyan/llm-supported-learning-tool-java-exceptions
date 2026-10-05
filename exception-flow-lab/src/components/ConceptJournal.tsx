// src/components/ConceptJournal.tsx
//
// Screen H. Reads directly from AppProgress + the static module/task
// content — no separate data store, per the build spec's §10 note.
//
// Build spec §18: collapsible per-module cards instead of always-expanded
// walls of text — collapsed shows just the title, state, and a short
// takeaway; expanded shows the learner's final Retrieval Practice
// explanation (recordRetrievalAnswer, written once when they complete the
// module — see App.tsx#handleCompleteModule — so it's always their most
// revised answer, never a stale first draft), the key rules, and the
// misconceptions addressed.

import { useState } from "react";
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(moduleId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>What I've learned</h1>
        <button type="button" className={styles.backLink} onClick={onBack}>
          ← Back
        </button>
      </div>
      <p className={styles.lede}>
        Your personal summary: the rules from each lesson you've done, plus your own explanation in your own words.
      </p>

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
          const stateLabel = !module.available
            ? "Coming soon"
            : state === "completed"
              ? "Completed"
              : state === "in_progress"
                ? "In progress"
                : "Not started";
          // Collapsed-view takeaway: the first key rule this module produced,
          // or the module's own short description before anything's covered.
          const takeaway = keyRules[0] ?? module.description;
          const isExpanded = expanded.has(module.id);

          return (
            <div key={module.id} className={styles.entry}>
              <button
                type="button"
                className={styles.entryToggle}
                onClick={() => toggle(module.id)}
                aria-expanded={isExpanded}
              >
                <span className={styles.entryToggleTop}>
                  <span className={styles.entryTitle}>{module.title}</span>
                  <span className={styles.entryState}>{stateLabel}</span>
                </span>
                <span className={styles.entryTakeaway}>
                  <InlineCode text={takeaway} />
                </span>
                <span className={styles.entryChevron} aria-hidden="true">
                  {isExpanded ? "▾" : "▸"}
                </span>
              </button>

              {isExpanded && (
                <div className={styles.entryDetail}>
                  {misconceptions.length === 0 ? (
                    <p className={styles.emptyState}>Nothing here yet. Finish this lesson and its rules show up here.</p>
                  ) : (
                    <>
                      {moduleProgress?.retrievalAnswer && (
                        <div className={styles.block}>
                          <p className={styles.blockLabel}>Your final explanation</p>
                          <p className={styles.retrievalAnswer}>{moduleProgress.retrievalAnswer}</p>
                        </div>
                      )}
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
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
