// src/components/TaskScreen.tsx
//
// Screen C (Task). Generic across diagnostic and transfer tasks — stage-
// specific framing (e.g. "one more try, comparable case") is injected via
// the optional `eyebrow` slot by whoever renders this (App for the
// diagnostic, TransferTaskFlow for transfer attempts), so this component
// itself doesn't need to know about stage/attempt at all.
//
// Order matters here per the build spec: answer → confidence → (optional)
// self-articulation → only then does the parent get told to show feedback.

import { useState } from "react";
import type { ConfidenceLevel, Task, TaskResponseData } from "../types/content";
import type { TaskStage } from "../state/screenReducer";
import { CodeBlock } from "./CodeBlock";
import { ExceptionHierarchy } from "./ExceptionHierarchy";
import { TaskRenderer } from "./TaskRenderer";
import { ConfidenceSelector } from "./ConfidenceSelector";
import { ArticulationBox } from "./ArticulationBox";
import { CaseNav, type CaseProgressStage } from "./CaseNav";
import styles from "./TaskScreen.module.css";

export interface TaskSubmission {
  response: TaskResponseData;
  confidence: ConfidenceLevel;
  articulationText: string;
}

export interface TaskScreenProps {
  task: Task;
  stage: TaskStage;
  onSubmit: (submission: TaskSubmission) => void;
  onBackToMap: () => void;
  eyebrow?: React.ReactNode;
}

type Step = "answering" | "confidence" | "articulate";

export function TaskScreen({ task, stage, onSubmit, onBackToMap, eyebrow }: TaskScreenProps) {
  const [step, setStep] = useState<Step>("answering");
  const [response, setResponse] = useState<TaskResponseData | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceLevel | null>(null);
  const [articulationText, setArticulationText] = useState("");

  // Lightweight Case 1 progress indicator (build spec's Case 1 revision,
  // §10) — only shown for module-1, which is the only module this trail was
  // authored for; every other module renders the bar with no trail at all.
  const progressStage: CaseProgressStage | undefined =
    task.moduleId === "module-1" ? (stage === "transfer" ? "transfer" : step === "articulate" ? "reflection" : "prediction") : undefined;

  // Framing sentence for the prediction step — says what the learner is
  // looking at ("code runs once, predict the events, order them") without
  // explaining the control-flow rule itself, which would give the answer
  // away. Same reasoning as the trail above: authored for module-1's
  // execution_trace tasks specifically, so it's gated the same way, and it
  // only makes sense while the task is still the thing on screen.
  const showIntro = task.moduleId === "module-1" && step === "answering";

  // Case 2's own orientation sentence (build spec's Case 2 revision) —
  // orients the learner to "this needs reordering" without explaining the
  // specificity rule itself, which would give the answer away. Scoped to
  // catch_order tasks specifically (the reordering interaction) rather than
  // every module-2 task, since the transfer tasks ask a different kind of
  // question and get their framing from `task.question` instead.
  const showCatchOrderIntro = task.moduleId === "module-2" && task.answer.type === "catch_order" && step === "answering";

  function handleAnswerSubmit(r: TaskResponseData) {
    setResponse(r);
    setStep("confidence");
  }

  function handleConfidenceNext() {
    if (!confidence) return;
    setStep("articulate");
  }

  function handleSeeFeedback() {
    if (!response || !confidence) return;
    onSubmit({ response, confidence, articulationText });
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
      <CodeBlock code={task.code} />
      {task.hierarchy && <ExceptionHierarchy nodes={task.hierarchy} />}

      {/* The task question ("Drag the events...") only makes sense while the
          task itself is still on screen — once the learner has submitted an
          answer and moved on to confidence/reflection, that instruction is
          stale and would misleadingly suggest the task is still active. */}
      {step === "answering" && (
        <>
          <p className={styles.question}>{task.question}</p>
          <TaskRenderer task={task} onSubmit={handleAnswerSubmit} />
        </>
      )}

      {step === "confidence" && (
        <div className={styles.stepCard}>
          <ConfidenceSelector
            value={confidence}
            onChange={setConfidence}
            prompt="Before seeing the feedback, how confident are you in your answer?"
          />
          <div className={styles.stepActions}>
            <button type="button" className={styles.primaryButton} disabled={!confidence} onClick={handleConfidenceNext}>
              Next
            </button>
          </div>
        </div>
      )}

      {step === "articulate" && (
        <div className={styles.stepCard}>
          <ArticulationBox prompt={task.articulationPrompt} value={articulationText} onChange={setArticulationText} />
          <div className={styles.stepActions}>
            <button type="button" className={styles.primaryButton} onClick={handleSeeFeedback}>
              See feedback
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
