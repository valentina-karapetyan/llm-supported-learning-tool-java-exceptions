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

import { useMemo } from "react";
import type { ReplayStep } from "../types/content";
import { buildRevealedLineMap, CodeBlock } from "./CodeBlock";
import { InlineCode } from "./InlineCode";
import { useStepReplay } from "../hooks/useStepReplay";
import styles from "./ExecutionReplay.module.css";

export interface ExecutionReplayProps {
  code: string;
  replayScript: ReplayStep[];
  // Overrides DEFAULT_CALLOUT below — see Task.replayCallout. Deliberately
  // just the sentence: the "⤷" glyph stays fixed in the markup so every
  // callout keeps the same shape.
  callout?: string;
  // Overrides DEFAULT_HEADING below — see Task.replayHeading.
  heading?: string;
}

const STEP_DELAY_MS = 400;

// Kept free of `code spans` on purpose: it renders through InlineCode, so
// adding backticks here would change how Modules 1-4 look.
const DEFAULT_CALLOUT = "control jumps straight to the matching catch clause";
const DEFAULT_HEADING = "Watch it happen";

export function ExecutionReplay({ code, replayScript, callout, heading }: ExecutionReplayProps) {
  const { revealCount, atStart, atEnd, goToPrevious, goToNext, replay } = useStepReplay(replayScript.length, STEP_DELAY_MS);

  const lineStates = useMemo(
    () => buildRevealedLineMap(replayScript, revealCount, (s) => s.lineNumber, (s) => s.state),
    [replayScript, revealCount],
  );

  const lineBadgeLabels = useMemo(
    () => buildRevealedLineMap(replayScript, revealCount, (s) => s.lineNumber, (s) => s.badgeLabel),
    [replayScript, revealCount],
  );

  // "handled" is the runtime "control jumps here" moment; "unreachable" is
  // the compile-time equivalent for a script with no runtime moment at all
  // (see Task.replayScript) — whichever comes first is this script's
  // one notable moment, and only one of the two ever appears in a given
  // script.
  const firstNotableIndex = useMemo(
    () => replayScript.findIndex((s) => s.state === "handled" || s.state === "unreachable"),
    [replayScript],
  );
  const showJumpCallout = firstNotableIndex >= 0 && revealCount > firstNotableIndex;
  const currentLineNumber = revealCount > 0 ? replayScript[revealCount - 1]?.lineNumber : undefined;

  // Self-guard: an empty script has nothing to animate. Callers should
  // prefer `hasReplayScript(task)` to decide whether to render this
  // component at all, but this keeps ExecutionReplay itself from ever
  // showing a "Watch it happen" heading with a live Replay button over a
  // code block that never actually highlights anything.
  if (replayScript.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3 className={styles.heading}>{heading ?? DEFAULT_HEADING}</h3>
        <div className={styles.controls}>
          <span className={styles.stepLabel}>
            Step {Math.min(revealCount, replayScript.length)} of {replayScript.length}
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
      <CodeBlock code={code} lineStates={lineStates} lineBadgeLabels={lineBadgeLabels} currentLineNumber={currentLineNumber} />
      <div className={[styles.callout, showJumpCallout ? styles.calloutVisible : ""].join(" ")} aria-live="polite">
        {showJumpCallout && (
          <>
            <span aria-hidden="true">⤷ </span>
            <InlineCode text={callout ?? DEFAULT_CALLOUT} />
          </>
        )}
      </div>
    </div>
  );
}
