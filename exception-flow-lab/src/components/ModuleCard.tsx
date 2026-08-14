// src/components/ModuleCard.tsx

import type { Module } from "../types/content";
import styles from "./ModuleCard.module.css";

export type ModuleCardState = "not_started" | "in_progress" | "completed";

export interface ModuleCardProps {
  module: Module;
  state: ModuleCardState;
  onSelect: () => void;
}

const STATE_LABEL: Record<ModuleCardState, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

export function ModuleCard({ module, state, onSelect }: ModuleCardProps) {
  const locked = !module.available;
  return (
    <button
      type="button"
      className={[styles.card, locked ? styles.cardLocked : ""].join(" ")}
      onClick={onSelect}
      disabled={locked}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>{module.title}</h3>
        <span className={[styles.badge, state === "completed" ? styles.badgeCompleted : ""].join(" ")}>
          {locked ? "Coming soon" : STATE_LABEL[state]}
        </span>
      </div>
      <p className={styles.description}>{module.description}</p>
    </button>
  );
}
