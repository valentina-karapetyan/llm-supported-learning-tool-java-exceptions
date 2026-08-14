// src/components/CompletionScreen.tsx
//
// Screen G. Deliberately non-competitive: no score, no percentage, no
// streak — just what was covered and a couple of ways to keep going.

import type { Module } from "../types/content";
import type { ModuleProgress } from "../state/progressStore";
import { getTaskById } from "../content/modules";
import styles from "./CompletionScreen.module.css";

export interface CompletionScreenProps {
  module: Module;
  moduleProgress: ModuleProgress | undefined;
  onBackToMap: () => void;
  onViewJournal: () => void;
}

export function CompletionScreen({ module, moduleProgress, onBackToMap, onViewJournal }: CompletionScreenProps) {
  const keyRules = Array.from(
    new Set(
      (moduleProgress?.taskProgress ?? [])
        .map((tp) => getTaskById(tp.taskId)?.feedback.keyRule)
        .filter((rule): rule is string => Boolean(rule))
    )
  );

  return (
    <div className={styles.wrapper}>
      <p className={styles.eyebrow}>Module complete</p>
      <h1 className={styles.title}>{module.title}</h1>
      <p className={styles.lede}>You've worked through this case file end to end. Here's what it was building toward:</p>

      {keyRules.length > 0 && (
        <ul className={styles.ruleList}>
          {keyRules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.secondaryButton} onClick={onViewJournal}>
          View Concept Journal
        </button>
        <button type="button" className={styles.primaryButton} onClick={onBackToMap}>
          Back to case files
        </button>
      </div>
    </div>
  );
}
