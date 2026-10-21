// src/components/CodeBlock.tsx
//
// Dumb presentational code display, shared by the Task screen (plain,
// no lineStates) and ExecutionReplay (drives lineStates over time to
// animate the control-flow replay on the Feedback screen).

import type { ReplayLineState } from "../types/content";
import styles from "./CodeBlock.module.css";

export interface CodeBlockProps {
  code: string;
  lineStates?: Partial<Record<number, ReplayLineState>>;
  // Optional per-line override for the badge text, keyed the same way as
  // `lineStates`. Falls back to the generic STATE_LABEL for that line's
  // state when a line has no entry here — e.g. lets a "throws" step read
  // "first() THROWS" instead of the generic, more ambiguous "throws here".
  lineBadgeLabels?: Partial<Record<number, string>>;
  caption?: string;
  // The single line a replay most recently revealed, layered over
  // lineStates' cumulative background so a learner stepping through can tell
  // "this just happened" from "this happened earlier in the trace" — see
  // ExecutionReplay / PropagationReplay.
  currentLineNumber?: number;
}

// Shared by ExecutionReplay and PropagationReplay: both reveal a script one
// step at a time and need a `{ lineNumber: value }` snapshot of everything
// revealed so far, built fresh each time `revealCount` advances.
export function buildRevealedLineMap<TStep, TValue>(
  steps: TStep[],
  revealCount: number,
  getLineNumber: (step: TStep) => number | undefined,
  getValue: (step: TStep) => TValue | undefined,
): Partial<Record<number, TValue>> {
  const map: Partial<Record<number, TValue>> = {};
  for (const step of steps.slice(0, revealCount)) {
    const lineNumber = getLineNumber(step);
    const value = getValue(step);
    if (lineNumber !== undefined && value !== undefined) map[lineNumber] = value;
  }
  return map;
}

const STATE_LABEL: Record<ReplayLineState, string> = {
  active: "runs",
  throws: "throws here",
  skipped: "skipped",
  handled: "handles it",
  propagates: "propagates",
  uncaught: "uncaught",
  unreachable: "unreachable",
};

export function CodeBlock({ code, lineStates, lineBadgeLabels, caption, currentLineNumber }: CodeBlockProps) {
  const lines = code.split("\n");

  return (
    <div className={styles.wrapper}>
      {caption && <p className={styles.caption}>{caption}</p>}
      <pre className={styles.pre}>
        <code>
          {lines.map((line, index) => {
            const lineNumber = index + 1;
            const state = lineStates?.[lineNumber];
            const stateClass = state ? styles[state] : undefined;
            const customBadge = lineBadgeLabels?.[lineNumber];
            const isCurrent = currentLineNumber === lineNumber;
            return (
              <div
                key={lineNumber}
                className={[styles.line, stateClass, isCurrent ? styles.lineCurrent : ""].filter(Boolean).join(" ")}
              >
                <span className={styles.lineNumber} aria-hidden="true">
                  {lineNumber}
                </span>
                <span className={styles.lineText}>{line || " "}</span>
                {/* Every state gets a visible text badge, not just skipped/
                    throws — build spec §17: the state must be understandable
                    without relying only on background color. */}
                {state && (
                  <span className={[styles.lineBadge, customBadge ? styles.lineBadgeCustom : ""].join(" ")}>
                    {customBadge ?? STATE_LABEL[state]}
                  </span>
                )}
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
