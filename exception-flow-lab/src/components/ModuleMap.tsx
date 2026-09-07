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

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Case files</h1>
        <button type="button" className={styles.journalLink} onClick={onViewJournal}>
          Concept Journal →
        </button>
      </div>
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
