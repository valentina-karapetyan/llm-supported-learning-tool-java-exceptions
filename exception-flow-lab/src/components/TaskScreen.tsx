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
import { CodeBlock } from "./CodeBlock";
import { TaskRenderer } from "./TaskRenderer";
import { ConfidenceSelector } from "./ConfidenceSelector";
import { ArticulationBox } from "./ArticulationBox";
import styles from "./TaskScreen.module.css";

export interface TaskSubmission {
  response: TaskResponseData;
  confidence: ConfidenceLevel;
  articulationText: string;
}

export interface TaskScreenProps {
  task: Task;
  onSubmit: (submission: TaskSubmission) => void;
  eyebrow?: React.ReactNode;
}

type Step = "answering" | "confidence" | "articulate";

export function TaskScreen({ task, onSubmit, eyebrow }: TaskScreenProps) {
  const [step, setStep] = useState<Step>("answering");
  const [response, setResponse] = useState<TaskResponseData | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceLevel | null>(null);
  const [articulationText, setArticulationText] = useState("");

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
      {eyebrow}
      <p className={styles.caseLabel}>{task.caseLabel}</p>
      <h1 className={styles.title}>{task.title}</h1>
      <CodeBlock code={task.code} />
      <p className={styles.question}>{task.question}</p>

      {step === "answering" && <TaskRenderer task={task} onSubmit={handleAnswerSubmit} />}

      {step === "confidence" && (
        <div className={styles.stepCard}>
          <ConfidenceSelector value={confidence} onChange={setConfidence} />
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
