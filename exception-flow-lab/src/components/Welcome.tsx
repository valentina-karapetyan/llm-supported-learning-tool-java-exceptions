// src/components/Welcome.tsx
//
// Screen A. No accounts, no streaks, no timers — sets that expectation
// immediately rather than letting the first task screen imply otherwise.

import styles from "./Welcome.module.css";

export interface WelcomeProps {
  onStart: () => void;
}

export function Welcome({ onStart }: WelcomeProps) {
  return (
    <div className={styles.wrapper}>
      <p className={styles.eyebrow}>Exception Flow Lab</p>
      <h1 className={styles.title}>Investigate how Java exceptions actually flow.</h1>
      <p className={styles.lede}>
        A handful of short case files, each built around one specific misconception about exception handling. Trace
        what really happens, compare it with your own reasoning, and watch the control flow play out.
      </p>
      <ul className={styles.list}>
        <li>No leaderboards, no timers, no streaks to keep.</li>
        <li>AI support is four fixed steps — a nudge, a walkthrough, a simpler take, an example — never a chat box, never a grade.</li>
        <li>Your progress stays on this device. Reset it anytime from the footer.</li>
      </ul>
      <button type="button" className={styles.startButton} onClick={onStart}>
        Start investigating
      </button>
    </div>
  );
}
