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
  onSubmit: (submission: TaskSubmission) => void;
}

export function TransferTaskFlow({ task, attempt, onSubmit }: TransferTaskFlowProps) {
  return (
    <TaskScreen
      task={task}
      onSubmit={onSubmit}
      eyebrow={
        <p className={styles.eyebrow}>
          {attempt > 1
            ? "One more try — here's a comparable case. Same rule, different scenario."
            : "Transfer task — apply the same rule to a new case."}
        </p>
      }
    />
  );
}
