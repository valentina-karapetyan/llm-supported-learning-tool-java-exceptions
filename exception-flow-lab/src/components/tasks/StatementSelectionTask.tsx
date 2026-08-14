// src/components/tasks/StatementSelectionTask.tsx
//
// Multi-select: the learner checks every statement that actually executes.
// Plain checkboxes — fully keyboard-operable by construction, no
// drag-and-drop involved for this task type.

import { useState } from "react";
import type { StatementSelectionData } from "../../types/content";
import { InlineCode } from "../InlineCode";
import styles from "./SelectionTask.module.css";

export interface StatementSelectionTaskProps {
  data: StatementSelectionData;
  onSubmit: (selectedIds: string[]) => void;
  disabled?: boolean;
}

export function StatementSelectionTask({ data, onSubmit, disabled }: StatementSelectionTaskProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    if (disabled) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className={styles.wrapper}>
      <ul className={styles.options}>
        {data.options.map((option) => {
          const isSelected = selected.has(option.id);
          return (
            <li key={option.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                className={[styles.option, isSelected ? styles.optionSelected : ""].join(" ")}
                onClick={() => toggle(option.id)}
                disabled={disabled}
              >
                <span className={[styles.optionMarker, styles.optionMarkerCheckbox].join(" ")} aria-hidden="true">
                  {isSelected ? "✓" : ""}
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
          disabled={disabled || selected.size === 0}
          onClick={() => onSubmit([...selected])}
        >
          Submit answer
        </button>
      </div>
    </div>
  );
}
