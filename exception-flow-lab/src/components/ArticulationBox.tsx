// src/components/ArticulationBox.tsx
//
// Self-articulation before reveal (build spec §2): a single optional
// textarea between "submit answer" and "show feedback". Never graded,
// never sent anywhere — purely for the learner's own reflection, shown
// back to them next to the key rule on the Feedback screen.

import styles from "./ArticulationBox.module.css";

export interface ArticulationBoxProps {
  prompt: string;
  value: string;
  onChange: (value: string) => void;
}

export function ArticulationBox({ prompt, value, onChange }: ArticulationBoxProps) {
  const id = "articulation-box";
  return (
    <div className={styles.wrapper}>
      <label htmlFor={id} className={styles.label}>
        {prompt}
        <span className={styles.optional}> (optional — not graded, just for you)</span>
      </label>
      <textarea
        id={id}
        className={styles.textarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder="One sentence is plenty…"
      />
    </div>
  );
}
