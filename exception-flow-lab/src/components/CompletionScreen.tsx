// src/components/CompletionScreen.tsx
//
// Screen G. Deliberately non-competitive: no score, no percentage, no
// streak — just what was covered and a couple of ways to keep going.
//
// Two sources for "what was covered", in priority order:
//   1. A module's authored `completion` summary, if it has one. Module 5
//      needs this: it authors no `keyRule` anywhere (it introduces no new
//      theory), so there would be nothing to derive, and a consolidation
//      module's recap is written copy rather than a list of per-task rules.
//   2. Otherwise the distinct key rules of the tasks the learner actually
//      completed in this module — Modules 1-4's behaviour, unchanged.

import type { Module } from "../types/content";
import type { ModuleProgress } from "../state/progressStore";
import { getTaskById } from "../content/modules";
import { InlineCode } from "./InlineCode";
import styles from "./CompletionScreen.module.css";

export interface CompletionScreenProps {
  module: Module;
  moduleProgress: ModuleProgress | undefined;
  onBackToMap: () => void;
  onViewJournal: () => void;
}

export function CompletionScreen({ module, moduleProgress, onBackToMap, onViewJournal }: CompletionScreenProps) {
  const derivedKeyRules = Array.from(
    new Set(
      (moduleProgress?.taskProgress ?? [])
        .map((tp) => getTaskById(tp.taskId)?.feedback.keyRule)
        .filter((rule): rule is string => Boolean(rule))
    )
  );

  const summary = module.completion;
  const points = summary?.points ?? derivedKeyRules;

  return (
    <div className={styles.wrapper}>
      <p className={styles.eyebrow}>{summary?.eyebrow ?? "Module complete"}</p>
      <h1 className={styles.title}>{summary?.title ?? module.title}</h1>
      <p className={styles.lede}>
        {summary?.lede ?? "You've worked through this case file end to end. Here's what it was building toward:"}
      </p>

      {points.length > 0 && (
        <ul className={styles.ruleList}>
          {points.map((point) => (
            <li key={point}>
              <InlineCode text={point} />
            </li>
          ))}
        </ul>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.secondaryButton} onClick={onViewJournal}>
          View Concept Journal
        </button>
        <button type="button" className={styles.primaryButton} onClick={onBackToMap}>
          {summary?.primaryActionLabel ?? "Back to case files"}
        </button>
      </div>
    </div>
  );
}
