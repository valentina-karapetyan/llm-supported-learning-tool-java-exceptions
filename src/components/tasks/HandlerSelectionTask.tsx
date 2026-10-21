// src/components/tasks/HandlerSelectionTask.tsx
//
// Single-select among handler options. Each option's rationale is shown
// after checking, next to the red/green result, by CheckedAnswer.

import { useState } from "react";
import type { HandlerSelectionData } from "../../types/content";
import { InlineCode } from "../InlineCode";
import styles from "./SelectionTask.module.css";

export interface HandlerSelectionTaskProps {
  data: HandlerSelectionData;
  onSubmit: (selectedOptionId: string) => void;
  disabled?: boolean;
}

export function HandlerSelectionTask({ data, onSubmit, disabled }: HandlerSelectionTaskProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className={styles.wrapper}>
      <ul className={styles.options} role="radiogroup" aria-label="Handler options">
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
          Check answer
        </button>
      </div>
    </div>
  );
}
