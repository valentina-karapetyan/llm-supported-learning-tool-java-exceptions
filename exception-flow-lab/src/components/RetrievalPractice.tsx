// src/components/RetrievalPractice.tsx
//
// Retrieval Practice screen, shown once per module after its final task's
// feedback and before its completion screen (see the "retrieval_practice"
// screen in screenReducer.ts / App.tsx). One open-recall question, a
// multiline answer, and a "Check my explanation" button — deliberately no
// multiple choice, no confidence question, no reflection step.
//
// There is no live grading yet: clicking "Check my explanation" calls
// retrievalComparisonService (which always resolves to `undefined` for now)
// and, in its place, shows a clearly labelled placeholder card explaining
// what the finished version will do. When a real comparison is wired up,
// only the branch below on `result` needs to change — the rest of this
// screen (question, textarea, actions) stays as-is.
//
// "Complete module" / "Complete learning lab" only unlocks after the learner
// has checked at least one explanation — still no grading, just makes sure
// the recall step isn't skippable in one click.

import { useState } from "react";
import type { RetrievalQuestion, RetrievalComparisonResult } from "../types/content";
import { retrievalComparisonService } from "../llm/retrievalComparisonService";
import { InlineCode } from "./InlineCode";
import styles from "./RetrievalPractice.module.css";

export interface RetrievalPracticeProps {
  retrievalQuestion: RetrievalQuestion;
  // "Complete module" everywhere except Module 5, which uses "Complete
  // learning lab" — passed in rather than hardcoded here so this component
  // stays module-agnostic.
  completeLabel: string;
  onComplete: () => void;
}

export function RetrievalPractice({ retrievalQuestion, completeLabel, onComplete }: RetrievalPracticeProps) {
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  // Unused for now beyond marking that a check happened — see the comment
  // above the placeholder card below.
  const [, setResult] = useState<RetrievalComparisonResult | undefined>(undefined);

  async function handleCheck() {
    if (answer.trim().length === 0) return;
    const comparison = await retrievalComparisonService.compare(retrievalQuestion, answer);
    setResult(comparison);
    setChecked(true);
  }

  return (
    <div className={styles.wrapper}>
      <p className={styles.eyebrow}>Retrieval Practice</p>
      <h1 className={styles.title}>Recall it without looking back</h1>
      <p className={styles.instruction}>Answer the question in your own words. A short explanation is enough.</p>

      <p className={styles.question}>
        <InlineCode text={retrievalQuestion.question} />
      </p>

      <textarea
        className={styles.textarea}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your explanation here…"
        rows={6}
        aria-label={retrievalQuestion.question}
      />

      <div className={styles.checkActions}>
        <button type="button" className={styles.secondaryButton} onClick={handleCheck} disabled={answer.trim().length === 0}>
          Check my explanation
        </button>
      </div>

      {checked && (
        <div className={styles.placeholderCard}>
          <p className={styles.placeholderTitle}>AI-supported feedback placeholder</p>
          <p className={styles.placeholderText}>
            In the final version, your explanation will be compared with the predefined expected concepts for this
            question. The system will identify correct, missing, or incorrect ideas and provide a short explanation.
          </p>
          {/* Vite sets import.meta.env.DEV to false in a production build —
              the build study participants run — so this line disappears
              there automatically without a separate flag to remember to flip. */}
          {import.meta.env.DEV && <p className={styles.devNote}>LLM comparison not connected yet.</p>}
        </div>
      )}

      <div className={styles.completeActions}>
        <button type="button" className={styles.primaryButton} onClick={onComplete} disabled={!checked}>
          {completeLabel}
        </button>
      </div>
    </div>
  );
}
