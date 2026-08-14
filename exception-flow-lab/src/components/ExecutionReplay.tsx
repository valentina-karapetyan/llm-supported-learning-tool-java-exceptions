// src/components/ExecutionReplay.tsx
//
// The animated control-flow visualizer shown on the Feedback screen, right
// under the keyRule card. Reuses CodeBlock + the task's own code string and
// authored replayScript — no separate asset, no re-fetching.
//
// Simplification worth flagging: the spec asks for "a visible arrow/motion"
// at the throw→catch jump. Rather than computing pixel-accurate line
// positions for a literal SVG path (fragile, and overkill for a handful of
// short snippets), this renders a callout banner that fades in at that
// moment, directly under the code. It's a deliberate scope cut for the
// prototype, not an oversight — easy to upgrade later if needed.

import { useEffect, useMemo, useState } from "react";
import type { ReplayStep } from "../types/content";
import { CodeBlock } from "./CodeBlock";
import styles from "./ExecutionReplay.module.css";

export interface ExecutionReplayProps {
  code: string;
  replayScript: ReplayStep[];
}

const STEP_DELAY_MS = 400;

function usesReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ExecutionReplay({ code, replayScript }: ExecutionReplayProps) {
  const reducedMotion = useMemo(() => usesReducedMotion(), []);
  const [revealCount, setRevealCount] = useState(reducedMotion ? replayScript.length : 0);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      setRevealCount(replayScript.length);
      return;
    }
    setRevealCount(0);
    if (replayScript.length === 0) return;

    let cancelled = false;
    let step = 0;

    const advance = () => {
      if (cancelled) return;
      step += 1;
      setRevealCount(step);
      if (step < replayScript.length) {
        window.setTimeout(advance, STEP_DELAY_MS);
      }
    };
    const firstTimer = window.setTimeout(advance, STEP_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(firstTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replayScript, reducedMotion, runId]);

  const lineStates = useMemo(() => {
    const map: Partial<Record<number, ReplayStep["state"]>> = {};
    for (const step of replayScript.slice(0, revealCount)) {
      map[step.lineNumber] = step.state;
    }
    return map;
  }, [replayScript, revealCount]);

  const firstHandledIndex = replayScript.findIndex((s) => s.state === "handled");
  const showJumpCallout = firstHandledIndex >= 0 && revealCount > firstHandledIndex;
  const animationDone = revealCount >= replayScript.length;

  // Self-guard: an empty script has nothing to animate. Callers should
  // prefer `hasReplayScript(task)` to decide whether to render this
  // component at all, but this keeps ExecutionReplay itself from ever
  // showing a "Watch it happen" heading with a live Replay button over a
  // code block that never actually highlights anything.
  if (replayScript.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3 className={styles.heading}>Watch it happen</h3>
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
      <CodeBlock code={code} lineStates={lineStates} />
      <div className={[styles.callout, showJumpCallout ? styles.calloutVisible : ""].join(" ")} aria-live="polite">
        {showJumpCallout ? "⤷ control jumps straight to the matching catch block" : ""}
      </div>
    </div>
  );
}
