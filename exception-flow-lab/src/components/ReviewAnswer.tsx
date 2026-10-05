// src/components/ReviewAnswer.tsx
//
// Renders in TaskScreen's `answerSlot` for a reviewed task (build spec §1),
// replacing the normal interactive TaskRenderer with a read-only summary of
// what the learner actually submitted.
//
// "Try this case again" switches to a practice run of the same task: a
// fresh TaskRenderer, then the same in-place red/green check and explanation
// as the real flow. It's local component state only and never dispatches or
// records anything — the originally recorded answer stays exactly as it was.

import { useState } from "react";
import type { Task, TaskResponseData } from "../types/content";
import type { TaskProgress } from "../state/progressStore";
import { evaluateAnswer } from "../state/evaluateAnswer";
import { AnswerDiff } from "./AnswerDiff";
import { CheckedAnswer } from "./CheckedAnswer";
import { FeedbackCard } from "./FeedbackCard";
import { TaskRenderer } from "./TaskRenderer";
import styles from "./ReviewAnswer.module.css";

export interface ReviewAnswerProps {
  task: Task;
  taskProgress: TaskProgress;
}

type Mode =
  | { kind: "review" }
  | { kind: "practice"; run: number }
  | {
      kind: "practice_result";
      run: number;
      response: TaskResponseData;
      explained: boolean;
    };

export function ReviewAnswer({ task, taskProgress }: ReviewAnswerProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [mode, setMode] = useState<Mode>({ kind: "review" });
  // selectedAnswer is stored as `unknown` (see progressStore.ts) but is
  // always written from a real TaskResponseData at submission time.
  const response = taskProgress.selectedAnswer as TaskResponseData;

  if (mode.kind === "practice") {
    return (
      <div className={styles.wrapper}>
        <p className={styles.practiceNote}>Practice run. Your original answer stays saved.</p>
        <TaskRenderer
          key={mode.run}
          task={task}
          onSubmit={(practiceResponse) =>
            setMode({
              kind: "practice_result",
              run: mode.run,
              response: practiceResponse,
              explained: false,
            })
          }
        />
        <button type="button" className={styles.toggle} onClick={() => setMode({ kind: "review" })}>
          Cancel
        </button>
      </div>
    );
  }

  if (mode.kind === "practice_result") {
    const correct = evaluateAnswer(task.answer, mode.response);
    return (
      <div className={styles.wrapper}>
        {!mode.explained ? (
          <CheckedAnswer task={task} response={mode.response} onContinue={() => setMode({ ...mode, explained: true })} />
        ) : (
          <div className={styles.feedback}>
            <FeedbackCard
              feedback={task.feedback}
              wasCorrect={correct}
              code={task.code}
              replayScript={task.replayScript}
              replayCallout={task.replayCallout}
              replayHeading={task.replayHeading}
              resolvedCode={task.resolvedCode}
              hierarchy={task.hierarchy}
              propagationTrace={task.propagationTrace}
              answer={task.answer}
              response={mode.response}
            />
          </div>
        )}
        <div className={styles.actions}>
          <button type="button" className={styles.toggle} onClick={() => setMode({ kind: "practice", run: mode.run + 1 })}>
            ↻ Try again
          </button>
          <button type="button" className={styles.toggle} onClick={() => setMode({ kind: "review" })}>
            Back to my saved answer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={[styles.badge, taskProgress.wasCorrect ? styles.badgeCorrect : styles.badgeIncorrect].join(" ")}>
        {taskProgress.wasCorrect ? "✓ You answered this correctly" : "✗ You answered this incorrectly"}
      </div>

      <AnswerDiff answer={task.answer} response={response} />

      <div className={styles.actions}>
        <button type="button" className={styles.toggle} onClick={() => setShowFeedback((prev) => !prev)}>
          {showFeedback ? "Hide explanation" : "Show explanation"}
        </button>
        <button type="button" className={styles.toggle} onClick={() => setMode({ kind: "practice", run: 0 })}>
          ↻ Try this case again
        </button>
      </div>

      {showFeedback && (
        <div className={styles.feedback}>
          <FeedbackCard
            feedback={task.feedback}
            wasCorrect={taskProgress.wasCorrect}
            code={task.code}
            replayScript={task.replayScript}
            replayCallout={task.replayCallout}
            replayHeading={task.replayHeading}
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
