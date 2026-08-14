// src/components/tasks/HandlerRefactoringTask.tsx
//
// Single-select among refactor-code options — same interaction shape as
// HandlerSelectionTask, but each option shows a code snippet instead of a
// short label.

import { useState } from "react";
import type { HandlerRefactoringData } from "../../types/content";
import styles from "./SelectionTask.module.css";

export interface HandlerRefactoringTaskProps {
  data: HandlerRefactoringData;
  onSubmit: (selectedOptionId: string) => void;
  disabled?: boolean;
}

export function HandlerRefactoringTask({ data, onSubmit, disabled }: HandlerRefactoringTaskProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className={styles.wrapper}>
      <ul className={styles.options} role="radiogroup" aria-label="Refactor options">
        {data.options.map((option) => {
          const isSelected = selectedId === option.id;
          return (
            <li key={option.id}>
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={[styles.option, isSelected ? styles.optionSelected : ""].join(" ")}
                onClick={() => !disabled && setSelectedId(option.id)}
                disabled={disabled}
              >
                <span className={styles.optionMarker} aria-hidden="true">
                  {isSelected ? "●" : ""}
                </span>
                <span className={styles.optionBody}>
                  <span className={styles.optionLabel}>{option.label}</span>
                  <pre className={styles.optionCode}>
                    <code>{option.code}</code>
                  </pre>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={disabled || !selectedId}
          onClick={() => selectedId && onSubmit(selectedId)}
        >
          Submit answer
        </button>
      </div>
    </div>
  );
}
