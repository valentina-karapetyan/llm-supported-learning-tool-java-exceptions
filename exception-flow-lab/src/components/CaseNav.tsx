// src/components/CaseNav.tsx
//
// Small, subtle wayfinding bar shown at the top of every case's screens: a
// "back to Case files" link plus (optionally) a lightweight trail showing
// roughly where the learner is. Two ways to supply that trail:
//   - `progressStage`: the Task → Feedback → Transfer trail of Modules 1-4's
//     flow. Opted into by Cases 1 and 3; see caseProgressStage in
//     App.tsx/TaskScreen.tsx for which modules pass a stage.
//   - `trail`: arbitrary labels, for a flow whose steps aren't those three —
//     Module 5's Case 1 → Case 2 → Case 3.
// Deliberately not a wizard either way: no clickable steps, no internal
// state, just a read-out of where the caller says the learner is.

import styles from "./CaseNav.module.css";

export type CaseProgressStage = "task" | "feedback" | "transfer";

const STAGES: { key: CaseProgressStage; label: string }[] = [
  { key: "task", label: "Task" },
  { key: "feedback", label: "Feedback" },
  { key: "transfer", label: "Transfer" },
];

/** An arbitrary labeled trail, for flows whose steps aren't
 *  Task/Feedback/Transfer. `currentIndex` indexes into `labels`. */
export interface CaseTrail {
  labels: string[];
  currentIndex: number;
}

export interface CaseNavProps {
  onBackToMap: () => void;
  // Omit both of these to show just the back link with no progress trail
  // (e.g. for modules that haven't opted into this indicator).
  progressStage?: CaseProgressStage;
  // Takes precedence over `progressStage` if both are somehow supplied —
  // an explicit trail is always more specific than a derived one.
  trail?: CaseTrail;
}

export function CaseNav({ onBackToMap, progressStage, trail }: CaseNavProps) {
  const resolvedTrail: CaseTrail | undefined =
    trail ??
    (progressStage
      ? { labels: STAGES.map((stage) => stage.label), currentIndex: STAGES.findIndex((stage) => stage.key === progressStage) }
      : undefined);

  return (
    <div className={styles.bar}>
      <button type="button" className={styles.backLink} onClick={onBackToMap}>
        ← Case files
      </button>
      {resolvedTrail && (
        <p className={styles.trail} aria-label={`Progress: ${resolvedTrail.labels[resolvedTrail.currentIndex] ?? ""}`}>
          {resolvedTrail.labels.map((label, index) => (
            <span key={label}>
              <span className={index === resolvedTrail.currentIndex ? styles.trailStepCurrent : styles.trailStep}>{label}</span>
              {index < resolvedTrail.labels.length - 1 && <span className={styles.trailSeparator}> → </span>}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
