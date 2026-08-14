// src/components/tasks/HandlerSelectionTask.tsx
//
// Single-select among handler options. Each option carries its own
// rationale text that's "shown after selection regardless of correctness"
// (per the data model) — that's a layer distinct from the task's overall
// Feedback screen: submitting here first reveals every option's rationale
// in place, then a separate "Continue" step hands off to the normal
// Feedback screen.

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
  const [revealed, setRevealed] = useState(false);

  return (
    <div className={styles.wrapper}>
      <ul className={styles.options} role={revealed ? undefined : "radiogroup"} aria-label="Handler options">
        {data.options.map((option) => {
          const isSelected = selectedId === option.id;
          return (
            <li key={option.id}>
              <button
                type="button"
                role={revealed ? undefined : "radio"}
                aria-checked={revealed ? undefined : isSelected}
                className={[styles.option, isSelected ? styles.optionSelected : ""].join(" ")}
                onClick={() => !disabled && !revealed && setSelectedId(option.id)}
                disabled={disabled || revealed}
              >
                <span className={styles.optionMarker} aria-hidden="true">
                  {isSelected ? "●" : ""}
                </span>
                <span className={styles.optionBody}>
                  <span className={styles.optionLabel}>
                    <InlineCode text={option.label} />
                  </span>
                  {revealed && isSelected && (
                    <p className={[styles.rationale, option.isCorrect ? styles.rationaleCorrect : styles.rationaleIncorrect].join(" ")}>
                      {option.rationale}
                    </p>
                  )}
                </span>
                {revealed && isSelected && (
                  <span className={[styles.resultBadge, option.isCorrect ? styles.badgeCorrect : styles.badgeIncorrect].join(" ")}>
                    {option.isCorrect ? "Correct" : "Not quite"}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <div className={styles.actions}>
        {!revealed ? (
          <button type="button" className={styles.primaryButton} disabled={disabled || !selectedId} onClick={() => setRevealed(true)}>
            Submit answer
          </button>
        ) : (
          <button type="button" className={styles.primaryButton} disabled={disabled} onClick={() => selectedId && onSubmit(selectedId)}>
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
