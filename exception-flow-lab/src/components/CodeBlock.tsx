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
  caption?: string;
}

const STATE_LABEL: Record<ReplayLineState, string> = {
  active: "runs",
  throws: "throws here",
  skipped: "skipped",
  handled: "handles it",
};

export function CodeBlock({ code, lineStates, caption }: CodeBlockProps) {
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
            return (
              <div key={lineNumber} className={[styles.line, stateClass].filter(Boolean).join(" ")}>
                <span className={styles.lineNumber} aria-hidden="true">
                  {lineNumber}
                </span>
                <span className={styles.lineText}>{line || " "}</span>
                {state && (state === "skipped" || state === "throws") && (
                  <span className={styles.lineBadge}>{STATE_LABEL[state]}</span>
                )}
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
