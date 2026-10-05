// src/components/Welcome.tsx
//
// Screen A. A short, friendly entry point: a headline, one sentence of what
// this is, a tiny animated example of the core idea (an exception skipping
// the rest of the `try` and landing in its `catch`), and three plain steps
// describing what every lesson looks like.

import styles from "./Welcome.module.css";

export interface WelcomeProps {
  onStart: () => void;
}

const STEPS = [
  { icon: "🔍", title: "Predict", body: "Read a few lines of Java and decide what happens when something goes wrong." },
  { icon: "🚦", title: "Check", body: "See instantly if you were right: green or red. No scores, no timer." },
  { icon: "▶", title: "Watch", body: "Replay the exception step by step, with a plain-language explanation." },
];

export function Welcome({ onStart }: WelcomeProps) {
  return (
    <div className={styles.wrapper}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.meta}>Java exceptions · 5 short lessons</p>
          <h1 className={styles.title}>Catch me if you can.</h1>
          <p className={styles.lede}>
            When Java code throws an exception, the program jumps somewhere else. But where? Here you guess where it
            lands, then watch it happen.
          </p>
          <button type="button" className={styles.startButton} onClick={onStart}>
            Let's go →
          </button>
        </div>

        {/* Decorative mini-replay: the throw on line 2 skips line 3 and lands in the catch. */}
        <div className={styles.demo} aria-hidden="true">
          <pre className={styles.code}>
            <span className={styles.line}>
              <span className={styles.kw}>try</span> {"{"}
            </span>
            <span className={[styles.line, styles.lineThrow].join(" ")}>
              {"  "}readFile(); <span className={styles.boom}>💥</span>
            </span>
            <span className={[styles.line, styles.lineSkipped].join(" ")}>{"  "}print("done");</span>
            <span className={styles.line}>
              {"}"} <span className={styles.kw}>catch</span> (IOException e) {"{"}
            </span>
            <span className={[styles.line, styles.lineCatch].join(" ")}>
              {"  "}print("caught!"); <span className={styles.landed}>✓</span>
            </span>
            <span className={styles.line}>{"}"}</span>
          </pre>
          <p className={styles.demoCaption}>Line 3 never runs. Would you have guessed?</p>
        </div>
      </section>

      <ol className={styles.steps}>
        {STEPS.map((step, i) => (
          <li className={styles.step} key={step.title}>
            <span className={styles.stepIcon}>{step.icon}</span>
            <span className={styles.stepTitle}>
              {i + 1}. {step.title}
            </span>
            <span className={styles.stepBody}>{step.body}</span>
          </li>
        ))}
      </ol>

      <p className={styles.footnote}>Your progress is saved in this browser only.</p>
    </div>
  );
}
