// src/components/FeedbackCard.tsx
//
// Screen D (Feedback). Shows correctness, the learner's own articulation
// next to the key rule, and the ExecutionReplay visualizer directly under
// the key rule card, per the build spec.

import type { Feedback, ReplayStep, TaskAnswerData, TaskResponseData } from "../types/content";
import { ExecutionReplay } from "./ExecutionReplay";
import { AnswerDiff } from "./AnswerDiff";
import styles from "./FeedbackCard.module.css";

export interface FeedbackCardProps {
  feedback: Feedback;
  wasCorrect: boolean;
  articulationText: string;
  code: string;
  replayScript: ReplayStep[];
  answer: TaskAnswerData;
  response: TaskResponseData;
}

export function FeedbackCard({ feedback, wasCorrect, articulationText, code, replayScript, answer, response }: FeedbackCardProps) {
  const title = wasCorrect ? feedback.correctTitle : feedback.incorrectTitle;
  const explanation = wasCorrect ? feedback.correctExplanation : feedback.incorrectExplanation;

  return (
    <div className={styles.wrapper}>
      <div className={[styles.banner, wasCorrect ? styles.bannerCorrect : styles.bannerIncorrect].join(" ")}>
        <span className={styles.bannerIcon} aria-hidden="true">
          {wasCorrect ? "✓" : "↺"}
        </span>
        <div>
          <h2 className={styles.bannerTitle}>{title}</h2>
          <p className={styles.bannerExplanation}>{explanation}</p>
        </div>
      </div>

      {!wasCorrect && (
        <div className={styles.diffCard}>
          <p className={styles.diffLabel}>What was actually off</p>
          <AnswerDiff answer={answer} response={response} />
        </div>
      )}

      <div className={styles.ruleCard}>
        {articulationText.trim() && (
          <div className={styles.articulationEcho}>
            <p className={styles.articulationLabel}>Your reflection — never graded, just for you:</p>
            <p className={styles.articulationText}>“{articulationText.trim()}”</p>
          </div>
        )}
        <p className={styles.ruleLabel}>Key rule</p>
        <p className={styles.ruleText}>{feedback.keyRule}</p>
      </div>

      <ExecutionReplay code={code} replayScript={replayScript} />
    </div>
  );
}
