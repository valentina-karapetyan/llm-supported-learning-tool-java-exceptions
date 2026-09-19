// src/components/RetrievalPractice.tsx
//
// Retrieval Practice screen, shown once per module after its final task's
// feedback and before its completion screen (see the "retrieval_practice"
// screen in screenReducer.ts / App.tsx). One open-recall question, a
// multiline answer, and a "Check my explanation" button — deliberately no
// multiple choice, no confidence question, no reflection step.
//
// Clicking "Check my explanation" calls retrievalComparisonService, which
// resolves to a RetrievalCheckOutcome (build spec §12/§13):
//   - "ok": a real per-criterion comparison, rendered below. Never a grade —
//     see RetrievalComparisonResult's doc comment in types/content.ts.
//   - "unavailable": no Gemini key configured. Expected, silent, renders the
//     same static placeholder card this screen has always shown.
//   - "error": a live request was actually attempted and failed (timeout,
//     empty/blocked response, exhausted output tokens, malformed JSON). This
//     is new — previously indistinguishable from "unavailable" — and shows
//     its own retry/continue card instead of silently reusing the
//     placeholder.
//
// "Complete module" / "Complete learning lab" unlocks once the learner has
// gotten a real "ok" or "unavailable" result, or explicitly chosen to
// continue past an "error" — still no grading, just makes sure the recall
// step isn't skippable in one click, and that a failed request specifically
// can't silently strand the learner either.

import { useRef, useState } from "react";
import type { RetrievalQuestion, CriterionStatus } from "../types/content";
import { retrievalComparisonService, type RetrievalCheckOutcome } from "../llm/retrievalComparisonService";
import { InlineCode } from "./InlineCode";
import styles from "./RetrievalPractice.module.css";

export interface RetrievalPracticeProps {
  retrievalQuestion: RetrievalQuestion;
  // "Complete module" everywhere except Module 5, which uses "Complete
  // learning lab" — passed in rather than hardcoded here so this component
  // stays module-agnostic.
  completeLabel: string;
  // Receives the learner's current explanation text so the caller can
  // persist it (build spec §18's Concept Journal entry) before advancing —
  // whatever is in the textarea at this point already reflects every
  // revision, so it's naturally their final answer.
  onComplete: (answer: string) => void;
}

const STATUS_ICON: Record<CriterionStatus, string> = {
  addressed: "✓",
  partly_addressed: "△",
  missing: "○",
};

const STATUS_LABEL: Record<CriterionStatus, string> = {
  addressed: "Addressed",
  partly_addressed: "Partly addressed",
  missing: "Missing",
};

export function RetrievalPractice({ retrievalQuestion, completeLabel, onComplete }: RetrievalPracticeProps) {
  const [answer, setAnswer] = useState("");
  const [checking, setChecking] = useState(false);
  const [outcome, setOutcome] = useState<RetrievalCheckOutcome | undefined>(undefined);
  const [proceedWithoutAi, setProceedWithoutAi] = useState(false);
  // Guards against a resolved-but-abandoned request overwriting whatever a
  // later request already put on screen (build spec §12's "associate the
  // returned response with the request that created it"). The larger
  // cross-task version of this — a response from a *different* question
  // landing here — is prevented one level up by App.tsx keying this
  // component by module id, so it fully remounts (fresh state) on a
  // question change instead of reusing this instance.
  const requestIdRef = useRef(0);

  async function handleCheck() {
    if (answer.trim().length === 0) return;
    const requestId = ++requestIdRef.current;
    setChecking(true);
    // Clear previous state immediately rather than leaving a stale card
    // visible while the new request is in flight.
    setOutcome(undefined);
    try {
      const result = await retrievalComparisonService.compare(retrievalQuestion, answer);
      if (requestIdRef.current !== requestId) return;
      setOutcome(result);
    } finally {
      if (requestIdRef.current === requestId) setChecking(false);
    }
  }

  function handleProceedWithoutAi() {
    setProceedWithoutAi(true);
  }

  const hasUsableOutcome = outcome !== undefined && outcome.status !== "error";
  const canComplete = hasUsableOutcome || proceedWithoutAi;

  return (
    <div className={styles.wrapper}>
      <p className={styles.eyebrow}>Before you finish</p>
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

      {checking && (
        <p className={styles.checkingStatus} role="status">
          Checking your explanation…
        </p>
      )}

      <div className={styles.checkActions}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleCheck}
          disabled={answer.trim().length === 0 || checking}
        >
          {checking ? "Checking…" : outcome ? "Recheck my explanation" : "Check my explanation"}
        </button>
      </div>

      {outcome?.status === "ok" && (
        <div className={styles.resultCard}>
          <p className={styles.resultHeading}>Feedback on your explanation</p>

          <div className={styles.criteriaList}>
            {outcome.result.criteria.map((criterion, index) => (
              <div key={index} className={[styles.criterionRow, styles[`criterion_${criterion.status}`]].join(" ")}>
                <span className={styles.criterionIcon} aria-hidden="true">
                  {STATUS_ICON[criterion.status]}
                </span>
                <span className={styles.criterionText}>
                  <span className={styles.criterionStatusLabel}>{STATUS_LABEL[criterion.status]}</span>
                  <InlineCode text={criterion.concept} />
                </span>
              </div>
            ))}
          </div>

          {outcome.result.potentialInaccuracies.length > 0 && (
            <div className={styles.inaccuraciesBlock}>
              <p className={styles.blockLabel}>! Potentially inaccurate</p>
              <ul className={styles.inaccuraciesList}>
                {outcome.result.potentialInaccuracies.map((text, index) => (
                  <li key={index}>
                    <InlineCode text={text} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.improveBlock}>
            <p className={styles.blockLabel}>What to improve</p>
            <p className={styles.improveText}>
              <InlineCode text={outcome.result.improvementSuggestion} />
            </p>
          </div>

          <p className={styles.reviseHint}>Revise my explanation — edit your answer above and check again when you're ready.</p>
        </div>
      )}

      {outcome?.status === "unavailable" && (
        <div className={styles.placeholderCard}>
          <p className={styles.placeholderTitle}>AI-supported feedback placeholder</p>
          <p className={styles.placeholderText}>
            In the final version, your explanation will be compared with the predefined expected concepts for this
            question. The system will identify addressed, partly addressed, or missing ideas and suggest one thing to
            improve.
          </p>
          {/* Vite sets import.meta.env.DEV to false in a production build —
              the build study participants run — so this line disappears
              there automatically without a separate flag to remember to flip. */}
          {import.meta.env.DEV && <p className={styles.devNote}>LLM comparison not connected (no VITE_GEMINI_API_KEY set).</p>}
        </div>
      )}

      {outcome?.status === "error" && !proceedWithoutAi && (
        <div className={styles.errorCard}>
          <p className={styles.errorTitle}>We couldn't check this explanation right now.</p>
          <div className={styles.errorActions}>
            <button type="button" className={styles.secondaryButton} onClick={handleCheck} disabled={checking}>
              Try again
            </button>
            <button type="button" className={styles.secondaryButton} onClick={handleProceedWithoutAi}>
              Continue without AI feedback
            </button>
          </div>
        </div>
      )}

      {outcome?.status === "error" && proceedWithoutAi && (
        <p className={styles.instruction}>Continuing without AI feedback for this question.</p>
      )}

      <div className={styles.completeActions}>
        <button type="button" className={styles.primaryButton} onClick={() => onComplete(answer)} disabled={!canComplete}>
          {completeLabel}
        </button>
      </div>
    </div>
  );
}
