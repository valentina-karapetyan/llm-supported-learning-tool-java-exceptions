// src/components/ModuleCard.tsx
//
// One row in the Module Map's numbered case-file list (not a card grid —
// a hairline-divided list, closer to a printed table of contents).

import type { Module } from "../types/content";
import styles from "./ModuleCard.module.css";

export type ModuleCardState = "not_started" | "in_progress" | "completed";

export interface ModuleCardProps {
  module: Module;
  state: ModuleCardState;
  index: number;
  onSelect: () => void;
}

const STATE_LABEL: Record<ModuleCardState, string> = {
  not_started: "Ready",
  in_progress: "In progress",
  completed: "Completed",
};

export function ModuleCard({ module, state, index, onSelect }: ModuleCardProps) {
  const locked = !module.available;
  const statusLabel = locked ? "In preparation" : STATE_LABEL[state];

  return (
    <button type="button" className={[styles.row, locked ? styles.rowLocked : ""].join(" ")} onClick={onSelect} disabled={locked}>
      <span className={styles.number} aria-hidden="true">
        {String(index).padStart(2, "0")}
      </span>
      <span className={styles.body}>
        <span className={styles.title}>{module.title}</span>
        <span className={styles.description}>{module.description}</span>
      </span>
      <span className={[styles.status, state === "completed" ? styles.statusCompleted : ""].join(" ")}>{statusLabel}</span>
    </button>
  );
}
