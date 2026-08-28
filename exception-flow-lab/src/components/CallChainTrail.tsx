// src/components/CallChainTrail.tsx
//
// A small, read-only visual of the active call chain — e.g.
// "start() → loadProfile() → readProfileFile()" — shown above the question
// so the learner can see how the methods relate before answering. Marks
// only where the exception originates (isOrigin); deliberately never marks
// where it's handled, since figuring that out is the whole task. Case 3's
// own visual — not the drag/sort interactions Cases 1 and 2 answer with.

import type { CallChainTrailStep } from "../types/content";
import styles from "./CallChainTrail.module.css";

export interface CallChainTrailProps {
  steps: CallChainTrailStep[]; // in call order, outermost caller first
}

export function CallChainTrail({ steps }: CallChainTrailProps) {
  return (
    <div className={styles.wrapper}>
      <p className={styles.label}>Call chain</p>
      <ol className={styles.trail}>
        {steps.map((step, index) => (
          <li key={`${step.methodName}-${index}`} className={styles.step}>
            <code className={styles.method}>{step.methodName}</code>
            {step.isOrigin && <span className={styles.originBadge}>throws here</span>}
            {index < steps.length - 1 && (
              <span className={styles.arrow} aria-hidden="true">
                →
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
