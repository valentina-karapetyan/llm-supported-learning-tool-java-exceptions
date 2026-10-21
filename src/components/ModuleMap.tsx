// src/components/ModuleMap.tsx
//
// Screen B. All five modules currently have authored content; a module
// with `available: false` would still render as a locked "coming soon"
// card so the map's shape stays right without inventing unauthored content.

import type { Module } from "../types/content";
import type { AppProgress } from "../state/progressStore";
import { ModuleCard, type ModuleCardState } from "./ModuleCard";
import styles from "./ModuleMap.module.css";

export interface ModuleMapProps {
  modules: Module[];
  progress: AppProgress;
  onSelectModule: (moduleId: string) => void;
  onViewJournal: () => void;
}

export function ModuleMap({ modules, progress, onSelectModule, onViewJournal }: ModuleMapProps) {
  function stateFor(moduleId: string): ModuleCardState {
    const moduleProgress = progress.modules.find((m) => m.moduleId === moduleId);
    return moduleProgress?.state ?? "not_started";
  }

  const completedCount = modules.filter((module) => stateFor(module.id) === "completed").length;

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Lessons</h1>
        <button type="button" className={styles.journalLink} onClick={onViewJournal}>
          📒 What I've learned →
        </button>
      </div>
      <p className={styles.progressLine}>
        {completedCount} of {modules.length} lessons completed
      </p>
      <div className={styles.list}>
        {modules.map((module, i) => (
          <ModuleCard
            key={module.id}
            module={module}
            state={stateFor(module.id)}
            index={i + 1}
            onSelect={() => module.available && onSelectModule(module.id)}
          />
        ))}
      </div>
    </div>
  );
}
