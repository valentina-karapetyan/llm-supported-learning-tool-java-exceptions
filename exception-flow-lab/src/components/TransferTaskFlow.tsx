// src/components/TransferTaskFlow.tsx
//
// Screen F (Transfer Task). Thin wrapper around the generic TaskScreen that
// adds transfer-specific framing copy — which task variant to serve (the
// baseline vs. the flow-adaptive high-confidence variant) and the one
// allowed retry are resolved by the caller (App, via content/modules.ts
// helpers); this component's own job is just the transfer-specific chrome,
// so TaskScreen itself stays stage-agnostic.

import type { Task } from "../types/content";
import { TaskScreen, type TaskSubmission } from "./TaskScreen";
import styles from "./TransferTaskFlow.module.css";

export interface TransferTaskFlowProps {
  task: Task;
  attempt: number;
  // Whether this retry actually serves a different task than the previous
  // attempt (true for modules with a stretch variant authored, like Module
  // 1; undefined/false otherwise, e.g. Module 2). Lets the copy stay
  // accurate instead of promising "a different case" it might not deliver.
  isDistinctRetryVariant?: boolean;
  onSubmit: (submission: TaskSubmission) => void;
}

export function TransferTaskFlow({ task, attempt, isDistinctRetryVariant, onSubmit }: TransferTaskFlowProps) {
  const eyebrowText =
    attempt > 1
      ? isDistinctRetryVariant
        ? "One more try — here's a genuinely different case. Same rule."
        : "One more try — look at it again. Same rule as before."
      : "Transfer task — apply the same rule to a new case.";

  return <TaskScreen task={task} onSubmit={onSubmit} eyebrow={<p className={styles.eyebrow}>{eyebrowText}</p>} />;
}
