// src/components/ReviewAnswer.tsx
//
// Renders in TaskScreen's `answerSlot` for a reviewed task (build spec §1),
// replacing the normal interactive TaskRenderer with a read-only summary of
// what the learner actually submitted — reviewing a task must never reset
// or overwrite its recorded result, so this never dispatches a submission.
//
// "View previous feedback" is local component state, not a reducer screen:
// feedback is only ever reachable as a sub-view of an already-open task
// review, never as its own item in ModuleReview's menu.

import { useState } from "react";
import type { Task, TaskResponseData } from "../types/content";
import type { TaskProgress } from "../state/progressStore";
import { AnswerDiff } from "./AnswerDiff";
import { FeedbackCard } from "./FeedbackCard";
import styles from "./ReviewAnswer.module.css";

export interface ReviewAnswerProps {
  task: Task;
  taskProgress: TaskProgress;
}

export function ReviewAnswer({ task, taskProgress }: ReviewAnswerProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  // selectedAnswer is stored as `unknown` (see progressStore.ts) but is
  // always written from a real TaskResponseData at submission time.
  const response = taskProgress.selectedAnswer as TaskResponseData;

  return (
    <div className={styles.wrapper}>
      <div className={[styles.badge, taskProgress.wasCorrect ? styles.badgeCorrect : styles.badgeIncorrect].join(" ")}>
        {taskProgress.wasCorrect ? "✓ You answered this correctly" : "↺ You answered this incorrectly"}
      </div>

      <AnswerDiff answer={task.answer} response={response} />

      <button type="button" className={styles.toggle} onClick={() => setShowFeedback((prev) => !prev)}>
        {showFeedback ? "Hide previous feedback" : "View previous feedback"}
      </button>

      {showFeedback && (
        <div className={styles.feedback}>
          <FeedbackCard
            feedback={task.feedback}
            wasCorrect={taskProgress.wasCorrect}
            code={task.code}
            replayScript={task.replayScript}
            replayCallout={task.replayCallout}
            resolvedCode={task.resolvedCode}
            hierarchy={task.hierarchy}
            propagationTrace={task.propagationTrace}
            answer={task.answer}
            response={response}
          />
        </div>
      )}
    </div>
  );
}
