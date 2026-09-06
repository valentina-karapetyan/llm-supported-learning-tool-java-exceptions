// src/components/Welcome.tsx
//
// Screen A. Kept deliberately short — a meta label, one headline, one
// short paragraph, three terse "how it works" lines. No bullet list of
// reassurances; "no leaderboards / no timers" etc. either shows up as the
// PROGRESS line below or is simply true by never appearing anywhere else.

import { InlineCode } from "./InlineCode";
import styles from "./Welcome.module.css";

export interface WelcomeProps {
  onStart: () => void;
}

const HOW_IT_WORKS = [
  { n: "01", label: "Method", body: "You order the events yourself before anything is revealed." },
  { n: "02", label: "Feedback", body: "Your sequence sits beside the real one, with the rule that explains the gap. No score." },
  { n: "03", label: "Progress", body: "Kept on this device only, and clearable at any time." },
];

export function Welcome({ onStart }: WelcomeProps) {
  return (
    <div className={styles.wrapper}>
      <p className={styles.meta}>Five case files · self-paced</p>
      <h1 className={styles.title}>An exception does not politely wait its turn.</h1>
      <p className={styles.lede}>
        <InlineCode text="Each case file is one thing programmers get wrong about `try`/`catch`. Commit to an answer, then trace the real control flow." />
      </p>

      <div className={styles.rows}>
        {HOW_IT_WORKS.map((row) => (
          <div className={styles.row} key={row.n}>
            <p className={styles.rowLabel}>
              {row.n} · {row.label}
            </p>
            <p className={styles.rowBody}>{row.body}</p>
          </div>
        ))}
      </div>

      <button type="button" className={styles.startButton} onClick={onStart}>
        Start investigating
      </button>
    </div>
  );
}
