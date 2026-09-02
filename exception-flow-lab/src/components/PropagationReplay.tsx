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
// Deliberately not built on top of ExecutionReplay/CodeBlock's lineStates —
// that mechanism highlights lines *within* one method's execution, but
// "no handler here, keep going" isn't a line state, it's a statement about
// an entire method having been passed over.

import { useEffect, useMemo, useState } from "react";
import type { PropagationStep } from "../types/content";
import { CodeBlock } from "./CodeBlock";
import { InlineCode } from "./InlineCode";
import styles from "./PropagationReplay.module.css";

export interface PropagationReplayProps {
  code: string;
  trace: PropagationStep[];
}

const STEP_DELAY_MS = 500;

function usesReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const STATUS_CLASS: Record<PropagationStep["status"], string> = {
  throws: styles.detailThrows,
  propagates: styles.detailPropagates,
  handled: styles.detailHandled,
  uncaught: styles.detailUncaught,
};

export function PropagationReplay({ code, trace }: PropagationReplayProps) {
  const reducedMotion = useMemo(() => usesReducedMotion(), []);
  const [revealCount, setRevealCount] = useState(reducedMotion ? trace.length : 0);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      setRevealCount(trace.length);
      return;
    }
    setRevealCount(0);
    if (trace.length === 0) return;

    let cancelled = false;
    let step = 0;

    const advance = () => {
      if (cancelled) return;
      step += 1;
      setRevealCount(step);
      if (step < trace.length) {
        window.setTimeout(advance, STEP_DELAY_MS);
      }
    };
    const firstTimer = window.setTimeout(advance, STEP_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(firstTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trace, reducedMotion, runId]);

  const animationDone = revealCount >= trace.length;

  // Self-guard, same reasoning as ExecutionReplay: an empty trace has
  // nothing to animate. Callers should prefer checking
  // `propagationTrace?.length` before rendering this at all.
  if (trace.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3 className={styles.heading}>Watch it propagate</h3>
        {!reducedMotion && (
          <button
            type="button"
            className={styles.replayButton}
            onClick={() => setRunId((id) => id + 1)}
            disabled={!animationDone}
          >
            ↻ Replay
          </button>
        )}
      </div>
      <CodeBlock code={code} />
      <div className={styles.trace}>
        {trace.map((step, index) => {
          const visible = index < revealCount;
          return (
            <div key={`${step.methodName}-${index}`} className={styles.traceItem}>
              {index > 0 && (
                <div className={[styles.arrow, visible ? styles.arrowVisible : ""].join(" ")} aria-hidden="true">
                  ↓
                </div>
              )}
              <div className={[styles.step, visible ? styles.stepVisible : ""].join(" ")}>
                <code className={styles.stepMethod}>{step.methodName}</code>
                <span className={[styles.stepDetail, STATUS_CLASS[step.status]].join(" ")}>
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
