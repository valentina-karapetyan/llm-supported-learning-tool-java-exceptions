// src/components/ModuleMap.tsx
//
// Screen B. Only Module 1 has authored content right now — the other
// modules render as locked "coming soon" cards so the map's shape is
// right without inventing task content that hasn't been authored.

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
      <div className={styles.grid}>
        {modules.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            state={stateFor(module.id)}
            onSelect={() => module.available && onSelectModule(module.id)}
          />
        ))}
      </div>
    </div>
  );
}
