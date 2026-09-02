// src/components/TaskScreen.tsx
//
// Screen C (Task). Generic across diagnostic and transfer tasks — stage-
// specific framing (e.g. "one more try, comparable case") is injected via
// the optional `eyebrow` slot by whoever renders this (App for the
// diagnostic, TransferTaskFlow for transfer attempts), so this component
// itself doesn't need to know about stage/attempt at all.
//
// Flow is TASK → FEEDBACK → TRANSFER (per the latest supervisor revision):
// submitting an answer here goes straight to the parent's Feedback screen —
// no confidence step, no self-articulation step in between anymore.

import type { Task, TaskResponseData } from "../types/content";
import type { TaskStage } from "../state/screenReducer";
import { CodeBlock } from "./CodeBlock";
import { ExceptionHierarchy } from "./ExceptionHierarchy";
import { CallChainTrail } from "./CallChainTrail";
import { TaskRenderer } from "./TaskRenderer";
import { CaseNav, type CaseProgressStage } from "./CaseNav";
import { InlineCode } from "./InlineCode";
import styles from "./TaskScreen.module.css";

export interface TaskSubmission {
  response: TaskResponseData;
}

export interface TaskScreenProps {
  task: Task;
  stage: TaskStage;
  onSubmit: (submission: TaskSubmission) => void;
  onBackToMap: () => void;
  eyebrow?: React.ReactNode;
}

export function TaskScreen({ task, stage, onSubmit, onBackToMap, eyebrow }: TaskScreenProps) {
  // Lightweight per-case progress indicator (build spec's Case 1 revision,
  // §10, since simplified to TASK → FEEDBACK → TRANSFER), opted into by
  // Module 1 and (per the Case 3 build) Module 3 — Module 2 deliberately
  // kept the plain bar with no trail, so every other module (including it)
  // renders with no trail at all.
  const progressStage: CaseProgressStage | undefined =
    task.moduleId === "module-1" || task.moduleId === "module-3" ? (stage === "transfer" ? "transfer" : "task") : undefined;

  // Case 2's own orientation sentence (build spec's Case 2 revision) —
  // orients the learner to "this needs reordering" without explaining the
  // specificity rule itself, which would give the answer away. Scoped to
  // catch_order tasks specifically (the reordering interaction) rather than
  // every module-2 task, since the transfer tasks ask a different kind of
  // question and get their framing from `task.question` instead.
  const showCatchOrderIntro = task.moduleId === "module-2" && task.answer.type === "catch_order";

  // Short, generic framing sentence for Module 1's execution-trace tasks —
  // says what the learner is looking at ("code runs once, figure out which
  // events occur") without explaining the control-flow rule itself, which
  // would give the answer away. Distinct from `task.question` below: that's
  // the operational instruction for the trace-builder widget itself.
  const showIntro = task.moduleId === "module-1";

  function handleAnswerSubmit(response: TaskResponseData) {
    onSubmit({ response });
  }

  return (
    <div className={styles.wrapper}>
      <CaseNav onBackToMap={onBackToMap} progressStage={progressStage} />
      {eyebrow}
      <p className={styles.caseLabel}>{task.caseLabel}</p>
      <h1 className={styles.title}>{task.title}</h1>
      {showIntro && (
        <p className={styles.intro}>
          The code below is executed once. Predict which events occur during this execution and place them in the order they happen.
        </p>
      )}
      {showCatchOrderIntro && (
        <p className={styles.intro}>
          The code below needs catch clauses for related exception types. Arrange them into an order that results in valid Java code.
        </p>
      )}
      {/* Generic orientation slot for any module (see Task.orientationNote) —
          new modules should prefer authoring this over adding another
          hardcoded showXIntro conditional like the one above. */}
      {task.orientationNote && <p className={styles.intro}>{task.orientationNote}</p>}
      <CodeBlock code={task.code} />
      {task.hierarchy && <ExceptionHierarchy nodes={task.hierarchy} />}
      {task.callChainTrail && <CallChainTrail steps={task.callChainTrail} />}

      <p className={styles.question}>
        <InlineCode text={task.question} />
      </p>
      <TaskRenderer task={task} onSubmit={handleAnswerSubmit} />
    </div>
  );
}
