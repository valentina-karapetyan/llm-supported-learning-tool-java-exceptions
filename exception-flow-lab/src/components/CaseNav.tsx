// src/components/CaseNav.tsx
//
// Small, subtle wayfinding bar shown at the top of every case's screens: a
// "back to Case files" link plus (optionally) a lightweight 4-step trail —
// Prediction → Reflection → Feedback → Transfer — showing roughly where
// the learner is in that one case file's flow. Opted into by Cases 1 and 3;
// see caseProgressStage in App.tsx/TaskScreen.tsx for which modules pass a
// stage. Deliberately not a wizard: no clickable steps, no internal state,
// just a read-out of whatever stage the caller says the learner is on.

import styles from "./CaseNav.module.css";

export type CaseProgressStage = "prediction" | "reflection" | "feedback" | "transfer";

const STAGES: { key: CaseProgressStage; label: string }[] = [
  { key: "prediction", label: "Prediction" },
  { key: "reflection", label: "Reflection" },
  { key: "feedback", label: "Feedback" },
  { key: "transfer", label: "Transfer" },
];

export interface CaseNavProps {
  onBackToMap: () => void;
  // Omit to show just the back link with no progress trail (e.g. for
  // modules that haven't opted into this indicator).
  progressStage?: CaseProgressStage;
}

export function CaseNav({ onBackToMap, progressStage }: CaseNavProps) {
  return (
    <div className={styles.bar}>
      <button type="button" className={styles.backLink} onClick={onBackToMap}>
        ← Case files
      </button>
      {progressStage && (
        <p className={styles.trail} aria-label={`Progress in this case file: ${progressStage}`}>
          {STAGES.map((stage, index) => (
            <span key={stage.key}>
              <span className={stage.key === progressStage ? styles.trailStepCurrent : styles.trailStep}>{stage.label}</span>
              {index < STAGES.length - 1 && <span className={styles.trailSeparator}> → </span>}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
