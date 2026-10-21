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
//   - "ok": real feedback, rendered below as one card grouped by what the
//     learner actually wrote (what's covered, what's missing, what's
//     inaccurate, what to revise next) rather than one row per criterion —
//     never a grade, see RetrievalComparisonResult's doc comment in
//     types/content.ts.
//   - "unavailable": no Gemini key configured. Expected, silent, renders the
//     same static placeholder card this screen has always shown.
//   - "error": a live request was actually attempted and failed (timeout,
//     empty/blocked response, exhausted output tokens, malformed JSON). This
//     is new — previously indistinguishable from "unavailable" — and shows
//     its own retry/continue card instead of silently reusing the
//     placeholder.
//
// "Complete case file" / "Complete learning lab" unlocks once the learner has
// gotten a real "ok" or "unavailable" result, or explicitly chosen to
// continue past an "error" — still no grading, just makes sure the recall
// step isn't skippable in one click, and that a failed request specifically
// can't silently strand the learner either.

import { useRef, useState } from "react";
import type { RetrievalComparisonResult, RetrievalQuestion } from "../types/content";
import { retrievalComparisonService, type RetrievalCheckOutcome } from "../llm/retrievalComparisonService";
import { InlineCode } from "./InlineCode";
import styles from "./RetrievalPractice.module.css";

// Renders one RetrievalComparisonResult as grouped, learner-facing sections
// instead of one status row per required concept — the mechanical
// "Missing … / Missing … / Missing …" rubric list this replaced. Sections
// that have nothing to say are omitted entirely rather than shown empty, and
// a good answer gets an affirmation instead of a manufactured "improvement".
function RetrievalFeedbackCard({ result }: { result: RetrievalComparisonResult }) {
  const covered = result.criteria.filter((c) => c.status === "addressed");
  // Concepts that still need work, most-important-first — requiredConcepts
  // is authored in that order and criteria mirrors it 1:1.
  const needsWork = result.criteria.filter((c) => c.status !== "addressed");
  const nothingLeftToRevise = needsWork.length === 0 && result.inaccuracies.length === 0;

  return (
    <div className={styles.resultCard}>
      <p className={styles.resultHeading}>Feedback on your explanation</p>
      <p className={styles.overallFeedback}>
        <InlineCode text={result.overallFeedback} />
      </p>

      {covered.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>What you already covered</p>
          <ul className={styles.sectionList}>
            {covered.map((criterion, index) => (
              <li key={index}>
                <InlineCode text={criterion.feedback} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {needsWork.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>What is still missing</p>
          <ul className={styles.sectionList}>
            {needsWork.map((criterion, index) => (
              <li key={index}>
                <InlineCode text={criterion.feedback} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.inaccuracies.length > 0 && (
        <div className={[styles.section, styles.checkSection].join(" ")}>
          <p className={styles.sectionLabel}>Check this idea</p>
          <ul className={styles.sectionList}>
            {result.inaccuracies.map((inaccuracy, index) => (
              <li key={index}>
                <InlineCode text={inaccuracy.correction} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.revisionFocus ? (
        <div className={[styles.section, styles.revisionSection].join(" ")}>
          <p className={styles.sectionLabel}>Revision focus</p>
          <p className={styles.revisionText}>
            <InlineCode text={result.revisionFocus} />
          </p>
        </div>
      ) : (
        nothingLeftToRevise && <p className={styles.allGoodText}>Your explanation covers the key points.</p>
      )}

      <p className={styles.reviseHint}>Edit your explanation above and check it again when you are ready.</p>
    </div>
  );
}

export interface RetrievalPracticeProps {
  retrievalQuestion: RetrievalQuestion;
  // "Finish lesson" everywhere except Module 5, which uses "Finish the
  // lab" — passed in rather than hardcoded here so this component
  // stays module-agnostic.
  completeLabel: string;
  // Receives the learner's current explanation text so the caller can
  // persist it (build spec §18's Concept Journal entry) before advancing —
  // whatever is in the textarea at this point already reflects every
  // revision, so it's naturally their final answer.
  onComplete: (answer: string) => void;
}

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
      <p className={styles.eyebrow}>Final question</p>
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

      {outcome?.status === "ok" && <RetrievalFeedbackCard result={outcome.result} />}

      {outcome?.status === "unavailable" && (
        <div className={styles.placeholderCard}>
          <p className={styles.placeholderTitle}>AI-supported feedback placeholder</p>
          <p className={styles.placeholderText}>
            In the final version, your explanation will be compared with the predefined expected concepts for this
            question, and you'll get feedback on what you covered, what's still missing, and anything worth
            double-checking.
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
