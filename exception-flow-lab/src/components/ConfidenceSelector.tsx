// src/components/ConfidenceSelector.tsx

import type { ConfidenceLevel } from "../types/content";
import styles from "./ConfidenceSelector.module.css";

export interface ConfidenceSelectorProps {
  value: ConfidenceLevel | null;
  onChange: (value: ConfidenceLevel) => void;
}

const OPTIONS: { value: ConfidenceLevel; label: string }[] = [
  { value: "low", label: "Not sure" },
  { value: "medium", label: "Fairly confident" },
  { value: "high", label: "Very confident" },
];

export function ConfidenceSelector({ value, onChange }: ConfidenceSelectorProps) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>How confident are you in this answer?</legend>
      <div className={styles.options} role="radiogroup">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            className={[styles.option, value === option.value ? styles.optionSelected : ""].join(" ")}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
