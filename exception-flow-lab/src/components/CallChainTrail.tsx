// src/components/CallChainTrail.tsx
//
// A small, read-only visual of the active call chain — shown above the
// question so the learner can see how the methods relate before answering.
// Marks only where the exception originates (isOrigin); deliberately never
// marks where it's handled, since figuring that out is the whole task —
// that resolution only ever appears afterward, in PropagationReplay on the
// Feedback screen. Case 3's own visual — not the drag/sort interactions
// Cases 1 and 2 answer with.
//
// Build spec §5: replaces the original horizontal "start() → loadProfile()
// → readProfileFile()" text strip with a vertical stack, reusing the same
// boxed-step visual language PropagationReplay already established for the
// post-answer view — just without animation or status coloring, since
// nothing here is resolved yet.

import type { CallChainTrailStep } from "../types/content";
import styles from "./CallChainTrail.module.css";

export interface CallChainTrailProps {
  steps: CallChainTrailStep[]; // in call order, outermost caller first
}

export function CallChainTrail({ steps }: CallChainTrailProps) {
  return (
    <div className={styles.wrapper}>
      <p className={styles.label}>Call chain</p>
      <div className={styles.trail}>
        {steps.map((step, index) => (
          <div key={`${step.methodName}-${index}`} className={styles.stepGroup}>
            {index > 0 && (
              <div className={styles.arrow} aria-hidden="true">
                ↓
              </div>
            )}
            <div className={[styles.step, step.isOrigin ? styles.stepOrigin : ""].join(" ")}>
              <code className={styles.method}>{step.methodName}</code>
              {step.isOrigin && <span className={styles.originBadge}>throws here</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
