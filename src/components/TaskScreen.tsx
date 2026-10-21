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
//
// Module 5's mixed cases render through this same component. They pass no
// `stage` (there is no diagnostic/transfer distinction in that flow) and
// supply their own `caseTrail` instead — everything else on this screen
// (case label, title, orientation note, code, hierarchy, question,
// TaskRenderer) is already content-driven and needed no change.

import type { Task, TaskResponseData } from "../types/content";
import type { TaskStage } from "../state/screenReducer";
import { CodeBlock } from "./CodeBlock";
import { ExceptionHierarchy } from "./ExceptionHierarchy";
import { CallChainTrail } from "./CallChainTrail";
import { TaskRenderer } from "./TaskRenderer";
import { CaseNav, type CaseProgressStage, type CaseTrail } from "./CaseNav";
import { InlineCode } from "./InlineCode";
import styles from "./TaskScreen.module.css";

export interface TaskSubmission {
  response: TaskResponseData;
}

export interface TaskScreenProps {
  task: Task;
  // Omitted by flows that have no diagnostic/transfer distinction (Module 5's
  // mixed cases), which supply `caseTrail` instead.
  stage?: TaskStage;
  // Optional so a read-only review screen (see ReviewAnswer.tsx, App.tsx's
  // task_review case) can render this screen with nothing meaningful to
  // submit — every interactive caller still always passes a real function.
  onSubmit?: (submission: TaskSubmission) => void;
  onBackToMap: () => void;
  eyebrow?: React.ReactNode;
  // Explicit CaseNav trail, overriding the Task → Feedback → Transfer one
  // derived from `stage` below.
  caseTrail?: CaseTrail;
  // Overrides CaseNav's default "← All lessons" back-link text — e.g.
  // task_review uses "← Back to lesson overview" instead.
  backLabel?: string;
  // Replaces the default interactive <TaskRenderer> with arbitrary content —
  // used by task_review to show the learner's past answer (read-only)
  // instead of a fresh answering widget. Every other caller omits this and
  // gets the normal interactive TaskRenderer.
  answerSlot?: React.ReactNode;
}

export function TaskScreen({ task, stage, onSubmit, onBackToMap, eyebrow, caseTrail, backLabel, answerSlot }: TaskScreenProps) {
  // Lightweight per-case progress indicator (build spec's Case 1 revision,
  // §10, since simplified to TASK → FEEDBACK → TRANSFER), opted into by
  // Module 1 and (per the Case 3 build) Module 3 — Module 2 deliberately
  // kept the plain bar with no trail, so every other module (including it)
  // renders with no trail at all.
  const progressStage: CaseProgressStage | undefined =
    stage && (task.moduleId === "module-1" || task.moduleId === "module-3")
      ? stage === "transfer"
        ? "transfer"
        : "task"
      : undefined;

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

  // Mixed Case Review's only framing sentence (build spec's polish pass) —
  // signals that a case may combine rules from more than one earlier case
  // file without naming which ones, so recognizing which rules apply stays
  // the exercise.
  const showMixedPracticeIntro = task.moduleId === "module-5";

  function handleAnswerSubmit(response: TaskResponseData) {
    onSubmit?.({ response });
  }

  return (
    <div className={styles.wrapper}>
      <CaseNav onBackToMap={onBackToMap} progressStage={progressStage} trail={caseTrail} backLabel={backLabel} />
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
          <InlineCode text="The code below needs `catch` clauses for related exception types. Arrange them into an order that results in valid Java code." />
        </p>
      )}
      {showMixedPracticeIntro && <p className={styles.intro}>Several rules may matter here.</p>}
      {/* Generic orientation slot for any module (see Task.orientationNote) —
          new modules should prefer authoring this over adding another
          hardcoded showXIntro conditional like the one above. */}
      {task.orientationNote && (
        <p className={styles.intro}>
          <InlineCode text={task.orientationNote} />
        </p>
      )}
      {/* data-tour-id: a plain marker attribute GuidedTour.tsx queries for
          by CSS selector — inert otherwise, present regardless of module. */}
      <div data-tour-id="task-code">
        <CodeBlock code={task.code} />
      </div>
      {task.hierarchy && <ExceptionHierarchy nodes={task.hierarchy} />}
      {task.callChainTrail && <CallChainTrail steps={task.callChainTrail} />}

      <p className={styles.question}>
        <InlineCode text={task.question} />
      </p>
      {answerSlot ?? <TaskRenderer task={task} onSubmit={handleAnswerSubmit} />}
    </div>
  );
}
