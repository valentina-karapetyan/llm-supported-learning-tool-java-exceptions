// src/components/PropagationReplay.tsx
//
// Case 3's main Feedback-screen visualization: an animated, vertical trace
// of the exception moving from where it's thrown up through the call chain
// to wherever it's actually handled. Same "reveal one step at a time, then
// offer a Replay button" shape as ExecutionReplay (Module 1's visualizer),
// but the thing being traced is the call chain itself, not highlighted
// lines within one code block — propagation crosses method boundaries,
// which per-line highlighting inside a single snippet can't represent.
//
// Deliberately not built *as* ExecutionReplay — "no handler here, keep
// going" is a statement about an entire method having been passed over, not
// a single line, so the trail below (one entry per method, connected by
// arrows) stays the main visualization regardless of code layout. It does
// reuse CodeBlock's lineStates, the same mechanism ExecutionReplay uses, but
// only as an optional add-on: a step can supply `lineNumber` to also
// highlight the one line in Module 3's merged multi-method code block that
// it's about, so a learner isn't left checking the trail against the code by
// eye. A step with no `lineNumber` just doesn't highlight anything.

import { useMemo } from "react";
import type { PropagationStep } from "../types/content";
import { buildRevealedLineMap, CodeBlock } from "./CodeBlock";
import { InlineCode } from "./InlineCode";
import { useStepReplay } from "../hooks/useStepReplay";
import styles from "./PropagationReplay.module.css";

export interface PropagationReplayProps {
  code: string;
  trace: PropagationStep[];
}

const STEP_DELAY_MS = 500;

const STATUS_CLASS: Record<PropagationStep["status"], string> = {
  throws: styles.detailThrows,
  propagates: styles.detailPropagates,
  handled: styles.detailHandled,
  uncaught: styles.detailUncaught,
};

// Build spec §17: a status must be understandable without relying only on
// colour — `throws` and `uncaught` previously shared identical styling
// despite being semantically opposite (start of the story vs. final
// failure), so each status gets its own icon, not just a color class.
const STATUS_ICON: Record<PropagationStep["status"], string> = {
  throws: "⚡",
  propagates: "→",
  handled: "✓",
  uncaught: "✗",
};

export function PropagationReplay({ code, trace }: PropagationReplayProps) {
  const { revealCount, atStart, atEnd, goToPrevious, goToNext, replay } = useStepReplay(trace.length, STEP_DELAY_MS);

  // Optional per-line highlighting on top of the trail below — a step with
  // no `lineNumber` just contributes nothing here, same as ExecutionReplay's
  // lineStates. `status` values are exactly ReplayLineState values of the
  // same name (see PropagationStepStatus), so no mapping is needed.
  const lineStates = useMemo(
    () => buildRevealedLineMap(trace, revealCount, (s) => s.lineNumber, (s) => s.status),
    [trace, revealCount],
  );

  const currentLineNumber = revealCount > 0 ? trace[revealCount - 1]?.lineNumber : undefined;

  // Self-guard, same reasoning as ExecutionReplay: an empty trace has
  // nothing to animate. Callers should prefer checking
  // `propagationTrace?.length` before rendering this at all.
  if (trace.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3 className={styles.heading}>Exception propagation</h3>
        <div className={styles.controls}>
          <span className={styles.stepLabel}>
            Step {Math.min(revealCount, trace.length)} of {trace.length}
          </span>
          <button type="button" className={styles.stepButton} onClick={goToPrevious} disabled={atStart} aria-label="Previous step">
            ‹
          </button>
          <button type="button" className={styles.stepButton} onClick={goToNext} disabled={atEnd} aria-label="Next step">
            ›
          </button>
          <button type="button" className={styles.replayButton} onClick={replay}>
            ↻ Replay
          </button>
        </div>
      </div>
      <CodeBlock code={code} lineStates={lineStates} currentLineNumber={currentLineNumber} />
      <div className={styles.trace}>
        {trace.map((step, index) => {
          const visible = index < revealCount;
          const isCurrent = index === revealCount - 1;
          return (
            <div key={`${step.methodName}-${index}`} className={styles.traceItem}>
              {index > 0 && (
                <div className={[styles.arrow, visible ? styles.arrowVisible : ""].join(" ")} aria-hidden="true">
                  ↓
                </div>
              )}
              <div
                className={[styles.step, visible ? styles.stepVisible : "", isCurrent ? styles.stepCurrent : ""]
                  .filter(Boolean)
                  .join(" ")}
              >
                <code className={styles.stepMethod}>{step.methodName}</code>
                <span className={[styles.stepDetail, STATUS_CLASS[step.status]].join(" ")}>
                  <span aria-hidden="true">{STATUS_ICON[step.status]} </span>
                  <InlineCode text={step.detail} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
