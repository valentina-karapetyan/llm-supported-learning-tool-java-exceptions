// src/components/tasks/CallChainTask.tsx
//
// Single-select: the learner picks which step in a displayed call chain
// actually handles the exception.

import { useState } from "react";
import type { CallChainData } from "../../types/content";
import styles from "./SelectionTask.module.css";

export interface CallChainTaskProps {
  data: CallChainData;
  onSubmit: (selectedStepId: string) => void;
  disabled?: boolean;
}

export function CallChainTask({ data, onSubmit, disabled }: CallChainTaskProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className={styles.wrapper}>
      <ol className={styles.options} role="radiogroup" aria-label="Call chain steps">
        {data.steps.map((step, index) => {
          const isSelected = selectedId === step.id;
          return (
            <li key={step.id}>
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={[styles.option, isSelected ? styles.optionSelected : ""].join(" ")}
                onClick={() => !disabled && setSelectedId(step.id)}
                disabled={disabled}
              >
                <span className={styles.optionMarker} aria-hidden="true">
                  {index + 1}
                </span>
                <span className={styles.optionBody}>
                  <span className={styles.optionLabel}>
                    <code>{step.methodName}</code>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={disabled || !selectedId}
          onClick={() => selectedId && onSubmit(selectedId)}
        >
          Check answer
        </button>
      </div>
    </div>
  );
}
