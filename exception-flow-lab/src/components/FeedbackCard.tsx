// src/components/FeedbackCard.tsx
//
// Screen D (Feedback). Shows correctness, the key rule, and the
// ExecutionReplay visualizer directly under the key rule card, per the
// build spec.
//
// ExecutionReplay only renders when a task actually has a replayScript, and
// it's given resolvedCode when present (falling back to code) rather than
// always the plain, possibly pre-answer `code` — see Task.replayScript /
// Task.resolvedCode for why a script can be either a real runtime trace or a
// compile-time reachability check, and Task.replayHeading for how a task
// tells ExecutionReplay which one it's showing. Module 4's design tasks
// still have no single representative code-and-order story to animate at
// all, so they reasonably omit replayScript entirely and just show plain
// code instead.

import type { Feedback, HierarchyNode, PropagationStep, ReplayStep, TaskAnswerData, TaskResponseData } from "../types/content";
import { hasReplayScript } from "../types/content";
import { CodeBlock } from "./CodeBlock";
import { ExecutionReplay } from "./ExecutionReplay";
import { PropagationReplay } from "./PropagationReplay";
import { ExceptionHierarchy } from "./ExceptionHierarchy";
import { AnswerDiff } from "./AnswerDiff";
import { InlineCode } from "./InlineCode";
import styles from "./FeedbackCard.module.css";

export interface FeedbackCardProps {
  feedback: Feedback;
  wasCorrect: boolean;
  code: string;
  replayScript?: ReplayStep[];
  // Per-task override for ExecutionReplay's throw -> catch callout; see
  // Task.replayCallout. Ignored by tasks with no replayScript.
  replayCallout?: string;
  // Per-task override for ExecutionReplay's heading; see Task.replayHeading.
  // Ignored by tasks with no replayScript.
  replayHeading?: string;
  // Hand-authored "solved" code. Falls back to `code` if absent. Shown for a
  // task with no replayScript instead of the plain (possibly still-blank)
  // `code`, and also as ExecutionReplay's own code when a task has both —
  // see Task.resolvedCode.
  resolvedCode?: string;
  // Shown separately below the code, never spliced into it — see
  // Task.hierarchy. Optional; most tasks omit it.
  hierarchy?: HierarchyNode[];
  // Case 3's main visualization (PropagationReplay) — takes priority over
  // the replayScript/resolvedCode fallback below when present. See
  // Task.propagationTrace.
  propagationTrace?: PropagationStep[];
  answer: TaskAnswerData;
  response: TaskResponseData;
}

export function FeedbackCard({
  feedback,
  wasCorrect,
  code,
  replayScript,
  replayCallout,
  replayHeading,
  resolvedCode,
  hierarchy,
  propagationTrace,
  answer,
  response,
}: FeedbackCardProps) {
  // For a wrong answer, prefer the rule-based title/explanation computed
  // from what the learner actually submitted (see Feedback.getIncorrectTitle
  // / getIncorrectExplanation) — still 100% predefined copy, just selected
  // by the learner's specific mistake instead of always showing the same
  // generic banner. Falls back to the static incorrectTitle/incorrectExplanation
  // for every task that doesn't supply one.
  const title = wasCorrect ? feedback.correctTitle : (feedback.getIncorrectTitle?.(response) ?? feedback.incorrectTitle);
  const explanation = wasCorrect
    ? feedback.correctExplanation
    : (feedback.getIncorrectExplanation?.(response) ?? feedback.incorrectExplanation);

  return (
    <div className={styles.wrapper}>
      <div className={[styles.banner, wasCorrect ? styles.bannerCorrect : styles.bannerIncorrect].join(" ")}>
        <span className={styles.bannerIcon} aria-hidden="true">
          {wasCorrect ? "✓" : "↺"}
        </span>
        <div>
          <h2 className={styles.bannerTitle}>
            <InlineCode text={title} />
          </h2>
          <p className={styles.bannerExplanation}>
            <InlineCode text={explanation} />
          </p>
        </div>
      </div>

      {!wasCorrect && (
        <div className={styles.diffCard}>
          <p className={styles.diffLabel}>Compare your trace</p>
          <AnswerDiff answer={answer} response={response} />
        </div>
      )}

      {/* Modules 1-4 all author a key rule — each of their tasks teaches one
          for the first time. Module 5 deliberately authors none: it's
          retrieval practice over rules already covered, and restating them
          in a card here would turn it back into instruction. */}
      {feedback.keyRule && (
        <div className={styles.ruleCard}>
          <p className={styles.ruleLabel}>Key rule</p>
          <p className={styles.ruleText}>
            <InlineCode text={feedback.keyRule} />
          </p>
        </div>
      )}

      {/* One-time term definition (build spec §3) — authored on exactly the
          two tasks that first need it (see Feedback.glossaryNote), never
          repeated afterward. */}
      {feedback.glossaryNote && (
        <p className={styles.glossaryNote}>
          <strong>{feedback.glossaryNote.term}</strong>: {feedback.glossaryNote.definition}
        </p>
      )}

      {hasReplayScript(replayScript) ? (
        <ExecutionReplay code={resolvedCode ?? code} replayScript={replayScript} callout={replayCallout} heading={replayHeading} />
      ) : propagationTrace && propagationTrace.length > 0 ? (
        <PropagationReplay code={resolvedCode ?? code} trace={propagationTrace} />
      ) : (
        <div className={styles.staticCodeSection}>
          <h3 className={styles.staticCodeHeading}>The code</h3>
          <CodeBlock code={resolvedCode ?? code} />
        </div>
      )}
      {hierarchy && <ExceptionHierarchy nodes={hierarchy} />}
    </div>
  );
}
