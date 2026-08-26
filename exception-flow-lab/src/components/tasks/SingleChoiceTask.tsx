// src/components/tasks/SingleChoiceTask.tsx
//
// Plain single-select: pick one option, submit. Deliberately no inline
// reveal (unlike HandlerSelectionTask, which shows a rationale per option
// immediately on selection) — correctness is decided and shown only on the
// Feedback screen, so the app-wide order (answer → confidence → reflection
// → feedback) holds for this task type too.

import { useState } from "react";
import type { SingleChoiceData } from "../../types/content";
import { InlineCode } from "../InlineCode";
import styles from "./SelectionTask.module.css";

export interface SingleChoiceTaskProps {
  data: SingleChoiceData;
  onSubmit: (selectedOptionId: string) => void;
  disabled?: boolean;
}

export function SingleChoiceTask({ data, onSubmit, disabled }: SingleChoiceTaskProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className={styles.wrapper}>
      <ul className={styles.options} role="radiogroup" aria-label="Answer options">
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
                  <span className={styles.optionLabel}>
                    <InlineCode text={option.label} />
                  </span>
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
